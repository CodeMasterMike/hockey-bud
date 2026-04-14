import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  StatsApiService,
  StatsResponse,
  StatsSection,
  SkaterStats,
  GoalieStats,
} from '../../../services/stats-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';

// ── Skater column definitions ────────────────────────────────────

interface ColumnDef<T> {
  key: string;
  sortKey: string;
  label: string;
  title: string;
  format?: (row: T) => string;
  wide?: boolean;
}

const SKATER_COLUMNS: readonly ColumnDef<SkaterStats>[] = [
  { key: 'gamesPlayed', sortKey: 'gamesPlayed', label: 'GP', title: 'Games Played' },
  { key: 'goals', sortKey: 'goals', label: 'G', title: 'Goals' },
  { key: 'assists', sortKey: 'assists', label: 'A', title: 'Assists' },
  { key: 'points', sortKey: 'points', label: 'PTS', title: 'Points' },
  { key: 'plusMinus', sortKey: 'plusMinus', label: '+/-', title: 'Plus/Minus', format: r => formatPlusMinus(r.plusMinus) },
  { key: 'hits', sortKey: 'hits', label: 'HIT', title: 'Hits', format: r => nullDash(r.hits) },
  { key: 'penaltyMinutes', sortKey: 'penaltyMinutes', label: 'PIM', title: 'Penalty Minutes' },
  { key: 'timeOnIcePerGame', sortKey: 'timeOnIce', label: 'TOI', title: 'Time On Ice Per Game', format: r => nullDash(r.timeOnIcePerGame, 1), wide: true },
  { key: 'shots', sortKey: 'shots', label: 'SOG', title: 'Shots On Goal', format: r => nullDash(r.shots) },
  { key: 'shootingPct', sortKey: 'shootingPct', label: 'S%', title: 'Shooting %', format: r => nullDash(r.shootingPct, 1), wide: true },
  { key: 'blockedShots', sortKey: 'blockedShots', label: 'BLK', title: 'Blocked Shots', format: r => nullDash(r.blockedShots) },
  { key: 'evenStrengthPoints', sortKey: 'evenStrengthPoints', label: 'EVP', title: 'Even Strength Points', format: r => nullDash(r.evenStrengthPoints) },
  { key: 'powerPlayPoints', sortKey: 'powerPlayPoints', label: 'PPP', title: 'Power Play Points', format: r => nullDash(r.powerPlayPoints) },
  { key: 'shortHandedPoints', sortKey: 'shortHandedPoints', label: 'SHP', title: 'Short Handed Points', format: r => nullDash(r.shortHandedPoints) },
  { key: 'giveaways', sortKey: 'giveaways', label: 'GV', title: 'Giveaways', format: r => nullDash(r.giveaways) },
  { key: 'takeaways', sortKey: 'takeaways', label: 'TK', title: 'Takeaways', format: r => nullDash(r.takeaways) },
  { key: 'faceoffPct', sortKey: 'faceoffPct', label: 'FO%', title: 'Faceoff Win %', format: r => nullDash(r.faceoffPct, 1), wide: true },
];

const GOALIE_COLUMNS: readonly ColumnDef<GoalieStats>[] = [
  { key: 'gamesPlayed', sortKey: 'gamesPlayed', label: 'GP', title: 'Games Played' },
  { key: 'gamesStarted', sortKey: 'gamesStarted', label: 'GS', title: 'Games Started', format: r => nullDash(r.gamesStarted) },
  { key: 'wins', sortKey: 'wins', label: 'W', title: 'Wins' },
  { key: 'losses', sortKey: 'losses', label: 'L', title: 'Losses' },
  { key: 'overtimeLosses', sortKey: 'overtimeLosses', label: 'OTL', title: 'Overtime Losses' },
  { key: 'savePct', sortKey: 'savePct', label: 'SV%', title: 'Save %', format: r => r.savePct.toFixed(3).replace(/^0/, ''), wide: true },
  { key: 'goalsAgainstAvg', sortKey: 'goalsAgainstAvg', label: 'GAA', title: 'Goals Against Average', format: r => r.goalsAgainstAvg.toFixed(2), wide: true },
  { key: 'shotsAgainst', sortKey: 'shotsAgainst', label: 'SA', title: 'Shots Against' },
  { key: 'saves', sortKey: 'saves', label: 'SV', title: 'Saves' },
  { key: 'goalsAgainst', sortKey: 'goalsAgainst', label: 'GA', title: 'Goals Against' },
  { key: 'goals', sortKey: 'goals', label: 'G', title: 'Goals (Goalie)' },
  { key: 'assists', sortKey: 'assists', label: 'A', title: 'Assists (Goalie)' },
];

function nullDash(value: number | null | undefined, decimals?: number): string {
  if (value === null || value === undefined) return '\u2014';
  return decimals !== undefined ? value.toFixed(decimals) : value.toString();
}

function formatPlusMinus(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `\u2212${Math.abs(value)}`;
  return '0';
}

