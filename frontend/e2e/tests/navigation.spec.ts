import { test, expect } from '@playwright/test';

test.describe('SPA Navigation & Routing', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.banner')).toBeVisible();
  });

  test('deep link to standings works on refresh', async ({ page }) => {
    await page.goto('/nhl/standings');
    await page.reload();
    await expect(page.locator('.standings-page')).toBeVisible();
  });

  test('deep link to teams works on refresh', async ({ page }) => {
    await page.goto('/nhl/teams');
    await page.reload();
    await expect(page.locator('.teams-page')).toBeVisible();
  });

  test('deep link to schedule works on refresh', async ({ page }) => {
    await page.goto('/nhl/schedule');
    await page.reload();
    await expect(page.locator('.schedule-page')).toBeVisible();
  });

  test('deep link to trades works on refresh', async ({ page }) => {
    await page.goto('/nhl/trades');
    await page.reload();
    await expect(page.locator('.trades-page')).toBeVisible();
  });

  test('deep link to playoffs works on refresh', async ({ page }) => {
    await page.goto('/nhl/playoffs');
    await page.reload();
    await expect(page.locator('app-playoff-bracket-page')).toBeVisible({ timeout: 15_000 });
  });

  test('deep link to draft works on refresh', async ({ page }) => {
    await page.goto('/nhl/draft');
    await page.reload();
    await expect(page.locator('app-draft-page')).toBeVisible({ timeout: 15_000 });
  });

  test('unknown route redirects to home', async ({ page }) => {
    await page.goto('/nhl/nonexistent-page');
    await expect(page).toHaveURL('/');
  });

  test('nav bar links navigate between sections', async ({ page }) => {
    // This test only makes sense on viewports where the nav is usable
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    if (viewportWidth < 768) { test.skip(true, 'Nav hidden on mobile'); return; }

    await page.goto('/nhl/scores');
    const standingsLink = page.locator('a[href*="standings"]').first();
    if (await standingsLink.isVisible()) {
      await standingsLink.click();
      await expect(page).toHaveURL(/\/nhl\/standings/);
    }
  });
});
