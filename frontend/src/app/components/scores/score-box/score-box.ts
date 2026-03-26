import { Component, input, output, inject, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ScoreGame } from '../../../services/scores-api.service';
import { GameClockService, ClockState } from '../../../services/game-clock.service';
import { DEFAULT_LEAGUE_ID, CLOSE_GAME_PERIOD_THRESHOLD, CLOSE_GAME_TIME_THRESHOLD_MS, getPeriodLabel } from '../../../constants';

@Component({
  selector: 'app-score-box',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box" role="button" tabindex="0" [class.box--live]="game().status === 'Live'" (click)="expand.emit()" (keydown.enter)="expand.emit()">
      <!-- Away team (top) -->
      <div class="box__team">
        <span class="box__team-info">
          @if (game().awayTeam.logoUrl) {
            <img [src]="game().awayTeam.logoUrl" [alt]="game().awayTeam.abbreviation" class="box__logo">
          }
          <span class="box__abbrev">{{ game().awayTeam.abbreviation }}</span>
        </span>
        @if (game().status !== 'Scheduled') {
          <span class="box__score">{{ game().awayTeam.score }}</span>
        }
      </div>
      <!-- Home team (bottom) -->
      <div class="box__team">
        <span class="box__team-info">
          @if (game().homeTeam.logoUrl) {
            <img [src]="game().homeTeam.logoUrl" [alt]="game().homeTeam.abbreviation" class="box__logo">
          }
          <span class="box__abbrev">{{ game().homeTeam.abbreviation }}</span>
        </span>
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
    .box__team-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .box__logo {
      width: 22px;
      height: 22px;
      object-fit: contain;
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
export class ScoreBox implements OnInit {
  game = input.required<ScoreGame>();
  leagueId = input<string>(DEFAULT_LEAGUE_ID);
  expand = output<void>();

  private clockService = inject(GameClockService);
  private destroyRef = inject(DestroyRef);
  private clockState: ClockState | null = null;

  clockDisplay = computed(() => {
    const g = this.game();
    if (g.status !== 'Live') return '';
    if (this.clockState) {
      return `${getPeriodLabel(this.clockState.period)} ${this.clockState.display}`;
    }
    const label = g.currentPeriodLabel ?? '';
    return `${label} ${g.periodTimeRemaining ?? ''}`.trim();
  });

  isCloseGame = computed(() => {
    const g = this.game();
    if (g.status !== 'Live') return false;
    const timeLeft = this.clockState?.timeRemainingMs ?? (g.periodTimeRemainingSeconds ?? 0) * 1000;
    const period = this.clockState?.period ?? g.currentPeriod ?? 0;
    return period >= CLOSE_GAME_PERIOD_THRESHOLD && timeLeft <= CLOSE_GAME_TIME_THRESHOLD_MS;
  });

  ngOnInit(): void {
    this.clockService.updates$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      if (state.gameId === this.game().id) {
        this.clockState = state;
      }
    });
  }
}
