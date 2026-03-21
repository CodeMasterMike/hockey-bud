import { Component, input, output, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ScoreGame } from '../../../services/scores-api.service';
import { GameClockService, ClockState } from '../../../services/game-clock.service';

@Component({
  selector: 'app-score-box',
  imports: [RouterLink],
  template: `
    <div class="box" [class.box--live]="game().status === 'Live'" (click)="expand.emit()">
      <!-- Away team (top) -->
      <div class="box__team">
        <span class="box__abbrev">{{ game().awayTeam.abbreviation }}</span>
        @if (game().status !== 'Scheduled') {
          <span class="box__score">{{ game().awayTeam.score }}</span>
        }
      </div>
      <!-- Home team (bottom) -->
      <div class="box__team">
        <span class="box__abbrev">{{ game().homeTeam.abbreviation }}</span>
        @if (game().status !== 'Scheduled') {
          <span class="box__score">{{ game().homeTeam.score }}</span>
        }
      </div>
      <!-- Status line -->
      <div class="box__status" [class.box__status--close]="isCloseGame()">
        @if (game().status === 'Scheduled') {
          <span>{{ game().scheduledStartLocal }}</span>
        } @else if (game().status === 'Live') {
          <span class="box__live-dot"></span>
          <span>{{ clockDisplay() }}</span>
        } @else {
          <span>Final{{ game().isOvertime ? '/OT' : '' }}{{ game().isShootout ? '/SO' : '' }}</span>
        }
      </div>
      <!-- SOG -->
      @if (game().status !== 'Scheduled') {
        <div class="box__sog">
          <span>SOG: {{ game().awayTeam.shotsOnGoal ?? '-' }} - {{ game().homeTeam.shotsOnGoal ?? '-' }}</span>
        </div>
      }
      <!-- Record/rank -->
      <div class="box__meta">
        <span class="box__record">{{ game().awayTeam.record }}</span>
        @if (game().awayTeam.leagueRank) {
          <span class="box__rank">#{{ game().awayTeam.leagueRank }}</span>
        }
      </div>
      <div class="box__meta">
        <span class="box__record">{{ game().homeTeam.record }}</span>
        @if (game().homeTeam.leagueRank) {
          <span class="box__rank">#{{ game().homeTeam.leagueRank }}</span>
        }
      </div>
      <!-- Game Hub link -->
      @if (game().status !== 'Scheduled') {
        <a class="box__hub-link" [routerLink]="['/', leagueId(), 'game-hub', game().id]" (click)="$event.stopPropagation()">
          Game Hub &rarr;
        </a>
      }
    </div>
  `,
  styles: [`
    .box {
      background: var(--bg-card);
      border: 1px solid var(--border-default);
      border-radius: 6px;
      padding: 12px;
      cursor: pointer;
      font-family: var(--font-primary);
      font-size: 13px;
      transition: border-color 0.15s;
    }
    .box:hover { border-color: var(--border-strong); }
    .box--live { border-left: 3px solid var(--color-live); }
    .box__team {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 0;
    }
    .box__abbrev {
      font-weight: 700;
      color: var(--text-primary);
      font-size: 14px;
    }
    .box__score {
      font-weight: 700;
      color: var(--text-primary);
      font-size: 18px;
    }
    .box__status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 700;
      padding: 4px 0;
      border-top: 1px solid var(--border-default);
      margin-top: 4px;
    }
    .box__status--close { color: var(--color-live); }
    .box__live-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-live);
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .box__sog {
      font-size: 11px;
      color: var(--text-muted);
      padding: 2px 0;
    }
    .box__meta {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: var(--text-muted);
      padding: 1px 0;
    }
    .box__rank { font-weight: 700; }
    .box__hub-link {
      display: block;
      text-align: center;
      font-size: 11px;
      color: var(--color-link);
      text-decoration: none;
      padding-top: 6px;
      border-top: 1px solid var(--border-default);
      margin-top: 6px;
    }
    .box__hub-link:hover { text-decoration: underline; }
  `]
})
export class ScoreBox implements OnInit, OnDestroy {
  game = input.required<ScoreGame>();
  leagueId = input<string>('nhl');
  expand = output<void>();

  private clockService = inject(GameClockService);
  private clockState: ClockState | null = null;
  private sub?: Subscription;

  clockDisplay = computed(() => {
    const g = this.game();
    if (g.status !== 'Live') return '';
    if (this.clockState) {
      const periodLabel = this.getPeriodLabel(this.clockState.period);
      return `${periodLabel} ${this.clockState.display}`;
    }
    const label = g.currentPeriodLabel ?? '';
    return `${label} ${g.periodTimeRemaining ?? ''}`.trim();
  });

  isCloseGame = computed(() => {
    const g = this.game();
    if (g.status !== 'Live') return false;
    const timeLeft = this.clockState?.timeRemainingMs ?? (g.periodTimeRemainingSeconds ?? 0) * 1000;
    const period = this.clockState?.period ?? g.currentPeriod ?? 0;
    return period >= 3 && timeLeft <= 5 * 60 * 1000;
  });

  ngOnInit(): void {
    this.sub = this.clockService.updates$.subscribe(state => {
      if (state.gameId === this.game().id) {
        this.clockState = state;
      }
    });
  }

  private getPeriodLabel(period: number): string {
    if (period <= 3) return `${period === 1 ? '1st' : period === 2 ? '2nd' : '3rd'}`;
    if (period === 4) return 'OT';
    return `${period - 3}OT`;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
