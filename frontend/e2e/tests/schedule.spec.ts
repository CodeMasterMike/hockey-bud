import { test, expect } from '@playwright/test';

test.describe('Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nhl/schedule');
  });

  test('page loads with month navigation', async ({ page }) => {
    await expect(page.locator('.schedule-page')).toBeVisible();
    await expect(page.locator('.month-label')).not.toBeEmpty();
    await expect(page.locator('.month-btn')).toHaveCount(2);
  });

  test('month navigation buttons work', async ({ page }) => {
    const monthLabel = page.locator('.month-label');
    await expect(monthLabel).toBeVisible({ timeout: 15_000 });
    const initialMonth = await monthLabel.textContent();

    // Try next month (if not disabled)
    const nextBtn = page.locator('.month-btn').last();
    if (!(await nextBtn.isDisabled())) {
      await nextBtn.click();
      const newMonth = await monthLabel.textContent();
      expect(newMonth).not.toBe(initialMonth);
    }
  });

  test('day cards show game matchups when data exists', async ({ page }) => {
    // Wait for data
    await expect(page.locator('.month-label')).toBeVisible({ timeout: 15_000 });

    const dayCards = page.locator('.day-card');
    if (await dayCards.count() > 0) {
      await expect(dayCards.first().locator('.day-header')).toBeVisible();
    }
  });

  test('game rows show team abbreviations', async ({ page }) => {
    await expect(page.locator('.month-label')).toBeVisible({ timeout: 15_000 });

    const gameRows = page.locator('.game-row');
    if (await gameRows.count() > 0) {
      await expect(gameRows.first().locator('.team-abbr')).toHaveCount(2);
    }
  });
});
