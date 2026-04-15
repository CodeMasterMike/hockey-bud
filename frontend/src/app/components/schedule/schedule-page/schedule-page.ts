import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ScheduleApiService,
  ScheduleResponse,
  ScheduleMonth,
} from '../../../services/schedule-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';
import { LoadingText } from '../../shared/loading-text/loading-text';
import { Skeleton } from '../../shared/skeleton/skeleton';

@Component({
  selector: 'app-schedule-page',
  imports: [RouterLink, DataAsOf, LoadingText, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="schedule-page">
      <header class="page-header">
        <h1 class="page-title">{{ data()?.season ?? '...' }} NHL Schedule</h1>
        <p class="page-subtitle">
          @if (loading()) {
            <app-loading-text label="Loading schedule" />
          } @else {
            <app-data-as-of [timestamp]="data()?.dataAsOf ?? null" />
          }
        </p>
      </header>

      <div class="month-nav">
        <button type="button" (click)="prevMonth()" [disabled]="!canGoPrev()" class="month-btn">&laquo;</button>
        <span class="month-label">{{ currentMonthLabel() }}</span>
        <button type="button" (click)="nextMonth()" [disabled]="!canGoNext()" class="month-btn">&raquo;</button>
      </div>

      @if (errorMessage()) {
        <div class="state-msg state-error">{{ errorMessage() }}</div>
      } @else if (loading()) {
        @for (_ of skeletonDays; track $index) {
          <div class="day-card">
            <div class="day-header"><app-skeleton width="120px" height="10px" /></div>
            @for (__ of skeletonGamesPerDay; track $index) {
              <div class="game-row">
                <span class="game-teams">
                  <app-skeleton width="36px" height="12px" />
                  <span class="at">at</span>
                  <app-skeleton width="36px" height="12px" />
                </span>
                <app-skeleton width="56px" height="12px" />
              </div>
            }
          </div>
        }
      } @else if (currentMonth(); as m) {
        @for (day of m.days; track day.date) {
          <div class="day-card">
            <div class="day-header">{{ formatDayHeader(day.date) }}</div>
            @if (day.games.length === 0) {
              <div class="day-empty">No games</div>
            } @else {
              @for (game of day.games; track game.gameId) {
                <a class="game-row" [routerLink]="['/', leagueId(), 'game-hub', game.gameId]">
                  <span class="game-teams">
                    <span class="team-abbr">{{ game.awayTeam.abbreviation }}</span>
                    <span class="at">@<!---->at</span>
                    <span class="team-abbr">{{ game.homeTeam.abbreviation }}</span>
                  </span>
                  @if (game.status === 'Final' || game.status === 'Official') {
                    <span class="game-score">
                      {{ game.awayScore }}–{{ game.homeScore }}
                      <span class="game-status">Final</span>
                    </span>
                  } @else if (game.status === 'Live') {
                    <span class="game-score game-live">Live</span>
                  } @else {
                    <span class="game-time">{{ game.scheduledStartLocal }}</span>
                  }
                </a>
              }
            }
          </div>
        }
      } @else {
        <div class="state-msg">No games found for this month.</div>
      }
    </div>
  `,
  styles: [`
    .schedule-page { max-width: 900px; margin: 0 auto; padding: 28px 20px 48px; font-family: var(--font-primary); }
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 1.2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 0.78rem; color: var(--text-muted); margin: 0; }

    .month-nav { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .month-btn { background: var(--bg-card); border: 1px solid var(--border-default); color: var(--text-primary); font: 700 1rem var(--font-primary); cursor: pointer; padding: 6px 14px; border-radius: 4px; }
    .month-btn:hover:not(:disabled) { background: var(--bg-row-alt); }
    .month-btn:disabled { opacity: 0.3; cursor: default; }
    .month-label { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-primary); min-width: 160px; text-align: center; }

    .day-card { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 4px; margin-bottom: 8px; overflow: hidden; }
    .day-header { font: 700 0.76rem var(--font-primary); text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); padding: 8px 14px; background: var(--bg-row-alt); border-bottom: 1px solid var(--border-default); }
    .day-empty { font-size: 0.76rem; color: var(--text-muted); padding: 10px 14px; }

    .game-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; border-bottom: 1px solid var(--border-default); text-decoration: none; color: var(--text-primary); font-size: 0.82rem; }
    .game-row:last-child { border-bottom: none; }
    .game-row:hover { background: var(--bg-row-alt); }
    .game-teams { display: flex; align-items: center; gap: 6px; }
    .team-abbr { font-weight: 700; }
    .at { font-size: 0.68rem; color: var(--text-muted); }
    .game-score { font-weight: 700; font-variant-numeric: tabular-nums; }
    .game-status { font-size: 0.68rem; color: var(--text-muted); font-weight: 400; margin-left: 6px; }
    .game-live { color: #C62828; }
    .game-time { font-size: 0.76rem; color: var(--text-muted); }

    .state-msg { color: var(--text-muted); text-align: center; padding: 48px 0; font-size: 14px; }
    .state-error { color: #c44; }
  `]
})
export class SchedulePage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ScheduleApiService);
  private destroyRef = inject(DestroyRef);

  readonly skeletonDays = Array(5);
  readonly skeletonGamesPerDay = Array(3);

  leagueId = signal(DEFAULT_LEAGUE_ID);
  data = signal<ScheduleResponse | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  monthIndex = signal(0);

  allMonths = computed<ScheduleMonth[]>(() => this.data()?.months ?? []);
  currentMonth = computed(() => this.allMonths()[this.monthIndex()] ?? null);
  currentMonthLabel = computed(() => this.currentMonth()?.label ?? '...');
  canGoPrev = computed(() => this.monthIndex() > 0);
  canGoNext = computed(() => this.monthIndex() < this.allMonths().length - 1);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.leagueId.set(params.get('leagueId') ?? DEFAULT_LEAGUE_ID);
      this.loadSchedule();
    });
  }

  loadSchedule(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.getSchedule(this.leagueId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.data.set(data);
        this.loading.set(false);
        this.jumpToCurrentMonth(data.months);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load schedule. Please try again.');
      }
    });
  }

  prevMonth(): void { this.monthIndex.update(i => Math.max(0, i - 1)); }
  nextMonth(): void { this.monthIndex.update(i => Math.min(this.allMonths().length - 1, i + 1)); }

  formatDayHeader(dateStr: string): string {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  }

  private jumpToCurrentMonth(months: ScheduleMonth[]): void {
    const now = new Date();
    const idx = months.findIndex(m => m.year === now.getFullYear() && m.month === now.getMonth() + 1);
    this.monthIndex.set(idx >= 0 ? idx : 0);
  }
}
