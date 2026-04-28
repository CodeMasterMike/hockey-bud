# Smoke Test — 2026-04-20 (regression pass)

Quick pass against the deployed dev site at <https://yellow-pond-0bd57f50f.1.azurestaticapps.net/>.
Intent: verify whether any of the 15 issues from the [2026-04-19 full run](../smoke-test-2026-04-19/README.md) have moved since yesterday.

Spot-checked pages: `/nhl/scores`, `/nhl/standings`, `/nhl/draft` + direct API hits to `/api/health/ready` and `/api/leagues/1/season-mode`.

## Result

**No fixes had landed as of 2026-04-20.** Every issue sampled reproduced. One (#15) was strictly worse — two days past `regularSeasonEnd` rather than one, and `season-mode` still returned `regular-season`.

**Update 2026-04-28:** All issues except #03 have been fixed on the `feature/fixes` and `feature/continued-fixes` branches. See the [2026-04-19 README](../smoke-test-2026-04-19/README.md) for per-issue fix status.

## Environment

- Date tested: 2026-04-20
- Backend `/api/health/ready`: **200 OK**
- Backend `/api/leagues/1/season-mode`:
  ```json
  {"mode":"regular-season","season":"20252026","regularSeasonEnd":"2026-04-18","playoffBracketAvailable":false,"draftAvailable":false}
  ```

## Regression status

Issues that were directly re-checked today:

| # | Issue | Detail from today's pass | Status |
|---|-------|--------------------------|--------|
| [01](../smoke-test-2026-04-19/01-signalr-negotiate-cors.md) | SignalR negotiate CORS failure | 4 console errors on `/nhl/scores` first paint: `Failed to complete negotiation with the server: TypeError: Failed to fetch`. Retry logged for 30s later. | Still reproduces |
| [02](../smoke-test-2026-04-19/02-past-games-stuck-in-live-or-scheduled.md) | Past games stuck in Live/Scheduled | API `GET /api/leagues/1/scores?date=2026-04-15` returned 6 games: 4 `Final`, **2 `Live`** — still live five days after play. | Still reproduces |
| [03](../smoke-test-2026-04-19/03-nav-shows-playoffs-and-draft-when-unavailable.md) | Nav shows Playoffs + Draft when unavailable | Nav still renders `SCORES / STANDINGS / PLAYOFFS / STATS / PLAYERS / TEAMS / DRAFT / SCHEDULE / SALARY CAP / TRADES / FREE AGENTS / PERSONNEL` despite `playoffBracketAvailable:false, draftAvailable:false`. | Still reproduces |
| [13](../smoke-test-2026-04-19/13-standings-division-banner-clipped.md) | Division banner text clipped | DOM text is `ATLANTIC DIVISION` in full — confirms this is a CSS overflow/clipping bug, not string truncation. Cannot be detected via `innerText`; need `scrollWidth > clientWidth` on the header element. | Still reproduces (confirmed CSS-level) |
| [14](../smoke-test-2026-04-19/14-draft-page-missing-year-label.md) | `Draft results —` trailing dash | Page still renders the heading as exactly `Draft results —` with no year. | Still reproduces |
| [15](../smoke-test-2026-04-19/15-season-mode-stale-after-regular-season-end.md) | Season mode stale | `regularSeasonEnd: 2026-04-18`, today is 2026-04-20. Mode still `regular-season`. Staleness window is now **2 days** (was 1). | Worse — consider bumping severity |

Issues not re-verified today (no new information, assumed still reproducing):

| # | Issue |
|---|-------|
| [04](../smoke-test-2026-04-19/04-team-profile-missing-franchise-data.md) | Team profile — `FOUNDED 0`, `STANLEY CUPS 0` |
| [05](../smoke-test-2026-04-19/05-roster-draft-column-all-udfa.md) | Roster shows all players as UDFA |
| [06](../smoke-test-2026-04-19/06-roster-born-column-shows-age.md) | Roster `BORN` column displays age |
| [07](../smoke-test-2026-04-19/07-dark-mode-toggle-no-effect.md) | Dark mode toggle has no visible effect |
| [08](../smoke-test-2026-04-19/08-game-hub-missing-finished-game-stats.md) | Game Hub — finished-game stats all zeros, Player Stats tab empty |
| [09](../smoke-test-2026-04-19/09-trades-page-empty.md) | Trades page — "0 trades this season" |
| [10](../smoke-test-2026-04-19/10-stats-hit-blk-gv-tk-missing.md) | Stats page — HIT/BLK/GV/TK all `—` |
| [11](../smoke-test-2026-04-19/11-search-player-dead-ends-on-placeholder.md) | Search → player dead-ends on placeholder route |
| [12](../smoke-test-2026-04-19/12-expanded-score-pregame-missing-labels-and-leaders.md) | Expanded score / pregame — missing labels and leader callouts |

## Full issue catalogue (one-line summaries)

Referenced back to the 2026-04-19 writeups:

1. [SignalR negotiate CORS](../smoke-test-2026-04-19/01-signalr-negotiate-cors.md) — **High**
2. [Past games stuck Live/Scheduled](../smoke-test-2026-04-19/02-past-games-stuck-in-live-or-scheduled.md) — **High**
3. [Nav shows Playoffs and Draft when unavailable](../smoke-test-2026-04-19/03-nav-shows-playoffs-and-draft-when-unavailable.md) — **High**
4. [Team profile missing franchise data](../smoke-test-2026-04-19/04-team-profile-missing-franchise-data.md) — **High**
5. [Roster draft column all UDFA](../smoke-test-2026-04-19/05-roster-draft-column-all-udfa.md) — **High**
6. [Roster `BORN` column shows age](../smoke-test-2026-04-19/06-roster-born-column-shows-age.md) — **Medium**
7. [Dark mode toggle no effect](../smoke-test-2026-04-19/07-dark-mode-toggle-no-effect.md) — **High**
8. [Game Hub missing finished-game stats](../smoke-test-2026-04-19/08-game-hub-missing-finished-game-stats.md) — **High**
9. [Trades page empty](../smoke-test-2026-04-19/09-trades-page-empty.md) — **High**
10. [Stats HIT/BLK/GV/TK missing](../smoke-test-2026-04-19/10-stats-hit-blk-gv-tk-missing.md) — **Medium**
11. [Search → player dead-ends on placeholder](../smoke-test-2026-04-19/11-search-player-dead-ends-on-placeholder.md) — **Medium**
12. [Expanded score / pregame missing labels and leaders](../smoke-test-2026-04-19/12-expanded-score-pregame-missing-labels-and-leaders.md) — **Medium**
13. [Standings division banner clipped](../smoke-test-2026-04-19/13-standings-division-banner-clipped.md) — **Low** *(CSS overflow, confirmed today)*
14. [Draft page missing year label](../smoke-test-2026-04-19/14-draft-page-missing-year-label.md) — **Low**
15. [Season mode stale](../smoke-test-2026-04-19/15-season-mode-stale-after-regular-season-end.md) — **Low** *(consider bumping — now 2 days stale)*

## Coverage note

Today was a regression pass, not a full run. 3 of 14 pages were visited (scores, standings, draft) plus two direct API hits. For full page coverage — team profile, game hub, trades, stats, playoffs, search, nav theme — re-run the full checklist from `.claude/skills/hockey-site-smoke-test/references/checklist.md`.

No new issues surfaced in the pages that were sampled.

## Tooling observation (for the skill itself)

Issue #13's check (division banner clipping) can't be detected by comparing `innerText` to expected copy — the DOM text is complete; the problem is visual clipping. Any future automated check of this class should compare `element.scrollWidth` vs. `element.clientWidth`, or take a screenshot and inspect visually. This note has been earmarked for the next skill iteration.
