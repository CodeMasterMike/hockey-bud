import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeamsApiService, TeamListItem } from '../../../services/teams-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';

@Component({
  selector: 'app-teams-index',
  imports: [RouterLink, DataAsOf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="teams-page">
      <h1 class="page-title">NHL Teams</h1>
      <p class="page-subtitle"><app-data-as-of [timestamp]="dataAsOf()" /></p>

      @if (errorMessage()) {
        <div class="state-msg state-error">{{ errorMessage() }}</div>
      } @else if (loading()) {
        <div class="state-msg">Loading teams...</div>
      } @else {
        <div class="teams-grid">
          @for (team of teams(); track team.id) {
            <a class="team-card" [routerLink]="['/', leagueId(), 'teams', team.id]">
              @if (team.logoUrl) {
                <img [src]="team.logoUrl" [alt]="team.abbreviation" class="team-logo" />
              } @else {
                <div class="team-logo-placeholder">{{ team.abbreviation }}</div>
              }
              <div class="team-info">
                <div class="team-name">{{ team.locationName }} {{ team.name }}</div>
                <div class="team-meta">
                  {{ team.abbreviation }}
                  @if (team.division) {
                    &middot; {{ team.division }}
                  }
                </div>
                @if (team.record) {
                  <div class="team-record">{{ team.record }} &middot; {{ team.points }} pts</div>
                }
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .teams-page { max-width: 1200px; margin: 0 auto; padding: 28px 20px 48px; font-family: var(--font-primary); }
    .page-title { font-size: 1.2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-primary); margin: 0 0 24px; }

    .teams-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

    .team-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 4px; text-decoration: none; color: var(--text-primary); }
    .team-card:hover { border-color: var(--border-strong); background: var(--bg-row-alt); }

    .team-logo { width: 40px; height: 40px; object-fit: contain; flex-shrink: 0; }
    .team-logo-placeholder { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font: 700 0.72rem var(--font-primary); border: 1px solid var(--border-default); border-radius: 4px; color: var(--text-muted); flex-shrink: 0; }

    .team-info { min-width: 0; }
    .team-name { font-size: 0.82rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .team-meta { font-size: 0.68rem; color: var(--text-muted); }
    .team-record { font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px; font-variant-numeric: tabular-nums; }

    .state-msg { color: var(--text-muted); text-align: center; padding: 48px 0; font-size: 14px; }
    .state-error { color: #c44; }

    @media (max-width: 1024px) { .teams-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) { .teams-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .teams-grid { grid-template-columns: 1fr; } }
  `]
})
export class TeamsIndex implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(TeamsApiService);
  private destroyRef = inject(DestroyRef);

  leagueId = signal(DEFAULT_LEAGUE_ID);
  teams = signal<TeamListItem[]>([]);
  dataAsOf = signal<string | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.leagueId.set(params.get('leagueId') ?? DEFAULT_LEAGUE_ID);
      this.loadTeams();
    });
  }

  private loadTeams(): void {
    this.loading.set(true);
    this.api.getTeams(this.leagueId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => { this.teams.set(res.teams); this.dataAsOf.set(res.dataAsOf); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorMessage.set('Unable to load teams.'); }
    });
  }
}
