import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

// ── Bracket Types ─────────────────────────────────────────────

export interface PlayoffBracketResponse {
  season: string;
  conference: string | null;
  dataAsOf: string;
  rounds: PlayoffRoundDto[];
}

export interface PlayoffRoundDto {
  roundNumber: number;
  label: string;
  series: PlayoffSeriesDto[];
}

export interface PlayoffSeriesDto {
  seriesLetter: string;
  topSeed: PlayoffSeriesTeamDto;
  bottomSeed: PlayoffSeriesTeamDto;
  conference: string;
  status: string;
  seriesScore: string;
}

export interface PlayoffSeriesTeamDto {
  abbreviation: string;
  logoUrl: string | null;
  conferenceSeed: number;
  seriesWins: number;
  regularSeasonRecord: string;
}

// ── Matchup Detail Types ──────────────────────────────────────

export interface PlayoffMatchupDetailResponse {
  seriesLetter: string;
  topSeed: PlayoffSeriesTeamDto;
  bottomSeed: PlayoffSeriesTeamDto;
  conference: string;
  status: string;
  seriesScore: string;
  games: PlayoffGameSummaryDto[];
  dataAsOf: string;
}

export interface PlayoffGameSummaryDto {
  gameId: number;
  gameNumber: number;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamAbbreviation: string;
  awayTeamAbbreviation: string;
}

@Injectable({ providedIn: 'root' })
export class PlayoffsApiService {
  private http = inject(HttpClient);

  getBracket(leagueId: string, conference?: string): Observable<PlayoffBracketResponse> {
    const params: Record<string, string> = {};
    if (conference) params['conference'] = conference;
    return this.http.get<PlayoffBracketResponse>(
      `${API_BASE_URL}/api/leagues/${leagueId}/playoffs/bracket`,
      { params }
    );
  }

  getMatchupDetail(leagueId: string, seriesLetter: string): Observable<PlayoffMatchupDetailResponse> {
    return this.http.get<PlayoffMatchupDetailResponse>(
      `${API_BASE_URL}/api/leagues/${leagueId}/playoffs/matchup/${seriesLetter}`
    );
  }
}
