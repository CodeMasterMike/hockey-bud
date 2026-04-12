import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants';

export interface TradesListResponse {
  season: string;
  dataAsOf: string;
  trades: TradeItem[];
}

export interface TradeItem {
  id: number;
  tradeDate: string;
  tradeDateDisplay: string;
  description: string | null;
  sides: TradeSide[];
}

export interface TradeSide {
  teamId: number;
  teamAbbreviation: string;
  teamName: string;
  teamLogoUrl: string | null;
  acquired: TradeAsset[];
  traded: TradeAsset[];
}

export interface TradeAsset {
  assetType: string;
  playerId: number | null;
  playerName: string | null;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class TradesApiService {
  private http = inject(HttpClient);

  getTrades(leagueId: string, teamId?: number): Observable<TradesListResponse> {
    const params: Record<string, string | number> = {};
    if (teamId != null) params['team'] = teamId;
    return this.http.get<TradesListResponse>(
      `${API_BASE_URL}/api/leagues/${leagueId}/trades`,
      { params }
    );
  }
}
