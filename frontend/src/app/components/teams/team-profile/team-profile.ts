import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeamsApiService, TeamProfile } from '../../../services/teams-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';
import { LoadingText } from '../../shared/loading-text/loading-text';

@Component({
  selector: 'app-team-profile',
  imports: [RouterLink, DataAsOf, LoadingText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="profile-page">
      @if (errorMessage()) {
        <div class="state-msg state-error">{{ errorMessage() }}</div>
      } @else if (loading()) {
        <div class="state-msg"><app-loading-text label="Loading team" /></div>
      } @else if (team(); as t) {
        <header class="profile-header">
          @if (t.logoUrl) {
            <img [src]="t.logoUrl" [alt]="t.abbreviation" class="profile-logo" />
          }
          <div>
            <h1 class="profile-title">{{ t.locationName }} {{ t.name }}</h1>
            <div class="profile-meta">
              {{ t.abbreviation }}
              @if (t.division) { &middot; {{ t.division }} Division }
              @if (t.conference) { &middot; {{ t.conference }} Conference }
            </div>
            @if (t.currentSeasonRecord; as r) {
              <div class="profile-record">
                {{ r.wins }}-{{ r.losses }}-{{ r.overtimeLosses }} &middot; {{ t.points }} pts
                @if (t.divisionRank) { &middot; {{ ordinal(t.divisionRank) }} in division }
              </div>
            }
            <app-data-as-of [timestamp]="t.dataAsOf" />
          </div>
        </header>

        <div class="profile-details">
          <div class="detail-card">
            <div class="detail-label">Founded</div>
            <div class="detail-value">{{ t.originalJoinYear }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Stanley Cups</div>
            <div class="detail-value">{{ t.stanleyCups.total }}</div>
          </div>
          @if (t.season) {
            <div class="detail-card">
              <div class="detail-label">Season</div>
              <div class="detail-value">{{ t.season }}</div>
            </div>
          }
        </div>

        @if (t.franchiseHistory.length > 0) {
          <section class="section">
            <h2 class="section-title">Franchise History</h2>
            @for (fh of t.franchiseHistory; track fh.yearStart) {
              <div class="fh-row">{{ fh.city }} {{ fh.name }} ({{ fh.yearStart }}–{{ fh.yearEnd }})</div>
            }
          </section>
        }

        <section class="section">
          <h2 class="section-title">Roster ({{ t.roster.length }})</h2>
          @if (t.roster.length === 0) {
            <div class="state-msg">No roster data available.</div>
          } @else {
            <div class="table-scroll">
              <table class="roster-table">
                <thead>
                  <tr>
                    <th class="col-num">#</th>
                    <th class="col-left">Name</th>
                    <th>S/C</th>
                    <th>Born</th>
                    <th>Birthplace</th>
                    <th>Draft</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of t.roster; track p.playerId; let i = $index) {
                    <tr [class.row-alt]="i % 2 === 1" [class.row-ebug]="p.isEbug">
                      <td class="col-num">{{ p.jerseyNumber ?? '—' }}</td>
                      <td class="col-left col-name">
                        {{ p.firstName }} {{ p.lastName }}
                        @if (p.isEbug) { <span class="ebug-tag">EBUG</span> }
                      </td>
                      <td>{{ p.shootsCatches }}</td>
                      <td>{{ formatAge(p.dateOfBirth) }}</td>
                      <td>{{ p.birthCity }}, {{ p.birthCountry }}</td>
                      <td>{{ p.draftYear ?? 'UDFA' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        <a [routerLink]="['/', leagueId(), 'teams']" class="back-link">&larr; All Teams</a>
      }
    </div>
  `,
  styles: [`
    .profile-page { max-width: 1000px; margin: 0 auto; padding: 28px 20px 48px; font-family: var(--font-primary); }

    .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
    .profile-logo { width: 72px; height: 72px; object-fit: contain; }
    .profile-title { font-size: 1.3rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-primary); margin: 0; }
    .profile-meta { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
    .profile-record { font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px; font-variant-numeric: tabular-nums; }

    .profile-details { display: flex; gap: 12px; margin-bottom: 28px; }
    .detail-card { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 4px; padding: 12px 18px; }
    .detail-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    .detail-value { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }

    .section { margin-bottom: 28px; }
    .section-title { font-size: 0.92rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-primary); margin: 0 0 12px; padding-bottom: 6px; border-bottom: 2px solid var(--border-strong); }
    .fh-row { font-size: 0.82rem; color: var(--text-secondary); padding: 4px 0; }

    .table-scroll { overflow-x: auto; }
    .roster-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
    .roster-table th { padding: 8px; text-align: right; font: 700 0.68rem var(--font-primary); text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted); border-bottom: 2px solid var(--border-strong); white-space: nowrap; }
    .roster-table th.col-left { text-align: left; }
    .roster-table th.col-num { width: 40px; text-align: center; }
    .roster-table td { padding: 6px 8px; text-align: right; border-bottom: 1px solid var(--border-default); white-space: nowrap; color: var(--text-primary); }
    .roster-table td.col-left { text-align: left; }
    .roster-table td.col-num { text-align: center; color: var(--text-muted); font-weight: 700; }
    .roster-table td.col-name { font-weight: 700; }
    .roster-table tr.row-alt td { background: var(--bg-row-alt); }
    .roster-table tr.row-ebug td { opacity: 0.6; }
    .ebug-tag { font-size: 0.6rem; background: var(--border-default); color: var(--text-muted); padding: 1px 4px; border-radius: 2px; margin-left: 4px; vertical-align: middle; }

    .back-link { font-size: 0.82rem; color: var(--color-link); }
    .back-link:hover { color: var(--color-link-hover); }

    .state-msg { color: var(--text-muted); text-align: center; padding: 48px 0; font-size: 14px; }
    .state-error { color: #c44; }
  `]
})
export class TeamProfilePage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(TeamsApiService);
  private destroyRef = inject(DestroyRef);

  leagueId = signal(DEFAULT_LEAGUE_ID);
  team = signal<TeamProfile | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.leagueId.set(params.get('leagueId') ?? DEFAULT_LEAGUE_ID);
      const teamId = Number(params.get('teamId'));
      if (teamId) this.loadTeam(teamId);
    });
  }

  private loadTeam(teamId: number): void {
    this.loading.set(true);
    this.api.getTeamProfile(teamId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: t => { this.team.set(t); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorMessage.set('Unable to load team.'); }
    });
  }

  formatAge(dob: string): string {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age.toString();
  }

  ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}
