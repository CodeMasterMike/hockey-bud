import { Component, ElementRef, viewChild, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ScoresApiService, TickerGame } from '../../../services/scores-api.service';
import { GameClockService, ClockState } from '../../../services/game-clock.service';

@Component({
  selector: 'app-score-bar',
  imports: [RouterLink],
  template: `
    <div class="ticker" aria-live="polite">
      <button class="ticker__arrow" (click)="scroll(-1)" aria-label="Scroll left">&#9664;</button>
      <div class="ticker__track" #track>
        @for (game of games(); track game.id) {
          <a [routerLink]="['/nhl/game-hub', game.id]" class="ticker__game">
            <span class="ticker__team">{{ game.awayTeam.abbreviation }}</span>
            @if (game.status !== 'Scheduled') {
              <span class="ticker__score">{{ game.awayScore }}</span>
              <span class="ticker__dash">&ndash;</span>
              <span class="ticker__score">{{ game.homeScore }}</span>
            } @else {
              <span class="ticker__dash">vs</span>
            }
            <span class="ticker__team">{{ game.homeTeam.abbreviation }}</span>
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
export class ScoreBar implements OnInit, OnDestroy {
  private track = viewChild<ElementRef<HTMLDivElement>>('track');
  private platformId = inject(PLATFORM_ID);
  private scoresApi = inject(ScoresApiService);
  private clockService = inject(GameClockService);

  games = signal<TickerGame[]>([]);
  private clockStates = new Map<number, ClockState>();
  private subs: Subscription[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.subs.push(
      this.scoresApi.getTicker('nhl').subscribe({
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
      })
    );

    this.subs.push(
      this.clockService.updates$.subscribe(state => {
        this.clockStates.set(state.gameId, state);
      })
    );
  }

  getClockDisplay(game: TickerGame): string {
    const state = this.clockStates.get(game.id);
    if (state) {
      const periodLabel = this.getPeriodLabel(state.period);
      return `${periodLabel} ${state.display}`;
    }
    const label = game.period ? this.getPeriodLabel(game.period) : '';
    return `${label} ${game.periodTimeRemaining ?? ''}`.trim();
  }

  isCloseGame(game: TickerGame): boolean {
    if (game.status !== 'Live') return false;
    const state = this.clockStates.get(game.id);
    const timeMs = state?.timeRemainingMs ?? (game.periodTimeRemainingSeconds ?? 0) * 1000;
    const period = state?.period ?? game.period ?? 0;
    return period >= 3 && timeMs <= 5 * 60 * 1000;
  }

  scroll(direction: number): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    const box = el.querySelector('.ticker__game') as HTMLElement;
    if (!box) return;
    el.scrollBy({ left: direction * (box.offsetWidth + 8) * 2, behavior: 'smooth' });
  }

  private getPeriodLabel(period: number): string {
    if (period <= 3) return period === 1 ? '1st' : period === 2 ? '2nd' : '3rd';
    if (period === 4) return 'OT';
    return `${period - 3}OT`;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
