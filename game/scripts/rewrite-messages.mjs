import fs from 'node:fs';

function u(parts) {
  return parts.map((p) => (typeof p === 'number' ? String.fromCharCode(p) : p)).join('');
}

const zh = {
  metaTitle: u([0x55c5, 0x89ba, 0x50cf, 0x7d20, 0x5957, 0x4ef6, ' · iGEM']),
  metaDesc: u([0x4e09, 0x6b3e, 0x6c23, 0x5473, 0x6559, 0x80b2, 0x904a, 0x6232, 0x5957, 0x4ef6, 0x9996, 0x9801, 0x3002]),
  brandTitle: u([0x55c5, 0x89ba, 0x50cf, 0x7d20]),
  homeAria: u([0x56de, 0x5230, 0x5957, 0x4ef6, 0x9996, 0x9801]),
  footerTagline: u([0x6c23, 0x5473, 0x4e0d, 0x662f, 0x5b64, 0x7acb, 0x7684, 0x9ede, 0xff0c, 0x800c, 0x662f, 0x4e00, 0x5f35, 0x5f7c, 0x6b64, 0x76f8, 0x9023, 0x7684, 0x5730, 0x5716, 0x3002]),
  langZh: u([0x7e41, 0x4e2d]),
  langSwitch: u([0x5207, 0x63db, 0x8a9e, 0x8a00]),
  hubHeading: u([0x4e09, 0x6b3e, 0x6c23, 0x5473, 0x904a, 0x6232]),
  hubLead: u([0x4ee5, 0x7d14, 0x975c, 0x614b, 0x9801, 0x9762, 0x90e8, 0x7f72, 0x7684, ' iGEM ', 0x6559, 0x80b2, 0x5957, 0x4ef6, 0x3002, 'Game 1 ', 0x5df2, 0x53ef, 0x904a, 0x73a9, 0xff1b, 'Game 2 ', 0x8207, ' Game 3 ', 0x958b, 0x767c, 0x4e2d, 0x3002]),
  play: u([0x9032, 0x5165, 0x904a, 0x6232]),
  comingSoon: u([0x958b, 0x767c, 0x4e2d]),
  comingSoonHint: u([0x5c1a, 0x672a, 0x958b, 0x653e, 0xff0c, 0x6309, 0x9215, 0x5df2, 0x505c, 0x7528, 0x3002]),
  g1title: u(['Game 1 · ', 0x55c5, 0x89ba, 0x50cf, 0x7d20, 0x5be6, 0x9a57, 0x5ba4]),
  g1blurb: u([0x89c0, 0x5bdf, 0x4e8c, 0x7dad, ' LED ', 0x6c23, 0x5473, 0x7de8, 0x78bc, 0xff0c, 0x627e, 0x51fa, 0x5b83, 0x4ee3, 0x8868, 0x7684, 0x6c23, 0x5473, 0x3002]),
  g2blurb: u([0x73a9, 0x6cd5, 0x898f, 0x5283, 0x4e2d, 0xff0c, 0x6b64, 0x968e, 0x6bb5, 0x5c1a, 0x672a, 0x5be6, 0x4f5c, 0x3002]),
  guide: u([0x904a, 0x6232, 0x8aaa, 0x660e]),
  soundToggle: u([0x5207, 0x63db, 0x97f3, 0x6548]),
  soundOn: u([0x958b, 0x555f, 0x97f3, 0x6548]),
  soundOff: u([0x95dc, 0x9589, 0x97f3, 0x6548]),
  backToHub: u([0x8fd4, 0x56de, 0x5957, 0x4ef6, 0x9996, 0x9801]),
};

