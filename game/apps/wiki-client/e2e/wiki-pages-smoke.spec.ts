import { expect, test } from '@playwright/test';

test('hub shows game cards without wiki page nav', async ({ page }) => {
  await page.goto('./index.html');
  await expect(page.locator('.wiki-page-nav')).toHaveCount(0);
  await expect(page.getByTestId('card-pixel')).toBeVisible();
  await expect(page.getByTestId('card-labyrinth')).toBeVisible();
  await expect(page.getByTestId('card-spectrum')).toBeVisible();
  await expect(page.getByTestId('play-pixel')).toBeVisible();
  await expect(page.getByTestId('science-labyrinth')).toBeVisible();
  await expect(page.getByTestId('hub-educators')).toBeVisible();
  await expect(page.getByTestId('explorer')).toHaveCount(0);
});

test('education page lists in-progress activities without invented results', async ({ page }) => {
  await page.goto('./education/index.html');
  await page.locator('.lang-switch [data-locale="en"]').click();
  await expect(page.getByTestId('for-educators')).toBeVisible();
  await expect(page.getByTestId('education-activity')).toHaveCount(4);
  await expect(page.getByTestId('education-empty')).toHaveCount(0);
  await expect(page.locator('.sp-muted')).toHaveCount(4);
});
