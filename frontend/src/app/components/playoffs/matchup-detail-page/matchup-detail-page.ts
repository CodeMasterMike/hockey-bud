import { Component, inject, signal, DestroyRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlayoffsApiService, PlayoffMatchupDetailResponse } from '../../../services/playoffs-api.service';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';

@Component({
  selector: 'app-matchup-detail-page',
  imports: [RouterLink, DataAsOf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      @if (loading()) {
        <p class="loading">Loading matchup&hellip;</p>
      } @else if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      } @else if (data()) {
        <div class="header">
          <div class="header__team">
            @if (data()!.topSeed.logoUrl) {
              <img [src]="data()!.topSeed.logoUrl" [alt]="data()!.topSeed.abbreviation" class="header__logo">
            }
            <span class="header__seed">{{ data()!.topSeed.conferenceSeed }}</span>
            <span class="header__abbrev">{{ data()!.topSeed.abbreviation }}</span>
          </div>
          <span class="header__vs">vs</span>
          <div class="header__team">
            @if (data()!.bottomSeed.logoUrl) {
              <img [src]="data()!.bottomSeed.logoUrl" [alt]="data()!.bottomSeed.abbreviation" class="header__logo">
            }
            <span class="header__seed">{{ data()!.bottomSeed.conferenceSeed }}</span>
            <span class="header__abbrev">{{ data()!.bottomSeed.abbreviation }}</span>
          </div>
        </div>
        <p class="series-info">{{ data()!.conference }} &mdash; {{ data()!.seriesScore }} &mdash; <app-data-as-of [timestamp]="data()!.dataAsOf" /></p>

        <div class="games-card">
          <div class="games-card__header">Games</div>
          <table class="games-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Away</th>
                <th></th>
                <th>Home</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (game of data()!.games; track game.gameNumber) {
                <tr [class.row-alt]="game.gameNumber % 2 === 0">
                  <td class="col-center">{{ game.gameNumber }}</td>
                  <td class="col-team">{{ game.awayTeamAbbreviation }}</td>
                  <td class="col-score">
                    @if (game.awayScore !== null && game.homeScore !== null) {
                      {{ game.awayScore }} &ndash; {{ game.homeScore }}
                    } @else {
                      &mdash;
                    }
                  </td>
                  <td class="col-team">{{ game.homeTeamAbbreviation }}</td>
                  <td class="col-status" [class.col-status--live]="game.status === 'Live'">
                    {{ game.status }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <a [routerLink]="['/', leagueId(), 'playoffs']" class="back-link">&larr; Back to bracket</a>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 28px 20px 48px; }
    .loading, .error { font-size: 0.82rem; color: var(--text-muted); padding: 24px 0; }

    .header {
      display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 8px;
    }
    .header__team { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 700; }
    .header__logo { width: 48px; height: 48px; object-fit: contain; }
    .header__seed { font-size: 0.72rem; color: var(--text-muted); }
    .header__abbrev { color: var(--text-primary); }
    .header__vs { font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }

    .series-info { text-align: center; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 28px; }

    .games-card {
      background: var(--bg-card); border: 1px solid var(--border-default);
      border-radius: 4px; overflow: hidden; margin-bottom: 24px;
    }
    .games-card__header {
      padding: 12px 16px 10px; font-size: 0.82rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      border-bottom: 1px solid var(--border-default);
    }
    .games-table {
      width: 100%; border-collapse: collapse; font-size: 0.76rem;
    }
    .games-table th {
      padding: 8px 12px; text-align: left; font-weight: 700; font-size: 0.68rem;
      text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted);
      border-bottom: 2px solid var(--border-strong);
    }
    .games-table td {
      padding: 6px 12px; border-bottom: 1px solid var(--border-default);
      font-variant-numeric: tabular-nums;
    }
    .games-table .row-alt td { background: var(--bg-row-alt); }
    .col-center { text-align: center; }
    .col-team { font-weight: 700; }
    .col-score { text-align: center; font-weight: 700; }
    .col-status { text-align: center; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .col-status--live { color: var(--color-live); }

    .back-link {
      font-size: 0.76rem; color: var(--color-link); text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }
  `]
})
export class MatchupDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private playoffsApi = inject(PlayoffsApiService);
  private destroyRef = inject(DestroyRef);

  leagueId = signal('');
  data = signal<PlayoffMatchupDetailResponse | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.leagueId.set(params.get('leagueId') ?? 'nhl');
        const seriesLetter = params.get('seriesLetter') ?? '';
        this.loadMatchup(seriesLetter);
      });
  }

  private loadMatchup(seriesLetter: string) {
    this.loading.set(true);
    this.errorMessage.set('');

    this.playoffsApi.getMatchupDetail(this.leagueId(), seriesLetter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.data.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Matchup not found.');
          this.loading.set(false);
        }
      });
  }
}
