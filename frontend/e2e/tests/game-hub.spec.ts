import { test, expect } from '@playwright/test';

// The API lives at a different origin than the frontend SWA.
const API_URL = process.env['PLAYWRIGHT_API_URL'] ?? 'http://localhost:5072';

/** Fetches a game ID from the scores API, or returns null if none available. */
async function getGameId(page: import('@playwright/test').Page): Promise<number | null> {
  try {
    const res = await page.request.get(`${API_URL}/api/leagues/nhl/scores`);
    if (!res.ok()) return null;
    const data = await res.json();
    return data.games?.[0]?.id ?? null;
  } catch { return null; }
}

test.describe('Game Hub Page', () => {
  test('game hub shows team stats tab by default', async ({ page }) => {
    const gameId = await getGameId(page);
    if (!gameId) { test.skip(true, 'No games available'); return; }

    await page.goto(`/nhl/game-hub/${gameId}`);
    await expect(page.locator('.hub-page')).toBeVisible({ timeout: 15_000 });

    const hasData = await page.locator('.tab-bar').isVisible().catch(() => false);
    if (!hasData) { test.skip(true, 'No detail data for this game'); return; }

    await expect(page.locator('.tab-bar button.active')).toContainText('Team Stats');
    await expect(page.locator('.box-table')).not.toHaveCount(0);
    await expect(page.locator('.compare-row')).not.toHaveCount(0);
  });

  test('player stats tab shows skater and goalie tables', async ({ page }) => {
    const gameId = await getGameId(page);
    if (!gameId) { test.skip(true, 'No games available'); return; }

    await page.goto(`/nhl/game-hub/${gameId}`);
    await expect(page.locator('.hub-page')).toBeVisible({ timeout: 15_000 });

    const hasData = await page.locator('.tab-bar').isVisible().catch(() => false);
    if (!hasData) { test.skip(true, 'No detail data'); return; }

    await page.locator('.tab-bar button', { hasText: 'Player Stats' }).click();
    await expect(page.locator('.tab-bar button.active')).toContainText('Player Stats');
    await expect(page.locator('.player-table')).not.toHaveCount(0);
  });

  test('game header shows teams and score', async ({ page }) => {
    const gameId = await getGameId(page);
    if (!gameId) { test.skip(true, 'No games available'); return; }

    await page.goto(`/nhl/game-hub/${gameId}`);
    await expect(page.locator('.game-header')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.game-header__status')).not.toBeEmpty();
    await expect(page.locator('.game-header__scoreline')).toBeVisible();
    await expect(page.locator('.game-header .team-logo')).toHaveCount(2);
  });

  test('back link navigates to scores', async ({ page }) => {
    const gameId = await getGameId(page);
    if (!gameId) { test.skip(true, 'No games available'); return; }

    await page.goto(`/nhl/game-hub/${gameId}`);
    await expect(page.locator('.hub-page')).toBeVisible({ timeout: 15_000 });
    await page.locator('.back-link').click();
    await expect(page).toHaveURL(/\/nhl\/scores/);
  });
});
