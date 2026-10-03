import { shuffle } from '../rng';
import { injectNoise } from './noise';
import { odorPattern } from './pattern';
import { similarity } from './similarity';
import type {
  BuiltQuestion,
  DifficultySettings,
  DistractorBias,
  PixelOdor,
} from './types';

function byId(odors: readonly PixelOdor[]): Map<string, PixelOdor> {
  return new Map(odors.map((odor) => [odor.id, odor]));
}

export function pickSessionPool(
  odors: readonly PixelOdor[],
  poolSize: number,
  seed: string,
): string[] {
  if (poolSize > odors.length) {
    throw new Error(`poolSize ${poolSize} exceeds catalog ${odors.length}`);
  }
  return shuffle(odors, `${seed}::pool`)
    .slice(0, poolSize)
    .map((odor) => odor.id);
}

function closeSliceCount(bias: DistractorBias, available: number): number {
  if (bias === 'mixed') return Math.min(available, 3);
  if (bias === 'similar') return Math.min(available, 5);
  return available; // very-similar: consider all, still pick top-similar first
}

export function buildQuestionOptions(
  answer: PixelOdor,
  pool: readonly PixelOdor[],
  settings: DifficultySettings,
  round: number,
  seed: string,
): string[] {
  const others = pool.filter((odor) => odor.id !== answer.id);
  const ranked = [...others].sort((a, b) => similarity(answer, b) - similarity(answer, a));
  const closeN = closeSliceCount(settings.distractorBias, ranked.length);
  const close = ranked.slice(0, closeN);
  const needDistractors = settings.optionsPerQuestion - 1;

  const closePicks = shuffle(close, `${seed}::q${round}::close`).slice(
    0,
    Math.min(2, needDistractors, close.length),
  );
  const remaining = others.filter((odor) => !closePicks.some((c) => c.id === odor.id));
  const farNeeded = needDistractors - closePicks.length;
  const farPicks =
    farNeeded > 0
      ? shuffle(remaining, `${seed}::q${round}::far`).slice(0, farNeeded)
      : [];

  const distractors = [...closePicks, ...farPicks];
  if (distractors.length !== needDistractors) {
    throw new Error(`Could not build ${needDistractors} distractors for ${answer.id}`);
  }

  const optionIds = shuffle(
    [answer.id, ...distractors.map((d) => d.id)],
    `${seed}::q${round}::options`,
  );
  if (new Set(optionIds).size !== optionIds.length) {
    throw new Error('Duplicate options');
  }
  if (!optionIds.includes(answer.id)) {
    throw new Error('Correct answer missing from options');
  }
  return optionIds;
}

export function buildAnswerSchedule(
  poolIds: readonly string[],
  questionCount: number,
  seed: string,
): string[] {
  if (poolIds.length === 0) throw new Error('Empty pool');
  const base = [...poolIds];
  const extrasNeeded = Math.max(0, questionCount - base.length);
  const extras = shuffle([...poolIds], `${seed}::repeat`).slice(0, extrasNeeded);
  const schedule = shuffle([...base, ...extras], `${seed}::answers`);
  if (schedule.length < questionCount) {
    // If questionCount > pool*2, pad by cycling shuffled pool
    while (schedule.length < questionCount) {
      schedule.push(
        ...shuffle([...poolIds], `${seed}::pad-${schedule.length}`).slice(
          0,
          questionCount - schedule.length,
        ),
      );
    }
  }
  return schedule.slice(0, questionCount);
}

export function buildQuestions(args: {
  odors: readonly PixelOdor[];
  poolIds: readonly string[];
  settings: DifficultySettings;
  seed: string;
  patternCache?: Map<number, Map<string, boolean[]>>;
}): BuiltQuestion[] {
  const { odors, poolIds, settings, seed, patternCache } = args;
  const map = byId(odors);
  const pool = poolIds.map((id) => {
    const odor = map.get(id);
    if (!odor) throw new Error(`Unknown pool odor ${id}`);
    return odor;
  });

  const answers = buildAnswerSchedule(poolIds, settings.questionCount, seed);

  return answers.map((answerId, round) => {
    const answer = map.get(answerId);
    if (!answer) throw new Error(`Unknown answer ${answerId}`);
    const optionIds = buildQuestionOptions(answer, pool, settings, round, seed);
    const basePattern = odorPattern(odors, answerId, settings.matrixSize, patternCache);
    const noise = injectNoise(
      basePattern,
      settings.noisePercentOfOff,
      `${seed}::noise::${answerId}::${round}`,
    );
    return {
      round,
      answerId,
      optionIds,
      basePattern,
      noiseIndices: noise.noiseIndices,
      noiseCount: noise.noiseCount,
      displayCells: noise.displayCells,
    };
  });
}
