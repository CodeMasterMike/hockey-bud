# Smoke Test — 2026-04-19

Smoke test of the deployed dev site at <https://yellow-pond-0bd57f50f.1.azurestaticapps.net/>
against the API at `hockeyhub-dev-api.purplewave-82f5d767.eastus.azurecontainerapps.io`.

Tested across: home / scores / standings / schedule / teams / team profile /
game hub / trades / stats / playoffs / draft / search / nav / theme.

## Issues found

Severity is my best guess — worth re-triaging.

| # | Severity | Area | File | Status |
|---|----------|------|------|--------|
| 01 | High | Realtime | [01-signalr-negotiate-cors.md](01-signalr-negotiate-cors.md) | **FIXED** 2026-04-22 — Moved CORS from Container Apps ingress to ASP.NET Core middleware; added `RequireCors` on hub endpoint; deployed via Bicep |
| 02 | High | Schedule / Scores sync | [02-past-games-stuck-in-live-or-scheduled.md](02-past-games-stuck-in-live-or-scheduled.md) | **FIXED** 2026-04-28 — Added `ReconcileStaleGamesAsync` to ScoresSyncJob (sweeps games >6h past start); ScheduleSyncJob now updates existing game status |
| 03 | High | Nav / Season mode | [03-nav-shows-playoffs-and-draft-when-unavailable.md](03-nav-shows-playoffs-and-draft-when-unavailable.md) | Open |
| 04 | High | Team profile | [04-team-profile-missing-franchise-data.md](04-team-profile-missing-franchise-data.md) | **FIXED** 2026-04-28 — Static franchise data (founding year + Cup count) for all 32 teams; SeedTeamsAsync populates on new + existing teams |
| 05 | High | Team profile / roster | [05-roster-draft-column-all-udfa.md](05-roster-draft-column-all-udfa.md) | **FIXED** 2026-04-28 — Draft fields (year/round/pick/team) now mapped during roster seeding. Requires re-seed |
| 06 | Medium | Team profile / roster | [06-roster-born-column-shows-age.md](06-roster-born-column-shows-age.md) | **FIXED** 2026-04-28 — Column header renamed from "Born" to "Age" |
| 07 | High | Theme | [07-dark-mode-toggle-no-effect.md](07-dark-mode-toggle-no-effect.md) | **FIXED** 2026-04-28 — ThemeService now injected in root App component so constructor runs at startup |
| 08 | High | Game Hub | [08-game-hub-missing-finished-game-stats.md](08-game-hub-missing-finished-game-stats.md) | **FIXED** 2026-04-28 — Rewrote boxscore parser: player stats from forwards/defense/goalies arrays, team stats from direct properties, powerPlay "x/y" string parsing |
| 09 | High | Trades | [09-trades-page-empty.md](09-trades-page-empty.md) | **Mitigated** 2026-04-28 — Empty state now shows "data not yet available" notice. NHL API has no trades endpoint; needs alternate data source |
| 10 | Medium | Stats | [10-stats-hit-blk-gv-tk-missing.md](10-stats-hit-blk-gv-tk-missing.md) | **FIXED** 2026-04-28 — Now fetches `skater/realtime` report in addition to `skater/summary` and merges HIT/BLK/GV/TK by player ID |
| 11 | Medium | Search → Players page | [11-search-player-dead-ends-on-placeholder.md](11-search-player-dead-ends-on-placeholder.md) | **FIXED** 2026-04-28 — Player search results shown as disabled with "Profile coming soon" instead of navigating to dead-end |
| 12 | Medium | Scores / expanded box | [12-expanded-score-pregame-missing-labels-and-leaders.md](12-expanded-score-pregame-missing-labels-and-leaders.md) | **Partial fix** 2026-04-28 — Pregame leaders (G/A/PTS) and season H2H now computed from DB. All-Time H2H still zeroed (no historical data) |
| 13 | Low | Standings layout | [13-standings-division-banner-clipped.md](13-standings-division-banner-clipped.md) | **FIXED** 2026-04-28 — Shortened division labels (dropped "Division" suffix); overflow-x changed to hidden |
| 14 | Low | Draft page copy | [14-draft-page-missing-year-label.md](14-draft-page-missing-year-label.md) | **FIXED** 2026-04-28 — Em-dash now conditional on dataAsOf presence |
| 15 | Low | Season mode staleness | [15-season-mode-stale-after-regular-season-end.md](15-season-mode-stale-after-regular-season-end.md) | **FIXED** 2026-04-28 — Added `pastRegularSeasonEnd` check; transitions to playoffs mode immediately when regular season date has passed |

## Environment

- Date tested: 2026-04-19 (season `20252026`, `regularSeasonEnd: 2026-04-18`)
- Browser: Chrome via Claude in Chrome
- Viewport: 1568×741 (desktop)
- Backend API `/season-mode` response:
  ```json
  {"mode":"regular-season","season":"20252026","regularSeasonEnd":"2026-04-18","playoffBracketAvailable":false,"draftAvailable":false}
  ```
