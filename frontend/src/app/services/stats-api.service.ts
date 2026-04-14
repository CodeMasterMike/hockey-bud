import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

export type StatsSection =
  | 'all-players'
  | 'all-goalies'
  | 'all-forwards'
  | 'all-defensemen'
  | 'rookie-players'
  | 'rookie-goalies';

export interface StatsResponse {
  section: string;
  season: string;
  sortedBy: string;
  pagination: Pagination;
  dataAsOf: string;
  players: SkaterStats[] | null;
  goalies: GoalieStats[] | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SkaterStats {
  playerId: number;
  name: string;
  teamId: number;
  teamAbbreviation: string;
  teamLogoUrl: string | null;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  hits: number | null;
  penaltyMinutes: number;
  timeOnIcePerGame: number | null;
  shots: number | null;
  shootingPct: number | null;
  blockedShots: number | null;
  evenStrengthPoints: number | null;
  powerPlayPoints: number | null;
  shortHandedPoints: number | null;
  giveaways: number | null;
  takeaways: number | null;
  faceoffPct: number | null;
}

export interface GoalieStats {
  playerId: number;
  name: string;
  teamId: number;
  teamAbbreviation: string;
  teamLogoUrl: string | null;
  gamesPlayed: number;
  gamesStarted: number | null;
  wins: number;
  losses: number;
  overtimeLosses: number;
  savePct: number;
  goalsAgainstAvg: number;
  shotsAgainst: number;
  saves: number;
  goalsAgainst: number;
  goals: number;
  assists: number;
}

@Injectable({ providedIn: 'root' })
export class StatsApiService {
  private http = inject(HttpClient);

  getStats(
    leagueId: string,
    section: StatsSection,
    sort?: string,
    sortDir: string = 'desc',
    page: number = 1,
    pageSize: number = 50
  ): Observable<StatsResponse> {
    const params: Record<string, string | number> = {
      section,
      sortDir,
      page,
      pageSize,
    };
    if (sort) params['sort'] = sort;

    return this.http.get<StatsResponse>(
      `${API_BASE_URL}/api/leagues/${leagueId}/stats`,
      { params }
    );
  }
}
