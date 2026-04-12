import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

export interface SearchResponse {
  query: string;
  players: SearchPlayer[];
  teams: SearchTeam[];
}

export interface SearchPlayer {
  playerId: number;
  firstName: string;
  lastName: string;
  teamAbbreviation: string | null;
  teamLogoUrl: string | null;
}

export interface SearchTeam {
  teamId: number;
  abbreviation: string;
  name: string;
  logoUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class SearchApiService {
  private http = inject(HttpClient);

  search(query: string, limit = 10): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(
      `${API_BASE_URL}/api/search`,
      { params: { q: query, limit } }
    );
  }
}
