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
import { NgTemplateOutlet } from '@angular/common';
import {
  StandingsApiService,
  StandingsResponse,
  StandingsGroup,
  StandingsTeam,
  StandingsView,
} from '../../../services/standings-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';

type SortColumn =
  | 'gamesPlayed'
  | 'wins'
  | 'losses'
  | 'overtimeLosses'
  | 'points'
  | 'pointsPct'
  | 'regulationWins'
  | 'regulationPlusOTWins'
  | 'goalsFor'
  | 'goalsAgainst'
  | 'goalDifferential'
  | 'powerPlayPct'
  | 'penaltyKillPct'
  | 'faceoffPct';

interface ColumnDef {
  key: SortColumn;
  label: string;
  title: string;
  wide?: boolean;
}

const COLUMNS: readonly ColumnDef[] = [
  { key: 'gamesPlayed', label: 'GP', title: 'Games Played' },
  { key: 'wins', label: 'W', title: 'Wins' },
  { key: 'losses', label: 'L', title: 'Losses' },
  { key: 'overtimeLosses', label: 'OTL', title: 'Overtime Losses' },
  { key: 'points', label: 'PTS', title: 'Points' },
  { key: 'pointsPct', label: 'PTS%', title: 'Points Percentage', wide: true },
  { key: 'regulationWins', label: 'RW', title: 'Regulation Wins' },
  { key: 'regulationPlusOTWins', label: 'ROW', title: 'Regulation + Overtime Wins' },
  { key: 'goalsFor', label: 'GF', title: 'Goals For' },
  { key: 'goalsAgainst', label: 'GA', title: 'Goals Against' },
  { key: 'goalDifferential', label: 'DIFF', title: 'Goal Differential' },
  { key: 'powerPlayPct', label: 'PP%', title: 'Power Play %', wide: true },
  { key: 'penaltyKillPct', label: 'PK%', title: 'Penalty Kill %', wide: true },
  { key: 'faceoffPct', label: 'FO%', title: 'Faceoff Win %', wide: true },
];

