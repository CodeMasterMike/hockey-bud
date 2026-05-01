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
  ScheduleGame,
} from '../../../services/schedule-api.service';

interface CalendarCell {
  day: number;
  date: string;
  isToday: boolean;
  games: ScheduleGame[];
}
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
        <div class="cal-grid">
          @for (h of dayHeaders; track h) {
            <div class="cal-hdr">{{ h }}</div>
          }
          @for (_ of skeletonDays; track $index) {
            <div class="cal-cell cal-cell--empty"><app-skeleton width="20px" height="10px" /></div>
          }
        </div>
      } @else if (calendarWeeks().length > 0) {
        <div class="cal-grid">
          @for (h of dayHeaders; track h) {
            <div class="cal-hdr">{{ h }}</div>
          }
          @for (cell of calendarCells(); track $index) {
            @if (cell) {
              <div class="cal-cell" [class.cal-cell--today]="cell.isToday" [class.cal-cell--has-games]="cell.games.length > 0">
                <div class="cal-day-num">{{ cell.day }}</div>
                @for (game of cell.games; track game.gameId) {
                  <a class="cal-game" [routerLink]="['/', leagueId(), 'game-hub', game.gameId]">
                    <span class="cal-matchup">{{ game.awayTeam.abbreviation }}@{{ game.homeTeam.abbreviation }}</span>
                    @if (game.status === 'Final' || game.status === 'Official') {
                      <span class="cal-result">{{ game.awayScore }}-{{ game.homeScore }}</span>
                    } @else if (game.status === 'Live') {
                      <span class="cal-live">LIVE</span>
                    } @else {
                      <span class="cal-time">{{ game.scheduledStartLocal }}</span>
                    }
                  </a>
                }
              </div>
            } @else {
              <div class="cal-cell cal-cell--empty"></div>
            }
          }
        </div>
      } @else {
        <div class="state-msg">No games found for this month.</div>
      }
    </div>
  `,
  styles: [`
    .schedule-page { max-width: 1100px; margin: 0 auto; padding: 28px 20px 48px; font-family: var(--font-primary); }
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 1.2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 0.78rem; color: var(--text-muted); margin: 0; }

    .month-nav { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .month-btn { background: var(--bg-card); border: 1px solid var(--border-default); color: var(--text-primary); font: 700 1rem var(--font-primary); cursor: pointer; padding: 6px 14px; border-radius: 4px; }
    .month-btn:hover:not(:disabled) { background: var(--bg-row-alt); }
    .month-btn:disabled { opacity: 0.3; cursor: default; }
    .month-label { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-primary); min-width: 160px; text-align: center; }

    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid var(--border-default); border-radius: 4px; overflow: hidden; background: var(--bg-card); }
    .cal-hdr { font: 700 0.68rem var(--font-primary); text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); text-align: center; padding: 8px 4px; background: var(--bg-row-alt); border-bottom: 2px solid var(--border-strong); }
    .cal-cell { min-height: 80px; padding: 4px 6px; border-bottom: 1px solid var(--border-default); border-right: 1px solid var(--border-default); overflow: hidden; }
    .cal-cell:nth-child(7n) { border-right: none; }
    .cal-cell--empty { background: var(--bg-row-alt); opacity: 0.5; }
    .cal-cell--today { background: color-mix(in srgb, var(--color-link) 8%, transparent); }
    .cal-day-num { font: 700 0.72rem var(--font-primary); color: var(--text-secondary); margin-bottom: 2px; }
    .cal-cell--today .cal-day-num { color: var(--color-link); }
    .cal-game { display: block; font-size: 0.62rem; padding: 1px 0; text-decoration: none; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cal-game:hover { text-decoration: underline; }
    .cal-matchup { font-weight: 700; }
    .cal-result { color: var(--text-secondary); margin-left: 2px; }
    .cal-live { color: #C62828; font-weight: 700; margin-left: 2px; }
    .cal-time { color: var(--text-muted); margin-left: 2px; }

    @media (max-width: 768px) {
      .cal-cell { min-height: 60px; padding: 3px 4px; }
      .cal-game { font-size: 0.56rem; }
    }

    .state-msg { color: var(--text-muted); text-align: center; padding: 48px 0; font-size: 14px; }
    .state-error { color: #c44; }
  `]
})
export class SchedulePage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ScheduleApiService);
  private destroyRef = inject(DestroyRef);

  readonly skeletonDays = Array(35);
  readonly dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  /** Build a flat array of calendar cells (null = empty padding day). */
  calendarCells = computed<(CalendarCell | null)[]>(() => {
    const m = this.currentMonth();
    if (!m) return [];

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Build a lookup from date string to games
    const dayMap = new Map(m.days.map(d => [d.date, d.games]));

    // First day of the month
    const firstDay = new Date(m.year, m.month - 1, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(m.year, m.month, 0).getDate();

    const cells: (CalendarCell | null)[] = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) cells.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${m.year}-${String(m.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        date: dateStr,
        isToday: dateStr === todayStr,
        games: dayMap.get(dateStr) ?? [],
      });
    }
    // Trailing empty cells to fill last week
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  });

  calendarWeeks = computed(() => {
    const cells = this.calendarCells();
    const weeks: (CalendarCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  });

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
