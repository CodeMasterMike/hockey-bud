import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

export interface TeamsListResponse {
  teams: TeamListItem[];
  dataAsOf: string;
}

export interface TeamListItem {
  id: number;
  locationName: string;
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  primaryColor: string;
  division: string | null;
  conference: string | null;
  record: string | null;
  points: number | null;
  pointsPct: number | null;
}

export interface TeamProfile {
  id: number;
  locationName: string;
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  primaryColor: string;
  division: string | null;
  conference: string | null;
  currentSeasonRecord: { wins: number; losses: number; overtimeLosses: number } | null;
  points: number | null;
  pointsPct: number | null;
  leagueRank: number | null;
  divisionRank: number | null;
  conferenceRank: number | null;
  clinchIndicator: string | null;
  joinedSeasonYear: number;
  originalJoinYear: number;
  stanleyCups: { total: number; since1973: number; since2006: number };
  franchiseHistory: { city: string; name: string; yearStart: number; yearEnd: number }[];
  season: string | null;
  roster: RosterPlayer[];
  dataAsOf: string;
}

export interface RosterPlayer {
  playerId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  shootsCatches: string;
  birthCity: string;
  birthCountry: string;
  dateOfBirth: string;
  draftYear: number | null;
  isEbug: boolean;
}

@Injectable({ providedIn: 'root' })
export class TeamsApiService {
  private http = inject(HttpClient);

  getTeams(leagueId: string): Observable<TeamsListResponse> {
    return this.http.get<TeamsListResponse>(`${API_BASE_URL}/api/leagues/${leagueId}/teams`);
  }

  getTeamProfile(teamId: number): Observable<TeamProfile> {
    return this.http.get<TeamProfile>(`${API_BASE_URL}/api/teams/${teamId}`);
  }
}
