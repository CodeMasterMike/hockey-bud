import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, merge, timer, switchMap, startWith, shareReplay } from 'rxjs';
import { SignalRService, ScoreUpdate } from './signalr.service';
import { TICKER_POLL_INTERVAL_MS } from '../constants';

export interface ScoresResponse {
  date: string;
  dateDisplay: string;
  showPreviousDay: boolean;
  dataAsOf: string;
  games: ScoreGame[];
}

export interface ScoreGame {
  id: number;
  status: string;
  scheduledStart: string;
  scheduledStartLocal: string | null;
  currentPeriod: number | null;
  currentPeriodLabel: string | null;
  periodTimeRemaining: string | null;
  periodTimeRemainingSeconds: number | null;
  clockRunning: boolean;
  isOvertime: boolean;
  isShootout: boolean;
  homeTeam: ScoreTeam;
  awayTeam: ScoreTeam;
}

export interface ScoreTeam {
  id: number;
  abbreviation: string;
  logoUrl: string | null;
  score: number | null;
  shotsOnGoal: number | null;
  record: string | null;
  pointsPct: number | null;
  leagueRank: number | null;
}

export interface ExpandedScore {
  gameId: number;
  periodScores: PeriodScore[];
  stats: GameStats;
  goalSummaries: { home: GoalSummary[]; away: GoalSummary[] };
  penaltySummaries: { home: PenaltySummary[]; away: PenaltySummary[] };
  headToHead?: {
    currentSeason: { home: H2HRecord; away: H2HRecord };
    allTime: { home: H2HRecord; away: H2HRecord };
  };
}

export interface PeriodScore {
  period: string;
  homeGoals: number;
  awayGoals: number;
  homeShots: number;
  awayShots: number;
}

export interface GameStats {
  homePowerPlay: string;
  awayPowerPlay: string;
  homeHits: number;
  awayHits: number;
  homeFaceoffPct: number;
  awayFaceoffPct: number;
  homeTakeaways: number;
  awayTakeaways: number;
  homeGiveaways: number;
  awayGiveaways: number;
  homeTimeOfPossession: string;
  awayTimeOfPossession: string;
}

export interface GoalSummary {
  period: string;
  time: string;
  displayTime: string;
  scorer: { playerId: number; name: string; goalNumber: number };
  assists: { playerId: number; name: string; assistNumber: number }[];
  isPowerPlay: boolean;
  videoUrl: string | null;
}

export interface PenaltySummary {
  period: string;
  time: string;
  displayTime: string;
  player: { playerId: number; name: string };
  penaltyType: string;
  penaltyMinutes: number;
  playerSeasonPIM: number;
  ruleBookRef: string | null;
  videoUrl: string | null;
}

export interface TickerResponse {
  dataAsOf: string;
  games: TickerGame[];
}

export interface TickerGame {
  id: number;
  status: string;
  period: number | null;
  periodTimeRemaining: string | null;
  periodTimeRemainingSeconds: number | null;
  homeTeam: { id: number; abbreviation: string; logoUrl: string | null };
  awayTeam: { id: number; abbreviation: string; logoUrl: string | null };
  homeScore: number | null;
  awayScore: number | null;
  scheduledStartLocal: string | null;
}

export interface PregameMatchup {
  gameId: number;
  status: string;
  homeTeam: PregameTeam;
  awayTeam: PregameTeam;
  headToHead: {
    currentSeason: { home: H2HRecord; away: H2HRecord };
    allTime: { home: H2HRecord; away: H2HRecord };
  };
}

export interface PregameTeam {
  id: number;
  abbreviation: string;
  topGoalScorers: { playerId: number; name: string; value: number }[];
  topAssistGetters: { playerId: number; name: string; value: number }[];
  topPointGetters: { playerId: number; name: string; value: number }[];
  startingGoalie: {
    playerId: number | null;
    name: string | null;
    gaa: number | null;
    savePct: number | null;
    confirmed: boolean;
  };
  powerPlayPct: number;
  penaltyKillPct: number;
}

export interface H2HRecord {
  wins: number;
  overtimeWins: number;
  shootoutWins: number;
  ties: number | null;
}

@Injectable({ providedIn: 'root' })
export class ScoresApiService {
  private http = inject(HttpClient);
  private signalR = inject(SignalRService);

  private refresh$ = new Subject<void>();

  getScores(leagueId: string, date?: string): Observable<ScoresResponse> {
    const params: Record<string, string> = {};
    if (date) params['date'] = date;
    return this.http.get<ScoresResponse>(`/api/leagues/${leagueId}/scores`, { params });
  }

  getExpandedScore(leagueId: string, gameId: number): Observable<ExpandedScore> {
    return this.http.get<ExpandedScore>(`/api/leagues/${leagueId}/scores/${gameId}/expanded`);
  }

  getTicker(leagueId: string): Observable<TickerResponse> {
    return merge(
      this.signalR.scoreUpdate$,
      this.refresh$,
      timer(0, TICKER_POLL_INTERVAL_MS)
    ).pipe(
      startWith(null),
      switchMap(() => this.http.get<TickerResponse>(`/api/leagues/${leagueId}/scores/ticker`)),
      shareReplay(1)
    );
  }

  getPregame(leagueId: string, gameId: number): Observable<PregameMatchup> {
    return this.http.get<PregameMatchup>(`/api/leagues/${leagueId}/scores/${gameId}/pregame`);
  }

  get scoreUpdates$(): Observable<ScoreUpdate> {
    return this.signalR.scoreUpdate$;
  }

  refresh(): void {
    this.refresh$.next();
  }
}
