import { Component, input, output, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ScoreGame, ScoresApiService, ExpandedScore } from '../../../services/scores-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';

@Component({
  selector: 'app-expanded-score-box',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="expanded">
      <div class="expanded__header">
        <div class="expanded__teams">
          @if (game().awayTeam.logoUrl) {
            <img [src]="game().awayTeam.logoUrl" [alt]="game().awayTeam.abbreviation" class="expanded__logo">
          }
          <span class="expanded__abbrev">{{ game().awayTeam.abbreviation }}</span>
          <span class="expanded__score">{{ game().awayTeam.score }}</span>
          <span class="expanded__dash">&ndash;</span>
          <span class="expanded__score">{{ game().homeTeam.score }}</span>
          <span class="expanded__abbrev">{{ game().homeTeam.abbreviation }}</span>
          @if (game().homeTeam.logoUrl) {
            <img [src]="game().homeTeam.logoUrl" [alt]="game().homeTeam.abbreviation" class="expanded__logo">
          }
        </div>
        <button class="expanded__close" (click)="collapse.emit()" aria-label="Collapse">&times;</button>
      </div>

      @if (error()) {
        <div class="expanded__loading">Failed to load details.</div>
      } @else if (data()) {
        <!-- Box scores (stacked) + Stats (right) -->
        <div class="expanded__main-row">
          <div class="expanded__box-scores">
            <!-- Goals box score -->
            <div class="expanded__box">
              <div class="expanded__box-title">Goals</div>
              <table class="expanded__table">
                <thead>
                  <tr>
                    <th></th>
                    @for (ps of data()!.periodScores; track ps.period) {
                      <th>{{ ps.period }}</th>
                    }
                    <th>T</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="expanded__team-cell">{{ game().awayTeam.abbreviation }}</td>
                    @for (ps of data()!.periodScores; track ps.period) {
                      <td>{{ ps.awayGoals }}</td>
                    }
                    <td class="expanded__total">{{ game().awayTeam.score }}</td>
                  </tr>
                  <tr>
                    <td class="expanded__team-cell">{{ game().homeTeam.abbreviation }}</td>
                    @for (ps of data()!.periodScores; track ps.period) {
                      <td>{{ ps.homeGoals }}</td>
                    }
                    <td class="expanded__total">{{ game().homeTeam.score }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Shots box score (stacked below goals) -->
            <div class="expanded__box">
              <div class="expanded__box-title">Shots on Goal</div>
              <table class="expanded__table">
                <thead>
                  <tr>
                    <th></th>
                    @for (ps of data()!.periodScores; track ps.period) {
                      <th>{{ ps.period }}</th>
                    }
                    <th>T</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="expanded__team-cell">{{ game().awayTeam.abbreviation }}</td>
                    @for (ps of data()!.periodScores; track ps.period) {
                      <td>{{ ps.awayShots }}</td>
                    }
                    <td class="expanded__total">{{ game().awayTeam.shotsOnGoal ?? '-' }}</td>
                  </tr>
                  <tr>
                    <td class="expanded__team-cell">{{ game().homeTeam.abbreviation }}</td>
                    @for (ps of data()!.periodScores; track ps.period) {
                      <td>{{ ps.homeShots }}</td>
                    }
                    <td class="expanded__total">{{ game().homeTeam.shotsOnGoal ?? '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Stats + H2H (right of box scores) -->
          <div class="expanded__stats-h2h">
          <!-- Condensed stats table (half width) -->
          <div class="expanded__stats-compact">
            <div class="expanded__stat-row">
              <span class="expanded__stat-away">{{ data()!.stats.awayPowerPlay }}</span>
              <span class="expanded__stat-label">PP</span>
              <span class="expanded__stat-home">{{ data()!.stats.homePowerPlay }}</span>
            </div>
            <div class="expanded__stat-row">
              <span class="expanded__stat-away">{{ data()!.stats.awayHits }}</span>
              <span class="expanded__stat-label">HIT</span>
              <span class="expanded__stat-home">{{ data()!.stats.homeHits }}</span>
            </div>
            <div class="expanded__stat-row">
              <span class="expanded__stat-away">{{ data()!.stats.awayFaceoffPct }}%</span>
              <span class="expanded__stat-label">FO%</span>
              <span class="expanded__stat-home">{{ data()!.stats.homeFaceoffPct }}%</span>
            </div>
            <div class="expanded__stat-row">
              <span class="expanded__stat-away">{{ data()!.stats.awayTakeaways }}</span>
              <span class="expanded__stat-label">TK</span>
              <span class="expanded__stat-home">{{ data()!.stats.homeTakeaways }}</span>
            </div>
            <div class="expanded__stat-row">
              <span class="expanded__stat-away">{{ data()!.stats.awayGiveaways }}</span>
              <span class="expanded__stat-label">GV</span>
              <span class="expanded__stat-home">{{ data()!.stats.homeGiveaways }}</span>
            </div>
            <div class="expanded__stat-row">
              <span class="expanded__stat-away">{{ data()!.stats.awayTimeOfPossession }}</span>
              <span class="expanded__stat-label">TOP</span>
              <span class="expanded__stat-home">{{ data()!.stats.homeTimeOfPossession }}</span>
            </div>
          </div>

          <!-- H2H tables (adjacent) -->
          @if (data()!.headToHead) {
            <div class="expanded__h2h">
              <table class="expanded__h2h-table">
                <caption>Season H2H</caption>
                <thead><tr><th></th><th>W</th><th>OTW</th><th>SOW</th></tr></thead>
                <tbody>
                  <tr>
                    <td class="expanded__h2h-team">{{ game().awayTeam.abbreviation }}</td>
                    <td>{{ data()!.headToHead!.currentSeason.away.wins }}</td>
                    <td>{{ data()!.headToHead!.currentSeason.away.overtimeWins }}</td>
                    <td>{{ data()!.headToHead!.currentSeason.away.shootoutWins }}</td>
                  </tr>
                  <tr>
                    <td class="expanded__h2h-team">{{ game().homeTeam.abbreviation }}</td>
                    <td>{{ data()!.headToHead!.currentSeason.home.wins }}</td>
                    <td>{{ data()!.headToHead!.currentSeason.home.overtimeWins }}</td>
                    <td>{{ data()!.headToHead!.currentSeason.home.shootoutWins }}</td>
                  </tr>
                </tbody>
              </table>
              <table class="expanded__h2h-table">
                <caption>All-Time H2H</caption>
                <thead><tr><th></th><th>W</th><th>OTW</th><th>SOW</th><th>T</th></tr></thead>
                <tbody>
                  <tr>
                    <td class="expanded__h2h-team">{{ game().awayTeam.abbreviation }}</td>
                    <td>{{ data()!.headToHead!.allTime.away.wins }}</td>
                    <td>{{ data()!.headToHead!.allTime.away.overtimeWins }}</td>
                    <td>{{ data()!.headToHead!.allTime.away.shootoutWins }}</td>
                    <td>{{ data()!.headToHead!.allTime.away.ties }}</td>
                  </tr>
                  <tr>
                    <td class="expanded__h2h-team">{{ game().homeTeam.abbreviation }}</td>
                    <td>{{ data()!.headToHead!.allTime.home.wins }}</td>
                    <td>{{ data()!.headToHead!.allTime.home.overtimeWins }}</td>
                    <td>{{ data()!.headToHead!.allTime.home.shootoutWins }}</td>
                    <td>{{ data()!.headToHead!.allTime.home.ties }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
          </div>
        </div>

        <!-- Goal summaries -->
        @if (data()!.goalSummaries.away.length > 0 || data()!.goalSummaries.home.length > 0) {
          <div class="expanded__summaries">
            <div class="expanded__summary-col">
              @for (goal of data()!.goalSummaries.away; track goal.displayTime) {
                <div class="expanded__goal">
                  <span class="expanded__goal-time">{{ goal.displayTime }}</span>
                  <span class="expanded__goal-scorer">{{ goal.scorer.name }} ({{ goal.scorer.goalNumber }})</span>
                  @if (goal.isPowerPlay) { <span class="expanded__pp-badge">PP</span> }
                </div>
              }
            </div>
            <div class="expanded__summary-col">
              @for (goal of data()!.goalSummaries.home; track goal.displayTime) {
                <div class="expanded__goal">
                  <span class="expanded__goal-time">{{ goal.displayTime }}</span>
                  <span class="expanded__goal-scorer">{{ goal.scorer.name }} ({{ goal.scorer.goalNumber }})</span>
                  @if (goal.isPowerPlay) { <span class="expanded__pp-badge">PP</span> }
                </div>
              }
            </div>
          </div>
        }

        <!-- Penalty summaries -->
        @if (data()!.penaltySummaries.away.length > 0 || data()!.penaltySummaries.home.length > 0) {
          <div class="expanded__summaries">
            <div class="expanded__summary-col">
              @for (pen of data()!.penaltySummaries.away; track pen.displayTime) {
                <div class="expanded__penalty">
                  <span class="expanded__pen-time">{{ pen.displayTime }}</span>
                  <span>{{ pen.player.name }} - {{ pen.penaltyType }} ({{ pen.penaltyMinutes }}min)</span>
                </div>
              }
            </div>
            <div class="expanded__summary-col">
              @for (pen of data()!.penaltySummaries.home; track pen.displayTime) {
                <div class="expanded__penalty">
                  <span class="expanded__pen-time">{{ pen.displayTime }}</span>
                  <span>{{ pen.player.name }} - {{ pen.penaltyType }} ({{ pen.penaltyMinutes }}min)</span>
                </div>
              }
            </div>
          </div>
        }
      } @else {
        <div class="expanded__loading">Loading details...</div>
      }

      <a class="expanded__hub" [routerLink]="['/', leagueId(), 'game-hub', game().id]">
        View Full Game Hub &rarr;
      </a>
    </div>
  `,
  styles: [`
    .expanded {
      background: var(--bg-card);
      border: 1px solid var(--border-strong);
      border-radius: 6px;
      padding: 16px;
      font-family: var(--font-primary);
    }
    .expanded__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .expanded__teams {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .expanded__logo { width: 28px; height: 28px; object-fit: contain; }
    .expanded__abbrev { font-weight: 700; font-size: 16px; color: var(--text-primary); }
    .expanded__score { font-weight: 700; font-size: 22px; color: var(--text-primary); }
    .expanded__dash { color: var(--text-muted); font-size: 18px; }
    .expanded__close {
      background: none;
      border: none;
      font-size: 22px;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0 4px;
    }
    .expanded__close:hover { color: var(--text-primary); }
    .expanded__main-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 12px;
    }
    .expanded__box-scores {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .expanded__box-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .expanded__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .expanded__table th, .expanded__table td {
      padding: 3px 6px;
      text-align: center;
      color: var(--text-primary);
    }
    .expanded__table th {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 700;
      border-bottom: 1px solid var(--border-default);
    }
    .expanded__team-cell { text-align: left; font-weight: 700; font-size: 11px; }
    .expanded__total { font-weight: 700; }
    .expanded__stats-h2h {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .expanded__stats-compact {}
    .expanded__stat-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 6px;
      text-align: center;
      padding: 2px 0;
      font-size: 11px;
    }
    .expanded__stat-away { text-align: right; color: var(--text-primary); }
    .expanded__stat-label {
      font-weight: 700;
      color: var(--text-muted);
      font-size: 9px;
      min-width: 28px;
    }
    .expanded__stat-home { text-align: left; color: var(--text-primary); }
    .expanded__h2h { display: flex; flex-direction: column; gap: 6px; }
    .expanded__h2h-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .expanded__h2h-table caption {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: var(--text-muted); text-align: left;
      padding-bottom: 2px;
    }
    .expanded__h2h-table th {
      font-size: 9px; font-weight: 700; color: var(--text-muted);
      text-align: center; padding: 2px 4px;
      border-bottom: 1px solid var(--border-default);
    }
    .expanded__h2h-table th:first-child { text-align: left; }
    .expanded__h2h-table td {
      text-align: center; padding: 2px 4px;
      border-bottom: 1px solid var(--border-default);
      color: var(--text-secondary);
    }
    .expanded__h2h-team { text-align: left !important; font-weight: 700; color: var(--text-primary) !important; }
    .expanded__summaries {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      border-top: 1px solid var(--border-default);
      padding-top: 10px;
      margin-bottom: 10px;
    }
    .expanded__goal, .expanded__penalty {
      font-size: 11px;
      color: var(--text-secondary);
      padding: 2px 0;
    }
    .expanded__goal-time, .expanded__pen-time {
      color: var(--text-muted);
      font-size: 10px;
      margin-right: 4px;
    }
    .expanded__goal-scorer { font-weight: 700; color: var(--text-primary); }
    .expanded__pp-badge {
      font-size: 9px;
      font-weight: 700;
      color: var(--color-pending);
      margin-left: 4px;
    }
    .expanded__loading {
      text-align: center;
      color: var(--text-muted);
      padding: 20px;
      font-size: 12px;
    }
    .expanded__hub {
      display: block;
      text-align: center;
      color: var(--color-link);
      text-decoration: none;
      font-size: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--border-default);
    }
    .expanded__hub:hover { text-decoration: underline; }
  `]
})
export class ExpandedScoreBox implements OnInit {
  game = input.required<ScoreGame>();
  leagueId = input<string>(DEFAULT_LEAGUE_ID);
  collapse = output<void>();

  private scoresApi = inject(ScoresApiService);
  private destroyRef = inject(DestroyRef);
  data = signal<ExpandedScore | null>(null);
  error = signal(false);

  ngOnInit(): void {
    this.scoresApi.getExpandedScore(this.leagueId(), this.game().id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.data.set(data),
      error: () => this.error.set(true)
    });
  }
}