@Component({
  selector: 'app-stats-page',
  imports: [DataAsOf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-page">
      <header class="page-header">
        <h1 class="page-title">{{ data()?.season ?? '...' }} NHL Stats</h1>
        <p class="page-subtitle">
          <app-data-as-of [timestamp]="data()?.dataAsOf ?? null" />
        </p>
      </header>

      <div class="section-tabs">
        @for (tab of sections; track tab.value) {
          <button
            type="button"
            [class.active]="section() === tab.value"
            (click)="setSection(tab.value)">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (errorMessage()) {
        <div class="state-message state-error">{{ errorMessage() }}</div>
      } @else if (loading()) {
        <div class="state-message">Loading stats...</div>
      } @else {
        <div class="table-card">
          <div class="table-scroll">
            @if (isGoalieSection()) {
              <table class="stats-table">
                <thead>
                  <tr>
                    <th class="col-left col-rank-header" title="Rank">#</th>
                    <th class="col-left col-player-header" title="Player">Player</th>
                    <th class="col-left col-team-header" title="Team">Team</th>
                    @for (col of goalieColumns; track col.key) {
                      <th
                        [class.sorted]="sortColumn() === col.sortKey"
                        [class.col-stat-wide]="col.wide"
                        [title]="col.title"
                        (click)="toggleSort(col.sortKey)">
                        {{ col.label }}
                        @if (sortColumn() === col.sortKey) {
                          <span class="sort-indicator">{{ sortDir() === 'desc' ? '▼' : '▲' }}</span>
                        }
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (g of goalies(); track g.playerId; let i = $index) {
                    <tr [class.row-alt]="i % 2 === 1">
                      <td class="col-rank">{{ rankNumber(i) }}</td>
                      <td class="col-left col-player">{{ g.name }}</td>
                      <td class="col-left col-team">{{ g.teamAbbreviation }}</td>
                      @for (col of goalieColumns; track col.key) {
                        <td [class.col-stat-wide]="col.wide">
                          {{ col.format ? col.format(g) : getGoalieValue(g, col.key) }}
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <table class="stats-table">
                <thead>
                  <tr>
                    <th class="col-left col-rank-header" title="Rank">#</th>
                    <th class="col-left col-player-header" title="Player">Player</th>
                    <th class="col-left col-team-header" title="Team">Team</th>
                    <th class="col-pos-header" title="Position">Pos</th>
                    @for (col of skaterColumns; track col.key) {
                      <th
                        [class.sorted]="sortColumn() === col.sortKey"
                        [class.col-stat-wide]="col.wide"
                        [title]="col.title"
                        (click)="toggleSort(col.sortKey)">
                        {{ col.label }}
                        @if (sortColumn() === col.sortKey) {
                          <span class="sort-indicator">{{ sortDir() === 'desc' ? '▼' : '▲' }}</span>
                        }
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (p of players(); track p.playerId; let i = $index) {
                    <tr [class.row-alt]="i % 2 === 1">
                      <td class="col-rank">{{ rankNumber(i) }}</td>
                      <td class="col-left col-player">{{ p.name }}</td>
                      <td class="col-left col-team">{{ p.teamAbbreviation }}</td>
                      <td class="col-pos">{{ p.position }}</td>
                      @for (col of skaterColumns; track col.key) {
                        <td [class.col-stat-wide]="col.wide">
                          {{ col.format ? col.format(p) : getSkaterValue(p, col.key) }}
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>

        @if (pagination()) {
          <div class="pagination">
            <button
              type="button"
              [disabled]="page() <= 1"
              (click)="goToPage(page() - 1)">
              ← Prev
            </button>
            <span class="page-info">
              Page {{ page() }} of {{ pagination()!.totalPages }}
              <span class="total-count">({{ pagination()!.totalItems }} players)</span>
            </span>
            <button
              type="button"
              [disabled]="page() >= (pagination()?.totalPages ?? 1)"
              (click)="goToPage(page() + 1)">
              Next →
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .stats-page { max-width: 1400px; margin: 0 auto; padding: 28px 20px 48px; font-family: var(--font-primary); }
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 1.2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 0.78rem; color: var(--text-muted); margin: 0; min-height: 1.2em; }

    .section-tabs { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 20px; border: 1px solid var(--border-strong); border-radius: 4px; overflow: hidden; width: fit-content; }
    .section-tabs button { font: 0.74rem var(--font-primary); padding: 8px 16px; background: var(--bg-card); color: var(--text-secondary); border: none; border-right: 1px solid var(--border-default); cursor: pointer; letter-spacing: 0.02em; white-space: nowrap; }
    .section-tabs button:last-child { border-right: none; }
    .section-tabs button:hover { background: var(--bg-row-alt); color: var(--text-primary); }
    .section-tabs button.active { background: var(--text-primary); color: var(--bg-card); font-weight: 700; }

    .table-card { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 4px; overflow: hidden; }
    .table-scroll { overflow-x: auto; }

    .stats-table { width: 100%; border-collapse: collapse; font-size: 0.76rem; }
    .stats-table th { padding: 8px; text-align: right; font-weight: 700; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted); border-bottom: 2px solid var(--border-strong); cursor: pointer; user-select: none; white-space: nowrap; }
    .stats-table th:hover { background: var(--bg-row-alt); color: var(--text-primary); }
    .stats-table th.col-left { text-align: left; }
    .stats-table th.sorted { color: var(--text-primary); }
    .stats-table th.col-rank-header { width: 38px; }
    .stats-table th.col-player-header { width: 180px; }
    .stats-table th.col-team-header { width: 60px; }
    .stats-table th.col-pos-header { width: 40px; text-align: center; }
    .sort-indicator { font-size: 0.62rem; margin-left: 2px; opacity: 0.7; }

    .stats-table tbody td { padding: 6px 8px; text-align: right; border-bottom: 1px solid var(--border-default); white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--text-primary); }
    .stats-table tbody td.col-left { text-align: left; }
    .stats-table tbody td.col-rank { text-align: center; color: var(--text-muted); font-size: 0.68rem; }
    .stats-table tbody td.col-player { font-weight: 700; }
    .stats-table tbody td.col-team { font-size: 0.72rem; color: var(--text-secondary); }
    .stats-table tbody td.col-pos { text-align: center; font-size: 0.72rem; color: var(--text-secondary); }

    .stats-table tbody tr.row-alt td { background: var(--bg-row-alt); }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px 0; }
    .pagination button { font: 700 0.76rem var(--font-primary); padding: 8px 16px; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-strong); border-radius: 4px; cursor: pointer; }
    .pagination button:hover:not(:disabled) { background: var(--bg-row-alt); }
    .pagination button:disabled { opacity: 0.4; cursor: default; }
    .page-info { font-size: 0.78rem; color: var(--text-secondary); }
    .total-count { color: var(--text-muted); }

    .state-message { color: var(--text-muted); text-align: center; padding: 48px 0; font-size: 14px; }
    .state-error { color: #c44; }

    @media (max-width: 768px) {
      .section-tabs { flex-wrap: wrap; width: 100%; }
      .section-tabs button { flex: 1; min-width: 0; text-align: center; font-size: 0.68rem; padding: 8px 8px; }
    }
  `]
})
export class StatsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(StatsApiService);
  private destroyRef = inject(DestroyRef);

  readonly skaterColumns = SKATER_COLUMNS;
  readonly goalieColumns = GOALIE_COLUMNS;

  readonly sections: { value: StatsSection; label: string }[] = [
    { value: 'all-players', label: 'All Skaters' },
    { value: 'all-goalies', label: 'All Goalies' },
    { value: 'all-forwards', label: 'Forwards' },
    { value: 'all-defensemen', label: 'Defensemen' },
    { value: 'rookie-players', label: 'Rookie Skaters' },
    { value: 'rookie-goalies', label: 'Rookie Goalies' },
  ];

  leagueId = signal(DEFAULT_LEAGUE_ID);
  section = signal<StatsSection>('all-players');
  data = signal<StatsResponse | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  sortColumn = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('desc');
  page = signal(1);

  players = computed(() => this.data()?.players ?? []);
  goalies = computed(() => this.data()?.goalies ?? []);
  pagination = computed(() => this.data()?.pagination ?? null);

  isGoalieSection = computed(() =>
    this.section() === 'all-goalies' || this.section() === 'rookie-goalies'
  );

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.leagueId.set(params.get('leagueId') ?? DEFAULT_LEAGUE_ID);
      this.loadStats();
    });
  }

  setSection(section: StatsSection): void {
    if (this.section() === section) return;
    this.section.set(section);
    this.sortColumn.set(null);
    this.sortDir.set('desc');
    this.page.set(1);
    this.loadStats();
  }

  toggleSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDir.update(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortColumn.set(column);
      this.sortDir.set('desc');
    }
    this.page.set(1);
    this.loadStats();
  }

  goToPage(newPage: number): void {
    this.page.set(newPage);
    this.loadStats();
  }

  rankNumber(index: number): number {
    const p = this.pagination();
    if (!p) return index + 1;
    return (p.page - 1) * p.pageSize + index + 1;
  }

  getSkaterValue(row: SkaterStats, key: string): string {
    const val = (row as unknown as Record<string, unknown>)[key];
    if (val === null || val === undefined) return '\u2014';
    return String(val);
  }

  getGoalieValue(row: GoalieStats, key: string): string {
    const val = (row as unknown as Record<string, unknown>)[key];
    if (val === null || val === undefined) return '\u2014';
    return String(val);
  }

  private loadStats(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const sort = this.sortColumn() ?? undefined;
    this.api.getStats(
      this.leagueId(),
      this.section(),
      sort,
      this.sortDir(),
      this.page()
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load stats. Please try again.');
      }
    });
  }
}
