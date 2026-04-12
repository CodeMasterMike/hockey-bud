import { test, expect } from '@playwright/test';
import { StandingsPage } from '../pages/standings.page';

test.describe('Standings Page', () => {
  let standings: StandingsPage;

  test.beforeEach(async ({ page }) => {
    standings = new StandingsPage(page);
    await standings.goto();
    // Wait for data to load
    await expect(standings.groupHeaders.first()).toBeVisible({ timeout: 15_000 });
  });

  test('defaults to Wild Card view', async () => {
    await expect(standings.viewButton('Wild Card')).toHaveClass(/active/);
    await expect(standings.groupHeaders.filter({ hasText: 'Atlantic Division' }).first()).toBeVisible();
    await expect(standings.groupHeaders.filter({ hasText: /Wild Card/ }).first()).toBeVisible();
  });

  test('shows all 4 view modes in toggle bar', async () => {
    for (const view of ['Wild Card', 'Division', 'Conference', 'League']) {
      await expect(standings.viewButton(view)).toBeVisible();
    }
  });

  test('Division view shows division groups', async ({ page }) => {
    await standings.switchView('Division');
    // On mobile only one conference is visible at a time; on desktop all 4 show
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    if (viewportWidth >= 1200) {
      for (const div of ['Atlantic', 'Metropolitan', 'Central', 'Pacific']) {
        await expect(standings.groupHeaders.filter({ hasText: div })).toBeVisible();
      }
    } else {
      // At least one division visible in the active conference tab
      await expect(standings.groupHeaders.first()).toBeVisible();
    }
    await expect(standings.groupHeaders.filter({ hasText: /Wild Card/ })).toHaveCount(0);
  });

  test('Conference view shows conference groups', async ({ page }) => {
    await standings.switchView('Conference');
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    if (viewportWidth >= 1200) {
      await expect(standings.groupHeaders.filter({ hasText: 'Eastern Conference' })).toBeVisible();
      await expect(standings.groupHeaders.filter({ hasText: 'Western Conference' })).toBeVisible();
    } else {
      // One conference visible, tabs available for the other
      await expect(standings.groupHeaders.first()).toBeVisible();
    }
  });

  test('League view shows single group', async () => {
    await standings.switchView('League');
    await expect(standings.groupHeaders.filter({ hasText: 'League' })).toBeVisible();
  });

  test('column headers include expected stat columns', async ({ page }) => {
    const firstTable = page.locator('.standings-table').first();
    const expectedTitles = ['Games Played', 'Wins', 'Losses', 'Overtime Losses', 'Points',
      'Regulation Wins', 'Goals For', 'Goals Against', 'Goal Differential'];
    for (const title of expectedTitles) {
      await expect(firstTable.locator(`th[title="${title}"]`)).toBeVisible();
    }
  });

  test('clicking a stat header adds sorted indicator', async ({ page }) => {
    const gfHeader = page.locator('.standings-table th', { hasText: 'GF' }).first();
    await gfHeader.click();
    await expect(gfHeader).toHaveClass(/sorted/);
    await expect(gfHeader.locator('.sort-indicator')).toBeVisible();
  });

  test('clicking # header resets sort', async ({ page }) => {
    // Sort by GF first
    await page.locator('.standings-table th', { hasText: 'GF' }).first().click();
    // Reset
    await page.locator('.standings-table th', { hasText: '#' }).first().click();
    await expect(page.locator('.standings-table th', { hasText: '#' }).first()).toHaveClass(/sorted/);
  });
});

test.describe('Standings Responsive', () => {
  test('shows conference tabs below 1200px', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    const standings = new StandingsPage(page);
    await standings.goto();
    await expect(standings.groupHeaders.first()).toBeVisible({ timeout: 15_000 });
    await expect(standings.conferenceTabs).toBeVisible();
  });

  test('conference tab switches visible conference', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    const standings = new StandingsPage(page);
    await standings.goto();
    await expect(standings.groupHeaders.first()).toBeVisible({ timeout: 15_000 });

    // Click Western tab
    await standings.conferenceTab('Western Conference').click();
    await expect(page.locator('.conference.west')).toBeVisible();
  });
});
