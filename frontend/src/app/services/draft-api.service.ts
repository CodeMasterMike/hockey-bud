import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

export interface DraftResponse {
  year: number;
  dataAsOf: string;
  rounds: DraftRoundDto[];
  isLive: boolean;
}

export interface DraftRoundDto {
  roundNumber: number;
  picks: DraftPickDto[];
}

export interface DraftPickDto {
  overallPick: number;
  pickInRound: number;
  teamAbbreviation: string;
  teamLogoUrl: string | null;
  playerName: string;
  position: string | null;
  birthCountry: string | null;
  previousClub: string | null;
  playerId: number | null;
}

@Injectable({ providedIn: 'root' })
export class DraftApiService {
  private http = inject(HttpClient);

  getDraft(leagueId: string, year?: number): Observable<DraftResponse> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    return this.http.get<DraftResponse>(
      `${API_BASE_URL}/api/leagues/${leagueId}/draft`,
      { params }
    );
  }
}
