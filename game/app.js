const ODORS = [
  { id: 'banana', name: '香蕉', en: 'Banana', vector: [1, .1, .1, .45, .05] },
  { id: 'lemon', name: '檸檬', en: 'Lemon', vector: [1, .05, .9, .05, .08] },
  { id: 'rose', name: '玫瑰', en: 'Rose', vector: [.15, 1, .12, .2, .02] },
  { id: 'coffee', name: '咖啡', en: 'Coffee', vector: [.02, .02, .08, 1, .35] },
  { id: 'mint', name: '薄荷', en: 'Mint', vector: [.08, .25, 1, .02, .08] },
  { id: 'strawberry', name: '草莓', en: 'Strawberry', vector: [1, .4, .12, .25, .02] },
  { id: 'chocolate', name: '巧克力', en: 'Chocolate', vector: [.1, .05, .02, 1, .15] },
  { id: 'lavender', name: '薰衣草', en: 'Lavender', vector: [.05, 1, .45, .18, .02] },
  { id: 'orange', name: '柳橙', en: 'Orange', vector: [1, .08, .75, .12, .05] },
  { id: 'cinnamon', name: '肉桂', en: 'Cinnamon', vector: [.06, .12, .04, 1, .4] },
  { id: 'apple', name: '蘋果', en: 'Apple', vector: [1, .15, .42, .15, .04] },
  { id: 'vanilla', name: '香草', en: 'Vanilla', vector: [.18, .7, .05, .75, .02] },
  { id: 'bread', name: '麵包', en: 'Bread', vector: [.02, .02, .08, .85, .65] },
  { id: 'pine', name: '松木', en: 'Pine', vector: [.02, .15, .88, .3, .18] },
  { id: 'popcorn', name: '爆米花', en: 'Popcorn', vector: [.04, .02, .04, .78, .72] },
  { id: 'peach', name: '水蜜桃', en: 'Peach', vector: [1, .38, .18, .22, .02] },
  { id: 'garlic', name: '大蒜', en: 'Garlic', vector: [.02, .01, .1, .12, 1] },
  { id: 'ocean', name: '海洋', en: 'Ocean', vector: [.02, .02, 1, .02, .58] },
  { id: 'honey', name: '蜂蜜', en: 'Honey', vector: [.35, .35, .06, .9, .03] },
  { id: 'smoke', name: '營火', en: 'Campfire', vector: [.01, .01, .12, 1, .75] },
];

const LEVELS = [
  { size: 3, name: '感知初醒' },
  { size: 4, name: '氣味輪廓' },
  { size: 5, name: '模式交會' },
  { size: 6, name: '嗅覺迷宮' },
  { size: 7, name: '神經星圖' },
];

const ACTIVATIONS = [1, 5, 10, 15, 20];
const state = {
  level: 0,
  activation: 1,
  mode: 'ready',
  round: 0,
  score: 0,
  answered: false,
  questions: [],
  sessionPool: [],
  studyIndex: 0,
  studyFurthest: 0,
  muted: false,
};

