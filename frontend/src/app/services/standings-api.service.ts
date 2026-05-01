import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

export type StandingsView = 'wildcard' | 'division' | 'conference' | 'league';

export interface StandingsResponse {
  season: string;
  view: StandingsView;
  dataAsOf: string;
  groups: StandingsGroup[];
}

export interface StandingsGroup {
  label: string;
  conference: string | null;
  teams: StandingsTeam[];
}

export interface StandingsTeam {
  teamId: number;
  abbreviation: string;
  logoUrl: string | null;
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  overtimeLosses: number;
  points: number;
  pointsPct: number;
  regulationWins: number;
  regulationPlusOTWins: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  powerPlayPct: number;
  penaltyKillPct: number;
  faceoffPct: number | null;
  divisionRank: number;
  conferenceRank: number;
  leagueRank: number;
  wildCardRank: number | null;
  clinchIndicator: string | null;
}

@Injectable({ providedIn: 'root' })
export class StandingsApiService {
  private http = inject(HttpClient);

  getStandings(leagueId: string, view: StandingsView): Observable<StandingsResponse> {
    return this.http.get<StandingsResponse>(
      `${API_BASE_URL}/api/leagues/${leagueId}/standings`,
      { params: { view } }
    );
  }
}
