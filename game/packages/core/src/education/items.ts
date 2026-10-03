import type {
  EducationGameId,
  EducationItem,
  EducationItemId,
  EducationPhase,
} from './types';

function t(en: string, zh: string): { en: string; 'zh-Hant': string } {
  return { en, 'zh-Hant': zh };
}

function opt(id: string, en: string, zh: string): { id: string; label: { en: string; 'zh-Hant': string } } {
  return { id, label: t(en, zh) };
}

/**
 * Stable education item bank.
 * Prompts measure concepts, not AeroSense brand trivia.
 */
export const EDUCATION_ITEMS: readonly EducationItem[] = [
  {
    id: 'G1-COMB-01',
    gameId: 'pixel',
    phase: 'pre',
    measures: 'Odor identity is a multi-receptor pattern, not a single receptor.',
    prompt: t(
      'How is an odor\u2019s identity shown in this game?',
      '\u5728\u9019\u500b\u904a\u6232\u88e1\uff0c\u6c23\u5473\u7684\u300c\u8eab\u4efd\u300d\u662f\u600e\u9ebc\u8868\u793a\u7684\uff1f',
    ),
    options: [
      opt('a', 'One receptor stands for one odor.', '\u4e00\u500b\u53d7\u9ad4\u4ee3\u8868\u4e00\u7a2e\u6c23\u5473\u3002'),
      opt('b', 'A pattern across several receptors.', '\u5e7e\u500b\u53d7\u9ad4\u4e00\u8d77\u7d44\u6210\u7684\u5716\u6a23\u3002'),
      opt('c', 'The English name of the smell.', '\u6c23\u5473\u7684\u82f1\u6587\u540d\u7a31\u3002'),
      opt('d', 'How bright a single light is.', '\u4e00\u9846\u71c8\u6709\u591a\u4eae\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G1-NOISE-01',
    gameId: 'pixel',
    phase: 'pre',
    measures: 'Noise can distract, but identity remains the overall pattern.',
    prompt: t(
      'Some extra lights may flicker. What does that mean?',
      '\u6709\u4e9b\u984d\u5916\u7684\u71c8\u53ef\u80fd\u6703\u9583\u3002\u9019\u4ee3\u8868\u4ec0\u9ebc\uff1f',
    ),
    options: [
      opt('a', 'The odor has changed into a new smell.', '\u6c23\u5473\u5df2\u7d93\u8b8a\u6210\u53e6\u4e00\u7a2e\u3002'),
      opt('b', 'Noise can distract, but identity is still the overall pattern.', '\u96dc\u8a0a\u53ef\u80fd\u5e72\u64fe\uff0c\u4f46\u8eab\u4efd\u4ecd\u662f\u6574\u9ad4\u5716\u6a23\u3002'),
      opt('c', 'Look only at the single brightest cell.', '\u53ea\u770b\u6700\u4eae\u7684\u90a3\u4e00\u683c\u3002'),
      opt('d', 'The game is broken.', '\u904a\u6232\u58de\u4e86\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G1-TRANSFER-01',
    gameId: 'pixel',
    phase: 'transfer',
    measures: 'Apply pattern comparison when two odors look similar.',
    prompt: t(
      'Two smells look similar, but a few receptors differ. What should you compare first?',
      '\u5169\u7a2e\u6c23\u5473\u770b\u8d77\u4f86\u5f88\u50cf\uff0c\u4f46\u5c11\u6578\u53d7\u9ad4\u4e0d\u4e00\u6a23\u3002\u4f60\u61c9\u8a72\u5148\u6bd4\u4ec0\u9ebc\uff1f',
    ),
    options: [
      opt('a', 'Only the strongest single receptor.', '\u53ea\u6bd4\u6700\u5f37\u7684\u90a3\u4e00\u500b\u53d7\u9ad4\u3002'),
      opt('b', 'The full receptor patterns.', '\u6bd4\u6574\u7d44\u53d7\u9ad4\u5716\u6a23\u3002'),
      opt('c', 'Which name sounds nicer.', '\u54ea\u500b\u540d\u5b57\u8f03\u597d\u807d\u3002'),
      opt('d', 'Whether the device brand is AeroSense.', '\u6a5f\u5668\u54c1\u724c\u662f\u4e0d\u662f AeroSense\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G1-FEED-01',
    gameId: 'pixel',
    phase: 'feedback',
    measures: 'Optional note about what was confusing or useful.',
    prompt: t(
      'What was most confusing or most useful? (optional)',
      '\u4ec0\u9ebc\u6700\u56f0\u64fe\u6216\u6700\u6709\u7528\uff1f\uff08\u53ef\u9078\uff09',
    ),
    options: [
      opt('visuals', 'The pictures / lights', '\u5716\u7247\uff0f\u71c8\u5149'),
      opt('instructions', 'The instructions', '\u8aaa\u660e\u6587\u5b57'),
      opt('idea', 'The science idea (patterns)', '\u79d1\u5b78\u6982\u5ff5\uff08\u5716\u6a23\uff09'),
      opt('skip', 'Skip / not sure', '\u8df3\u904e\uff0f\u4e0d\u78ba\u5b9a'),
    ],
    correctOptionId: null,
    optional: true,
  },
  {
    id: 'G2-SCREEN-01',
    gameId: 'qc-shift',
    phase: 'pre',
    measures: 'Screening is an early warning, not confirmatory diagnosis.',
    prompt: t(
      'A screening alert means:',
      '\u7be9\u6aa2\u8b66\u5831\u7684\u610f\u601d\u662f\uff1a',
    ),
    options: [
      opt('a', 'A confirmed diagnosis that the food is unsafe.', '\u5df2\u7d93\u78ba\u8a3a\u98df\u7269\u4e0d\u5b89\u5168\u3002'),
      opt('b', 'An early warning that may need follow-up, not a final confirmation.', '\u65e9\u671f\u8b66\u793a\uff0c\u53ef\u80fd\u9700\u8981\u8ffd\u8e64\uff0c\u4e0d\u662f\u6700\u5f8c\u78ba\u8a8d\u3002'),
      opt('c', 'Proof the batch is safe.', '\u8b49\u660e\u9019\u6279\u8ca8\u5b89\u5168\u3002'),
      opt('d', 'An order to throw all the food away.', '\u547d\u4ee4\u628a\u6240\u6709\u98df\u7269\u4e1f\u6389\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G2-QC-01',
    gameId: 'qc-shift',
    phase: 'pre',
    measures: 'Invalid or uncertain measurements need appropriate follow-up.',
    prompt: t(
      'If a reading is invalid or very uncertain, what is appropriate?',
      '\u82e5\u8b80\u6578\u7121\u6548\u6216\u5f88\u4e0d\u78ba\u5b9a\uff0c\u600e\u9ebc\u505a\u624d\u5408\u9069\uff1f',
    ),
    options: [
      opt('a', 'Treat it as a final diagnosis.', '\u7576\u6210\u6700\u5f8c\u8a3a\u65b7\u3002'),
      opt('b', 'Follow up (retest or confirmation) instead of trusting it.', '\u8ffd\u8e64\uff08\u91cd\u6e2c\u6216\u9001\u78ba\u8a8d\uff09\uff0c\u4e0d\u8981\u76f2\u76ee\u76f8\u4fe1\u3002'),
      opt('c', 'Always ignore it.', '\u4e00\u5f8b\u5ffd\u7565\u3002'),
      opt('d', 'Always destroy the batch.', '\u4e00\u5f8b\u92b7\u6bc0\u8a72\u6279\u8ca8\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G2-TRANSFER-01',
    gameId: 'qc-shift',
    phase: 'transfer',
    measures: 'Apply screening-vs-diagnosis to an invalid follow-up reading.',
    prompt: t(
      'A sensor beeps once, then the next reading is invalid. What should a worker do?',
      '\u611f\u6e2c\u5668\u97ff\u4e86\u4e00\u8072\uff0c\u63a5\u4e0b\u4f86\u7684\u8b80\u6578\u537b\u662f\u7121\u6548\u3002\u5de5\u4f5c\u4eba\u54e1\u61c9\u8a72\u600e\u9ebc\u505a\uff1f',
    ),
    options: [
      opt('a', 'Announce a confirmed poisoning.', '\u5ba3\u5e03\u5df2\u7d93\u78ba\u8a3a\u4e2d\u6bd2\u3002'),
      opt('b', 'Use follow-up (retest / confirmation) because screening is not diagnosis.', '\u4f7f\u7528\u8ffd\u8e64\uff08\u91cd\u6e2c\uff0f\u78ba\u8a8d\uff09\uff0c\u56e0\u70ba\u7be9\u6aa2\u4e0d\u662f\u8a3a\u65b7\u3002'),
      opt('c', 'Turn the sensor off forever.', '\u6c38\u9060\u95dc\u6389\u611f\u6e2c\u5668\u3002'),
      opt('d', 'Decide the food is definitely safe.', '\u5224\u5b9a\u98df\u7269\u4e00\u5b9a\u5b89\u5168\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G2-FEED-01',
    gameId: 'qc-shift',
    phase: 'feedback',
    measures: 'Optional note about what was confusing or useful.',
    prompt: t(
      'What was most confusing or most useful? (optional)',
      '\u4ec0\u9ebc\u6700\u56f0\u64fe\u6216\u6700\u6709\u7528\uff1f\uff08\u53ef\u9078\uff09',
    ),
    options: [
      opt('visuals', 'The batch card / meters', '\u6279\u6b21\u5361\u7247\uff0f\u6578\u503c'),
      opt('instructions', 'The instructions', '\u8aaa\u660e\u6587\u5b57'),
      opt('idea', 'The science idea (screening vs confirmation)', '\u79d1\u5b78\u6982\u5ff5\uff08\u7be9\u6aa2 vs \u78ba\u8a8d\uff09'),
      opt('skip', 'Skip / not sure', '\u8df3\u904e\uff0f\u4e0d\u78ba\u5b9a'),
    ],
    correctOptionId: null,
    optional: true,
  },
  {
    id: 'G2-ALERT-01',
    gameId: 'qc-shift',
    phase: 'feedback',
    measures: 'Optional preference for alert information (not scored).',
    prompt: t(
      'What information would help you understand an alert? (optional)',
      '\u4ec0\u9ebc\u8cc7\u8a0a\u80fd\u5e6b\u4f60\u770b\u61c2\u8b66\u5831\uff1f\uff08\u53ef\u9078\uff09',
    ),
    options: [
      opt('risk', 'Risk level', '\u98a8\u96aa\u7b49\u7d1a'),
      opt('confidence', 'How sure the reading is', '\u8b80\u6578\u7684\u786c\u5ea6'),
      opt('quality', 'Signal quality / invalid flag', '\u8a0a\u865f\u54c1\u8cea\uff0f\u7121\u6548\u6a19\u8a18'),
      opt('next', 'What to do next', '\u4e0b\u4e00\u6b65\u8981\u505a\u4ec0\u9ebc'),
      opt('skip', 'Skip / no preference', '\u8df3\u904e\uff0f\u6c92\u6709\u504f\u597d'),
    ],
    correctOptionId: null,
    optional: true,
  },
  {
    id: 'G3-MIX-01',
    gameId: 'spectrum',
    phase: 'pre',
    measures: 'Mixtures can create overlapping receptor-response patterns.',
    prompt: t(
      'When two odors mix, receptor-response patterns:',
      '\u5169\u7a2e\u6c23\u5473\u6df7\u5728\u4e00\u8d77\u6642\uff0c\u53d7\u9ad4\u53cd\u61c9\u5716\u6a23\u6703\uff1a',
    ),
    options: [
      opt('a', 'Stay completely separate with no overlap.', '\u5b8c\u5168\u5206\u958b\uff0c\u6c92\u6709\u91cd\u758a\u3002'),
      opt('b', 'Can overlap, so the mix is not a simple single-odor fingerprint.', '\u53ef\u80fd\u91cd\u758a\uff0c\u56e0\u6b64\u6df7\u5408\u4e0d\u662f\u55ae\u4e00\u6c23\u5473\u6307\u7d0b\u3002'),
      opt('c', 'Become a rainbow of visible light.', '\u8b8a\u6210\u53ef\u898b\u5149\u7684\u5f69\u8679\u3002'),
      opt('d', 'Can only show one odor at a time.', '\u4e00\u6b21\u53ea\u80fd\u986f\u793a\u4e00\u7a2e\u6c23\u5473\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G3-DECODE-01',
    gameId: 'spectrum',
    phase: 'pre',
    measures: 'Computational decoding helps separate similar overlapping patterns.',
    prompt: t(
      'Why is computational decoding useful here?',
      '\u70ba\u4ec0\u9ebc\u8a08\u7b97\u89e3\u78bc\u5728\u9019\u88e1\u6709\u7528\uff1f',
    ),
    options: [
      opt('a', 'It proves real gas concentrations in a warehouse.', '\u5b83\u80fd\u8b49\u660e\u5009\u5eab\u88e1\u771f\u5be6\u6c23\u9ad4\u6fc3\u5ea6\u3002'),
      opt('b', 'It helps separate similar overlapping patterns.', '\u5b83\u5e6b\u5fd9\u5206\u958b\u76f8\u4f3c\u4e14\u91cd\u758a\u7684\u5716\u6a23\u3002'),
      opt('c', 'It replaces all laboratory work.', '\u5b83\u53d6\u4ee3\u6240\u6709\u5be6\u9a57\u5ba4\u5de5\u4f5c\u3002'),
      opt('d', 'It prints the product brand automatically.', '\u5b83\u6703\u81ea\u52d5\u5370\u51fa\u7522\u54c1\u54c1\u724c\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G3-TRANSFER-01',
    gameId: 'spectrum',
    phase: 'transfer',
    measures: 'Apply decoding when two mixtures look similar.',
    prompt: t(
      'Banana and lemon mixed 50/50 look a bit like orange. A good next step is:',
      '\u9999\u8549\u8207\u6ab8\u6aac 50/50 \u6df7\u5408\u770b\u8d77\u4f86\u6709\u9ede\u50cf\u6a59\u5b50\u3002\u8f03\u597d\u7684\u4e0b\u4e00\u6b65\u662f\uff1a',
    ),
    options: [
      opt('a', 'Decide it must be orange.', '\u5224\u5b9a\u5b83\u4e00\u5b9a\u662f\u6a59\u5b50\u3002'),
      opt('b', 'Compare mixture candidates and ratios, not just one peak.', '\u6bd4\u8f03\u5019\u9078\u6df7\u5408\u8207\u6bd4\u4f8b\uff0c\u4e0d\u53ea\u770b\u4e00\u500b\u5c16\u5cf0\u3002'),
      opt('c', 'Measure it with a light spectrum.', '\u7528\u5149\u8b5c\u4f86\u6e2c\u3002'),
      opt('d', 'Conclude decoding cannot help.', '\u65b7\u5b9a\u89e3\u78bc\u6c92\u6709\u5e6b\u52a9\u3002'),
    ],
    correctOptionId: 'b',
    optional: false,
  },
  {
    id: 'G3-FEED-01',
    gameId: 'spectrum',
    phase: 'feedback',
    measures: 'Optional note about what was confusing or useful.',
    prompt: t(
      'What was most confusing or most useful? (optional)',
      '\u4ec0\u9ebc\u6700\u56f0\u64fe\u6216\u6700\u6709\u7528\uff1f\uff08\u53ef\u9078\uff09',
    ),
    options: [
      opt('visuals', 'The receptor-response chart', '\u53d7\u9ad4\u53cd\u61c9\u5716'),
      opt('instructions', 'The instructions', '\u8aaa\u660e\u6587\u5b57'),
      opt('idea', 'The science idea (overlapping mixes)', '\u79d1\u5b78\u6982\u5ff5\uff08\u91cd\u758a\u6df7\u5408\uff09'),
      opt('skip', 'Skip / not sure', '\u8df3\u904e\uff0f\u4e0d\u78ba\u5b9a'),
    ],
    correctOptionId: null,
    optional: true,
  },
];

const BY_ID = new Map(EDUCATION_ITEMS.map((item) => [item.id, item]));

export function getEducationItem(id: string): EducationItem | undefined {
  return BY_ID.get(id as EducationItemId);
}

export function itemsForGame(
  gameId: EducationGameId,
  phase: EducationPhase,
): EducationItem[] {
  return EDUCATION_ITEMS.filter((item) => item.gameId === gameId && item.phase === phase);
}

export function pairedItemIds(gameId: EducationGameId): EducationItemId[] {
  return EDUCATION_ITEMS.filter(
    (item) => item.gameId === gameId && item.phase === 'pre' && item.correctOptionId,
  ).map((item) => item.id);
}

export function scoreEducationAnswer(
  itemId: string,
  answer: string,
): boolean | null {
  const item = getEducationItem(itemId);
  if (!item || item.correctOptionId == null) return null;
  return answer === item.correctOptionId;
}

export function isEducationItemId(value: string): value is EducationItemId {
  return BY_ID.has(value as EducationItemId);
}
