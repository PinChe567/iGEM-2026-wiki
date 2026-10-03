import { expect, test } from '@playwright/test';

test.describe('AeroSense Scentbound Labyrinth wiki smoke', () => {
  test('ready screen matches Game 1 chrome and starts the maze', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('./games/labyrinth/index.html');
    await page.locator('.lang-switch [data-locale="en"]').click();
    await expect(page.getByTestId('scentbound-shell')).toBeVisible();
    await expect(page.locator('#introEyebrow')).toContainText(/GAME 02/i);
    await expect(page.getByTestId('ready')).toBeVisible();
    await expect(page.locator('.lx-shell')).toHaveCount(0);
    await expect(page.getByTestId('qc-play')).toHaveCount(0);

    await page.getByTestId('level-junior').click();
    await page.locator('.advanced-settings summary').click();
    await page.getByTestId('seed-input').fill('e2e-maze-junior-001');
    await page.getByTestId('start-adventure').click();
    await expect(page.getByTestId('maze-play')).toBeVisible();
    await expect(page.getByTestId('maze-canvas')).toBeVisible();
    await expect(page.getByTestId('objective')).toBeVisible();
    await page.locator('body').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#pauseOverlay')).toBeVisible();
  });

  test('How to Play shows four control cards', async ({ page }) => {
    await page.goto('./games/labyrinth/index.html');
    await page.locator('.lang-switch [data-locale="en"]').click();
    await page.locator('#guideButton').click();
    await expect(page.getByTestId('how-cards')).toBeVisible();
    await expect(page.getByTestId('how-cards')).toContainText('WASD');
    await expect(page.getByTestId('how-cards')).toContainText('SPACE');
    await expect(page.getByTestId('how-cards')).toContainText('Q');
    await expect(page.getByTestId('how-cards')).toContainText('E');
  });

  test('mobile viewport does not overflow and shows touch controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./games/labyrinth/index.html');
    await page.locator('.lang-switch [data-locale="en"]').click();
    await page.getByTestId('start-adventure').click();
    await expect(page.getByTestId('maze-play')).toBeVisible();
    await expect(page.locator('[data-joystick]')).toBeVisible();
    await expect(page.locator('[data-attack-btn]')).toBeVisible();
    await expect(page.locator('[data-scan-btn]')).toBeVisible();
    await expect(page.locator('[data-interact-btn]')).toBeVisible();
    const box = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(box.scrollWidth).toBeLessThanOrEqual(box.innerWidth + 1);
  });

  test('repeated hints become an explicit next-step instruction', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('./games/labyrinth/index.html');
    await page.locator('.lang-switch [data-locale="en"]').click();
    await page.getByTestId('level-junior').click();
    await page.getByTestId('start-adventure').click();
    await expect(page.getByTestId('maze-play')).toBeVisible();
    const hintBtn = page.locator('#hintBtn');
    await hintBtn.click();
    await hintBtn.click();
    await hintBtn.click();
    const hint = page.getByTestId('hint-prompt');
    await expect(hint).toBeVisible();
    await expect(hint).toHaveAttribute('data-hint-level', '3');
    await expect(hint).toHaveAttribute('data-hint-objective', 'cartridge');
    await expect(hint).toContainText(/Do this now/i);
    await expect(hint).toContainText(/chest|Receptor/i);
  });

  test('hub links to Game 2 Scentbound on the preserved route', async ({ page }) => {
    await page.goto('./index.html');
    await page.locator('.lang-switch [data-locale="en"]').click();
    await expect(page.getByTestId('card-labyrinth')).toContainText(/Scentbound/i);
    await page.locator('a[data-game="labyrinth"]').click();
    await expect(page).toHaveURL(/\/games\/labyrinth(\/index\.html)?\/?$/);
    await expect(page.getByTestId('scentbound-shell')).toBeVisible();
  });
});
