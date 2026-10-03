import { expect, test } from '@playwright/test';
import {
  buildPracticeSpectrumSession,
  canonicalizeMixture,
  scoreAB,
} from '@suite/core/spectrum';
import {
  SPECTRUM_CONTENT_VERSION,
  SPECTRUM_ODOR_IDS,
  signatureMap,
} from '@suite/content';

const FIXED_SEED = 'e2e-spectrum-seed-001';
const SIGS = signatureMap();
const ALL_IDS = [...SPECTRUM_ODOR_IDS];

async function resetSpectrum(page: import('@playwright/test').Page) {
  await page.goto('./games/spectrum/index.html');
  await page.evaluate(() => localStorage.removeItem('suite.spectrum.v1'));
  await page.reload();
  await expect(page.getByTestId('ready')).toBeVisible();
}

async function openAdvanced(page: import('@playwright/test').Page) {
  await page.locator('#advanced').evaluate((el: HTMLDetailsElement) => {
    el.open = true;
  });
}

async function startEasyPractice(
  page: import('@playwright/test').Page,
  seed = FIXED_SEED,
) {
  await page.getByTestId('level-easy').click();
  await openAdvanced(page);
  await page.getByTestId('seed').fill(seed);
  await page.getByTestId('start').click();
}

async function completeOrSkipTutorial(page: import('@playwright/test').Page) {
  const tut = page.getByTestId('tutorial');
  if (await tut.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i += 1) {
      await expect(page.getByTestId('tutorial')).toHaveAttribute(
        'data-tutorial-step',
        String(i),
      );
      await page.getByTestId('tut-next').click();
    }
  }
  await expect(page.getByTestId('play')).toBeVisible();
}

/** Build a guess by setting percents (0% = unused). */
async function setGuess(
  page: import('@playwright/test').Page,
  parts: Array<{ odorId: string; percent: number }>,
) {
  // Zero every visible percent control first
  const nums = page.locator('[data-num]');
  const n = await nums.count();
  for (let i = 0; i < n; i += 1) {
    const input = nums.nth(i);
    await input.fill('0');
    await input.blur();
  }
  for (const part of parts) {
    await page.getByTestId(`percent-${part.odorId}`).fill(String(part.percent));
    await page.getByTestId(`percent-${part.odorId}`).blur();
  }
}

