import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-banner',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="banner">
      <a routerLink="/" class="banner__brand">
        <span class="banner__brand-icon">H</span>
        Hockey League Hub
      </a>
      <div class="banner__search">
        <input type="text" placeholder="Search players, teams, trades..." />
      </div>
      <button class="banner__hamburger" (click)="menuToggle.emit()" aria-label="Menu">&#9776;</button>
    </header>
  `,
  styles: [`
    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-banner);
      color: var(--text-on-banner);
      padding: 0 24px;
      height: 56px;
      font-family: var(--font-primary);
    }
    .banner__brand {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.04em;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-on-banner);
      text-decoration: none;
    }
    .banner__brand-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 2px solid var(--text-on-banner);
      border-radius: 50%;
      font-size: 16px;
    }
    .banner__search {
      flex: 0 1 420px;
      margin: 0 24px;
    }
    .banner__search input {
      width: 100%;
      padding: 8px 14px;
      border: 1px solid var(--banner-input-border);
      border-radius: 4px;
      background: var(--banner-input-bg);
      color: var(--text-on-banner);
      font-family: var(--font-primary);
      font-size: 13px;
      outline: none;
    }
    .banner__search input::placeholder { color: var(--banner-placeholder); }
    .banner__search input:focus { background: var(--banner-input-focus-bg); border-color: var(--banner-input-focus-border); }
    .banner__hamburger {
      background: none;
      border: 1px solid var(--banner-input-border);
      border-radius: 4px;
      color: var(--text-on-banner);
      font-size: 22px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .banner__hamburger:hover { background: var(--banner-hover-bg); }
  `]
})
export class Banner {
  menuToggle = output();
}
