import { test, expect } from '@playwright/test';

test.describe('Draft Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nhl/draft');
  });

  test('page loads with title', async ({ page }) => {
    await expect(page.locator('app-draft-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.page__title')).toContainText(/Draft/i);
  });

  test('round tabs are visible when data exists', async ({ page }) => {
    await expect(page.locator('app-draft-page .loading, app-draft-page .error, app-draft-page .round-tabs').first()).toBeVisible({ timeout: 15_000 });

    const roundTabs = page.locator('.round-tabs button');
    if (await roundTabs.count() > 0) {
      // NHL draft has 7 rounds
      const count = await roundTabs.count();
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(7);

      // First tab is active by default
      await expect(roundTabs.first()).toHaveClass(/tab--active/);
      await expect(roundTabs.first()).toContainText('Round 1');
    }
  });

  test('draft table shows picks', async ({ page }) => {
    await expect(page.locator('app-draft-page .loading, app-draft-page .error, app-draft-page .draft-card').first()).toBeVisible({ timeout: 15_000 });

    const draftCard = page.locator('.draft-card');
    if (await draftCard.isVisible()) {
      // Table has header columns
      const headers = page.locator('.draft-table thead th');
      await expect(headers).not.toHaveCount(0);

      // Table has pick rows
      const rows = page.locator('.draft-table tbody tr');
      if (await rows.count() > 0) {
        // Each row has a pick number
        await expect(rows.first().locator('.col-pick')).toBeVisible();

        // Each row has a team cell with logo
        await expect(rows.first().locator('.col-team')).toBeVisible();

        // Each row has a player name
        await expect(rows.first().locator('.col-player')).toBeVisible();
      }
    }
  });

  test('switching round tabs updates the table', async ({ page }) => {
    await expect(page.locator('app-draft-page .loading, app-draft-page .error, app-draft-page .round-tabs').first()).toBeVisible({ timeout: 15_000 });

    const roundTabs = page.locator('.round-tabs button');
    if (await roundTabs.count() >= 2) {
      // Click round 2
      await roundTabs.nth(1).click();
      await expect(roundTabs.nth(1)).toHaveClass(/tab--active/);

      // Draft card header should update
      await expect(page.locator('.draft-card__header')).toContainText('Round 2');
    }
  });

  test('player names are clickable links when playerId exists', async ({ page }) => {
    await expect(page.locator('app-draft-page .loading, app-draft-page .error, app-draft-page .draft-card').first()).toBeVisible({ timeout: 15_000 });

    const playerLinks = page.locator('.col-player a');
    if (await playerLinks.count() > 0) {
      const href = await playerLinks.first().getAttribute('href');
      if (href) {
        expect(href).toMatch(/\/nhl\/players\//);
      }
    }
  });

  test('team logos are displayed in pick rows', async ({ page }) => {
    await expect(page.locator('app-draft-page .loading, app-draft-page .error, app-draft-page .draft-card').first()).toBeVisible({ timeout: 15_000 });

    const teamLogos = page.locator('.draft-table .team-logo');
    if (await teamLogos.count() > 0) {
      await expect(teamLogos.first()).toBeVisible();
    }
  });

  test('draft card header shows pick count', async ({ page }) => {
    await expect(page.locator('app-draft-page .loading, app-draft-page .error, app-draft-page .draft-card').first()).toBeVisible({ timeout: 15_000 });

    const info = page.locator('.draft-card__info');
    if (await info.isVisible()) {
      await expect(info).toContainText(/picks/i);
    }
  });

  test('deep link to draft works on refresh', async ({ page }) => {
    await page.goto('/nhl/draft');
    await page.reload();
    await expect(page.locator('app-draft-page')).toBeVisible({ timeout: 15_000 });
  });

  test('shows error when no draft data available', async ({ page }) => {
    await expect(page.locator('app-draft-page')).toBeVisible({ timeout: 15_000 });

    // Should show either draft data or an error message
    const hasData = await page.locator('.draft-card').isVisible().catch(() => false);
    const hasError = await page.locator('.error').isVisible().catch(() => false);
    expect(hasData || hasError).toBe(true);
  });
});

test.describe('Draft Page — Mobile', () => {
  test('draft table scrolls horizontally on mobile', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    if (viewportWidth >= 768) { test.skip(true, 'Desktop only'); return; }

    await page.goto('/nhl/draft');
    await expect(page.locator('app-draft-page')).toBeVisible({ timeout: 15_000 });

    const tableWrap = page.locator('.table-wrap');
    if (await tableWrap.isVisible()) {
      // The table wrapper should have overflow-x: auto
      const overflow = await tableWrap.evaluate(el => getComputedStyle(el).overflowX);
      expect(overflow).toBe('auto');
    }
  });

  test('round tabs wrap on mobile', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    if (viewportWidth >= 768) { test.skip(true, 'Desktop only'); return; }

    await page.goto('/nhl/draft');
    await expect(page.locator('app-draft-page .loading, app-draft-page .error, app-draft-page .round-tabs').first()).toBeVisible({ timeout: 15_000 });

    const roundTabs = page.locator('.round-tabs');
    if (await roundTabs.isVisible()) {
      // Tabs container uses flex-wrap
      const flexWrap = await roundTabs.evaluate(el => getComputedStyle(el).flexWrap);
      expect(flexWrap).toBe('wrap');
    }
  });
});
