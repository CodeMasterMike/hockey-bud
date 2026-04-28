import { Component, inject, signal, output, ChangeDetectionStrategy, DestroyRef, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { SearchApiService, SearchResponse } from '../../../services/search-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';

@Component({
  selector: 'app-banner',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="banner">
      <a routerLink="/" class="banner__brand">
        <span class="banner__brand-icon">H</span>
        Hockey League Hub
      </a>
      <div class="banner__search" #searchContainer>
        <input
          type="text"
          placeholder="Search players, teams..."
          [value]="searchTerm()"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (keydown.escape)="close()"
          (keydown.enter)="$event.preventDefault()"
          autocomplete="off" />
        @if (showDropdown() && results()) {
          <div class="search-dropdown">
            @if (results()!.teams.length > 0) {
              <div class="search-group">
                <div class="search-group__label">Teams</div>
                @for (team of results()!.teams; track team.teamId) {
                  <button class="search-result" (mousedown)="goToTeam(team.teamId)">
                    <span class="search-result__name">{{ team.name }}</span>
                    <span class="search-result__meta">{{ team.abbreviation }}</span>
                  </button>
                }
              </div>
            }
            @if (results()!.players.length > 0) {
              <div class="search-group">
                <div class="search-group__label">Players</div>
                @for (player of results()!.players; track player.playerId) {
                  <div class="search-result search-result--disabled">
                    <span class="search-result__name">{{ player.firstName }} {{ player.lastName }}</span>
                    <span class="search-result__meta">{{ player.teamAbbreviation ?? '' }} · Profile coming soon</span>
                  </div>
                }
              </div>
            }
            @if (results()!.teams.length === 0 && results()!.players.length === 0) {
              <div class="search-empty">No results for "{{ searchTerm() }}"</div>
            }
          </div>
        }
      </div>
      <button class="banner__hamburger" (click)="menuToggle.emit()" aria-label="Menu">&#9776;</button>
    </header>
  `,
  host: {
    '(document:click)': 'onDocumentClick($event)'
  },
  styles: [`
    .banner { display: flex; align-items: center; justify-content: space-between; background: var(--bg-banner); color: var(--text-on-banner); padding: 0 24px; height: 56px; font-family: var(--font-primary); }
    .banner__brand { font-size: 20px; font-weight: 700; letter-spacing: 0.04em; white-space: nowrap; display: flex; align-items: center; gap: 10px; color: var(--text-on-banner); text-decoration: none; }
    .banner__brand-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 2px solid var(--text-on-banner); border-radius: 50%; font-size: 16px; }
    .banner__search { flex: 0 1 420px; margin: 0 24px; position: relative; }
    .banner__search input { width: 100%; padding: 8px 14px; border: 1px solid var(--banner-input-border); border-radius: 4px; background: var(--banner-input-bg); color: var(--text-on-banner); font-family: var(--font-primary); font-size: 13px; outline: none; }
    .banner__search input::placeholder { color: var(--banner-placeholder); }
    .banner__search input:focus { background: var(--banner-input-focus-bg); border-color: var(--banner-input-focus-border); }
    .banner__hamburger { background: none; border: 1px solid var(--banner-input-border); border-radius: 4px; color: var(--text-on-banner); font-size: 22px; cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
    .banner__hamburger:hover { background: var(--banner-hover-bg); }

    .search-dropdown { position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; background: var(--bg-card); border: 1px solid var(--border-strong); border-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 200; max-height: 400px; overflow-y: auto; }
    .search-group__label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); padding: 10px 14px 4px; }
    .search-result { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 8px 14px; border: none; background: none; cursor: pointer; font-family: var(--font-primary); font-size: 0.82rem; color: var(--text-primary); text-align: left; }
    .search-result:hover { background: var(--bg-row-alt); }
    .search-result--disabled { cursor: default; opacity: 0.6; }
    .search-result--disabled:hover { background: none; }
    .search-result__meta { font-size: 0.72rem; color: var(--text-muted); }
    .search-empty { font-size: 0.78rem; color: var(--text-muted); padding: 16px 14px; text-align: center; }
    .search-group + .search-group { border-top: 1px solid var(--border-default); }
  `]
})
export class Banner {
  private router = inject(Router);
  private searchApi = inject(SearchApiService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('searchContainer', { static: true }) searchContainer!: ElementRef;

  menuToggle = output();

  searchTerm = signal('');
  results = signal<SearchResponse | null>(null);
  showDropdown = signal(false);

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(q => q.length >= 2),
      tap(() => this.showDropdown.set(true)),
      switchMap(q => this.searchApi.search(q).pipe(
        catchError(() => EMPTY)
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => this.results.set(res));
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    if (value.length < 2) {
      this.results.set(null);
      this.showDropdown.set(false);
      return;
    }
    this.search$.next(value);
  }

  onFocus(): void {
    if (this.results() && this.searchTerm().length >= 2) {
      this.showDropdown.set(true);
    }
  }

  close(): void {
    this.showDropdown.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.searchContainer.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }

  goToTeam(teamId: number): void {
    this.close();
    this.router.navigate(['/', DEFAULT_LEAGUE_ID, 'teams', teamId]);
  }

  goToPlayer(playerId: number): void {
    this.close();
    this.router.navigate(['/', DEFAULT_LEAGUE_ID, 'players'], { queryParams: { player: playerId } });
  }
}
