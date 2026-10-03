/**
 * Education activities — structured records only.
 * Never invent student quotes, teacher feedback, or outcome percentages.
 */

export type Localized = { 'zh-Hant': string; en: string };

export type EducationStatus = 'planned' | 'in-progress' | 'completed';

export type EvaluationMethod =
  | 'pre-post'
  | 'feedback-form'
  | 'observation'
  | 'interview'
  | 'other';

export type EducationActivity = {
  id: string;
  title: Localized;
  status: EducationStatus;
  audienceAndNeeds: Localized;
  learningObjectives: Localized;
  coDesignAdaptation: Localized;
  materials: Localized;
  activity: Localized;
  safetyInclusivityAccessibility: Localized;
  evaluationMethod: EvaluationMethod;
  evaluationNotes: Localized;
  /**
   * Results must be team-supplied. Leave empty when planned/in-progress.
   * Do not invent participation counts, quotes, or percentages.
   */
  results: Localized;
  whatChangedAfterFeedback: Localized;
  reusableDownloads: Array<{
    label: Localized;
    href: string;
    license: Localized;
  }>;
  license: Localized;
};

export type EducationCatalog = {
  schemaVersion: '1';
  intro: Localized;
  activities: EducationActivity[];
};

const emptyLoc = (): Localized => ({ 'zh-Hant': '', en: '' });

const L = (zh: string, en: string): Localized => ({ 'zh-Hant': zh, en });

const PACK = '../education-games';

const licenseUnknown = L(
  '本倉庫尚未公布根目錄 LICENSE。在團隊補上授權之前，請勿假設 Creative Commons 或其他開放授權。iGEM Wiki 托管仍須遵守 iGEM 規則。標示 TODO-VERIFY 的媒體不可視為已授權。',
  'This repository has not published a root LICENSE file. Do not assume Creative Commons or similar rights until the team adds one. iGEM Wiki hosting remains subject to iGEM rules. Media marked TODO-VERIFY is not cleared.',
);

const packLicense = L(
  '教育說明文件與遊戲原始碼授權尚未在倉庫根目錄公布。',
  'Educator docs and game source license are not published at the repository root yet.',
);

function download(labelZh: string, labelEn: string, file: string) {
  return {
    label: L(labelZh, labelEn),
    href: `${PACK}/${file}`,
    license: packLicense,
  };
}

const programDownloads = [
  download('教育遊戲說明包', 'Education games README', 'README.md'),
  download('遊玩測試流程', 'Playtest protocol', 'playtest-protocol.md'),
  download('題庫（穩定題號）', 'Question bank', 'question-bank.md'),
  download('匿名資料欄位說明', 'Anonymous data dictionary', 'data-dictionary.md'),
  download('改版紀錄模板', 'Redesign log', 'redesign-log.md'),
];

