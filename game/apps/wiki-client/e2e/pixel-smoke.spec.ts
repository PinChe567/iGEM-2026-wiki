import { expect, test } from '@playwright/test';
import { buildPracticeSession, mergePracticeSettings } from '@suite/core/pixel';
import { CONTENT_VERSION, toPixelOdors } from '@suite/content';

const FIXED_SEED = 'e2e-smoke-seed-001';

test.describe('Pixel Lab smoke', () => {
  test('complete a seeded run, switch language, use keyboard, replay seed', async ({ page }) => {
    const odors = toPixelOdors();
    const settings = mergePracticeSettings({
      matrixSize: 4,
      noisePercentOfOff: 0,
      allowStudyReview: true,
      patternDisplayMs: 0,
      distractorBias: 'mixed',
      poolSize: 6,
      questionCount: 10,
    });
    const session = buildPracticeSession({
      odors,
      settings,
      seed: FIXED_SEED,
      contentVersion: CONTENT_VERSION,
    });

    await page.goto('./games/pixel/index.html');
    await expect(page.locator('#start')).toBeVisible();

    await page.locator('.lang-switch [data-locale="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#start')).toContainText(/Start Game/i);

    await page.locator('.lang-switch [data-locale="zh-Hant"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');

    await page.locator('[data-level="practice"]').click();
    await page.locator('.advanced-settings summary').click();
    await page.locator('#matrixSize').selectOption('4');
    await page.locator('#bias').selectOption('mixed');
    await page.locator('[data-noise="0"]').click();
    await page.locator('#display').selectOption('0');
    await page.locator('#seedInput').fill(FIXED_SEED);
    await page.locator('#start').click();

    await expect(page.locator('#onboardNext')).toBeVisible();
    await page.locator('#onboardNext').click();
    await page.locator('#onboardStart').click();

    for (let i = 0; i < session.poolIds.length; i += 1) {
      await page.locator('#next').click();
    }

    for (const question of session.questions) {
      const answerIndex = question.optionIds.indexOf(question.answerId);
      expect(answerIndex).toBeGreaterThanOrEqual(0);
      await page.locator('.option-card').nth(answerIndex).click();
      await expect(page.locator('#goNext')).toBeVisible();
      await page.locator('#goNext').click();
    }

    await expect(page.locator('.result-state')).toBeVisible();
    await page.locator('.tech-details summary').click();
    await expect(page.getByText(FIXED_SEED)).toBeVisible();
    await page.locator('#replay').click();
    await expect(page.locator('#next')).toBeVisible();
  });
});
