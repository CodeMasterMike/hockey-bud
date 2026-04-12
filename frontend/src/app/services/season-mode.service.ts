import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, timer, switchMap } from 'rxjs';
import { API_BASE_URL } from '../constants';

export interface SeasonMode {
  mode: 'regular-season' | 'playoffs' | 'off-season';
  season: string;
  regularSeasonEnd: string | null;
  playoffBracketAvailable: boolean;
  draftAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeasonModeService {
  private http = inject(HttpClient);

  private seasonMode$: Observable<SeasonMode> | null = null;

  getSeasonMode(leagueId: string): Observable<SeasonMode> {
    if (!this.seasonMode$) {
      // Poll every 30 minutes; season mode changes infrequently
      this.seasonMode$ = timer(0, 30 * 60 * 1000).pipe(
        switchMap(() =>
          this.http.get<SeasonMode>(`${API_BASE_URL}/api/leagues/${leagueId}/season-mode`)
        ),
        shareReplay(1)
      );
    }
    return this.seasonMode$;
  }
}
