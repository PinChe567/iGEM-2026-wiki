import { expect, test, type Page } from '@playwright/test';

async function startGuest(page: Page, nickname: string): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('health-ok')).toBeVisible({ timeout: 30_000 });
  const guestStart = page.getByTestId('guest-start');
  if (await guestStart.isVisible().catch(() => false)) {
    await page.getByTestId('nick-input').fill(nickname);
    await page.getByTestId('start-guest').click();
  }
  await expect(page.getByTestId('session')).toBeVisible({ timeout: 15_000 });
}

test('two browsers share Sync Race lobby without answer-key leakage', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  const leaks: string[] = [];
  for (const page of [pageA, pageB]) {
    page.on('response', async (res) => {
      if (!res.url().includes('/api/') && !res.url().includes('/socket.io')) return;
      try {
        const text = await res.text();
        if (/privateSeed|answerKey|"answerId"/.test(text)) {
          leaks.push(`${res.url()} :: ${text.slice(0, 200)}`);
        }
      } catch {
        /* non-text */
      }
    });
  }

  await startGuest(pageA, 'Browser Alpha');
  await startGuest(pageB, 'Browser Bravo');

  await pageA.getByRole('button', { name: 'Sync Race', exact: true }).click();
  await pageB.getByRole('button', { name: 'Sync Race', exact: true }).click();
  await expect(pageA.getByTestId('sync-hub')).toBeVisible();
  await expect(pageB.getByTestId('sync-hub')).toBeVisible();

  await pageA.getByTestId('create-room').click();
  await expect(pageA.getByTestId('room-code')).toBeVisible({ timeout: 20_000 });
  const code = (await pageA.getByTestId('room-code').innerText()).trim();
  expect(code.length).toBeGreaterThanOrEqual(4);

  await pageB.getByTestId('join-code').fill(code);
  await pageB.getByTestId('join-room').click();
  await expect(pageB.getByTestId('room-code')).toHaveText(code, { timeout: 20_000 });

  await pageA.getByTestId('sync-ready').click();
  await pageB.getByTestId('sync-ready').click();

  // Both should observe countdown or question without answer keys in DOM.
  await expect
    .poll(async () => {
      const a = await pageA.locator('[data-testid="sync-stage"]').innerText();
      const b = await pageB.locator('[data-testid="sync-stage"]').innerText();
      return `${a}\n${b}`;
    }, { timeout: 15_000 })
    .toMatch(/Countdown|Question|lobby/i);

  const domA = await pageA.content();
  const domB = await pageB.content();
  expect(domA).not.toMatch(/privateSeed|answerKey/);
  expect(domB).not.toMatch(/privateSeed|answerKey/);
  expect(leaks).toEqual([]);

  await ctxA.close();
  await ctxB.close();
});

test('daily challenge hub exposes ranked policy and server-verified badge', async ({ page }) => {
  await startGuest(page, 'Daily Browser');
  await page.getByRole('button', { name: 'Daily Challenge', exact: true }).click();
  await expect(page.getByTestId('daily-hub')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('server-verified')).toContainText(/Server verified/i);
  await expect(page.getByTestId('ranked-policy')).toContainText(/first completed/i);
  const html = await page.content();
  expect(html).not.toMatch(/privateSeed|"answerId"|answerKey/);
});