const els = {
  playArea: document.querySelector('#playArea'),
  levelTabs: document.querySelector('#levelTabs'),
  activationPicker: document.querySelector('#activationPicker'),
  activationValue: document.querySelector('#activationValue'),
  levelNumber: document.querySelector('#levelNumber'),
  levelName: document.querySelector('#levelName'),
  odorCount: document.querySelector('#odorCount'),
  atlasDialog: document.querySelector('#atlasDialog'),
  guideDialog: document.querySelector('#guideDialog'),
  atlasGrid: document.querySelector('#atlasGrid'),
  soundButton: document.querySelector('#soundButton'),
};

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, seed = `${Date.now()}-${Math.random()}`) {
  const result = [...items];
  const random = hash(seed);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function cellFeatures(size, index) {
  const random = hash(`receptor-${size}-${index}`);
  return [random(), random(), random(), random(), random()];
}

function rawOdorPattern(odor, size) {
  const total = size * size;
  const activeCount = Math.max(3, Math.round(total * .36));
  const personal = hash(`${odor.id}-${size}`);
  const ranked = Array.from({ length: total }, (_, index) => {
    const features = cellFeatures(size, index);
    const affinity = features.reduce((sum, value, i) => sum + value * odor.vector[i], 0) /
      odor.vector.reduce((sum, value) => sum + value, 0);
    return { index, score: affinity + personal() * .13 };
  }).sort((a, b) => b.score - a.score);
  const active = new Set(ranked.slice(0, activeCount).map(item => item.index));
  return Array.from({ length: total }, (_, index) => active.has(index));
}

const patternCache = new Map();

function patternsForSize(size) {
  if (patternCache.has(size)) return patternCache.get(size);

  const patterns = new Map();
  const used = new Set();
  ODORS.forEach(odor => {
    const original = rawOdorPattern(odor, size);
    let candidate = original;
    let signature = candidate.map(Number).join('');

    // Similar feature vectors can collapse to the same sparse pattern on a tiny
    // grid. Swap only one cell to keep them similar while making every odor fair.
    if (used.has(signature)) {
      const active = original.map((value, index) => value ? index : -1).filter(index => index >= 0);
      const off = original.map((value, index) => value ? -1 : index).filter(index => index >= 0);
      const variants = [];
      active.forEach(onIndex => off.forEach(offIndex => variants.push([onIndex, offIndex])));
      const ordered = shuffle(variants, `signature-${odor.id}-${size}`);
      for (const [onIndex, offIndex] of ordered) {
        const variant = [...original];
        variant[onIndex] = false;
        variant[offIndex] = true;
        const variantSignature = variant.map(Number).join('');
        if (!used.has(variantSignature)) {
          candidate = variant;
          signature = variantSignature;
          break;
        }
      }
    }

    used.add(signature);
    patterns.set(odor.id, candidate);
  });
  patternCache.set(size, patterns);
  return patterns;
}

function odorPattern(odor, size) {
  return patternsForSize(size).get(odor.id);
}

function noisyPattern(odor, size, activation, round) {
  const base = odorPattern(odor, size);
  const off = base.map((value, index) => value ? -1 : index).filter(index => index >= 0);
  const noiseCount = Math.min(off.length, Math.round(size * size * activation / 100));
  const noisy = shuffle(off, `${odor.id}-${size}-${activation}-${round}`).slice(0, noiseCount);
  return { base, noise: new Set(noisy) };
}

function similarity(a, b) {
  const dot = a.vector.reduce((sum, value, i) => sum + value * b.vector[i], 0);
  const ma = Math.sqrt(a.vector.reduce((sum, value) => sum + value * value, 0));
  const mb = Math.sqrt(b.vector.reduce((sum, value) => sum + value * value, 0));
  return dot / (ma * mb);
}

function visualStyle(index) {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return `background-position:${col * 25}% ${row * (100 / 3)}%`;
}

function smellVisual(odor, className = '') {
  const index = ODORS.indexOf(odor);
  return `<div class="smell-visual ${className}" style="${visualStyle(index)}" role="img" aria-label="${odor.name}"></div>`;
}

function matrixMarkup(pattern, size, noise = new Set(), label = '氣味 LED 編碼') {
  const cells = pattern.map((on, index) => {
    const type = noise.has(index) ? 'noise-cell' : on ? 'on' : '';
    return `<i class="led-cell ${type}"></i>`;
  }).join('');
  return `<div class="led-matrix" style="--size:${size}" role="img" aria-label="${size} 乘 ${size} ${label}">${cells}</div>`;
}

function renderControls() {
  els.levelTabs.innerHTML = LEVELS.map((level, index) => `
    <button class="level-tab ${state.level === index ? 'active' : ''}" role="tab" aria-selected="${state.level === index}" data-level="${index}" type="button">
      <span>LEVEL 0${index + 1}</span><strong>${level.size} × ${level.size}</strong>
    </button>
  `).join('');

  els.activationPicker.innerHTML = ACTIVATIONS.map(value => `
    <button class="activation-button ${state.activation === value ? 'active' : ''}" data-activation="${value}" type="button" aria-label="${value}% 干擾活化">${value}%</button>
  `).join('');

  const level = LEVELS[state.level];
  els.activationValue.textContent = `${state.activation}%`;
  els.levelNumber.textContent = `0${state.level + 1}`;
  els.levelName.textContent = level.name;
  els.odorCount.textContent = '6';
}

function renderReady() {
  const level = LEVELS[state.level];
  const featured = ODORS[Math.min(state.level * 4, ODORS.length - 1)];
  const pattern = odorPattern(featured, level.size);
  els.playArea.innerHTML = `
    <div class="ready-state">
      <div class="matrix-showcase">
        <div class="matrix-aura"></div>
        ${matrixMarkup(pattern, level.size)}
      </div>
      <div class="ready-copy">
        <span class="section-label">LEVEL 0${state.level + 1} · READY</span>
        <h3>${level.size} × ${level.size} ${level.name}</h3>
        <p>本關會從完整的 20 種氣味圖鑑中隨機抽出 6 種。相近的氣味會共享更多亮點，但每一種仍有自己的細微特徵。</p>
        <div class="ready-tip"><b>i</b><span>建議先開啟氣味圖鑑，點選圖片比較編碼，再開始 10 題挑戰。</span></div>
        <button class="primary-button" id="startButton" type="button">隨機抽選並預習 6 種 <span class="arrow">→</span></button>
      </div>
    </div>
  `;
  document.querySelector('#startButton').addEventListener('click', beginStudy);
}

function beginStudy() {
  state.mode = 'study';
  state.sessionPool = shuffle(ODORS, `session-${Date.now()}-${Math.random()}`).slice(0, 6);
  state.studyIndex = 0;
  state.studyFurthest = 0;
  playTone(480, .08);
  renderStudy();
}

function renderStudy() {
  const level = LEVELS[state.level];
  const pool = state.sessionPool;
  const odor = pool[state.studyIndex];
  const isFirst = state.studyIndex === 0;
  const isLast = state.studyIndex === pool.length - 1;

  els.playArea.innerHTML = `
    <div class="study-state">
      <div class="study-topline">
        <div>
          <span class="section-label">SCENT PREVIEW</span>
          <h3>測驗前，先記住每個氣味</h3>
        </div>
        <span class="question-count">${String(state.studyIndex + 1).padStart(2, '0')} / ${String(pool.length).padStart(2, '0')}</span>
      </div>

      <div class="study-progress" aria-label="氣味預習進度">
        ${pool.map((item, index) => `
          <button class="study-dot ${index === state.studyIndex ? 'active' : ''} ${index <= state.studyFurthest && index !== state.studyIndex ? 'viewed' : ''}"
            data-study-index="${index}" type="button" aria-label="查看${item.name}" ${index > state.studyFurthest ? 'disabled' : ''}></button>
        `).join('')}
      </div>

      <div class="study-content">
        <div class="study-odor">
          <span class="study-number">ODOR ${String(state.studyIndex + 1).padStart(2, '0')}</span>
          ${smellVisual(odor, 'study-image')}
          <div class="study-name"><h4>${odor.name}</h4><span>${odor.en}</span></div>
        </div>
        <div class="study-code">
          ${matrixMarkup(odorPattern(odor, level.size), level.size, new Set(), `${odor.name}的基礎編碼`)}
          <div><b>${level.size} × ${level.size} 基礎編碼</b><span>綠色亮點屬於氣味本身；正式測驗中可能加入紫色干擾。</span></div>
        </div>
      </div>

      <div class="study-actions">
        <button class="secondary-button" id="studyPrev" type="button" ${isFirst ? 'disabled' : ''}>← 上一個</button>
        <span>${isLast ? '已看到最後一種氣味' : `還有 ${pool.length - state.studyIndex - 1} 種氣味`}</span>
        <button class="primary-button" id="studyNext" type="button">
          ${isLast ? '全部看完，確認開始' : '記住了，下一個'} <span class="arrow">→</span>
        </button>
      </div>
    </div>
  `;

  document.querySelector('#studyPrev').addEventListener('click', () => {
    if (state.studyIndex > 0) {
      state.studyIndex -= 1;
      renderStudy();
    }
  });
  document.querySelector('#studyNext').addEventListener('click', () => {
    if (isLast) startGame();
    else {
      state.studyIndex += 1;
      state.studyFurthest = Math.max(state.studyFurthest, state.studyIndex);
      playTone(540, .05);
      renderStudy();
    }
  });
  document.querySelectorAll('[data-study-index]').forEach(button => {
    button.addEventListener('click', () => {
      state.studyIndex = Number(button.dataset.studyIndex);
      renderStudy();
    });
  });
}

function makeQuestions() {
  const pool = state.sessionPool;
  const answers = shuffle([
    ...pool,
    ...shuffle(pool, `repeat-${Date.now()}`).slice(0, 4),
  ], `answers-${Date.now()}`);
  return answers.map((answer, round) => {
    const similar = pool
      .filter(odor => odor !== answer)
      .sort((a, b) => similarity(answer, b) - similarity(answer, a));
    const close = similar.slice(0, 5);
    const distractors = shuffle(close, `${answer.id}-close-${round}`).slice(0, 2);
    const remaining = pool.filter(odor => odor !== answer && !distractors.includes(odor));
    distractors.push(shuffle(remaining, `${answer.id}-far-${round}`)[0]);
    return { answer, options: shuffle([answer, ...distractors], `${answer.id}-options-${round}`) };
  });
}

function startGame() {
  state.mode = 'quiz';
  state.round = 0;
  state.score = 0;
  state.answered = false;
  state.questions = makeQuestions();
  playTone(480, .08);
  renderQuiz();
}

function renderQuiz() {
  const level = LEVELS[state.level];
  const question = state.questions[state.round];
  const encoded = noisyPattern(question.answer, level.size, state.activation, state.round);
  els.playArea.innerHTML = `
    <div class="quiz-state">
      <div class="quiz-topline">
        <div class="progress-track"><div class="progress-fill" style="width:${(state.round + 1) * 10}%"></div></div>
        <span class="question-count">${String(state.round + 1).padStart(2, '0')} / 10</span>
        <span class="score-pill">${state.score} PTS</span>
      </div>
      <div class="quiz-main">
        <div class="question-visual">${matrixMarkup(encoded.base, level.size, encoded.noise)}</div>
        <div class="question-panel">
          <span class="section-label">IDENTIFY THE SCENT</span>
          <h3>這組編碼是哪個氣味？</h3>
          <p>選出最符合這組 LED 模式的氣味圖片</p>
          <div class="options-grid">
            ${question.options.map(odor => `
              <button class="option-card" data-odor="${odor.id}" type="button">
                ${smellVisual(odor)}
                <span><strong>${odor.name}</strong><small>${odor.en}</small></span>
              </button>
            `).join('')}
          </div>
          <div class="feedback hidden" id="feedback"></div>
        </div>
      </div>
    </div>
  `;
  document.querySelectorAll('.option-card').forEach(button => button.addEventListener('click', answerQuestion));
}

function answerQuestion(event) {
  if (state.answered) return;
  state.answered = true;
  const chosen = event.currentTarget.dataset.odor;
  const question = state.questions[state.round];
  const correct = chosen === question.answer.id;
  if (correct) {
    state.score += 100;
    playTone(720, .11);
  } else {
    playTone(180, .16);
  }

  document.querySelectorAll('.option-card').forEach(button => {
    button.disabled = true;
    if (button.dataset.odor === question.answer.id) {
      button.classList.add('correct');
      button.insertAdjacentHTML('beforeend', '<i class="option-mark">✓</i>');
    } else if (button.dataset.odor === chosen) {
      button.classList.add('wrong');
      button.insertAdjacentHTML('beforeend', '<i class="option-mark">×</i>');
    }
  });

  const feedback = document.querySelector('#feedback');
  const nearest = ODORS
    .filter(odor => odor !== question.answer)
    .sort((a, b) => similarity(question.answer, b) - similarity(question.answer, a))[0];
  feedback.classList.remove('hidden');
  feedback.innerHTML = `
    <div class="feedback-copy ${correct ? '' : 'wrong'}">
      <strong>${correct ? '辨識正確！' : `正確答案是「${question.answer.name}」`}</strong>
      <span>${question.answer.name}與${nearest.name}的特徵較接近，因此會共享較多亮點。</span>
    </div>
    <button class="next-button" id="nextButton" type="button">${state.round === 9 ? '看結果' : '下一題'} →</button>
  `;
  document.querySelector('#nextButton').addEventListener('click', nextQuestion);
}

function nextQuestion() {
  if (state.round >= 9) {
    state.mode = 'result';
    renderResult();
    return;
  }
  state.round += 1;
  state.answered = false;
  renderQuiz();
}

function renderResult() {
  const correct = state.score / 100;
  const passed = correct >= 6;
  const perfect = correct === 10;
  const level = LEVELS[state.level];
  if (perfect) playFanfare();
  els.playArea.innerHTML = `
    <div class="result-state">
      <div class="result-score">
        <div class="score-ring" style="--score-angle:${correct * 36}deg"><div><strong>${state.score}</strong><span>FINAL SCORE</span></div></div>
        <span class="result-badge ${passed ? '' : 'fail'}">${perfect ? '✦ 完美辨識' : passed ? '✓ 挑戰通過' : '再試一次'}</span>
      </div>
      <div class="result-copy">
        <span class="section-label">LEVEL 0${state.level + 1} · COMPLETE</span>
        <h3>${perfect ? '你的嗅覺地圖很清晰！' : passed ? '成功讀懂氣味編碼！' : '已經很接近了！'}</h3>
        <p>${perfect ? '十題全數辨識正確，這是本關最高分。' : passed ? '你已達到 60% 過關標準，可以前往下一個矩陣尺寸。' : '先到圖鑑比較相似氣味的共同亮點，再挑戰一次。'}</p>
        <div class="result-metrics">
          <div><strong>${correct}</strong><span>答對題數</span></div>
          <div><strong>${state.activation}%</strong><span>干擾活化</span></div>
          <div><strong>${level.size}×${level.size}</strong><span>矩陣尺寸</span></div>
        </div>
        <div class="result-actions">
          <button class="secondary-button" id="retryButton" type="button">重新挑戰</button>
          ${passed && state.level < LEVELS.length - 1 ? '<button class="primary-button" id="nextLevelButton" type="button">下一大關 <span class="arrow">→</span></button>' : '<button class="primary-button" id="viewAtlasResult" type="button">複習圖鑑</button>'}
        </div>
      </div>
    </div>
  `;
  document.querySelector('#retryButton').addEventListener('click', beginStudy);
  const nextLevel = document.querySelector('#nextLevelButton');
  if (nextLevel) nextLevel.addEventListener('click', () => setLevel(state.level + 1));
  const atlas = document.querySelector('#viewAtlasResult');
  if (atlas) atlas.addEventListener('click', openAtlas);
}

function setLevel(index) {
  state.level = index;
  state.mode = 'ready';
  renderControls();
  renderReady();
  window.scrollTo({ top: document.querySelector('.lab').offsetTop - 20, behavior: 'smooth' });
}

function renderAtlas(selected = null) {
  const level = LEVELS[state.level];
  const pool = ODORS;
  els.atlasGrid.innerHTML = pool.map((odor, index) => {
    const detail = selected === odor.id ? `
      <div class="atlas-detail">
        ${matrixMarkup(odorPattern(odor, level.size), level.size, new Set(), `${odor.name}的基礎編碼`)}
        <div><span class="section-label">BASE PATTERN</span><h3>${odor.name} · ${odor.en}</h3><p>這是 ${level.size} × ${level.size} 模式下的固定基礎編碼。挑戰中的紫色亮點是額外干擾，不屬於原始氣味。</p></div>
      </div>` : '';
    return `
      <button class="atlas-item" data-atlas-odor="${odor.id}" type="button">
        ${smellVisual(odor)}
        <span class="atlas-item-copy"><strong>${odor.name}</strong><small>${String(index + 1).padStart(2, '0')}</small></span>
      </button>${detail}`;
  }).join('');
  document.querySelectorAll('[data-atlas-odor]').forEach(button => {
    button.addEventListener('click', () => renderAtlas(button.dataset.atlasOdor === selected ? null : button.dataset.atlasOdor));
  });
}

function openAtlas() {
  renderAtlas();
  els.atlasDialog.showModal();
}

let audioContext;
function playTone(frequency, duration) {
  if (state.muted) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is an optional enhancement. */ }
}

function playFanfare() {
  [520, 660, 820].forEach((tone, i) => setTimeout(() => playTone(tone, .18), i * 120));
}

els.levelTabs.addEventListener('click', event => {
  const button = event.target.closest('[data-level]');
  if (button) setLevel(Number(button.dataset.level));
});

els.activationPicker.addEventListener('click', event => {
  const button = event.target.closest('[data-activation]');
  if (!button) return;
  state.activation = Number(button.dataset.activation);
  state.mode = 'ready';
  renderControls();
  renderReady();
});

document.querySelector('#atlasButton').addEventListener('click', openAtlas);
document.querySelector('#guideButton').addEventListener('click', () => els.guideDialog.showModal());
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.close}`).close());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
});
els.soundButton.addEventListener('click', () => {
  state.muted = !state.muted;
  els.soundButton.classList.toggle('muted', state.muted);
  els.soundButton.setAttribute('aria-label', state.muted ? '開啟音效' : '關閉音效');
  if (!state.muted) playTone(520, .08);
});

renderControls();
renderReady();
