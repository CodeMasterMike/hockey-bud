import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

export interface GameHubResponse {
  gameId: number;
  externalId: number;
  status: string;
  homeTeam: GameHubTeam;
  awayTeam: GameHubTeam;
  homeScore: number;
  awayScore: number;
  arena: { name: string; city: string | null } | null;
  currentPeriod: number | null;
  periodTimeRemaining: string | null;
  isOvertime: boolean;
  isShootout: boolean;
  periodScores: PeriodScore[];
  teamStats: TeamStats;
  events: GameEvent[];
  playerStats: PlayerStats;
  dataAsOf: string;
}

export interface GameHubTeam {
  id: number;
  abbreviation: string;
  name: string;
  logoUrl: string | null;
}

export interface PeriodScore {
  period: string;
  homeGoals: number;
  awayGoals: number;
  homeShots: number;
  awayShots: number;
}

export interface TeamStats {
  shotsOnGoal: { home: number; away: number };
  hits: { home: number; away: number };
  powerPlay: { home: string; away: string };
  faceoffPct: { home: number; away: number };
  giveaways: { home: number; away: number };
  takeaways: { home: number; away: number };
}

export interface GameEvent {
  eventType: string;
  period: number;
  gameClockTime: string;
  teamAbbreviation: string;
  description: string | null;
  isPowerPlay: boolean;
  isShortHanded: boolean;
  isEmptyNet: boolean;
  penaltyType: string | null;
  penaltyMinutes: number | null;
  coordinateX: number | null;
  coordinateY: number | null;
  videoUrl: string | null;
}

export interface PlayerStats {
  home: TeamPlayers;
  away: TeamPlayers;
}

export interface TeamPlayers {
  skaters: Skater[];
  goalies: Goalie[];
}

export interface Skater {
  playerId: number;
  jerseyNumber: number;
  position: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  hits: number;
  penaltyMinutes: number;
  timeOnIce: string;
  shots: number;
}

export interface Goalie {
  playerId: number;
  jerseyNumber: number;
  shotsAgainst: number;
  saves: number;
  savePct: number;
  timeOnIce: string;
}

@Injectable({ providedIn: 'root' })
export class GameHubApiService {
  private http = inject(HttpClient);

  getGameHub(gameId: number): Observable<GameHubResponse> {
    return this.http.get<GameHubResponse>(`${API_BASE_URL}/api/games/${gameId}/hub`);
  }
}
