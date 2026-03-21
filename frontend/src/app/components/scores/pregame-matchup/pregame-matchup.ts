import { Component, input, output, inject, signal, OnInit } from '@angular/core';
import { ScoreGame, ScoresApiService, PregameMatchup as PregameData } from '../../../services/scores-api.service';

@Component({
  selector: 'app-pregame-matchup',
  template: `
    <div class="pregame">
      <div class="pregame__header">
        <div class="pregame__teams">
          <span class="pregame__abbrev">{{ game().awayTeam.abbreviation }}</span>
          <span class="pregame__vs">vs</span>
          <span class="pregame__abbrev">{{ game().homeTeam.abbreviation }}</span>
          <span class="pregame__time">{{ game().scheduledStartLocal }}</span>
        </div>
        <button class="pregame__close" (click)="collapse.emit()" aria-label="Collapse">&times;</button>
      </div>

      @if (data()) {
        <div class="pregame__content">
          <!-- Starting goalies + team leaders side by side -->
          <div class="pregame__section">
            <div class="pregame__players-grid">
              <!-- Away team column -->
              <div class="pregame__team-col">
                <div class="pregame__mini-title">{{ data()!.awayTeam.abbreviation }} Goalie</div>
                @if (data()!.awayTeam.startingGoalie.confirmed) {
                  <div class="pregame__goalie">
                    <span class="pregame__goalie-name">{{ data()!.awayTeam.startingGoalie.name }}</span>
                    <span class="pregame__goalie-stat">{{ data()!.awayTeam.startingGoalie.gaa?.toFixed(2) }} GAA / {{ (data()!.awayTeam.startingGoalie.savePct! * 100).toFixed(1) }}% SV</span>
                  </div>
                } @else {
                  <span class="pregame__goalie-tba">TBA</span>
                }
                @for (s of data()!.awayTeam.topGoalScorers; track s.playerId) {
                  <div class="pregame__leader"><span class="pregame__leader-cat">G:</span> {{ s.name }} ({{ s.value }})</div>
                }
                @for (s of data()!.awayTeam.topAssistGetters; track s.playerId) {
                  <div class="pregame__leader"><span class="pregame__leader-cat">A:</span> {{ s.name }} ({{ s.value }})</div>
                }
                @for (s of data()!.awayTeam.topPointGetters; track s.playerId) {
                  <div class="pregame__leader"><span class="pregame__leader-cat">PTS:</span> {{ s.name }} ({{ s.value }})</div>
                }
              </div>
              <!-- Home team column -->
              <div class="pregame__team-col">
                <div class="pregame__mini-title">{{ data()!.homeTeam.abbreviation }} Goalie</div>
                @if (data()!.homeTeam.startingGoalie.confirmed) {
                  <div class="pregame__goalie">
                    <span class="pregame__goalie-name">{{ data()!.homeTeam.startingGoalie.name }}</span>
                    <span class="pregame__goalie-stat">{{ data()!.homeTeam.startingGoalie.gaa?.toFixed(2) }} GAA / {{ (data()!.homeTeam.startingGoalie.savePct! * 100).toFixed(1) }}% SV</span>
                  </div>
                } @else {
                  <span class="pregame__goalie-tba">TBA</span>
                }
                @for (s of data()!.homeTeam.topGoalScorers; track s.playerId) {
                  <div class="pregame__leader"><span class="pregame__leader-cat">G:</span> {{ s.name }} ({{ s.value }})</div>
                }
                @for (s of data()!.homeTeam.topAssistGetters; track s.playerId) {
                  <div class="pregame__leader"><span class="pregame__leader-cat">A:</span> {{ s.name }} ({{ s.value }})</div>
                }
                @for (s of data()!.homeTeam.topPointGetters; track s.playerId) {
                  <div class="pregame__leader"><span class="pregame__leader-cat">PTS:</span> {{ s.name }} ({{ s.value }})</div>
                }
              </div>
            </div>
          </div>

          <!-- Special teams -->
          <div class="pregame__section">
            <div class="pregame__stat-row">
              <span>{{ data()!.awayTeam.powerPlayPct }}%</span>
              <span class="pregame__stat-label">PP%</span>
              <span>{{ data()!.homeTeam.powerPlayPct }}%</span>
            </div>
            <div class="pregame__stat-row">
              <span>{{ data()!.awayTeam.penaltyKillPct }}%</span>
              <span class="pregame__stat-label">PK%</span>
              <span>{{ data()!.homeTeam.penaltyKillPct }}%</span>
            </div>
          </div>

          <!-- Head to head -->
          <div class="pregame__section">
            <div class="pregame__section-title">Head to Head</div>
            <div class="pregame__h2h">
              <div class="pregame__h2h-row">
                <span class="pregame__h2h-label">Season</span>
                <span>{{ data()!.headToHead.currentSeason.away.wins }}W</span>
                <span>-</span>
                <span>{{ data()!.headToHead.currentSeason.home.wins }}W</span>
              </div>
              <div class="pregame__h2h-row">
                <span class="pregame__h2h-label">All-Time</span>
                <span>{{ data()!.headToHead.allTime.away.wins }}W</span>
                <span>-</span>
                <span>{{ data()!.headToHead.allTime.home.wins }}W</span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="pregame__loading">Loading matchup...</div>
      }
    </div>
  `,
  styles: [`
    .pregame {
      background: var(--bg-card);
      border: 1px solid var(--border-strong);
      border-radius: 6px;
      padding: 16px;
      font-family: var(--font-primary);
    }
    .pregame__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .pregame__teams { display: flex; align-items: center; gap: 8px; }
    .pregame__abbrev { font-weight: 700; font-size: 16px; color: var(--text-primary); }
    .pregame__vs { color: var(--text-muted); font-size: 12px; }
    .pregame__time { color: var(--text-muted); font-size: 12px; margin-left: 8px; }
    .pregame__close {
      background: none; border: none; font-size: 22px;
      color: var(--text-muted); cursor: pointer;
    }
    .pregame__close:hover { color: var(--text-primary); }
    .pregame__content { font-size: 12px; }
    .pregame__section {
      border-top: 1px solid var(--border-default);
      padding: 8px 0;
    }
    .pregame__section-title {
      font-size: 10px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
    }
    .pregame__players-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .pregame__team-col { display: flex; flex-direction: column; gap: 2px; }
    .pregame__mini-title {
      font-size: 9px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;
    }
    .pregame__goalie { display: flex; flex-direction: column; gap: 1px; margin-bottom: 4px; }
    .pregame__goalie-name { font-weight: 700; color: var(--text-primary); }
    .pregame__goalie-stat { color: var(--text-muted); font-size: 11px; }
    .pregame__goalie-tba { color: var(--text-muted); font-style: italic; }
    .pregame__leader { color: var(--text-secondary); padding: 1px 0; font-size: 11px; }
    .pregame__leader-cat { font-weight: 700; color: var(--text-muted); font-size: 10px; }
    .pregame__stat-row {
      display: grid; grid-template-columns: 1fr auto 1fr;
      gap: 8px; text-align: center; padding: 2px 0; color: var(--text-primary);
    }
    .pregame__stat-label { font-weight: 700; color: var(--text-muted); font-size: 10px; min-width: 32px; }
    .pregame__h2h { font-size: 12px; }
    .pregame__h2h-row {
      display: flex; gap: 8px; align-items: center;
      padding: 2px 0; color: var(--text-primary);
    }
    .pregame__h2h-label { font-weight: 700; color: var(--text-muted); min-width: 60px; font-size: 10px; }
    .pregame__loading { text-align: center; color: var(--text-muted); padding: 20px; }
  `]
})
export class PregameMatchup implements OnInit {
  game = input.required<ScoreGame>();
  leagueId = input<string>('nhl');
  collapse = output<void>();

  private scoresApi = inject(ScoresApiService);
  data = signal<PregameData | null>(null);

  ngOnInit(): void {
    this.scoresApi.getPregame(this.leagueId(), this.game().id).subscribe({
      next: data => this.data.set(data)
    });
  }
}