const pixelZh = {
  title: '\u6c23\u5473\u50cf\u7d20\u5be6\u9a57\u5ba4',
  lead: '\u7528\u793a\u610f\u7528\u865b\u64ec\u53d7\u9ad4\u6a21\u5f0f\u8fa8\u8b58\u6c23\u5473\u7de8\u78bc\u3002',
  practice: '\u7df4\u7fd2\u6a21\u5f0f',
  daily: '\u6bcf\u65e5\u6311\u6230',
  startPractice: '\u958b\u59cb\u7df4\u7fd2',
  startDaily: '\u958b\u59cb\u6bcf\u65e5\u6311\u6230',
  randomizeSeed: '\u7522\u751f\u65b0\u7a2e\u5b50',
  settings: '\u96e3\u5ea6\u8a2d\u5b9a',
  matrixSize: '\u77e9\u9663\u5c3a\u5bf8',
  distractorBias: '\u5e72\u64fe\u9078\u9805\u504f\u5411',
  noise: '\u5e72\u64fe\u4f54\u672a\u4eae\u683c\u6bd4\u4f8b',
  studyReview: '\u5141\u8a31\u8907\u7fd2',
  displayMs: '\u5716\u6a23\u986f\u793a\u6642\u9593',
  yes: '\u662f',
  no: '\u5426',
  shown: '\u986f\u793a\u7684\u5716\u6a23',
  choose: '\u9019\u7d44\u7de8\u78bc\u662f\u54ea\u500b\u6c23\u5473\uff1f',
  noiseCount: '\u5be6\u969b\u5e72\u64fe\u683c\uff1a',
  next: '\u4e0b\u4e00\u984c',
  results: '\u7d50\u679c',
  replay: '\u91cd\u73a9\u540c\u4e00\u7a2e\u5b50',
  copySeed: '\u8907\u88fd\u7a2e\u5b50',
  copied: '\u5df2\u8907\u88fd',
  clearData: '\u6e05\u9664\u672c\u6a5f\u8cc7\u6599',
  shortcuts: '\u5feb\u6377\u9375\uff1a1\u20134 \u9078\u64c7\u3001Enter \u4e0b\u4e00\u984c\u3001Esc \u95dc\u9589\u8996\u7a97',
  science: '\u79d1\u5b78\u8aaa\u660e',
  assetCredit: '\u7d20\u6750\u8cc7\u8a0a',
  correct: '\u8fa8\u8b58\u6b63\u78ba\uff01',
  answer: '\u6b63\u78ba\u7b54\u6848',
  nearest: '\u6700\u63a5\u8fd1\u7684\u6c23\u5473',
  best: '\u6700\u9ad8\u5206',
};

function esc(s) {
  return JSON.stringify(s);
}

const pixelZhBlock = Object.entries(pixelZh)
  .map(([k, v]) => `      ${k}: ${JSON.stringify(v)},`)
  .join('\n');

