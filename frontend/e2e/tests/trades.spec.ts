import { test, expect } from '@playwright/test';

test.describe('Trades Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nhl/trades');
  });

  test('page loads with title', async ({ page }) => {
    await expect(page.locator('.trades-page')).toBeVisible();
    await expect(page.locator('.page-title')).toContainText(/Trades/i);
  });

  test('shows trade cards when data exists', async ({ page }) => {
    // Wait for load to finish (either cards or empty state)
    await expect(page.locator('.state-msg, .trade-card').first()).toBeVisible({ timeout: 15_000 });

    const tradeCards = page.locator('.trade-card');
    if (await tradeCards.count() > 0) {
      // Each trade card has a date and at least one side
      await expect(tradeCards.first().locator('.trade-date')).toBeVisible();
      await expect(tradeCards.first().locator('.trade-side')).not.toHaveCount(0);
    }
  });

  test('trade cards show team logos and abbreviations', async ({ page }) => {
    await expect(page.locator('.state-msg, .trade-card').first()).toBeVisible({ timeout: 15_000 });

    const tradeCards = page.locator('.trade-card');
    if (await tradeCards.count() > 0) {
      await expect(tradeCards.first().locator('.side-team')).toBeVisible();
    }
  });

  test('trade cards show acquired/traded assets', async ({ page }) => {
    await expect(page.locator('.state-msg, .trade-card').first()).toBeVisible({ timeout: 15_000 });

    const tradeCards = page.locator('.trade-card');
    if (await tradeCards.count() > 0) {
      // At least one asset group should exist
      await expect(tradeCards.first().locator('.asset-group')).not.toHaveCount(0);
    }
  });
});
