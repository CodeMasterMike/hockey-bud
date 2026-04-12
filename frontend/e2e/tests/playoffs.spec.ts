import { test, expect } from '@playwright/test';

const API_URL = process.env['PLAYWRIGHT_API_URL'] ?? 'http://localhost:5072';

test.describe('Playoff Bracket Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nhl/playoffs');
  });

  test('page loads with title', async ({ page }) => {
    await expect(page.locator('app-playoff-bracket-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.page__title')).toContainText(/Playoffs/i);
  });

  test('conference tabs are visible', async ({ page }) => {
    await expect(page.locator('app-playoff-bracket-page')).toBeVisible({ timeout: 15_000 });
    const tabs = page.locator('.conf-tabs button');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toContainText('Eastern');
    await expect(tabs.nth(1)).toContainText('Western');
    await expect(tabs.nth(2)).toContainText('Full League');
  });

  test('eastern conference tab is active by default', async ({ page }) => {
    await expect(page.locator('app-playoff-bracket-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.conf-tabs button').first()).toHaveClass(/tab--active/);
  });

  test('switching conference tabs loads new data', async ({ page }) => {
    await expect(page.locator('app-playoff-bracket-page')).toBeVisible({ timeout: 15_000 });

    await page.locator('.conf-tabs button', { hasText: 'Western' }).click();
    await expect(page.locator('.conf-tabs button', { hasText: 'Western' })).toHaveClass(/tab--active/);
  });

  test('shows rounds and matchup cards when data exists', async ({ page }) => {
    await expect(page.locator('app-playoff-bracket-page .loading, app-playoff-bracket-page .error, app-playoff-bracket-page .round').first()).toBeVisible({ timeout: 15_000 });

    const rounds = page.locator('.round');
    if (await rounds.count() > 0) {
      // Each round has a label
      await expect(rounds.first().locator('.round__label')).toBeVisible();

      // Each round has matchup cards
      const matchups = page.locator('.matchup');
      if (await matchups.count() > 0) {
        // Matchup shows two teams
        await expect(matchups.first().locator('.matchup__team')).toHaveCount(2);

        // Matchup shows seed numbers
        await expect(matchups.first().locator('.matchup__seed').first()).toBeVisible();

        // Matchup shows series status
        await expect(matchups.first().locator('.matchup__status')).toBeVisible();
      }
    }
  });

  test('matchup cards are clickable links', async ({ page }) => {
    await expect(page.locator('app-playoff-bracket-page .loading, app-playoff-bracket-page .error, app-playoff-bracket-page .round').first()).toBeVisible({ timeout: 15_000 });

    const matchups = page.locator('.matchup');
    if (await matchups.count() > 0) {
      // Matchup is an <a> tag with an href to matchup detail
      const href = await matchups.first().getAttribute('href');
      if (href) {
        expect(href).toMatch(/\/nhl\/playoffs\/matchup\//);
      }
    }
  });

  test('deep link to playoffs works on refresh', async ({ page }) => {
    await page.goto('/nhl/playoffs');
    await page.reload();
    await expect(page.locator('app-playoff-bracket-page')).toBeVisible({ timeout: 15_000 });
  });

  test('shows error or empty state when no bracket available', async ({ page }) => {
    // The page should handle the case where playoffs haven't started
    await expect(page.locator('app-playoff-bracket-page')).toBeVisible({ timeout: 15_000 });

    // Should show either rounds (data exists) or an error message (no data)
    const hasRounds = await page.locator('.round').count() > 0;
    const hasError = await page.locator('.error').isVisible().catch(() => false);
    expect(hasRounds || hasError).toBe(true);
  });
});

test.describe('Playoff Bracket — Mobile', () => {
  test('conference tabs visible on mobile', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    if (viewportWidth >= 768) { test.skip(true, 'Desktop only'); return; }

    await page.goto('/nhl/playoffs');
    await expect(page.locator('app-playoff-bracket-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.conf-tabs')).toBeVisible();
  });
});
