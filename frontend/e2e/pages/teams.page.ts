import { type Page, type Locator } from '@playwright/test';

export class TeamsPage {
  readonly teamCards: Locator;

  constructor(private page: Page) {
    this.teamCards = page.locator('.team-card');
  }

  async goto() { await this.page.goto('/nhl/teams'); }

  teamCard(name: string) { return this.teamCards.filter({ hasText: name }); }
}

export class TeamProfilePage {
  readonly title: Locator;
  readonly rosterTable: Locator;
  readonly detailCards: Locator;
  readonly backLink: Locator;

  constructor(private page: Page) {
    this.title = page.locator('.profile-title');
    this.rosterTable = page.locator('.roster-table');
    this.detailCards = page.locator('.detail-card');
    this.backLink = page.locator('.back-link');
  }

  async goto(teamId: number) { await this.page.goto(`/nhl/teams/${teamId}`); }
}