export const educationCatalog: EducationCatalog = {
  schemaVersion: '1',
  intro: L(
    '三款 Wiki 遊戲是教育用示意模型，不是 AeroSense 感測器效能實驗。公開遊客可直接遊玩；工作坊可加 ?study=1 做配對前後測。在真實遊玩測試匯出之前，成果欄位保持空白。',
    'The three Wiki games are educational illustrative models, not AeroSense sensor-performance experiments. Public visitors play immediately; workshops may add ?study=1 for paired pre/post questions. Results stay empty until a real playtest export exists.',
  ),
  activities: [
    {
      id: 'suite-three-games',
      title: L('三款氣味教育遊戲（套件）', 'Three-game odor education suite'),
      status: 'in-progress',
      audienceAndNeeds: L(
        'iGEM 教育／Human Practices 工作坊、課堂或博物館活動，以及 Wiki 一般訪客。需要不用真實感測器也能練習「圖案／迷宮／混合物」概念的短活動。不適合當作專業品管人員認證。',
        'iGEM Education / Human Practices workshops, classroom or museum events, and general Wiki visitors. Need short activities to practice pattern, maze, and mixture ideas without real sensors. Not a professional QC certification.',
      ),
      learningObjectives: L(
        '（1）氣味身分是多受體圖案，不是單一受體。（2）篩檢不是確診；無效或不確定的讀數需要後續處理。（3）混合物會造成重疊的受體反應，計算解碼有幫助。',
        '(1) Odor identity is a multi-receptor pattern, not a single receptor. (2) Screening is not confirmatory diagnosis; invalid or uncertain readings need follow-up. (3) Mixtures create overlapping receptor-response patterns, and computational decoding is useful.',
      ),
      coDesignAdaptation: L(
        '計畫在工作坊使用 Junior／Standard／Challenge 與可選 study mode，並依真實遊玩紀錄修改題幹與提示。目前沒有已登錄的共創會議紀錄。',
        'Plan: use Junior / Standard / Challenge plus optional study mode in workshops, then revise stems and hints from real play records. No co-design meeting notes are checked in yet.',
      ),
      materials: L(
        '瀏覽器或靜態 Wiki；教育說明包（docs/education-games）；可選 study mode 與本機匯出的 JSON。不需要實驗器材。',
        'A browser or the static Wiki; the educator pack (docs/education-games); optional study mode with local JSON export. No lab equipment.',
      ),
      activity: L(
        '從套件首頁選一款遊戲。一般模式直接玩。工作坊在網址加上 ?study=1：兩題課前短問 → 原遊戲 → 相同概念課後問、一題遷移、可選回饋。主持人匯出匿名資料。',
        'Pick a game from the hub. Normal mode plays immediately. Workshops append ?study=1: two short pre questions → the usual game → the same concepts post, one transfer item, optional feedback. Facilitators export anonymous data.',
      ),
      safetyInclusivityAccessibility: L(
        '純數位、無濕實驗。不蒐集姓名、信箱、確切年齡、IP 或學校編號。提供鍵盤操作、可見焦點、高對比、減少動畫、雙語（繁中／英文）。顏色不是唯一編碼。兒童與一般大眾的作答不得用來推導專業操作門檻。',
        'Digital only; no wet lab. No name, email, exact age, IP, or school ID. Keyboard use, visible focus, high contrast, reduced motion, bilingual zh-Hant / English. Color is not the only encoding. Child and general-public answers must not set professional operational thresholds.',
      ),
      evaluationMethod: 'pre-post',
      evaluationNotes: L(
        '配對 n 只計算同一題號同時有計分的課前與課後答案。使用 scripts/summarize-education.mjs 做描述統計；不要填補缺值，也不要在正式流程跑顯著性檢定。',
        'Paired n counts only sessions with scored pre and post answers for the same item ID. Use scripts/summarize-education.mjs for descriptive counts; do not impute missing values or run significance tests in the official flow.',
      ),
      results: emptyLoc(),
      whatChangedAfterFeedback: emptyLoc(),
      reusableDownloads: programDownloads,
      license: licenseUnknown,
    },
    {
      id: 'game-1-pixel',
      title: L('遊戲 1 · 氣味像素實驗室', 'Game 1 · Odor Pixel Lab'),
      status: 'in-progress',
      audienceAndNeeds: L(
        '需要練習「用整組受體圖案辨認氣味」的學生與一般訪客。Junior／Standard／Challenge 對應不同干擾與速度。',
        'Learners who need to practice identifying an odor from a receptor pattern. Junior / Standard / Challenge change noise and timing.',
      ),
      learningObjectives: L(
        '能說明氣味身分是多受體圖案；理解雜訊可能干擾但仍應看整體圖案。',
        'Explain that odor identity is a multi-receptor pattern; treat extra lights as noise and still read the overall pattern.',
      ),
      coDesignAdaptation: L(
        '題號 G1-COMB-01、G1-NOISE-01、G1-TRANSFER-01 可在真實遊玩後改寫，但 ID 保持穩定。',
        'Items G1-COMB-01, G1-NOISE-01, and G1-TRANSFER-01 can be reworded after real playtests; IDs stay stable.',
      ),
      materials: L(
        'games/pixel/index.html；遊戲說明 game-1-pixel.md；可選 ?study=1。',
        'games/pixel/index.html; game-1-pixel.md; optional ?study=1.',
      ),
      activity: L(
        '觀看 LED 圖案（可能含雜訊），選出對應氣味。科學說明強調此為示意模型。',
        'View an LED pattern (possibly with noise) and choose the matching odor. The science note states this is an illustrative model.',
      ),
      safetyInclusivityAccessibility: L(
        '鍵盤 1–4 作答；圖案有 aria-label；亮格另有中心標記、雜訊另有條紋。高對比與減少特效可在遊戲內開啟。',
        'Keys 1–4 select options; grids have aria-labels; ON cells use a center mark and noise uses stripes. High contrast and reduced effects are available in-game.',
      ),
      evaluationMethod: 'pre-post',
      evaluationNotes: L(
        '配對題：G1-COMB-01、G1-NOISE-01。遷移：G1-TRANSFER-01。成果未填。',
        'Paired items: G1-COMB-01, G1-NOISE-01. Transfer: G1-TRANSFER-01. Results not filled.',
      ),
      results: emptyLoc(),
      whatChangedAfterFeedback: emptyLoc(),
      reusableDownloads: [download('遊戲 1 說明', 'Game 1 guide', 'game-1-pixel.md')],
      license: licenseUnknown,
    },
    {
      id: 'game-2-qc-shift',
      title: L('遊戲 2 · AeroSense：氣味迷宮', 'Game 2 · AeroSense: Scentbound Labyrinth'),
      status: 'in-progress',
      audienceAndNeeds: L(
        '想用迷宮理解氣味感測可以指路、辨真假、打開密道的訪客。公開路徑仍是 games/labyrinth/。',
        'Visitors who should learn that odor sensing can guide a path, tell true from fake, and open hidden routes. The public URL remains games/labyrinth/.',
      ),
      learningObjectives: L(
        '能說出氣味感測可以指路、辨真假、打開密道；用掃描區分已知氣味、未知圖樣與雜訊標記，而不是把示意氣味當成真實診斷。',
        'Explain that odor sensing can guide, verify, and open hidden paths; use Scan to tell learned scents, unknown patterns, and noisy markers apart, without treating illustrative odors as real diagnoses.',
      ),
      coDesignAdaptation: L(
        '計畫依工作坊回饋調整警報資訊偏好題（G2-ALERT-01）與提示文案。尚無登錄的玩家回饋。',
        'Plan to adjust the optional alert-preference item (G2-ALERT-01) and hint copy from workshop notes. No player feedback is logged yet.',
      ),
      materials: L(
        'games/labyrinth/index.html；game-2-qc-shift.md；可選 ?study=1。',
        'games/labyrinth/index.html; game-2-qc-shift.md; optional ?study=1.',
      ),
      activity: L(
        '走出迷宮。死路寶箱解鎖掃描、氣味指引與秘密通道。',
        'Find the maze exit. Dead-end chests unlock scan, scent guidance, and secret passages.',
      ),
      safetyInclusivityAccessibility: L(
        '無真實食品或感測器。鍵盤 WASD／空白鍵／Q／E 與觸控搖桿。高對比、減少特效與低暗度可在進階設定開啟。',
        'No real food or sensors. Keyboard WASD / Space / Q / E plus a touch joystick. High contrast, reduced motion, and low darkness are in Advanced settings.',
      ),
      evaluationMethod: 'pre-post',
      evaluationNotes: L(
        '配對題：G2-SCREEN-01、G2-QC-01。匯出可含監看／重測／暫扣次數等模擬決策欄位。',
        'Paired items: G2-SCREEN-01, G2-QC-01. Exports may include simulated monitor / retest / hold counts.',
      ),
      results: emptyLoc(),
      whatChangedAfterFeedback: emptyLoc(),
      reusableDownloads: [download('遊戲 2 說明', 'Game 2 guide', 'game-2-qc-shift.md')],
      license: licenseUnknown,
    },
    {
      id: 'game-3-scent-mixer',
      title: L('遊戲 3 · 氣味指紋混合器', 'Game 3 · Scent Mixer / Odor Fingerprint Mixer'),
      status: 'in-progress',
      audienceAndNeeds: L(
        '需要看到「混合物會重疊」並練習比較候選比例的訪客。Junior 為兩張卡片與固定比例。',
        'Visitors who need to see that mixtures overlap and to compare candidate ratios. Junior uses two cards and fixed ratios.',
      ),
      learningObjectives: L(
        '能說明混合物可造成重疊的受體反應；理解計算解碼是在比較候選與比例，不是單一看一個峰值。',
        'Explain that mixtures can overlap; treat decoding as comparing candidates and ratios, not reading a single peak.',
      ),
      coDesignAdaptation: L(
        'Junior 路徑已在軟體中提供，便於較少同時操作的場合。真實遊玩後可再調整提示層級文案。',
        'A Junior path is already in software for sessions that need fewer simultaneous controls. Hint copy can change after real playtests.',
      ),
      materials: L(
        'games/spectrum/index.html；game-3-scent-mixer.md；可選 ?study=1。',
        'games/spectrum/index.html; game-3-scent-mixer.md; optional ?study=1.',
      ),
      activity: L(
        '閱讀 12 通道示意圖，推測混合來源與整數比例。圖表另有文字摘要。',
        'Read a 12-channel illustrative chart and infer sources plus integer ratios. The chart has a text summary.',
      ),
      safetyInclusivityAccessibility: L(
        '圖表不只靠顏色：有文字峰值摘要與座標說明。高對比與減少動畫。解題成功不代表測出真實濃度。',
        'Charts are not color-only: text peak summaries and axis notes are provided. High contrast and reduced motion. Solving a puzzle is not a real concentration measurement.',
      ),
      evaluationMethod: 'pre-post',
      evaluationNotes: L(
        '配對題：G3-MIX-01、G3-DECODE-01。匯出可含猜測次數、提示層級、是否解出。',
        'Paired items: G3-MIX-01, G3-DECODE-01. Exports may include guesses, hint level, and solved.',
      ),
      results: emptyLoc(),
      whatChangedAfterFeedback: emptyLoc(),
      reusableDownloads: [download('遊戲 3 說明', 'Game 3 guide', 'game-3-scent-mixer.md')],
      license: licenseUnknown,
    },
  ],
};

export function assertEducationActivity(a: EducationActivity): void {
  if (!a.id.trim()) throw new Error('education activity id required');
  if (a.status === 'completed' && !a.results.en.trim() && !a.results['zh-Hant'].trim()) {
    throw new Error(
      `education ${a.id}: completed activities require team-supplied results (no invented metrics)`,
    );
  }
}
