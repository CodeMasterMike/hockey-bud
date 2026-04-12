import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

export interface ScheduleResponse {
  season: string;
  dataAsOf: string;
  months: ScheduleMonth[];
}

export interface ScheduleMonth {
  month: number;
  year: number;
  label: string;
  days: ScheduleDay[];
}

export interface ScheduleDay {
  date: string;
  games: ScheduleGame[];
}

export interface ScheduleGame {
  gameId: number;
  externalId: number;
  homeTeam: ScheduleTeam;
  awayTeam: ScheduleTeam;
  scheduledStart: string;
  scheduledStartLocal: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface ScheduleTeam {
  id: number;
  abbreviation: string;
  logoUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class ScheduleApiService {
  private http = inject(HttpClient);

  getSchedule(leagueId: string, month?: number, teamId?: number): Observable<ScheduleResponse> {
    const params: Record<string, string | number> = {};
    if (month != null) params['month'] = month;
    if (teamId != null) params['team'] = teamId;
    return this.http.get<ScheduleResponse>(
      `${API_BASE_URL}/api/leagues/${leagueId}/schedule`,
      { params }
    );
  }
}
