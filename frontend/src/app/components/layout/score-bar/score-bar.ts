import { Component, ElementRef, viewChild, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ScoresApiService, TickerGame } from '../../../services/scores-api.service';
import { GameClockService, ClockState } from '../../../services/game-clock.service';
import { DEFAULT_LEAGUE_ID, CLOSE_GAME_PERIOD_THRESHOLD, CLOSE_GAME_TIME_THRESHOLD_MS, getPeriodLabel } from '../../../constants';

@Component({
  selector: 'app-score-bar',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ticker" aria-live="polite">
      <button class="ticker__arrow" (click)="scroll(-1)" aria-label="Scroll left">&#9664;</button>
      <div class="ticker__track" #track>
        @for (game of games(); track game.id) {
          <a [routerLink]="['/' + leagueId + '/game-hub', game.id]" class="ticker__game">
            <span class="ticker__team">
              @if (game.awayTeam.logoUrl) {
                <img [src]="game.awayTeam.logoUrl" [alt]="game.awayTeam.abbreviation" class="ticker__logo">
              }
              {{ game.awayTeam.abbreviation }}
            </span>
            @if (game.status !== 'Scheduled') {
              <span class="ticker__score">{{ game.awayScore }}</span>
              <span class="ticker__dash">&ndash;</span>
              <span class="ticker__score">{{ game.homeScore }}</span>
            } @else {
              <span class="ticker__dash">vs</span>
            }
            <span class="ticker__team">
              @if (game.homeTeam.logoUrl) {
                <img [src]="game.homeTeam.logoUrl" [alt]="game.homeTeam.abbreviation" class="ticker__logo">
              }
              {{ game.homeTeam.abbreviation }}
            </span>
            <span class="ticker__status" [class.ticker__status--close]="isCloseGame(game)">
              @if (game.status === 'Live') {
                <span class="ticker__live-dot"></span>
                <span>{{ getClockDisplay(game) }}</span>
              } @else if (game.status === 'Final') {
                <span>Final</span>
              } @else {
                <span>{{ game.scheduledStartLocal }}</span>
              }
            </span>
          </a>
        }
        @if (games().length === 0) {
          <span class="ticker__empty">No games today</span>
        }
      </div>
      <button class="ticker__arrow" (click)="scroll(1)" aria-label="Scroll right">&#9654;</button>
    </div>
  `,
  styles: [`
    .ticker {
      background: var(--bg-ticker);
      color: var(--text-ticker);
      height: 56px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      font-family: var(--font-primary);
    }
    .ticker__arrow {
      background: none;
      border: none;
      color: var(--text-ticker);
      font-size: 18px;
      cursor: pointer;
      width: 36px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      opacity: 0.5;
    }
    .ticker__arrow:hover { opacity: 1; background: rgba(255,255,255,0.08); }
    .ticker__track {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      flex: 1;
      padding: 0 4px;
      scroll-behavior: smooth;
    }
    .ticker__game {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      height: 40px;
      flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 4px;
      background: rgba(255,255,255,0.04);
      text-decoration: none;
      color: var(--text-ticker);
    }
    .ticker__game:hover { background: rgba(255,255,255,0.1); }
    .ticker__logo {
      width: 18px;
      height: 18px;
      object-fit: contain;
      vertical-align: middle;
      margin-right: 2px;
    }
    .ticker__score, .ticker__team, .ticker__status { color: #fff; }
    .ticker__dash { color: rgba(245,240,225,0.4); }
    .ticker__status--close { color: var(--color-live) !important; }
    .ticker__live-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-live);
      margin-right: 5px;
      animation: live-pulse 1.4s ease-in-out infinite;
    }
    .ticker__empty {
      color: rgba(245,240,225,0.4);
      font-size: 12px;
      padding: 0 16px;
    }
    @keyframes live-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `]
})
export class ScoreBar implements OnInit {
  private track = viewChild<ElementRef<HTMLDivElement>>('track');
  private platformId = inject(PLATFORM_ID);
  private scoresApi = inject(ScoresApiService);
  private clockService = inject(GameClockService);
  private destroyRef = inject(DestroyRef);

  readonly leagueId = DEFAULT_LEAGUE_ID;
  games = signal<TickerGame[]>([]);
  private clockStates = new Map<number, ClockState>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.scoresApi.getTicker(this.leagueId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ticker => {
        this.games.set(ticker.games);
        for (const game of ticker.games) {
          if (game.status === 'Live' && game.periodTimeRemainingSeconds != null) {
            this.clockService.initClock(
              game.id,
              game.period ?? 1,
              game.periodTimeRemainingSeconds,
              true
            );
          }
        }
      }
    });

    this.clockService.updates$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      this.clockStates.set(state.gameId, state);
    });
  }

  getClockDisplay(game: TickerGame): string {
    const state = this.clockStates.get(game.id);
    if (state) {
      return `${getPeriodLabel(state.period)} ${state.display}`;
    }
    const label = game.period ? getPeriodLabel(game.period) : '';
    return `${label} ${game.periodTimeRemaining ?? ''}`.trim();
  }

  isCloseGame(game: TickerGame): boolean {
    if (game.status !== 'Live') return false;
    const state = this.clockStates.get(game.id);
    const timeMs = state?.timeRemainingMs ?? (game.periodTimeRemainingSeconds ?? 0) * 1000;
    const period = state?.period ?? game.period ?? 0;
    return period >= CLOSE_GAME_PERIOD_THRESHOLD && timeMs <= CLOSE_GAME_TIME_THRESHOLD_MS;
  }

  scroll(direction: number): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    const box = el.querySelector('.ticker__game') as HTMLElement;
    if (!box) return;
    el.scrollBy({ left: direction * (box.offsetWidth + 8) * 2, behavior: 'smooth' });
  }
}