test.describe('Scent Spectrum wiki', () => {
  test('tutorial, pool A/B, history, solve, fail, locale, mobile, keyboard', async ({
    page,
  }) => {
    const session = buildPracticeSpectrumSession({
      difficulty: 'easy',
      signatures: SIGS,
      odorIds: ALL_IDS,
      contentVersion: SPECTRUM_CONTENT_VERSION,
      seed: FIXED_SEED,
    });
    const truth = session.puzzle.truth;
    expect(truth.components.length).toBeGreaterThanOrEqual(2);
    expect(session.puzzle.poolIds).toHaveLength(6);

    const swapped = canonicalizeMixture(
      truth.components.length === 2
        ? [
            {
              odorId: truth.components[0]!.odorId,
              percent: truth.components[1]!.percent,
            },
            {
              odorId: truth.components[1]!.odorId,
              percent: truth.components[0]!.percent,
            },
          ]
        : truth.components.map((c, i) => ({
            odorId: c.odorId,
            percent:
              truth.components[(i + 1) % truth.components.length]!.percent,
          })),
    );
    // When only concentrations are swapped among the same odors: 0A2B for 2-comp truth.
    if (truth.components.length === 2) {
      expect(scoreAB(swapped, truth, session.puzzle.poolIds)).toEqual({
        a: 0,
        b: 2,
      });
    }

    await resetSpectrum(page);

    await page.locator('.lang-switch [data-locale="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('start')).toContainText(/Start Game/i);

    await page.locator('.lang-switch [data-locale="zh-Hant"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');

    await startEasyPractice(page);
    await completeOrSkipTutorial(page);
    await expect(page.getByTestId('mix-count')).toBeVisible();
    await expect(page.getByTestId('pattern-stack')).toBeVisible();
    const playCanvasWidths = await page
      .locator('[data-testid="pattern-stack"] canvas.sp-canvas')
      .evaluateAll((els) => els.map((el) => Math.round(el.clientWidth)));
    expect(playCanvasWidths.length).toBeGreaterThan(1);
    expect(new Set(playCanvasWidths).size).toBe(1);

    if (truth.components.length === 2) {
      await setGuess(
        page,
        swapped.components.map((c) => ({ ...c })),
      );
      await expect(page.getByTestId('sum')).toHaveText('100');
      await page.getByTestId('submit').click();
      await expect(page.getByTestId('feedback')).toHaveAttribute('data-ab', '0A2B');
      await expect(page.getByTestId('last-guess')).toBeVisible();
      await expect(page.getByTestId('last-guess-mix')).toBeVisible();
      await expect(page.getByTestId('guess-chart')).toBeVisible();
      await expect(page.locator('#targetCanvas')).toBeVisible();
      await expect(page.getByTestId('more-details')).not.toHaveAttribute('open');
      await page.locator('[data-testid="more-details"] > summary').click();
      await page.getByTestId('tech-details').locator('summary').click();
      await expect(page.getByTestId('ab-result')).toContainText('0A2B');
      await page.getByTestId('toggle-history').click();
      await expect(page.getByTestId('history')).toContainText('0A2B');
    }

    await setGuess(
      page,
      truth.components.map((c) => ({ ...c })),
    );
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('result')).toHaveAttribute('data-solved', 'true');
    await expect(page.getByTestId('truth')).toBeVisible();
    await expect(page.getByTestId('result-patterns')).toBeVisible();
    const resultCanvasWidths = await page
      .locator('[data-testid="result-patterns"] canvas.sp-canvas')
      .evaluateAll((els) => els.map((el) => Math.round(el.clientWidth)));
    expect(resultCanvasWidths.length).toBeGreaterThan(1);
    expect(new Set(resultCanvasWidths).size).toBe(1);

    // Failure reveal
    await page.getByTestId('to-setup').click();
    await page.evaluate(() => {
      const raw = localStorage.getItem('suite.spectrum.v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      data.tutorialSeen = true;
      localStorage.setItem('suite.spectrum.v1', JSON.stringify(data));
    });

    const failSeed = 'e2e-spectrum-fail-002';
    const failSession = buildPracticeSpectrumSession({
      difficulty: 'easy',
      signatures: SIGS,
      odorIds: ALL_IDS,
      contentVersion: SPECTRUM_CONTENT_VERSION,
      seed: failSeed,
    });
    const wrongPool = ALL_IDS.filter(
      (id) => !failSession.puzzle.truth.components.some((c) => c.odorId === id),
    );
    const wrong = canonicalizeMixture([
      { odorId: wrongPool[0]!, percent: 60 },
      { odorId: wrongPool[1]!, percent: 40 },
    ]);

    await startEasyPractice(page, failSeed);
    await expect(page.getByTestId('play')).toBeVisible();

    for (let i = 0; i < 8; i += 1) {
      await setGuess(
        page,
        wrong.components.map((c) => ({ ...c })),
      );
      await page.getByTestId('submit').click();
    }
    await expect(page.getByTestId('result')).toHaveAttribute('data-solved', 'false');
    await expect(page.getByTestId('truth')).toBeVisible();

    // Mobile history
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('to-setup').click();
    await startEasyPractice(page, FIXED_SEED);
    await expect(page.getByTestId('play')).toBeVisible();
    await setGuess(
      page,
      truth.components.map((c) => ({ ...c })),
    );
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('result')).toBeVisible();

    // Keyboard-only
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.getByTestId('to-setup').click();
    await openAdvanced(page);
    await page.getByTestId('seed').fill(FIXED_SEED);
    await page.getByTestId('start').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('play')).toBeVisible();
    await setGuess(
      page,
      truth.components.map((c) => ({ ...c })),
    );
    await page.getByTestId('submit').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('result')).toHaveAttribute('data-solved', 'true');
  });

  test('junior mixer, hints autofill a legal mix, default difficulty, no overflow', async ({
    page,
  }) => {
    const session = buildPracticeSpectrumSession({
      difficulty: 'junior',
      signatures: SIGS,
      odorIds: ALL_IDS,
      contentVersion: SPECTRUM_CONTENT_VERSION,
      seed: FIXED_SEED,
    });
    const truth = session.puzzle.truth;
    expect(truth.components).toHaveLength(2);
    expect(session.puzzle.poolIds).toHaveLength(4);

    await resetSpectrum(page);
    await expect(page.getByTestId('level-junior')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#sp-title')).toContainText(/氣味指紋混合器|Scent Mixer/);

    await page.locator('.lang-switch [data-locale="en"]').click();
    await page.locator('#guideButton').click();
    await expect(page.getByTestId('how-cards')).toBeVisible();
    await expect(page.getByTestId('how-cards')).toContainText('Choose scents');
    await page.locator('#guideDialog [data-close="guideDialog"]').first().click();

    await page.getByTestId('level-junior').click();
    await openAdvanced(page);
    await page.getByTestId('seed').fill(FIXED_SEED);
    await page.getByTestId('start').click();
    await completeOrSkipTutorial(page);

    await expect(page.getByTestId('play')).toHaveClass(/is-junior/);
    await expect(page.getByTestId('pattern-stack')).toBeVisible();
    await expect(page.getByTestId('junior-builder')).toBeVisible();
    await expect(page.locator('[data-num]')).toHaveCount(0);
    await expect(page.locator('[data-range]')).toHaveCount(0);
    await page.locator('[data-testid="more-details"] > summary').click();
    await expect(page.getByTestId('channel-note')).toHaveText(
      'These are receptor-response channels, not a light spectrum.',
    );
    await page.locator('[data-testid="more-details"] > summary').click();

    const first = truth.components[0]!;
    const second = truth.components[1]!;
    await page.getByTestId(`odor-card-${first.odorId}`).click();
    await page.getByTestId(`odor-card-${second.odorId}`).click();
    await expect(page.getByTestId(`odor-card-${first.odorId}`)).toHaveClass(/is-picked/);
    await expect(page.getByTestId(`odor-card-${first.odorId}`)).not.toHaveClass(/is-hint-out/);
    await expect(page.getByTestId(`odor-card-${second.odorId}`)).toHaveClass(/is-picked/);
    const pickedOpacity = await page
      .getByTestId(`odor-card-${first.odorId}`)
      .evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(pickedOpacity).toBeGreaterThan(0.9);
    await page.getByTestId(`ratio-${first.percent}-${second.percent}`).click();
    await expect(page.getByTestId('sum')).toHaveText('100');
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('result')).toHaveAttribute('data-solved', 'true');
    await expect(page.getByTestId('discovered')).toContainText(/overlapping receptor-response/);
    await page.locator('.result-copy .tech-details summary').click();
    await expect(page.getByTestId('model-disclaimer')).toContainText(/educational simulations/);
    await expect(page.getByTestId('time-score')).toHaveCount(0);

    await page.getByTestId('to-setup').click();
    await page.evaluate(() => {
      const raw = localStorage.getItem('suite.spectrum.v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      data.tutorialSeen = true;
      localStorage.setItem('suite.spectrum.v1', JSON.stringify(data));
    });

    await page.getByTestId('level-junior').click();
    await openAdvanced(page);
    await page.getByTestId('seed').fill(FIXED_SEED);
    await page.getByTestId('start').click();
    await expect(page.getByTestId('play')).toBeVisible();

    await page.getByTestId('use-hint').click();
    await page.getByTestId('use-hint').click();
    await page.getByTestId('use-hint').click();
    await expect(page.getByTestId('hint-mixes')).toBeVisible();
    await page.getByTestId('hint-mix-0').click();
    await expect(page.getByTestId('sum')).toHaveText('100');
    await expect(page.getByTestId('submit')).toBeEnabled();

    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(8);

    await page.setViewportSize({ width: 1280, height: 720 });
    for (const id of session.puzzle.poolIds) {
      const card = page.getByTestId(`odor-card-${id}`);
      if ((await card.getAttribute('aria-pressed')) === 'true') {
        await card.click();
      }
    }
    await page.getByTestId(`odor-card-${first.odorId}`).focus();
    await page.keyboard.press('Enter');
    await page.getByTestId(`odor-card-${second.odorId}`).focus();
    await page.keyboard.press('Enter');
    await page.getByTestId(`ratio-${first.percent}-${second.percent}`).focus();
    await page.keyboard.press('Enter');
    await page.getByTestId('submit').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('result')).toHaveAttribute('data-solved', 'true');
  });

  test('switching difficulty or daily during a run returns to the start screen', async ({ page }) => {
    await resetSpectrum(page);
    await startEasyPractice(page);
    await completeOrSkipTutorial(page);
    await expect(page.getByTestId('play')).toBeVisible();

    await page.getByTestId('level-junior').click();
    await expect(page.getByTestId('ready')).toBeVisible();
    await expect(page.getByTestId('play')).toHaveCount(0);
    await expect(page.getByTestId('level-junior')).toHaveAttribute('aria-checked', 'true');

    await page.locator('[data-mode="daily"]').click();
    await expect(page.getByTestId('ready')).toBeVisible();
    await page.locator('#advanced').evaluate((el: HTMLDetailsElement) => {
      el.open = true;
    });
    await expect(page.getByTestId('daily-note')).toBeVisible();
    await expect(page.getByTestId('seed')).toHaveCount(0);

    await page.locator('[data-mode="practice"]').click();
    await expect(page.getByTestId('ready')).toBeVisible();
    await expect(page.getByTestId('seed')).toBeVisible();
    await page.getByTestId('start').click();
    await completeOrSkipTutorial(page);
    await expect(page.getByTestId('play')).toBeVisible();
    await expect(page.getByTestId('play')).toHaveClass(/is-junior/);
  });
});
