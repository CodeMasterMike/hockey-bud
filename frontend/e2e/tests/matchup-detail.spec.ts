import { test, expect } from '@playwright/test';

const API_URL = process.env['PLAYWRIGHT_API_URL'] ?? 'http://localhost:5072';

/** Fetches a series letter from the playoff bracket API, or null if unavailable. */
async function getSeriesLetter(page: import('@playwright/test').Page): Promise<string | null> {
  try {
    const res = await page.request.get(`${API_URL}/api/leagues/nhl/playoffs/bracket`);
    if (!res.ok()) return null;
    const data = await res.json();
    const series = data.rounds?.[0]?.series?.[0];
    return series?.seriesLetter ?? null;
  } catch { return null; }
}

test.describe('Matchup Detail Page', () => {
  test('matchup detail shows teams and series info', async ({ page }) => {
    const seriesLetter = await getSeriesLetter(page);
    if (!seriesLetter) { test.skip(true, 'No playoff bracket available'); return; }

    await page.goto(`/nhl/playoffs/matchup/${seriesLetter}`);
    await expect(page.locator('app-matchup-detail-page')).toBeVisible({ timeout: 15_000 });

    const hasData = await page.locator('.header').isVisible().catch(() => false);
    if (!hasData) { test.skip(true, 'No matchup data for this series'); return; }

    // Header shows two teams with logos
    await expect(page.locator('.header__team')).toHaveCount(2);
    await expect(page.locator('.header__vs')).toBeVisible();

    // Series info line is present
    await expect(page.locator('.series-info')).toBeVisible();
    await expect(page.locator('.series-info')).not.toBeEmpty();
  });

  test('matchup detail shows games table', async ({ page }) => {
    const seriesLetter = await getSeriesLetter(page);
    if (!seriesLetter) { test.skip(true, 'No playoff bracket available'); return; }

    await page.goto(`/nhl/playoffs/matchup/${seriesLetter}`);
    await expect(page.locator('app-matchup-detail-page')).toBeVisible({ timeout: 15_000 });

    const hasData = await page.locator('.games-card').isVisible().catch(() => false);
    if (!hasData) { test.skip(true, 'No game data'); return; }

    // Games table header
    await expect(page.locator('.games-card__header')).toContainText('Games');

    // Table has rows
    const rows = page.locator('.games-table tbody tr');
    await expect(rows.first()).toBeVisible();

    // Each row has team abbreviations
    await expect(rows.first().locator('.col-team')).not.toHaveCount(0);
  });

  test('back link navigates to bracket', async ({ page }) => {
    const seriesLetter = await getSeriesLetter(page);
    if (!seriesLetter) { test.skip(true, 'No playoff bracket available'); return; }

    await page.goto(`/nhl/playoffs/matchup/${seriesLetter}`);
    await expect(page.locator('app-matchup-detail-page')).toBeVisible({ timeout: 15_000 });

    const backLink = page.locator('.back-link');
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/nhl\/playoffs/);
    }
  });

  test('deep link to matchup detail works on refresh', async ({ page }) => {
    const seriesLetter = await getSeriesLetter(page);
    if (!seriesLetter) { test.skip(true, 'No playoff bracket available'); return; }

    await page.goto(`/nhl/playoffs/matchup/${seriesLetter}`);
    await page.reload();
    await expect(page.locator('app-matchup-detail-page')).toBeVisible({ timeout: 15_000 });
  });

  test('shows error for invalid series letter', async ({ page }) => {
    await page.goto('/nhl/playoffs/matchup/INVALID');
    await expect(page.locator('app-matchup-detail-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.error')).toBeVisible();
  });
});
