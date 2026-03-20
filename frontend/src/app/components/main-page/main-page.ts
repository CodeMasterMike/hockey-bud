import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-page',
  imports: [RouterLink],
  template: `
    <div class="main-page">
      <h1 class="main-page__title">Hockey League Hub</h1>
      <p class="main-page__subtitle">Select a league to explore</p>
      <div class="main-page__leagues">
        <a routerLink="/nhl/scores" class="main-page__league">
          <div class="main-page__league-icon">NHL</div>
          <span class="main-page__league-name">National Hockey League</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .main-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 24px;
      min-height: 60vh;
      font-family: var(--font-primary);
    }
    .main-page__title {
      font-size: 36px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    .main-page__subtitle {
      font-size: 14px;
      color: var(--text-muted);
      font-style: italic;
      margin-bottom: 48px;
    }
    .main-page__leagues {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      max-width: 800px;
      width: 100%;
    }
    .main-page__league {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
      background: var(--bg-card);
      border: 1px solid var(--border-default);
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-primary);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .main-page__league:hover {
      border-color: var(--border-strong);
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .main-page__league-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid var(--text-primary);
      border-radius: 50%;
      font-size: 24px;
      font-weight: 700;
    }
    .main-page__league-name {
      font-size: 14px;
      font-weight: 700;
      text-align: center;
    }
  `]
})
export class MainPage {}
