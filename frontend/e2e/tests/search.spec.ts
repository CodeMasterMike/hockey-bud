import { test, expect } from '@playwright/test';
import { SearchComponent } from '../pages/search.page';

test.describe('Global Search', () => {
  let search: SearchComponent;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    search = new SearchComponent(page);
  });

  test('search input is visible in banner', async () => {
    await expect(search.input).toBeVisible();
    await expect(search.input).toHaveAttribute('placeholder', /[Ss]earch/);
  });

  test('no dropdown for queries under 2 characters', async () => {
    await search.input.fill('a');
    // Wait a bit to confirm no dropdown appears
    await search.input.page().waitForTimeout(500);
    await expect(search.dropdown).not.toBeVisible();
  });

  test('shows player results for a name search', async () => {
    await search.search('MacKinnon');
    await expect(search.groupLabels.filter({ hasText: 'Players' })).toBeVisible();
    await expect(search.result('MacKinnon')).toBeVisible();
  });

  test('shows team results for a team search', async () => {
    await search.search('Colorado');
    await expect(search.groupLabels.filter({ hasText: 'Teams' })).toBeVisible();
    await expect(search.result('Colorado Avalanche')).toBeVisible();
  });

  test('shows team results for abbreviation search', async () => {
    await search.search('COL');
    await expect(search.groupLabels.filter({ hasText: 'Teams' })).toBeVisible();
  });

  test('clicking a team result navigates to team profile', async ({ page }) => {
    await search.search('Colorado');
    await search.result('Colorado Avalanche').click();
    await expect(page).toHaveURL(/\/nhl\/teams\/\d+/);
  });

  test('escape closes dropdown', async () => {
    await search.search('col');
    await expect(search.dropdown).toBeVisible();
    await search.input.press('Escape');
    await expect(search.dropdown).not.toBeVisible();
  });

  test('clicking outside closes dropdown', async ({ page }) => {
    await search.search('col');
    await expect(search.dropdown).toBeVisible();
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(search.dropdown).not.toBeVisible();
  });

  test('shows "no results" for gibberish query', async () => {
    await search.search('zzzzxxx');
    await expect(search.dropdown.locator('.search-empty')).toBeVisible();
  });
});