@Component({
  selector: 'app-standings-page',
  imports: [NgTemplateOutlet, DataAsOf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="standings-page">
      <header class="page-header">
        <h1 class="page-title">{{ data()?.season ?? '...' }} NHL Standings</h1>
        <p class="page-subtitle">
          <app-data-as-of [timestamp]="data()?.dataAsOf ?? null" />
        </p>
      </header>

      <div class="view-toggle">
        @for (v of views; track v.value) {
          <button
            type="button"
            [class.active]="view() === v.value"
            (click)="setView(v.value)">
            {{ v.label }}
          </button>
        }
      </div>

      @if (errorMessage()) {
        <div class="state-message state-error">{{ errorMessage() }}</div>
      } @else if (loading()) {
        <div class="state-message">Loading standings...</div>
      } @else if (view() === 'league') {
        <section class="conference single">
          <div class="card-header">League</div>
          <div class="table-scroll">
            <ng-container [ngTemplateOutlet]="tableTpl" [ngTemplateOutletContext]="{ groups: leagueGroups() }" />
          </div>
        </section>
      } @else {
        <div class="conference-tabs">
          <button
            type="button"
            [class.tab-active]="activeConference() === 'Eastern'"
            (click)="activeConference.set('Eastern')">
            Eastern Conference
          </button>
          <button
            type="button"
            [class.tab-active]="activeConference() === 'Western'"
            (click)="activeConference.set('Western')">
            Western Conference
          </button>
        </div>

        <div class="conferences">
          <section
            class="conference east"
            [class.active]="activeConference() === 'Eastern'">
            <div class="card-header">
              Eastern Conference
              <span class="card-header-meta">{{ headerMeta() }}</span>
            </div>
            <div class="table-scroll">
              <ng-container [ngTemplateOutlet]="tableTpl" [ngTemplateOutletContext]="{ groups: easternGroups() }" />
            </div>
          </section>

          <section
            class="conference west"
            [class.active]="activeConference() === 'Western'">
            <div class="card-header">
              Western Conference
              <span class="card-header-meta">{{ headerMeta() }}</span>
            </div>
            <div class="table-scroll">
              <ng-container [ngTemplateOutlet]="tableTpl" [ngTemplateOutletContext]="{ groups: westernGroups() }" />
            </div>
          </section>
        </div>
      }
    </div>

    <ng-template #tableTpl let-groups="groups">
      <table class="standings-table">
        <thead>
          <tr>
            <th
              class="col-left col-rank-header"
              [class.sorted]="sortColumn() === null"
              title="Rank — click to reset to default order"
              (click)="resetSort()">#</th>
            <th class="col-left col-team-header" title="Team">Team</th>
            @for (col of columns; track col.key) {
              <th
                [class.sorted]="sortColumn() === col.key"
                [class.col-stat-wide]="col.wide"
                [title]="col.title"
                (click)="toggleSort(col.key)">
                {{ col.label }}
                @if (sortColumn() === col.key) {
                  <span class="sort-indicator">{{ sortDir() === 'desc' ? '▼' : '▲' }}</span>
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (group of groups; track group.label) {
            <tr class="group-header">
              <td [attr.colspan]="columns.length + 2">{{ group.label }}</td>
            </tr>
            @for (team of sortedTeams(group); track team.teamId; let i = $index) {
              <tr
                [class.row-alt]="i % 2 === 1"
                [class.row-eliminated]="isEliminated(group, team)"
                [class.wc-divider]="isCutLine(group, team, i)">
                <td class="col-rank">{{ rankDisplay(group, team, i) }}</td>
                <td class="col-left col-team">{{ team.name }}</td>
                <td>{{ team.gamesPlayed }}</td>
                <td>{{ team.wins }}</td>
                <td>{{ team.losses }}</td>
                <td>{{ team.overtimeLosses }}</td>
                <td class="col-pts">{{ team.points }}</td>
                <td>{{ formatPct(team.pointsPct) }}</td>
                <td>{{ team.regulationWins }}</td>
                <td>{{ team.regulationPlusOTWins }}</td>
                <td>{{ team.goalsFor }}</td>
                <td>{{ team.goalsAgainst }}</td>
                <td [class.col-diff-pos]="team.goalDifferential > 0" [class.col-diff-neg]="team.goalDifferential < 0">
                  {{ formatDiff(team.goalDifferential) }}
                </td>
                <td>{{ formatPercent1(team.powerPlayPct) }}</td>
                <td>{{ formatPercent1(team.penaltyKillPct) }}</td>
                <td>{{ team.faceoffPct !== null ? formatPercent1(team.faceoffPct) : '—' }}</td>
              </tr>
            }
          }
        </tbody>
      </table>
    </ng-template>
  `,
  styles: [`
    .standings-page { max-width: 1400px; margin: 0 auto; padding: 28px 20px 48px; font-family: var(--font-primary); }
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 1.2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 0.78rem; color: var(--text-muted); margin: 0; min-height: 1.2em; }

    .view-toggle { display: flex; margin-bottom: 20px; border: 1px solid var(--border-strong); border-radius: 4px; overflow: hidden; width: fit-content; }
    .view-toggle button { font: 0.76rem var(--font-primary); padding: 8px 18px; background: var(--bg-card); color: var(--text-secondary); border: none; border-right: 1px solid var(--border-default); cursor: pointer; letter-spacing: 0.02em; }
    .view-toggle button:last-child { border-right: none; }
    .view-toggle button:hover { background: var(--bg-row-alt); color: var(--text-primary); }
    .view-toggle button.active { background: var(--text-primary); color: var(--bg-card); font-weight: 700; }

    .conference-tabs { display: none; }
    .conference-tabs button { font: 700 0.82rem var(--font-primary); text-transform: uppercase; letter-spacing: 0.06em; padding: 12px 24px; background: var(--bg-row-alt); color: var(--text-muted); border: 1px solid var(--border-default); border-bottom: none; border-radius: 4px 4px 0 0; cursor: pointer; margin-right: -1px; }
    .conference-tabs button:hover { color: var(--text-primary); }
    .conference-tabs button.tab-active { background: var(--bg-card); color: var(--text-primary); border-bottom: 1px solid var(--bg-card); position: relative; z-index: 1; }

    .conferences { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .conference { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 4px; overflow: hidden; }
    .conference.single { grid-column: 1 / -1; }
    .card-header { padding: 12px 16px 10px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border-default); display: flex; align-items: center; justify-content: space-between; color: var(--text-primary); }
    .card-header-meta { font-size: 0.68rem; color: var(--text-muted); font-weight: 400; letter-spacing: 0.04em; }
    .table-scroll { overflow-x: auto; }

    .standings-table { width: 100%; border-collapse: collapse; font-size: 0.76rem; }
    .standings-table th { padding: 8px; text-align: right; font-weight: 700; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted); border-bottom: 2px solid var(--border-strong); cursor: pointer; user-select: none; white-space: nowrap; }
    .standings-table th:hover { background: var(--bg-row-alt); color: var(--text-primary); }
    .standings-table th.col-left { text-align: left; }
    .standings-table th.sorted { color: var(--text-primary); }
    .standings-table th.col-rank-header { width: 38px; }
    .standings-table th.col-team-header { width: 180px; }
    .sort-indicator { font-size: 0.62rem; margin-left: 2px; opacity: 0.7; }

    .group-header td { background: var(--bg-row-alt); font: 700 0.72rem var(--font-primary); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); padding: 8px 10px; border-top: 2px solid var(--border-strong); }

    .standings-table tbody td { padding: 6px 8px; text-align: right; border-bottom: 1px solid var(--border-default); white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--text-primary); }
    .standings-table tbody td.col-left { text-align: left; }
    .standings-table tbody td.col-rank { text-align: center; color: var(--text-muted); font-size: 0.68rem; }
    .standings-table tbody td.col-team, .standings-table tbody td.col-pts { font-weight: 700; }
    .standings-table tbody td.col-diff-pos { color: #2E7D32; }
    .standings-table tbody td.col-diff-neg { color: #C62828; }

    .standings-table tbody tr.row-alt td { background: var(--bg-row-alt); }
    .standings-table tbody tr.row-eliminated td { opacity: 0.6; }
    .standings-table tbody tr.wc-divider td { border-top: 2px dashed var(--border-strong); }

    .state-message { color: var(--text-muted); text-align: center; padding: 48px 0; font-size: 14px; }
    .state-error { color: #c44; }

    @media (max-width: 1199px) {
      .conferences { grid-template-columns: 1fr; }
      .conference { display: none; }
      .conference.active, .conference.single { display: block; }
      .conference-tabs { display: flex; }
      .card-header { display: none; }
    }
  `]
})
export class StandingsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(StandingsApiService);
  private destroyRef = inject(DestroyRef);

  readonly columns = COLUMNS;
  readonly views: { value: StandingsView; label: string }[] = [
    { value: 'wildcard', label: 'Wild Card' },
    { value: 'division', label: 'Division' },
    { value: 'conference', label: 'Conference' },
    { value: 'league', label: 'League' },
  ];

  leagueId = signal(DEFAULT_LEAGUE_ID);
  view = signal<StandingsView>('wildcard');
  data = signal<StandingsResponse | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  activeConference = signal<'Eastern' | 'Western'>('Eastern');
  sortColumn = signal<SortColumn | null>(null);
  sortDir = signal<'asc' | 'desc'>('desc');

  easternGroups = computed(() =>
    (this.data()?.groups ?? []).filter(g => g.conference === 'Eastern')
  );
  westernGroups = computed(() =>
    (this.data()?.groups ?? []).filter(g => g.conference === 'Western')
  );
  leagueGroups = computed(() => this.data()?.groups ?? []);

  headerMeta = computed(() => {
    switch (this.view()) {
      case 'wildcard': return 'Wild Card Format';
      case 'division': return 'Division Format';
      case 'conference': return 'Conference Format';
      default: return '';
    }
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.leagueId.set(params.get('leagueId') ?? DEFAULT_LEAGUE_ID);
      this.loadStandings();
    });
  }

  setView(view: StandingsView): void {
    if (this.view() === view) return;
    this.view.set(view);
    this.loadStandings();
  }

  loadStandings(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.getStandings(this.leagueId(), this.view()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load standings. Please try again.');
      }
    });
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDir.update(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortColumn.set(column);
      this.sortDir.set('desc');
    }
  }

  resetSort(): void {
    this.sortColumn.set(null);
    this.sortDir.set('desc');
  }

  sortedTeams(group: StandingsGroup): StandingsTeam[] {
    const col = this.sortColumn();
    if (col === null) return group.teams;

    const dir = this.sortDir();
    const multiplier = dir === 'desc' ? -1 : 1;

    return [...group.teams].sort((a, b) => {
      const av = a[col] ?? Number.NEGATIVE_INFINITY;
      const bv = b[col] ?? Number.NEGATIVE_INFINITY;
      if (av < bv) return -1 * multiplier;
      if (av > bv) return 1 * multiplier;
      return 0;
    });
  }

  /** Wild card group teams whose wildCardRank is null are out of playoff position. */
  isEliminated(group: StandingsGroup, team: StandingsTeam): boolean {
    return group.label.endsWith('Wild Card') && team.wildCardRank === null;
  }

  /**
   * The cut line is the dashed border between the last qualifying wild card team
   * (WC2) and the first eliminated team — only meaningful in default sort order.
   */
  isCutLine(group: StandingsGroup, team: StandingsTeam, index: number): boolean {
    if (this.sortColumn() !== null) return false;
    if (!group.label.endsWith('Wild Card')) return false;
    if (team.wildCardRank !== null) return false;
    // First eliminated team is the one immediately after WC2.
    const teams = group.teams;
    return index > 0 && teams[index - 1].wildCardRank === 2;
  }

  rankDisplay(group: StandingsGroup, team: StandingsTeam, index: number): string {
    // Custom sort: positional within current order, no playoff semantics.
    if (this.sortColumn() !== null) return (index + 1).toString();

    // Default order — wild card group has special WC1/WC2 labels for qualifiers.
    if (group.label.endsWith('Wild Card')) {
      if (team.wildCardRank !== null) return `WC${team.wildCardRank}`;
      return team.conferenceRank.toString();
    }
    if (group.label.endsWith('Division')) return team.divisionRank.toString();
    if (group.label.endsWith('Conference')) return team.conferenceRank.toString();
    return team.leagueRank.toString();
  }

  formatPct(value: number): string {
    // PointsPct as ".654" — drop the leading zero, 3 decimals.
    return value.toFixed(3).replace(/^0/, '');
  }

  formatPercent1(value: number): string {
    return value.toFixed(1);
  }

  formatDiff(value: number): string {
    if (value > 0) return `+${value}`;
    if (value < 0) return `−${Math.abs(value)}`;
    return '0';
  }

}
