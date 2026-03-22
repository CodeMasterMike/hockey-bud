import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DEFAULT_LEAGUE_ID } from '../../../constants';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav">
      @for (link of navLinks; track link.path) {
        <a [routerLink]="'/' + leagueId() + '/' + link.path"
           routerLinkActive="nav__link--active"
           class="nav__link">
          {{ link.label }}
        </a>
      }
    </nav>
  `,
  styles: [`
    .nav {
      background: var(--bg-nav);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 44px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-default);
      overflow-x: auto;
    }
    .nav__link {
      color: rgba(245,240,225,0.65);
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0 16px;
      height: 100%;
      display: flex;
      align-items: center;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      font-family: var(--font-primary);
      transition: color 0.15s;
    }
    .nav__link:hover { color: rgba(245,240,225,0.9); }
    .nav__link--active { color: #F5F0E1; border-bottom-color: #F5F0E1; }
  `]
})
export class NavBar {
  leagueId = input(DEFAULT_LEAGUE_ID);

  navLinks = [
    { path: 'scores', label: 'Scores' },
    { path: 'standings', label: 'Standings' },
    { path: 'stats', label: 'Stats' },
    { path: 'players', label: 'Players' },
    { path: 'teams', label: 'Teams' },
    { path: 'schedule', label: 'Schedule' },
    { path: 'salary-cap', label: 'Salary Cap' },
    { path: 'trades', label: 'Trades' },
    { path: 'free-agents', label: 'Free Agents' },
    { path: 'personnel', label: 'Personnel' },
  ];
}
