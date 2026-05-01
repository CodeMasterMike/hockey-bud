import { Component, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DraftApiService, DraftResponse } from '../../../services/draft-api.service';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';
import { LoadingText } from '../../shared/loading-text/loading-text';

@Component({
  selector: 'app-draft-page',
  imports: [RouterLink, DataAsOf, LoadingText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h2 class="page__title">{{ data()?.year || '' }} NHL Draft</h2>
      <p class="page__subtitle">
        @if (data()?.isLive) {
          <span class="live-dot"></span> Live
        } @else {
          Draft results
        }
        @if (data()?.dataAsOf) { &mdash; <app-data-as-of [timestamp]="data()!.dataAsOf" /> }
      </p>

      @if (loading()) {
        <p class="loading"><app-loading-text label="Loading draft data" /></p>
      } @else if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      } @else if (data()) {
        <div class="round-tabs">
          @for (round of data()!.rounds; track round.roundNumber) {
            <button
              [class.tab--active]="activeRound() === round.roundNumber"
              (click)="activeRound.set(round.roundNumber)">
              Round {{ round.roundNumber }}
            </button>
          }
        </div>

        @if (currentRound(); as round) {
          <div class="draft-card">
            <div class="draft-card__header">
              <span>Round {{ round.roundNumber }}</span>
              <span class="draft-card__info">{{ round.picks.length }} picks</span>
            </div>
            <div class="table-wrap">
              <table class="draft-table">
                <thead>
                  <tr>
                    <th class="col-center">Pick</th>
                    <th>Team</th>
                    @if (round.roundNumber === 1) {
                      <th class="col-center">Odds</th>
                    }
                    <th>Player</th>
                    <th class="col-center">Pos</th>
                    <th>Previous Club</th>
                    <th class="col-center">Nation</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pick of round.picks; track pick.overallPick; let i = $index) {
                    <tr [class.row-alt]="i % 2 === 1">
                      <td class="col-pick">{{ pick.overallPick }}</td>
                      <td class="col-team">
                        <div class="team-cell">
                          @if (pick.teamLogoUrl) {
                            <img [src]="pick.teamLogoUrl" [alt]="pick.teamAbbreviation" class="team-logo">
                          }
                          {{ pick.teamAbbreviation }}
                        </div>
                      </td>
                      @if (round.roundNumber === 1) {
                        <td class="col-odds">{{ lotteryOdds(pick.overallPick) }}</td>
                      }
                      <td class="col-player">
                        @if (pick.playerId) {
                          <a [routerLink]="['/', leagueId(), 'players', pick.playerId]">{{ pick.playerName }}</a>
                        } @else if (pick.playerName) {
                          {{ pick.playerName }}
                        } @else {
                          &mdash;
                        }
                      </td>
                      <td class="col-center">{{ pick.position || '—' }}</td>
                      <td class="col-prev">{{ pick.previousClub || '—' }}</td>
                      <td class="col-center">{{ pick.birthCountry || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 28px 20px 48px; }
    .page__title {
      font-size: 1.2rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; margin-bottom: 4px;
    }
    .page__subtitle { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 20px; }
    .loading, .error { font-size: 0.82rem; color: var(--text-muted); padding: 24px 0; }

    .live-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-live); margin-right: 4px;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

    .round-tabs { display: flex; gap: 0; margin-bottom: 0; flex-wrap: wrap; }
    .round-tabs button {
      font-family: var(--font-primary); font-size: 0.76rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 18px;
      background: var(--bg-row-alt); color: var(--text-muted);
      border: 1px solid var(--border-default); border-bottom: none;
      border-radius: 4px 4px 0 0; cursor: pointer; margin-right: -1px;
    }
    .round-tabs button:hover { color: var(--text-primary); }
    .round-tabs button.tab--active {
      background: var(--bg-card); color: var(--text-primary);
      border-bottom: 1px solid var(--bg-card); position: relative; z-index: 1;
    }

    .draft-card {
      background: var(--bg-card); border: 1px solid var(--border-default);
      border-radius: 0 4px 4px 4px; overflow: hidden; margin-bottom: 32px;
    }
    .draft-card__header {
      padding: 12px 16px 10px; font-size: 0.82rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      border-bottom: 1px solid var(--border-default);
      display: flex; justify-content: space-between; align-items: center;
    }
    .draft-card__info { font-size: 0.68rem; color: var(--text-muted); font-weight: 400; }

    .table-wrap { overflow-x: auto; }
    .draft-table { width: 100%; border-collapse: collapse; font-size: 0.74rem; }
    .draft-table thead th {
      padding: 8px 10px; text-align: left; font-weight: 700; font-size: 0.68rem;
      text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted);
      border-bottom: 2px solid var(--border-strong); white-space: nowrap;
    }
    .draft-table thead th.col-center { text-align: center; }
    .draft-table tbody td {
      padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border-default);
      white-space: nowrap;
    }
    .draft-table tbody td.col-center { text-align: center; }
    .draft-table tbody .row-alt td { background: var(--bg-row-alt); }

    .col-pick { font-weight: 700; color: var(--text-muted); font-size: 0.72rem; text-align: center; width: 44px; }
    .col-team { font-weight: 700; }
    .team-cell { display: flex; align-items: center; gap: 6px; }
    .team-logo { width: 18px; height: 18px; object-fit: contain; }
    .col-player { font-weight: 700; }
    .col-player a { color: var(--text-primary); text-decoration: none; }
    .col-player a:hover { color: var(--color-link); text-decoration: underline; }
    .col-prev { color: var(--text-secondary); }
    .col-odds { text-align: center; font-weight: 600; color: var(--text-secondary); font-size: 0.72rem; font-variant-numeric: tabular-nums; }
  `]
})
export class DraftPage implements OnInit {
  private route = inject(ActivatedRoute);
  private draftApi = inject(DraftApiService);
  private destroyRef = inject(DestroyRef);

  leagueId = signal('');
  data = signal<DraftResponse | null>(null);
  activeRound = signal(1);
  loading = signal(true);
  errorMessage = signal('');

  currentRound = computed(() => {
    const d = this.data();
    if (!d) return null;
    return d.rounds.find(r => r.roundNumber === this.activeRound()) ?? d.rounds[0] ?? null;
  });

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.leagueId.set(params.get('leagueId') ?? 'nhl');
        this.loadDraft();
      });
  }

  /** NHL Draft Lottery odds by original pick position (bottom 16 non-playoff teams). */
  private readonly LOTTERY_ODDS = [
    25.5, 13.5, 11.5, 9.5, 8.5, 7.5, 6.5, 6.0,
    5.0, 3.5, 3.0, 2.5, 2.0, 1.5, 0.5, 0.5
  ];

  lotteryOdds(pick: number): string {
    if (pick <= this.LOTTERY_ODDS.length) return `${this.LOTTERY_ODDS[pick - 1]}%`;
    return '—';
  }

  private loadDraft() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.draftApi.getDraft(this.leagueId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.data.set(data);
          if (data.rounds.length > 0) {
            this.activeRound.set(data.rounds[0].roundNumber);
          }
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Draft data not available.');
          this.loading.set(false);
        }
      });
  }
}