const out = `import type { Locale } from './locale';

export type MessageTree = {
  meta: { title: string; description: string };
  shell: {
    brandTitle: string;
    brandSubtitle: string;
    homeAria: string;
    footerMark: string;
    footerTagline: string;
    langZh: string;
    langEn: string;
    langSwitchAria: string;
  };
  hub: {
    eyebrow: string;
    heading: string;
    lead: string;
    play: string;
    comingSoon: string;
    comingSoonHint: string;
    games: {
      pixel: { title: string; blurb: string };
      game2: { title: string; blurb: string };
      game3: { title: string; blurb: string };
    };
  };
  pixelShell: {
    guide: string;
    soundToggle: string;
    soundOn: string;
    soundOff: string;
    backToHub: string;
  };
  pixel: Record<string, string>;
};

export const messages: Record<Locale, MessageTree> = {
  'zh-Hant': {
    meta: {
      title: ${esc(zh.metaTitle)},
      description: ${esc(zh.metaDesc)},
    },
    shell: {
      brandTitle: ${esc(zh.brandTitle)},
      brandSubtitle: 'ODOR PIXEL SUITE',
      homeAria: ${esc(zh.homeAria)},
      footerMark: 'ODOR PIXEL SUITE · 2026',
      footerTagline: ${esc(zh.footerTagline)},
      langZh: ${esc(zh.langZh)},
      langEn: 'EN',
      langSwitchAria: ${esc(zh.langSwitch)},
    },
    hub: {
      eyebrow: 'EDUCATION SUITE',
      heading: ${esc(zh.hubHeading)},
      lead: ${esc(zh.hubLead)},
      play: ${esc(zh.play)},
      comingSoon: ${esc(zh.comingSoon)},
      comingSoonHint: ${esc(zh.comingSoonHint)},
      games: {
        pixel: {
          title: ${esc(zh.g1title)},
          blurb: ${esc(zh.g1blurb)},
        },
        game2: { title: 'Game 2', blurb: ${esc(zh.g2blurb)} },
        game3: { title: 'Game 3', blurb: ${esc(zh.g2blurb)} },
      },
    },
    pixelShell: {
      guide: ${esc(zh.guide)},
      soundToggle: ${esc(zh.soundToggle)},
      soundOn: ${esc(zh.soundOn)},
      soundOff: ${esc(zh.soundOff)},
      backToHub: ${esc(zh.backToHub)},
    },
    pixel: {
${pixelZhBlock}
    },
  },
  en: {
    meta: {
      title: 'Odor Pixel Suite · iGEM',
      description: 'Hub for three educational scent games.',
    },
    shell: {
      brandTitle: 'Odor Pixel',
      brandSubtitle: 'ODOR PIXEL SUITE',
      homeAria: 'Back to suite home',
      footerMark: 'ODOR PIXEL SUITE · 2026',
      footerTagline: 'A scent is not a single point — it is a connected map.',
      langZh: ${esc(zh.langZh)},
      langEn: 'EN',
      langSwitchAria: 'Switch language',
    },
    hub: {
      eyebrow: 'EDUCATION SUITE',
      heading: 'Three scent games',
      lead: 'A pure-static iGEM education suite. Game 1 is playable; Games 2 and 3 are in development.',
      play: 'Play',
      comingSoon: 'Coming soon',
      comingSoonHint: 'Not available yet — this control is disabled.',
      games: {
        pixel: {
          title: 'Game 1 · Odor Pixel Lab',
          blurb: 'Read 2D LED scent codes and identify the matching odor.',
        },
        game2: {
          title: 'Game 2',
          blurb: 'Gameplay is planned; not implemented in this phase.',
        },
        game3: {
          title: 'Game 3',
          blurb: 'Gameplay is planned; not implemented in this phase.',
        },
      },
    },
    pixelShell: {
      guide: 'How to play',
      soundToggle: 'Toggle sound',
      soundOn: 'Unmute sound',
      soundOff: 'Mute sound',
      backToHub: 'Back to suite home',
    },
    pixel: {
      title: 'Odor Pixel Lab',
      lead: 'Identify odor codes using an illustrative virtual-receptor model.',
      practice: 'Practice',
      daily: 'Daily challenge',
      startPractice: 'Start practice',
      startDaily: 'Start daily challenge',
      randomizeSeed: 'Randomize seed',
      settings: 'Difficulty settings',
      matrixSize: 'Matrix size',
      distractorBias: 'Distractor bias',
      noise: 'Noise as share of OFF cells',
      studyReview: 'Allow study review',
      displayMs: 'Pattern display time',
      yes: 'Yes',
      no: 'No',
      shown: 'Shown pattern',
      choose: 'Which odor is this code?',
      noiseCount: 'Noise cells:',
      next: 'Next',
      results: 'Results',
      replay: 'Replay same seed',
      copySeed: 'Copy seed',
      copied: 'Copied',
      clearData: 'Clear local data',
      shortcuts: 'Shortcuts: 1–4 choose, Enter next, Esc close dialogs',
      science: 'Science note',
      assetCredit: 'Asset credit',
      correct: 'Correct!',
      answer: 'Answer',
      nearest: 'Nearest odor',
      best: 'Best',
    },
  },
};

export function t(locale: Locale): MessageTree {
  return messages[locale];
}
`;

fs.writeFileSync('apps/wiki-client/src/i18n/messages.ts', out, 'utf8');
console.log('messages rewritten', out.includes(zh.brandTitle));
