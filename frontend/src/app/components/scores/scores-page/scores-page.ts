import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScoresApiService, ScoresResponse, ScoreGame } from '../../../services/scores-api.service';
import { GameClockService } from '../../../services/game-clock.service';
import { ScoreBox } from '../score-box/score-box';
import { ExpandedScoreBox } from '../expanded-score-box/expanded-score-box';
import { PregameMatchup } from '../pregame-matchup/pregame-matchup';
import { CalendarPicker } from '../calendar-picker/calendar-picker';
import { DEFAULT_LEAGUE_ID } from '../../../constants';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';

@Component({
  selector: 'app-scores-page',
  imports: [ScoreBox, ExpandedScoreBox, PregameMatchup, CalendarPicker, DataAsOf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scores-page">
      <div class="scores-header">
        <h1 class="scores-title">Scores <app-data-as-of [timestamp]="scoresData()?.dataAsOf ?? null" /></h1>
        <div class="scores-date-controls">
          <button class="date-nav" (click)="navigateDate(-1)" aria-label="Previous day">&laquo;</button>
          <button class="date-display" (click)="showCalendar.set(!showCalendar())">
            {{ scoresData()?.dateDisplay ?? 'Loading...' }}
          </button>
          <button class="date-nav" (click)="navigateDate(1)" aria-label="Next day">&raquo;</button>
        </div>
        @if (showCalendar()) {
          <app-calendar-picker
            [selectedDate]="selectedDate()"
            (dateSelected)="onDateSelected($event)"
          />
        }
      </div>

      @if (errorMessage()) {
        <div class="scores-error">{{ errorMessage() }}</div>
      } @else if (loading()) {
        <div class="scores-loading">Loading scores...</div>
      } @else if (games().length === 0) {
        <div class="scores-empty">No games scheduled for this date.</div>
      } @else {
        <div class="scores-grid">
          @for (game of games(); track game.id) {
            <div class="scores-grid__cell" [class.scores-grid__cell--expanded]="expandedGameId() === game.id">
              @if (expandedGameId() === game.id) {
                @if (game.status === 'Scheduled') {
                  <app-pregame-matchup
                    [leagueId]="leagueId()"
                    [game]="game"
                    (collapse)="expandedGameId.set(null)"
                  />
                } @else {
                  <app-expanded-score-box
                    [leagueId]="leagueId()"
                    [game]="game"
                    (collapse)="expandedGameId.set(null)"
                  />
                }
              } @else {
                <app-score-box
                  [game]="game"
                  [leagueId]="leagueId()"
                  (expand)="onExpand(game)"
                />
              }
            </div>
          }
        </div>
      }

      @if (scoresData()?.showPreviousDay) {
        <div class="scores-previous-day">
          <button (click)="navigateDate(-1)">View yesterday's scores</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .scores-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .scores-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      position: relative;
    }
    .scores-title {
      font-family: var(--font-primary);
      font-size: 24px;
      color: var(--text-primary);
      margin: 0;
    }
    .scores-date-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .date-nav {
      background: none;
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      font-family: var(--font-primary);
      font-size: 16px;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 4px;
    }
    .date-nav:hover { background: var(--bg-row-alt); }
    .date-display {
      background: var(--bg-card);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      font-family: var(--font-primary);
      font-size: 16px;
      cursor: pointer;
      padding: 6px 16px;
      border-radius: 4px;
      min-width: 80px;
      text-align: center;
    }
    .date-display:hover { border-color: var(--border-strong); }
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .scores-grid__cell--expanded {
      grid-column: 1 / -1;
    }
    .scores-error {
      font-family: var(--font-primary);
      color: #c44;
      text-align: center;
      padding: 48px 0;
      font-size: 14px;
    }
    .scores-loading, .scores-empty {
      font-family: var(--font-primary);
      color: var(--text-muted);
      text-align: center;
      padding: 48px 0;
      font-size: 14px;
    }
    .scores-previous-day {
      text-align: center;
      margin-top: 24px;
    }
    .scores-previous-day button {
      background: none;
      border: 1px solid var(--border-default);
      color: var(--color-link);
      font-family: var(--font-primary);
      cursor: pointer;
      padding: 8px 20px;
      border-radius: 4px;
      font-size: 13px;
    }
    @media (max-width: 900px) {
      .scores-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 520px) {
      .scores-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ScoresPage implements OnInit {
  private route = inject(ActivatedRoute);
  private scoresApi = inject(ScoresApiService);
  private clockService = inject(GameClockService);
  private destroyRef = inject(DestroyRef);

  leagueId = signal(DEFAULT_LEAGUE_ID);
  selectedDate = signal<string | null>(null);
  scoresData = signal<ScoresResponse | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  expandedGameId = signal<number | null>(null);
  showCalendar = signal(false);

  games = computed(() => this.scoresData()?.games ?? []);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const league = params.get('leagueId') ?? DEFAULT_LEAGUE_ID;
      this.leagueId.set(league);
      this.loadScores();
    });

    this.scoresApi.scoreUpdates$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.loadScores(false);
    });
  }

  loadScores(showLoading = true): void {
    if (showLoading) this.loading.set(true);
    const date = this.selectedDate() ?? undefined;

    this.scoresApi.getScores(this.leagueId(), date).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.scoresData.set(data);
        this.loading.set(false);
        this.errorMessage.set(null);
        this.initLiveClocks(data.games);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load scores. Please try again.');
      }
    });
  }

  navigateDate(offset: number): void {
    const current = this.selectedDate()
      ? new Date(this.selectedDate()! + 'T00:00:00')
      : new Date();
    current.setDate(current.getDate() + offset);
    const dateStr = current.toISOString().split('T')[0];
    this.selectedDate.set(dateStr);
    this.expandedGameId.set(null);
    this.loadScores();
  }

  onDateSelected(date: string): void {
    this.selectedDate.set(date);
    this.showCalendar.set(false);
    this.expandedGameId.set(null);
    this.loadScores();
  }

  onExpand(game: ScoreGame): void {
    this.expandedGameId.set(
      this.expandedGameId() === game.id ? null : game.id
    );
  }

  private initLiveClocks(games: ScoreGame[]): void {
    for (const game of games) {
      if (game.status === 'Live' && game.periodTimeRemainingSeconds != null) {
        this.clockService.initClock(
          game.id,
          game.currentPeriod ?? 1,
          game.periodTimeRemainingSeconds,
          game.clockRunning
        );
      }
    }
  }
}
