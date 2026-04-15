import {
  Component, inject, signal, OnInit,
  ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  GameHubApiService, GameHubResponse, GameEvent,
} from '../../../services/gamehub-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';
import { DataAsOf } from '../../shared/data-as-of/data-as-of';
import { LoadingText } from '../../shared/loading-text/loading-text';

type Tab = 'team-stats' | 'player-stats';

@Component({
  selector: 'app-game-hub-page',
  imports: [RouterLink, DataAsOf, LoadingText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hub-page">
      @if (errorMessage()) {
        <div class="state-msg state-error">{{ errorMessage() }}</div>
      } @else if (loading()) {
        <div class="state-msg"><app-loading-text label="Loading game" /></div>
      } @else if (game(); as g) {

        <!-- Game Header -->
        <div class="game-header">
          <div class="game-header__status">{{ g.status }}{{ g.isOvertime ? ' / OT' : '' }}{{ g.isShootout ? ' / SO' : '' }}</div>
          <h1 class="game-header__scoreline">
            <span class="team-block">
              @if (g.awayTeam.logoUrl) { <img [src]="g.awayTeam.logoUrl" [alt]="g.awayTeam.abbreviation" class="team-logo" /> }
              {{ g.awayTeam.abbreviation }}
            </span>
            <span class="score">{{ g.awayScore }} &ndash; {{ g.homeScore }}</span>
            <span class="team-block">
              {{ g.homeTeam.abbreviation }}
              @if (g.homeTeam.logoUrl) { <img [src]="g.homeTeam.logoUrl" [alt]="g.homeTeam.abbreviation" class="team-logo" /> }
            </span>
          </h1>
          @if (g.arena) {
            <div class="game-header__detail">{{ g.arena.name }}{{ g.arena.city ? ', ' + g.arena.city : '' }}</div>
          }
          <div class="game-header__detail"><app-data-as-of [timestamp]="g.dataAsOf" /></div>
        </div>

        <!-- Tab Bar -->
        <div class="tab-bar">
          <button [class.active]="tab() === 'team-stats'" (click)="tab.set('team-stats')">Team Stats</button>
          <button [class.active]="tab() === 'player-stats'" (click)="tab.set('player-stats')">Player Stats</button>
        </div>

        <!-- Team Stats Tab -->
        @if (tab() === 'team-stats') {
          <div class="top-row">
            <!-- Period Box Scores -->
            <div class="box-scores">
              <div class="card">
                <div class="card-title">Goals by Period</div>
                <table class="box-table">
                  <thead><tr><th class="col-left">Team</th>
                    @for (ps of g.periodScores; track ps.period) { <th>{{ ps.period }}</th> }
                    <th>Total</th>
                  </tr></thead>
                  <tbody>
                    <tr><td class="col-left bld">{{ g.awayTeam.abbreviation }}</td>
                      @for (ps of g.periodScores; track ps.period) { <td>{{ ps.awayGoals }}</td> }
                      <td class="bld">{{ g.awayScore }}</td>
                    </tr>
                    <tr><td class="col-left bld">{{ g.homeTeam.abbreviation }}</td>
                      @for (ps of g.periodScores; track ps.period) { <td>{{ ps.homeGoals }}</td> }
                      <td class="bld">{{ g.homeScore }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card">
                <div class="card-title">Shots by Period</div>
                <table class="box-table">
                  <thead><tr><th class="col-left">Team</th>
                    @for (ps of g.periodScores; track ps.period) { <th>{{ ps.period }}</th> }
                    <th>Total</th>
                  </tr></thead>
                  <tbody>
                    <tr><td class="col-left bld">{{ g.awayTeam.abbreviation }}</td>
                      @for (ps of g.periodScores; track ps.period) { <td>{{ ps.awayShots }}</td> }
                      <td class="bld">{{ totalShots(g, 'away') }}</td>
                    </tr>
                    <tr><td class="col-left bld">{{ g.homeTeam.abbreviation }}</td>
                      @for (ps of g.periodScores; track ps.period) { <td>{{ ps.homeShots }}</td> }
                      <td class="bld">{{ totalShots(g, 'home') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- Team Comparison -->
            <div class="card compare-card">
              <div class="card-title">Team Comparison</div>
              <div class="compare">
                @for (row of compareRows(g); track row.label) {
                  <div class="compare-row">
                    <span class="compare-val">{{ row.away }}</span>
                    <span class="compare-label">{{ row.label }}</span>
                    <span class="compare-val">{{ row.home }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Goals & Penalties -->
          <div class="card">
            <div class="card-title">Goals</div>
            <div class="summaries">
              <div class="summary-col">
                <div class="summary-heading">{{ g.awayTeam.name }} ({{ g.awayScore }})</div>
                @for (ev of goals(g, 'away'); track $index) {
                  <div class="summary-item">
                    <span class="ev-time">{{ periodLabel(ev.period) }} &bull; {{ ev.gameClockTime }}</span> &mdash;
                    {{ ev.description }}
                    @if (ev.isPowerPlay) { <span class="ev-tag">PPG</span> }
                    @if (ev.isShortHanded) { <span class="ev-tag">SHG</span> }
                    @if (ev.isEmptyNet) { <span class="ev-tag">EN</span> }
                  </div>
                }
                @if (goals(g, 'away').length === 0) { <div class="summary-empty">No goals</div> }
              </div>
              <div class="summary-col">
                <div class="summary-heading">{{ g.homeTeam.name }} ({{ g.homeScore }})</div>
                @for (ev of goals(g, 'home'); track $index) {
                  <div class="summary-item">
                    <span class="ev-time">{{ periodLabel(ev.period) }} &bull; {{ ev.gameClockTime }}</span> &mdash;
                    {{ ev.description }}
                    @if (ev.isPowerPlay) { <span class="ev-tag">PPG</span> }
                    @if (ev.isShortHanded) { <span class="ev-tag">SHG</span> }
                    @if (ev.isEmptyNet) { <span class="ev-tag">EN</span> }
                  </div>
                }
                @if (goals(g, 'home').length === 0) { <div class="summary-empty">No goals</div> }
              </div>
            </div>

            <hr class="divider" />

            <div class="card-title">Penalties</div>
            <div class="summaries">
              <div class="summary-col">
                <div class="summary-heading">{{ g.awayTeam.name }}</div>
                @for (ev of penalties(g, 'away'); track $index) {
                  <div class="summary-item">
                    <span class="ev-time">{{ periodLabel(ev.period) }} &bull; {{ ev.gameClockTime }}</span> &mdash;
                    {{ ev.description }}{{ ev.penaltyType ? ', ' + ev.penaltyType : '' }}
                    @if (ev.penaltyMinutes) { ({{ ev.penaltyMinutes }}:00) }
                  </div>
                }
                @if (penalties(g, 'away').length === 0) { <div class="summary-empty">No penalties</div> }
              </div>
              <div class="summary-col">
                <div class="summary-heading">{{ g.homeTeam.name }}</div>
                @for (ev of penalties(g, 'home'); track $index) {
                  <div class="summary-item">
                    <span class="ev-time">{{ periodLabel(ev.period) }} &bull; {{ ev.gameClockTime }}</span> &mdash;
                    {{ ev.description }}{{ ev.penaltyType ? ', ' + ev.penaltyType : '' }}
                    @if (ev.penaltyMinutes) { ({{ ev.penaltyMinutes }}:00) }
                  </div>
                }
                @if (penalties(g, 'home').length === 0) { <div class="summary-empty">No penalties</div> }
              </div>
            </div>
          </div>
        }

        <!-- Player Stats Tab -->
        @if (tab() === 'player-stats') {
          @for (side of ['away', 'home']; track side) {
            <div class="card">
              <div class="card-title">{{ side === 'away' ? g.awayTeam.name + ' (Away)' : g.homeTeam.name + ' (Home)' }} &mdash; Skaters</div>
              <div class="table-scroll">
                <table class="player-table">
                  <thead><tr>
                    <th class="col-num">#</th><th class="col-left">Pos</th>
                    <th>G</th><th>A</th><th>PTS</th><th>+/-</th><th>HIT</th><th>PIM</th><th>TOI</th><th>SOG</th>
                  </tr></thead>
                  <tbody>
                    @for (sk of skaters(g, side); track sk.playerId; let i = $index) {
                      <tr [class.row-alt]="i % 2 === 1">
                        <td class="col-num">{{ sk.jerseyNumber }}</td>
                        <td class="col-left">{{ sk.position }}</td>
                        <td>{{ sk.goals }}</td><td>{{ sk.assists }}</td><td class="bld">{{ sk.points }}</td>
                        <td [class.pos]="sk.plusMinus > 0" [class.neg]="sk.plusMinus < 0">{{ formatPM(sk.plusMinus) }}</td>
                        <td>{{ sk.hits }}</td><td>{{ sk.penaltyMinutes }}</td><td>{{ sk.timeOnIce }}</td><td>{{ sk.shots }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <div class="card-title">{{ side === 'away' ? g.awayTeam.name : g.homeTeam.name }} &mdash; Goalies</div>
              <div class="table-scroll">
                <table class="player-table">
                  <thead><tr>
                    <th class="col-num">#</th>
                    <th>SA</th><th>SV</th><th>SV%</th><th>TOI</th>
                  </tr></thead>
                  <tbody>
                    @for (gl of goalies(g, side); track gl.playerId) {
                      <tr>
                        <td class="col-num">{{ gl.jerseyNumber }}</td>
                        <td>{{ gl.shotsAgainst }}</td><td>{{ gl.saves }}</td>
                        <td>{{ gl.savePct.toFixed(3).replace('0.', '.') }}</td><td>{{ gl.timeOnIce }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        }

        <a [routerLink]="['/', leagueId(), 'scores']" class="back-link">&larr; Back to Scores</a>
      }
    </div>
  `,
  styles: [`
    .hub-page { max-width: 1100px; margin: 0 auto; padding: 28px 20px 48px; font-family: var(--font-primary); }

    .game-header { text-align: center; margin-bottom: 20px; }
    .game-header__status { font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
    .game-header__scoreline { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin: 4px 0; display: flex; align-items: center; justify-content: center; gap: 12px; }
    .game-header__detail { font-size: 0.76rem; color: var(--text-muted); }
    .team-block { display: flex; align-items: center; gap: 6px; }
    .team-logo { width: 32px; height: 32px; object-fit: contain; }
    .score { font-variant-numeric: tabular-nums; }

    .tab-bar { display: flex; gap: 0; margin-bottom: 20px; border: 1px solid var(--border-strong); border-radius: 4px; overflow: hidden; width: fit-content; }
    .tab-bar button { font: 0.78rem var(--font-primary); padding: 8px 20px; background: var(--bg-card); color: var(--text-secondary); border: none; border-right: 1px solid var(--border-default); cursor: pointer; }
    .tab-bar button:last-child { border-right: none; }
    .tab-bar button:hover { background: var(--bg-row-alt); }
    .tab-bar button.active { background: var(--text-primary); color: var(--bg-card); font-weight: 700; }

    .top-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .box-scores { display: flex; flex-direction: column; gap: 12px; }
    .card { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 4px; padding: 14px 16px; margin-bottom: 12px; }
    .compare-card { margin-bottom: 0; }
    .card-title { font: 700 0.82rem var(--font-primary); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-primary); margin-bottom: 10px; }

    .box-table { width: 100%; border-collapse: collapse; font-size: 0.76rem; }
    .box-table th, .box-table td { padding: 5px 8px; text-align: center; border-bottom: 1px solid var(--border-default); }
    .box-table th { font: 700 0.68rem var(--font-primary); text-transform: uppercase; color: var(--text-muted); }
    .box-table th.col-left, .box-table td.col-left { text-align: left; }
    .bld { font-weight: 700; }

    .compare { display: flex; flex-direction: column; gap: 0; }
    .compare-row { display: flex; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--border-default); }
    .compare-row:last-child { border-bottom: none; }
    .compare-val { flex: 1; text-align: center; font: 700 0.82rem var(--font-primary); color: var(--text-primary); font-variant-numeric: tabular-nums; }
    .compare-label { flex: 1.2; text-align: center; font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; }

    .summaries { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .summary-heading { font: 700 0.78rem var(--font-primary); margin-bottom: 8px; color: var(--text-primary); }
    .summary-item { font-size: 0.76rem; color: var(--text-secondary); padding: 4px 0; line-height: 1.5; }
    .summary-empty { font-size: 0.76rem; color: var(--text-muted); }
    .ev-time { color: var(--text-muted); }
    .ev-tag { font-size: 0.62rem; background: var(--border-default); padding: 1px 4px; border-radius: 2px; margin-left: 4px; vertical-align: middle; color: var(--text-muted); }
    .divider { border: none; border-top: 2px solid var(--border-strong); margin: 16px 0; }

    .table-scroll { overflow-x: auto; }
    .player-table { width: 100%; border-collapse: collapse; font-size: 0.76rem; }
    .player-table th { padding: 6px 8px; text-align: right; font: 700 0.68rem var(--font-primary); text-transform: uppercase; color: var(--text-muted); border-bottom: 2px solid var(--border-strong); white-space: nowrap; }
    .player-table td { padding: 5px 8px; text-align: right; border-bottom: 1px solid var(--border-default); font-variant-numeric: tabular-nums; color: var(--text-primary); }
    .player-table th.col-left, .player-table td.col-left { text-align: left; }
    .player-table th.col-num, .player-table td.col-num { text-align: center; width: 36px; color: var(--text-muted); font-weight: 700; }
    .player-table tr.row-alt td { background: var(--bg-row-alt); }
    .pos { color: #2E7D32; }
    .neg { color: #C62828; }

    .back-link { font-size: 0.82rem; color: var(--color-link); }
    .state-msg { color: var(--text-muted); text-align: center; padding: 48px 0; font-size: 14px; }
    .state-error { color: #c44; }

    @media (max-width: 900px) {
      .top-row { grid-template-columns: 1fr; }
      .summaries { grid-template-columns: 1fr; }
    }
  `]
})
export class GameHubPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(GameHubApiService);
  private destroyRef = inject(DestroyRef);

  leagueId = signal(DEFAULT_LEAGUE_ID);
  game = signal<GameHubResponse | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  tab = signal<Tab>('team-stats');

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.leagueId.set(params.get('leagueId') ?? DEFAULT_LEAGUE_ID);
      const gameId = Number(params.get('gameId'));
      if (gameId) this.loadGame(gameId);
    });
  }

  private loadGame(gameId: number): void {
    this.loading.set(true);
    this.api.getGameHub(gameId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: g => { this.game.set(g); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorMessage.set('Unable to load game data.'); }
    });
  }

  totalShots(g: GameHubResponse, side: string): number {
    return g.periodScores.reduce((sum, p) => sum + (side === 'home' ? p.homeShots : p.awayShots), 0);
  }

  compareRows(g: GameHubResponse): { label: string; home: string; away: string }[] {
    const s = g.teamStats;
    return [
      { label: 'Shots on Goal', away: s.shotsOnGoal.away.toString(), home: s.shotsOnGoal.home.toString() },
      { label: 'Hits', away: s.hits.away.toString(), home: s.hits.home.toString() },
      { label: 'Power Play', away: s.powerPlay.away, home: s.powerPlay.home },
      { label: 'Faceoffs', away: s.faceoffPct.away.toFixed(1) + '%', home: s.faceoffPct.home.toFixed(1) + '%' },
      { label: 'Giveaways', away: s.giveaways.away.toString(), home: s.giveaways.home.toString() },
      { label: 'Takeaways', away: s.takeaways.away.toString(), home: s.takeaways.home.toString() },
    ];
  }

  goals(g: GameHubResponse, side: string): GameEvent[] {
    const abbr = side === 'home' ? g.homeTeam.abbreviation : g.awayTeam.abbreviation;
    return g.events.filter(e => e.eventType === 'Goal' && e.teamAbbreviation === abbr);
  }

  penalties(g: GameHubResponse, side: string): GameEvent[] {
    const abbr = side === 'home' ? g.homeTeam.abbreviation : g.awayTeam.abbreviation;
    return g.events.filter(e => e.eventType === 'Penalty' && e.teamAbbreviation === abbr);
  }

  skaters(g: GameHubResponse, side: string) {
    return side === 'home' ? g.playerStats.home.skaters : g.playerStats.away.skaters;
  }

  goalies(g: GameHubResponse, side: string) {
    return side === 'home' ? g.playerStats.home.goalies : g.playerStats.away.goalies;
  }

  periodLabel(period: number): string {
    if (period <= 3) return period === 1 ? '1st' : period === 2 ? '2nd' : '3rd';
    if (period === 4) return 'OT';
    return `${period - 3}OT`;
  }

  formatPM(v: number): string {
    return v > 0 ? `+${v}` : v.toString();
  }
}
