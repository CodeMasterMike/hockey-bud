import { Component, inject, signal, DestroyRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlayoffsApiService, PlayoffBracketResponse } from '../../../services/playoffs-api.service';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';
import { LoadingText } from '../../shared/loading-text/loading-text';

@Component({
  selector: 'app-playoff-bracket-page',
  imports: [RouterLink, DataAsOf, LoadingText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h2 class="page__title">{{ data()?.season || '' }} NHL Playoffs</h2>
      <p class="page__subtitle"><app-data-as-of [timestamp]="data()?.dataAsOf ?? null" /></p>

      <div class="conf-tabs">
        @for (tab of conferenceTabs; track tab.value) {
          <button
            [class.tab--active]="activeConference() === tab.value"
            (click)="setConference(tab.value)">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <p class="loading"><app-loading-text label="Loading bracket" /></p>
      } @else if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      } @else if (data()) {
        @for (round of data()!.rounds; track round.roundNumber) {
          <div class="round">
            <h3 class="round__label">{{ round.label }}</h3>
            <div class="round__series">
              @for (series of round.series; track series.seriesLetter) {
                <a [routerLink]="['/', leagueId(), 'playoffs', 'matchup', series.seriesLetter]"
                   class="matchup">
                  <div class="matchup__team" [class.matchup__team--winner]="series.topSeed.seriesWins === 4">
                    <span class="matchup__seed">{{ series.topSeed.conferenceSeed || '—' }}</span>
                    @if (series.topSeed.logoUrl) {
                      <img [src]="series.topSeed.logoUrl" [alt]="series.topSeed.abbreviation" class="matchup__logo">
                    }
                    <span class="matchup__abbrev">{{ series.topSeed.abbreviation || 'TBD' }}</span>
                    <span class="matchup__record">{{ series.topSeed.regularSeasonRecord }}</span>
                    <span class="matchup__wins"
                      [class.matchup__wins--leading]="series.topSeed.seriesWins >= series.bottomSeed.seriesWins && (series.topSeed.seriesWins > 0 || series.bottomSeed.seriesWins > 0)">
                      {{ series.topSeed.seriesWins > 0 || series.bottomSeed.seriesWins > 0 ? series.topSeed.seriesWins : '—' }}
                    </span>
                  </div>
                  <div class="matchup__team" [class.matchup__team--winner]="series.bottomSeed.seriesWins === 4">
                    <span class="matchup__seed">{{ series.bottomSeed.conferenceSeed || '—' }}</span>
                    @if (series.bottomSeed.logoUrl) {
                      <img [src]="series.bottomSeed.logoUrl" [alt]="series.bottomSeed.abbreviation" class="matchup__logo">
                    }
                    <span class="matchup__abbrev">{{ series.bottomSeed.abbreviation || 'TBD' }}</span>
                    <span class="matchup__record">{{ series.bottomSeed.regularSeasonRecord }}</span>
                    <span class="matchup__wins"
                      [class.matchup__wins--leading]="series.bottomSeed.seriesWins > series.topSeed.seriesWins">
                      {{ series.topSeed.seriesWins > 0 || series.bottomSeed.seriesWins > 0 ? series.bottomSeed.seriesWins : '—' }}
                    </span>
                  </div>
                  <div class="matchup__status"
                    [class.matchup__status--live]="series.status === 'In Progress'"
                    [class.matchup__status--final]="series.status === 'Complete'">
                    {{ series.seriesScore }}
                  </div>
                </a>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; padding: 28px 20px 48px; }
    .page__title {
      font-size: 1.2rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; margin-bottom: 4px;
    }
    .page__subtitle { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 20px; }
    .loading, .error { font-size: 0.82rem; color: var(--text-muted); padding: 24px 0; }

    .conf-tabs { display: flex; gap: 0; margin-bottom: 24px; }
    .conf-tabs button {
      font-family: var(--font-primary); font-size: 0.76rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 20px;
      background: var(--bg-row-alt); color: var(--text-muted);
      border: 1px solid var(--border-default); border-bottom: none;
      border-radius: 4px 4px 0 0; cursor: pointer; margin-right: -1px;
    }
    .conf-tabs button:hover { color: var(--text-primary); }
    .conf-tabs button.tab--active {
      background: var(--bg-card); color: var(--text-primary);
      border-bottom: 1px solid var(--bg-card); position: relative; z-index: 1;
    }

    .round { margin-bottom: 32px; }
    .round__label {
      font-size: 0.82rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 12px;
      padding-bottom: 8px; border-bottom: 1px solid var(--border-default);
    }
    .round__series { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }

    .matchup {
      border: 1px solid var(--border-default); border-radius: 4px;
      overflow: hidden; cursor: pointer; text-decoration: none; display: block;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .matchup:hover { border-color: var(--color-link); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

    .matchup__team {
      display: flex; align-items: center; gap: 6px; padding: 8px 10px;
      font-size: 0.74rem; font-weight: 700; color: var(--text-primary);
      background: var(--bg-card); border-bottom: 1px solid var(--border-default);
    }
    .matchup__team:last-of-type { border-bottom: none; }
    .matchup__team--winner { background: rgba(46, 125, 50, 0.08); }

    .matchup__seed { font-size: 0.66rem; color: var(--text-muted); min-width: 18px; }
    .matchup__logo { width: 18px; height: 18px; object-fit: contain; }
    .matchup__abbrev { color: var(--text-primary); }
    .matchup__record { font-size: 0.66rem; color: var(--text-muted); font-weight: 400; margin-left: auto; }
    .matchup__wins { font-size: 0.82rem; font-weight: 700; min-width: 14px; text-align: center; color: var(--text-muted); }
    .matchup__wins--leading { color: var(--text-primary); }

    .matchup__status {
      text-align: center; font-size: 0.64rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 10px;
      color: var(--text-muted); background: var(--bg-row-alt);
    }
    .matchup__status--live { color: var(--color-live); }
    .matchup__status--final { color: var(--text-muted); }
  `]
})
export class PlayoffBracketPage implements OnInit {
  private route = inject(ActivatedRoute);
  private playoffsApi = inject(PlayoffsApiService);
  private destroyRef = inject(DestroyRef);

  leagueId = signal('');
  activeConference = signal<string>('eastern');
  data = signal<PlayoffBracketResponse | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  conferenceTabs = [
    { label: 'Eastern Conference', value: 'eastern' },
    { label: 'Western Conference', value: 'western' },
    { label: 'Full League', value: 'full' },
  ];

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.leagueId.set(params.get('leagueId') ?? 'nhl');
        this.loadBracket();
      });
  }

  setConference(conf: string) {
    this.activeConference.set(conf);
    this.loadBracket();
  }

  private loadBracket() {
    this.loading.set(true);
    this.errorMessage.set('');

    const conf = this.activeConference() === 'full' ? undefined : this.activeConference();

    this.playoffsApi.getBracket(this.leagueId(), conf)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.data.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('No playoff bracket available for this season.');
          this.loading.set(false);
        }
      });
  }
}
