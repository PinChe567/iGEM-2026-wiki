import { createRng, shuffle } from '../rng';
import { QC_SHIFT_PRODUCTS } from './content';
import { QC_SHIFT_REQUIRED_TYPES, getQcShiftPreset } from './presets';
import { assertReadingConsistent, stripConfidenceIfNeeded } from './rules';
import type {
  QcFlag,
  QcReading,
  QcScenario,
  QcShiftPresetId,
  ScenarioType,
  SimulatedFungalRisk,
} from './types';
import { QC_SHIFT_SEED_VERSION } from './versions';

type Template = {
  type: ScenarioType;
  explanationKey: string;
  truth: SimulatedFungalRisk;
  initial: Omit<QcReading, 'confidence'> & { confidenceBase: number | null };
  retest: Omit<QcReading, 'confidence'> & { confidenceBase: number | null };
};

const TEMPLATES: Record<ScenarioType, Template> = {
  'true-low': {
    type: 'true-low',
    explanationKey: 'explain.true-low',
    truth: 'not-elevated',
    initial: { risk: 'low', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.86 },
    retest: { risk: 'low', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.9 },
  },
  'true-high': {
    type: 'true-high',
    explanationKey: 'explain.true-high',
    truth: 'high',
    initial: { risk: 'high', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.84 },
    retest: { risk: 'high', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.88 },
  },
  'true-medium': {
    type: 'true-medium',
    explanationKey: 'explain.true-medium',
    truth: 'elevated',
    initial: { risk: 'medium', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.72 },
    retest: { risk: 'medium', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.78 },
  },
  'false-positive': {
    type: 'false-positive',
    explanationKey: 'explain.false-positive',
    truth: 'not-elevated',
    initial: { risk: 'high', quality: 'uncertain', qcFlags: ['unstable-baseline'], confidenceBase: 0.48 },
    retest: { risk: 'low', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.81 },
  },
  'false-negative': {
    type: 'false-negative',
    explanationKey: 'explain.false-negative',
    truth: 'high',
    initial: { risk: 'low', quality: 'uncertain', qcFlags: ['low-signal'], confidenceBase: 0.41 },
    retest: { risk: 'high', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.8 },
  },
  borderline: {
    type: 'borderline',
    explanationKey: 'explain.borderline',
    truth: 'elevated',
    initial: { risk: 'medium', quality: 'uncertain', qcFlags: ['ok'], confidenceBase: 0.52 },
    retest: { risk: 'medium', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.74 },
  },
  'invalid-reading': {
    type: 'invalid-reading',
    explanationKey: 'explain.invalid-reading',
    truth: 'not-elevated',
    initial: { risk: 'invalid', quality: 'invalid', qcFlags: ['out-of-range'], confidenceBase: null },
    retest: { risk: 'low', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.77 },
  },
  'drift-qc': {
    type: 'drift-qc',
    explanationKey: 'explain.drift-qc',
    truth: 'high',
    initial: { risk: 'medium', quality: 'uncertain', qcFlags: ['drift'], confidenceBase: 0.44 },
    retest: { risk: 'high', quality: 'good', qcFlags: ['ok'], confidenceBase: 0.82 },
  },
};

function roundConfidence(value: number): number {
  return Math.round(value * 100) / 100;
}

function jitterConfidence(
  base: number | null,
  seed: string,
  index: number,
  phase: 'initial' | 'retest',
  showConfidence: boolean,
): number | null {
  if (!showConfidence || base === null) return null;
  const rng = createRng(`${seed}::conf::${index}::${phase}`);
  const jitter = (rng() - 0.5) * 0.06;
  return roundConfidence(Math.min(0.97, Math.max(0.3, base + jitter)));
}

function toReading(
  spec: Template['initial'],
  seed: string,
  index: number,
  phase: 'initial' | 'retest',
  showConfidence: boolean,
  showQcFlags: boolean,
): QcReading {
  const flags: QcFlag[] = showQcFlags ? [...spec.qcFlags] : [];
  const reading: QcReading = {
    risk: spec.risk,
    quality: spec.quality,
    confidence: jitterConfidence(spec.confidenceBase, seed, index, phase, showConfidence),
    qcFlags: flags,
  };
  assertReadingConsistent(reading, `${phase}:${spec.risk}`);
  return stripConfidenceIfNeeded(reading, showConfidence);
}

export function generateQcShiftScenarios(args: {
  seed: string;
  presetId: QcShiftPresetId;
}): QcScenario[] {
  const settings = getQcShiftPreset(args.presetId);
  const types = shuffle([...QC_SHIFT_REQUIRED_TYPES[args.presetId]], `${args.seed}::order`);
  if (types.length !== settings.batchCount) {
    throw new Error(`Preset ${args.presetId} type mix ${types.length} != batchCount ${settings.batchCount}`);
  }
  const products = shuffle([...QC_SHIFT_PRODUCTS], `${args.seed}::products`);
  if (products.length < types.length) throw new Error('Not enough simulated lots');

  return types.map((type, index) => {
    const template = TEMPLATES[type];
    const product = products[index]!;
    const initialReading = toReading(
      template.initial,
      args.seed,
      index,
      'initial',
      settings.showConfidence,
      settings.showQcFlags,
    );
    const retestReading = toReading(
      template.retest,
      args.seed,
      index,
      'retest',
      settings.showConfidence,
      settings.showQcFlags,
    );
    const scenario: QcScenario = {
      id: `qc-${args.presetId}-${index}`,
      productId: product.id,
      initialReading,
      retestReading,
      hiddenGroundTruth: { simulatedFungalRisk: template.truth },
      explanationKey: template.explanationKey,
      scenarioType: template.type,
      seedMeta: {
        seed: args.seed,
        presetId: args.presetId,
        index,
        seedVersion: QC_SHIFT_SEED_VERSION,
      },
    };
    assertScenarioPossible(scenario);
    return scenario;
  });
}

export function assertScenarioPossible(scenario: QcScenario): void {
  assertReadingConsistent(scenario.initialReading, `${scenario.id}:initial`);
  assertReadingConsistent(scenario.retestReading, `${scenario.id}:retest`);
  if (scenario.scenarioType === 'invalid-reading') {
    if (scenario.initialReading.risk !== 'invalid') {
      throw new Error(`${scenario.id}: invalid-reading must start invalid`);
    }
    if (scenario.retestReading.risk === 'invalid') {
      throw new Error(`${scenario.id}: retest must clarify an invalid reading`);
    }
  }
  if (scenario.scenarioType === 'false-positive') {
    if (scenario.hiddenGroundTruth.simulatedFungalRisk !== 'not-elevated') {
      throw new Error(`${scenario.id}: false-positive truth must be not-elevated`);
    }
    if (scenario.initialReading.risk !== 'high') {
      throw new Error(`${scenario.id}: false-positive initial risk must be high`);
    }
  }
  if (scenario.scenarioType === 'false-negative') {
    if (scenario.hiddenGroundTruth.simulatedFungalRisk !== 'high') {
      throw new Error(`${scenario.id}: false-negative truth must be high`);
    }
    if (scenario.initialReading.risk === 'high') {
      throw new Error(`${scenario.id}: false-negative initial reading cannot already be high`);
    }
  }
}

export function listScenarioTemplates(): readonly ScenarioType[] {
  return Object.keys(TEMPLATES) as ScenarioType[];
}
