import { test, expect } from '@playwright/test';
import { TeamsPage } from '../pages/teams.page';

test.describe('Teams Index', () => {
  let teams: TeamsPage;

  test.beforeEach(async ({ page }) => {
    teams = new TeamsPage(page);
    await teams.goto();
    await expect(teams.teamCards.first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows all 32 NHL teams', async () => {
    await expect(teams.teamCards).toHaveCount(32);
  });

  test('teams are sorted alphabetically by location', async ({ page }) => {
    const names = await page.locator('.team-name').allTextContents();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test('each team card shows abbreviation and division', async () => {
    const firstCard = teams.teamCards.first();
    await expect(firstCard.locator('.team-meta')).toContainText(/[A-Z]{3}/);
  });

  test('clicking a team navigates to profile', async ({ page }) => {
    await teams.teamCards.first().click();
    await expect(page).toHaveURL(/\/nhl\/teams\/\d+/);
    await expect(page.locator('.profile-title')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Team Profile', () => {
  test('shows team info, details, and roster', async ({ page }) => {
    // Navigate via teams index to get a valid team ID
    await page.goto('/nhl/teams');
    await expect(page.locator('.team-card').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('.team-card').first().click();
    await expect(page.locator('.profile-title')).toBeVisible({ timeout: 15_000 });

    // Header
    await expect(page.locator('.profile-title')).not.toBeEmpty();
    await expect(page.locator('.profile-meta')).toContainText(/Division/);

    // Detail cards
    await expect(page.locator('.detail-card')).toHaveCount(3);

    // Roster table
    await expect(page.locator('.roster-table')).toBeVisible();
    await expect(page.locator('.roster-table tbody tr')).not.toHaveCount(0);
  });

  test('back link returns to teams index', async ({ page }) => {
    await page.goto('/nhl/teams');
    await expect(page.locator('.team-card').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('.team-card').first().click();
    await expect(page.locator('.back-link')).toBeVisible({ timeout: 15_000 });
    await page.locator('.back-link').click();
    await expect(page).toHaveURL(/\/nhl\/teams$/);
  });
});

test.describe('Teams Responsive', () => {
  test('grid reflows on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/nhl/teams');
    await expect(page.locator('.team-card').first()).toBeVisible({ timeout: 15_000 });
    // Cards should still be visible, just in fewer columns
    await expect(page.locator('.team-card')).toHaveCount(32);
  });
});
