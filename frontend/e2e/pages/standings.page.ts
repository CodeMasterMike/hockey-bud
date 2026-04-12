import { type Page, type Locator, expect } from '@playwright/test';

export class StandingsPage {
  readonly viewToggle: Locator;
  readonly conferenceTabs: Locator;
  readonly tableHeaders: Locator;
  readonly groupHeaders: Locator;

  constructor(private page: Page) {
    this.viewToggle = page.locator('.view-toggle');
    this.conferenceTabs = page.locator('.conference-tabs');
    this.tableHeaders = page.locator('.standings-table th');
    this.groupHeaders = page.locator('.group-header td');
  }

  async goto() { await this.page.goto('/nhl/standings'); }

  viewButton(name: string) { return this.viewToggle.getByRole('button', { name }); }
  conferenceTab(name: string) { return this.conferenceTabs.getByRole('button', { name }); }

  async switchView(view: string) {
    await this.viewButton(view).click();
    await expect(this.viewButton(view)).toHaveClass(/active/);
  }
}
