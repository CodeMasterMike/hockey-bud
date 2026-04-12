import { type Page, type Locator } from '@playwright/test';

export class SearchComponent {
  readonly input: Locator;
  readonly dropdown: Locator;
  readonly groupLabels: Locator;
  readonly results: Locator;

  constructor(private page: Page) {
    this.input = page.locator('.banner__search input');
    this.dropdown = page.locator('.search-dropdown');
    this.groupLabels = page.locator('.search-group__label');
    this.results = page.locator('.search-result');
  }

  async search(query: string) {
    await this.input.fill(query);
    // Wait for debounced API call + dropdown render
    await this.dropdown.waitFor({ state: 'visible', timeout: 3000 });
  }

  result(text: string) { return this.results.filter({ hasText: text }); }
}
