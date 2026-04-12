import { Component, inject, input, signal, computed, DestroyRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DEFAULT_LEAGUE_ID } from '../../../constants';
import { SeasonModeService, SeasonMode } from '../../../services/season-mode.service';

interface NavLink {
  path: string;
  label: string;
}

const REGULAR_SEASON_LINKS: NavLink[] = [
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

const PLAYOFF_LINKS: NavLink[] = [
  { path: 'scores', label: 'Scores' },
  { path: 'standings', label: 'Standings' },
  { path: 'playoffs', label: 'Playoffs' },
  { path: 'stats', label: 'Stats' },
  { path: 'players', label: 'Players' },
  { path: 'teams', label: 'Teams' },
  { path: 'schedule', label: 'Schedule' },
  { path: 'salary-cap', label: 'Salary Cap' },
  { path: 'trades', label: 'Trades' },
  { path: 'free-agents', label: 'Free Agents' },
  { path: 'personnel', label: 'Personnel' },
];

const OFFSEASON_LINKS: NavLink[] = [
  { path: 'draft', label: 'Draft' },
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

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav">
      @for (link of navLinks(); track link.path) {
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
export class NavBar implements OnInit {
  private seasonModeService = inject(SeasonModeService);
  private destroyRef = inject(DestroyRef);

  leagueId = input(DEFAULT_LEAGUE_ID);
  private mode = signal<SeasonMode['mode']>('regular-season');

  navLinks = computed<NavLink[]>(() => {
    switch (this.mode()) {
      case 'playoffs': return PLAYOFF_LINKS;
      case 'off-season': return OFFSEASON_LINKS;
      default: return REGULAR_SEASON_LINKS;
    }
  });

  ngOnInit() {
    this.seasonModeService.getSeasonMode(this.leagueId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.mode.set(data.mode),
        error: () => this.mode.set('regular-season'),
      });
  }
}
