# Research: Historical NHL Data Coverage

**Date**: 2026-03-16
**Context**: The spec expanded historical data from 2000-01 to "as far back as reliable data can go" with three visually differentiated eras.
**Note**: API endpoint findings are based on documented community knowledge of `api-web.nhle.com`. Live endpoint verification is recommended before implementation (see Verification Checklist at the end).

---

## 1. NHL Web API (api-web.nhle.com) Historical Coverage

### 1a. Seasons & Standings

**Decision**: The NHL Web API provides season and standings data back to **1917-18** (the NHL's inaugural season). Use this as the primary source for standings and season-level data across all eras.

**Rationale**: The `/v1/standings-season` endpoint returns a list of all available season IDs. Community documentation confirms this list extends back to 1917-18. The `/v1/standings/{date}` endpoint accepts any date within those seasons. However, the structure of standings data changes across eras:

- **1917-1926**: No divisions or conferences. Single-league standings.
- **1926-1938**: Canadian and American divisions.
- **1938-1967**: Single division (Original Six era).
- **1967-1974**: East/West divisions, then expanding to four divisions.
- **1974-1993**: Various division/conference reorganizations.
- **1993-2013**: Eastern/Western conferences with three divisions each.
- **2013-present**: Eastern/Western conferences with two divisions each (Metropolitan, Atlantic, Central, Pacific).

The standings response includes W, L, T (ties, pre-2005), OTL (post-2005), PTS, GF, GA. Points percentage and ROW are modern additions.

**Alternatives considered**:
- **NHL Records API (`records.nhl.com/site/api`)**: Also provides franchise and season data going back to 1917. Can serve as a fallback or supplementary source for franchise history.
- **Hockey-Reference scraping**: Unnecessary for basic standings since the API covers this.

### 1b. Player Stats & Career Data

**Decision**: The NHL Web API provides career stats for players going back to the earliest NHL seasons via the `/v1/player/{playerId}/landing` endpoint. Use this for player career stat lines, but expect reduced stat columns for older eras.

**Rationale**: The player landing endpoint returns career season-by-season stats. Players from the Original 6 era (e.g., Maurice Richard, Gordie Howe, Bobby Orr) have player IDs in the system and return career stat lines. Key observations:

- **Available for all eras**: GP, G, A, PTS, PIM
- **Available from ~1959-60 onward**: Plus/minus (introduced 1959-60, though tracked inconsistently until 1967-68)
- **Available from ~1983-84 onward**: Power play goals, short-handed goals, game-winning goals
- **Available from ~1997-98 onward**: TOI (time on ice), shots, shooting percentage, faceoff percentage
- **Available from ~2005-06 onward**: Hits, blocked shots, takeaways, giveaways
- **Available from ~2007-08 onward**: Even-strength/power-play/short-handed points breakdowns, shootout stats
- **Never available from this API**: WAR, xGF/60, xGA/60 (third-party analytics)

The player search endpoint (`/v1/player/search`) and roster endpoints also cover historical seasons.

**Alternatives considered**:
- **NHL Records API**: Provides career totals and some additional historical context (franchise records, milestones) but less granular season-by-season data.
- **Hockey-Reference**: Most comprehensive historical stat source. Provides detailed data including stats not in the NHL API (pre-1960 assists broken into primary/secondary for some eras, All-Star selections, award voting). However, it requires scraping and has terms of service that restrict automated data collection.

### 1c. Team Rosters

**Decision**: The NHL Web API provides roster data via `/v1/roster/{teamAbbrev}/{season}` (e.g., `/v1/roster/MTL/19431944`) back to the earliest seasons. Use this as the primary roster source.

**Rationale**: The roster endpoint uses the format `YYYYYYYY` (e.g., `19431944` for the 1943-44 season). Community testing confirms it returns roster data for Original 6 teams. Earlier franchise abbreviations are mapped (e.g., the original Ottawa Senators, Montreal Maroons, etc. have their own codes). The response includes player IDs, names, positions, and jersey numbers.

**Caveat**: Roster completeness varies. Some very early seasons (1917-1925) may have incomplete rosters. Mid-season transactions (call-ups, loans) are less reliably tracked before the modern era.

### 1d. Game Schedules & Scores

**Decision**: The NHL Web API provides schedule data via `/v1/schedule/{date}` and game data via `/v1/gamecenter/{gameId}/landing` back to the 1917-18 season. Use this for game results across all eras, but expect reduced detail for older games.

**Rationale**: The schedule endpoint returns games for any date in NHL history. Game landing pages return scores and basic game information. However:

- **All eras**: Final score, home/away teams, date, overtime indicator
- **~1959-60 onward**: Period-by-period scoring
- **~1987-88 onward**: Shots on goal per period
- **~1997-98 onward**: Detailed play-by-play with coordinates (limited)
- **~2007-08 onward**: Full play-by-play with x/y coordinates, real-time event feeds
- **~2015-16 onward**: Enhanced tracking data (player positions, puck tracking via NHL EDGE)

**Alternatives considered**:
- **Hockey-Reference**: Has complete game logs going back to 1917. Good supplementary source for verifying scores.

### 1e. Game Events (Play-by-Play)

**Decision**: Play-by-play event data with coordinates is only reliably available from the NHL Web API starting around the **2007-08** season. For earlier games, only goal and penalty summaries are available. The Rink Instances feature should be era-gated.

**Rationale**: The `/v1/gamecenter/{gameId}/play-by-play` endpoint returns detailed event data, but the richness varies dramatically:

- **Pre-1998**: No play-by-play events at all. Only final scores and goal/penalty summaries from box scores.
- **1998-2007**: Basic play-by-play available (goals, penalties, shots) but coordinates are sparse or absent.
- **2007-present**: Full play-by-play with x/y coordinates for most event types.
- **2015-present**: Enhanced with NHL EDGE puck and player tracking.

This means the Rink Instances tab in the Game Hub will only be functional for games from ~2007-08 onward. For earlier games, the tab should either be hidden or show a message explaining that event location data is not available for this era.

---

## 2. Supplementary Data Sources for Pre-2000 NHL Data

### 2a. NHL Records API (records.nhl.com)

**Decision**: Use the NHL Records API as a supplementary source for franchise history, award winners, and milestone records. It fills gaps the main API does not.

**Rationale**: The NHL Records API provides:
- Complete franchise history (relocations, name changes) going back to 1917
- Stanley Cup champions by year
- Award winners (Hart, Vezina, Norris, Calder, etc.) by year
- All-time records and milestones
- Draft history

This is especially valuable for populating the `FranchiseHistory` entity and `PlayerAward` entity across all eras. The API is separate from `api-web.nhle.com` and may have different availability characteristics.

**Endpoints of interest**:
- `records.nhl.com/site/api/franchise` -- all franchises with history
- `records.nhl.com/site/api/franchise-season-results?cayenneExp=franchiseId={id}` -- season-by-season results per franchise
- `records.nhl.com/site/api/award` -- all awards with yearly winners

**Alternatives considered**:
- **Manual data entry**: For the ~30 defunct/relocated franchises and ~100 years of awards, this is feasible but error-prone. The API is preferred.
- **Wikipedia/Hockey-Reference scraping**: More complete but legally risky and fragile.

### 2b. Hockey-Reference.com

**Decision**: Use Hockey-Reference as a **verification and gap-fill source only**, not as a primary automated data feed. Manual lookups are acceptable for one-time historical seed data; automated scraping is not recommended.

**Rationale**: Hockey-Reference has the most comprehensive NHL historical data available anywhere. It includes:
- Complete player stats from 1917 to present
- Game logs for every game played
- Advanced stats (Corsi, Fenwick, PDO) from 2007-08 onward
- Draft history, award voting, All-Star selections
- Salary data from ~2000 onward

However, Hockey-Reference's terms of service prohibit automated scraping. Sports Reference (the parent company) actively blocks scrapers and has sent cease-and-desist letters. Their data is available for licensing (Sports Reference LLC provides data licensing) but costs are significant.

**Recommended use**: During the initial database seed, a developer can manually verify data completeness by spot-checking against Hockey-Reference. For persistent gaps (e.g., a player missing from the NHL API), manual data entry from Hockey-Reference is acceptable as a one-time task.

### 2c. Elite Prospects

**Decision**: Consider Elite Prospects as a future supplementary source for international league stats and draft/prospect data.

**Rationale**: Elite Prospects covers all professional and junior leagues worldwide. Useful for the "Other Leagues" tab on player profiles. They offer an API with paid tiers. Not needed for the historical NHL data effort but relevant for future phases.

### 2d. CapFriendly / PuckPedia

**Decision**: Contract and salary cap data is only meaningful from the **2005-06** season onward (when the salary cap was introduced). Use CapFriendly/PuckPedia-style data sources for the salary cap era only.

**Rationale**: The salary cap was introduced after the 2004-05 lockout. Pre-2005 salary data exists but is incomplete and not governed by a cap system. The spec already scopes the Salary Cap section to the modern era implicitly (all examples use current players). No change needed for historical expansion -- the Salary Cap page simply does not extend before 2005-06.

---

## 3. Data Completeness by Era

### Decision: Implement a stat availability matrix that maps each stat column to the earliest season it was reliably tracked. The UI should display "--" for stats that don't exist in a given era, and the schema should use nullable columns.

### Rationale: Detailed breakdown by era

#### Era 1: Original 6 to 1972 (NHL founded 1917, consolidated to 6 teams by 1942)

| Stat | Available? | Notes |
|------|-----------|-------|
| GP, G, A, PTS, PIM | Yes | Available from 1917-18 |
| +/- | Partial | Introduced 1959-60, consistent from 1967-68 |
| PP/SH goals | No | Not tracked as separate categories |
| TOI | No | Not recorded |
| SOG (shots on goal) | Partial | Tracked inconsistently; more reliable from ~1959-60 |
| Hits, Blocks | No | Not recorded |
| Faceoffs | No | Not recorded |
| Giveaways, Takeaways | No | Not recorded |
| Save % / GAA | Partial | GAA available; SV% requires SOG data |
| Goalie W/L | Yes | Available from earliest seasons |
| Shutouts | Yes | Available from earliest seasons |
| Play-by-play coordinates | No | Not available |

**Team-level**: W, L, T, PTS, GF, GA are complete. No OTL (overtime losses) as the overtime/shootout format did not exist.

**Standings format**: Ties existed (games could end in a draw). The points system was 2-for-win, 1-for-tie, 0-for-loss. No overtime/shootout until 1983-84 (regular season overtime introduced) and 2005-06 (shootout introduced).

#### Era 2: Expansion Era 1973-2005

| Stat | Available? | Notes |
|------|-----------|-------|
| GP, G, A, PTS, PIM | Yes | Complete |
| +/- | Yes | Reliable from 1967-68 onward |
| PP/SH goals | Yes | From ~1983-84 onward |
| PPP/SHP/EVP | Partial | From ~1997-98 onward |
| TOI | From ~1998 | First tracked 1997-98, comprehensive from 1998-99 |
| SOG | Yes | Reliable from ~1983-84 |
| Hits | From ~2005 | NHL started tracking 2005-06 (inconsistent in 2005-06) |
| Blocks | From ~2005 | Same as hits |
| Faceoffs | From ~1998 | Tracked from 1997-98 |
| Giveaways/Takeaways | From ~2005 | NHL started tracking 2005-06 |
| SV%, GAA | Yes | SV% reliable with SOG data from ~1983 |
| Shootout stats | No | Shootout introduced 2005-06 |
| Play-by-play | From ~1998 | Basic PBP from 1997-98, no coordinates |

**Team-level**: W, L, T (until 2005), OTL (from 1999-00). The "loser point" (OT loss = 1 point) was introduced in 1999-2000. Ties were eliminated after the 2003-04 season.

#### Era 3: Salary Cap Era 2006-Present

| Stat | Available? | Notes |
|------|-----------|-------|
| All basic stats | Yes | Complete |
| TOI | Yes | Complete |
| Hits, Blocks, GV, TK | Yes | Complete (some arena-level tracking inconsistency in early years) |
| Faceoffs | Yes | Complete |
| Shootout | Yes | From 2005-06 |
| Play-by-play with coordinates | Yes | From ~2007-08 |
| Enhanced tracking (EDGE) | From ~2021 | Puck/player tracking from ~2021-22 |
| Salary cap data | Yes | Complete |

---

## 4. Era Differentiation in the UI

### Decision: Use a combination of CSS custom properties per era, a `data-era` attribute on table rows/sections, and Tailwind CSS utility classes for visual differentiation. Implement via an Angular pipe or directive that computes era from season year.

### Rationale:

The spec says: "Differentiate eras with background shading or bold separation lines."

**Implementation approach**:

1. **Angular `EraPipe`**: A pure pipe that takes a season year and returns `'original-six' | 'expansion' | 'salary-cap'`:
   ```typescript
   // era.pipe.ts
   transform(seasonStartYear: number): 'original-six' | 'expansion' | 'salary-cap' {
     if (seasonStartYear <= 1972) return 'original-six';
     if (seasonStartYear <= 2005) return 'expansion';
     return 'salary-cap';
   }
   ```

2. **CSS custom properties per era** (in the design token system alongside light/dark mode):
   ```css
   /* Light mode era backgrounds */
   [data-theme="light"] {
     --era-original-six-bg: #F0E6D2;     /* Warm parchment - oldest feel */
     --era-original-six-border: #8B7355;  /* Aged leather brown */
     --era-expansion-bg: #EDE8DA;         /* Slightly less aged parchment */
     --era-expansion-border: #6B7B8D;     /* Steel blue-gray */
     --era-salary-cap-bg: #F5F0E1;       /* Standard page background */
     --era-salary-cap-border: #4A4A4A;   /* Standard dark */
   }

   /* Dark mode era backgrounds */
   [data-theme="dark"] {
     --era-original-six-bg: #0D1A2E;     /* Slightly warmer dark blue */
     --era-original-six-border: #8B7355;
     --era-expansion-bg: #0B1726;
     --era-expansion-border: #6B7B8D;
     --era-salary-cap-bg: #0A1628;       /* Standard dark background */
     --era-salary-cap-border: #4A4A4A;
   }
   ```

3. **Era separator**: Bold horizontal rule with era label between eras in season-by-season tables:
   ```html
   <tr class="era-separator" data-era="original-six">
     <td colspan="100%">
       <span class="era-label">Original Six Era (1917-1972)</span>
     </td>
   </tr>
   ```

4. **Table row styling**: Each stat row gets a `data-era` attribute. Tailwind classes apply subtle background tint. Alternating row shading (FR-009) still applies within each era but the base color shifts slightly per era.

**Alternatives considered**:
- **Icon/badge per era**: A small icon (e.g., a shield for Original Six, an expansion star for the expansion era) next to the season. Adds visual noise to data-dense tables. Rejected for stat tables but could be used on the team profile's franchise history section.
- **Sidebar era timeline**: A vertical timeline alongside the stat table indicating era boundaries. Attractive but complex to implement responsively. Deferred.
- **Pure separation lines only**: The simplest approach -- just a bold `<hr>` between eras. Meets the spec but misses the opportunity for era atmosphere. The recommended approach combines both (separator lines AND subtle background shifts).

---

## 5. Schema Implications for Historical Data

### Decision: All stat columns that did not exist in older eras must be nullable in PostgreSQL. Add an `EraTag` computed column and a `StatAvailability` reference table to manage era-aware display logic.

### Rationale:

**5a. PlayerSeason table changes**:

The existing `PlayerSeason` entity already has many columns that should be nullable. Reviewing the current schema against historical availability:

| Column | Current Type | Change Needed |
|--------|-------------|---------------|
| GamesPlayed | int | No change (always available) |
| Goals | int | No change |
| Assists | int | No change |
| Points | int | No change |
| PlusMinus | int | **Change to int?** -- not available pre-1960 |
| Hits | int | **Change to int?** -- not available pre-2005 |
| PenaltyMinutes | int | No change (always available) |
| TimeOnIcePerGame | decimal | **Change to decimal?** -- not available pre-1998 |
| Shots | int | **Change to int?** -- not available pre-1960 reliably |
| ShootingPct | decimal? | Already nullable, correct |
| BlockedShots | int | **Change to int?** -- not available pre-2005 |
| EvenStrengthPoints | int | **Change to int?** -- not available pre-1998 |
| PowerPlayPoints | int | **Change to int?** -- not available pre-1984 |
| ShortHandedPoints | int | **Change to int?** -- not available pre-1984 |
| Giveaways | int | **Change to int?** -- not available pre-2005 |
| Takeaways | int | **Change to int?** -- not available pre-2005 |
| FaceoffPct | decimal? | Already nullable, correct |
| ShootoutPct | decimal? | Already nullable, correct |

**5b. StandingsSnapshot changes**:

| Column | Current Type | Change Needed |
|--------|-------------|---------------|
| OvertimeLosses | int | **Change to int?** -- did not exist pre-2000 |
| RegulationWins | int | **Change to int?** -- not a historical concept |
| RegulationPlusOTWins | int | **Change to int?** -- not a historical concept |
| PowerPlayPct | decimal | **Change to decimal?** -- PP stats not tracked early |
| PenaltyKillPct | decimal | **Change to decimal?** -- same |
| WildCardRank | int? | Already nullable, correct |

**Add new columns**:

| Column | Type | Notes |
|--------|------|-------|
| Ties | int? | For pre-2005 seasons (2 pts for W, 1 pt for T) |

**5c. Game table changes**:

| Column | Current Type | Change Needed |
|--------|-------------|---------------|
| HomeShotsOnGoal | int? | Already nullable, correct |
| HomeHits | int? | Already nullable, correct |
| HomeFaceoffPct | decimal? | Already nullable, correct |
| All other nullable game stats | Already nullable | No change needed |

The Game entity is already well-designed for historical data -- most detail fields are nullable.

**5d. New reference table -- StatAvailability**:

```
| Id | StatName        | EntityType    | FirstSeasonYear | Notes                          |
|----|-----------------|---------------|-----------------|--------------------------------|
| 1  | PlusMinus       | PlayerSeason  | 1959            | Inconsistent until 1967        |
| 2  | TimeOnIce       | PlayerSeason  | 1997            |                                |
| 3  | Hits            | PlayerSeason  | 2005            | Inconsistent in 2005-06        |
| 4  | BlockedShots    | PlayerSeason  | 2005            |                                |
| 5  | Giveaways       | PlayerSeason  | 2005            |                                |
| 6  | Takeaways       | PlayerSeason  | 2005            |                                |
| 7  | Shots           | PlayerSeason  | 1959            | Inconsistent pre-1983          |
| 8  | PowerPlayPoints | PlayerSeason  | 1983            |                                |
| 9  | ShortHandedPts  | PlayerSeason  | 1983            |                                |
| 10 | EVP             | PlayerSeason  | 1997            |                                |
| 11 | FaceoffPct      | PlayerSeason  | 1997            |                                |
| 12 | ShootoutPct     | PlayerSeason  | 2005            |                                |
| 13 | OvertimeLosses  | Standings     | 1999            |                                |
| 14 | Coordinates     | GameEvent     | 2007            |                                |
```

This table drives the frontend logic: when rendering a stat column for a given season, the Angular component checks whether the stat existed in that era. If not, the column header is either hidden (for era-specific views) or the cell shows "--".

**5e. Season table enhancement**:

Add `Era` computed column or store it explicitly:

| Column | Type | Notes |
|--------|------|-------|
| Era | string | "OriginalSix", "Expansion", "SalaryCap" -- computed from YearStart |
| PointSystemType | string | "2pt-win-1pt-tie", "2pt-win-1pt-otl", "2pt-win-1pt-otl-shootout" |
| HasOvertime | bool | Regular season OT: from 1983-84 |
| HasShootout | bool | From 2005-06 |
| HasTies | bool | Until 2003-04 |
| TeamCount | int | Number of teams active that season |

**Alternatives considered**:
- **Separate table per era**: Three `PlayerSeason` tables (one per era) with different columns. Avoids nulls but triples query complexity and makes cross-era comparisons (career totals) much harder. Rejected.
- **JSON column for optional stats**: Store era-specific stats in a `jsonb` column. Flexible but loses type safety and makes sorting/filtering in SQL harder. Rejected.
- **Non-nullable with sentinel value (0 or -1)**: Using 0 for "not tracked" is ambiguous (a player can legitimately have 0 hits). Using -1 is a code smell. Nullable is the correct semantic choice.

---

## 6. Approximate Data Volume

### Decision: The full historical dataset is manageable for PostgreSQL. Plan for approximately 7,500 players, 150 teams/franchises, 60,000+ games, and 110 seasons.

### Rationale: Estimated row counts per entity

| Entity | Estimated Rows | Notes |
|--------|---------------|-------|
| **Season** | ~110 | 1917-18 through 2025-26 |
| **Team** | ~60 active + defunct | Includes relocated/folded franchises (Montreal Maroons, Quebec Bulldogs, etc.) |
| **FranchiseHistory** | ~80 | ~30 relocations/rebrandings |
| **Player** | ~7,500 | All players who have played at least one NHL game (NHL.com lists ~7,800) |
| **PlayerSeason** | ~50,000 | ~7,500 players x ~6.5 avg seasons per player (many short careers) |
| **Game** | ~62,000 | ~550 games/season (modern) down to ~48 games/season (early); ~108 seasons |
| **GameEvent** | ~4,000,000 | For games with play-by-play data (~2007+, ~20,000 games x ~200 events/game). Pre-2007 games: goal/penalty events only (~300,000) |
| **GamePlayerStat** | ~2,500,000 | ~62,000 games x ~40 players per game (limited for older games) |
| **GamePeriodScore** | ~200,000 | ~62,000 games x ~3.2 periods avg |
| **StandingsSnapshot** | ~3,000 | ~110 seasons x ~28 avg teams |
| **Personnel** | ~2,000 | Coaches, GMs, etc. across history |
| **PersonnelHistory** | ~5,000 | Predecessor chains |
| **Trade** | ~10,000 | Rough estimate; trade tracking is less complete pre-1970 |
| **TradeAsset** | ~25,000 | ~2.5 assets per trade |
| **Contract** | ~10,000 | Salary cap era only (2005-present), ~500/year |
| **Arena** | ~120 | All venues, many historical |
| **PlayerAward** | ~3,000 | Major awards across all seasons |
| **RuleBookEntry** | ~200 | Current rule book |

**Total estimated database size**: ~50-100 GB including indexes (dominated by GameEvent and GamePlayerStat). Well within PostgreSQL capabilities without sharding.

**Initial seed time**: Full historical data import from the NHL API would involve ~7,500 player requests, ~62,000 game requests, and ~110 season requests. At a conservative 2 requests/second (to avoid rate limiting), this is approximately:
- Players: ~62 minutes
- Games: ~8.5 hours
- Seasons/standings: ~1 minute

Total cold seed: approximately **10-12 hours** with rate limiting. Should be run as a one-time Hangfire background job with progress tracking, resume capability, and error logging. Subsequent syncs only fetch current-season data.

**Alternatives considered**:
- **Lazy loading**: Only fetch historical data when a user requests it (e.g., when viewing a 1970 player profile). Reduces seed time but creates cold-start latency for users and complicates the sync architecture. Rejected for a site that aims to be comprehensive.
- **Phased loading**: Seed modern era (2005+) first, then backfill expansion era, then Original Six. This is **recommended** as the implementation approach -- it allows launch with modern data while historical data populates in the background.

---

## 7. Implementation Recommendations

### 7a. Phased Historical Data Loading Strategy

**Phase A (launch)**: 2005-06 to present. Full stat coverage, salary cap data, play-by-play with coordinates. ~20 seasons, ~1,200 games/year.

**Phase B (post-launch week 1)**: 1979-80 to 2004-05. Expansion era. Most basic stats available. ~26 seasons.

**Phase C (post-launch week 2)**: 1917-18 to 1978-79. Original Six and early expansion. Core stats only. ~62 seasons.

### 7b. The Ties Problem

Pre-2005 standings used ties (2 pts for W, 1 pt for T, 0 for L). The spec's standings page shows OTL and PTS% which assume the modern point system. For historical standings:

- Display "T" column instead of "OTL" for pre-2000 seasons
- Display "T/OTL" for 2000-2004 seasons (both ties and OT losses existed 1999-2004)
- PTS% calculation changes: (PTS) / (GP x 2) remains valid across all eras
- ROW (Regulation + Overtime Wins) is not applicable pre-2005; hide the column

### 7c. Defunct Teams

The data model already supports defunct teams via `Team.IsActive`. For full historical coverage, the database needs entries for all defunct/relocated franchises:

- Montreal Maroons (1924-1938)
- New York/Brooklyn Americans (1925-1942)
- Pittsburgh Pirates/Philadelphia Quakers (1925-1931)
- Ottawa Senators [original] (1917-1934)
- Montreal Wanderers (1917-1918, arena fire)
- Quebec Bulldogs (1919-1920)
- Hamilton Tigers (1920-1925)
- St. Louis Eagles (1934-1935)
- Cleveland Barons (1976-1978, merged with Minnesota North Stars)
- Atlanta Flames (1972-1980, moved to Calgary)
- Kansas City/Colorado Rockies (1974-1982, became New Jersey Devils)
- Hartford Whalers (1979-1997, became Carolina Hurricanes)
- Quebec Nordiques (1979-1995, became Colorado Avalanche)
- Winnipeg Jets [original] (1979-1996, became Arizona/Phoenix Coyotes)
- Minnesota North Stars (1967-1993, became Dallas Stars)
- And others through relocation chains

The `FranchiseHistory` table handles this well. The future phase "Historical/defunct team profiles" should be pulled into scope since historical data now extends to these teams' active periods.

### 7d. Rate Limiting and API Etiquette

The NHL Web API has no published rate limits, but community consensus suggests:
- Keep requests under 3-5 per second sustained
- Implement exponential backoff on HTTP 429 or 503 responses
- Cache aggressively; historical data never changes
- Use `If-Modified-Since` headers where supported
- Run historical seed jobs during off-peak hours (overnight, not during game time)

---

## 8. Verification Checklist

The following API calls should be verified before implementation to confirm current endpoint availability and response structure. The research above is based on documented community knowledge as of early 2025 and may have changed.

| Endpoint | What to verify |
|----------|---------------|
| `GET /v1/standings-season` | Returns list; confirm earliest season in the list |
| `GET /v1/standings/1950-01-15` | Returns standings data for mid-Original Six era |
| `GET /v1/roster/MTL/19421943` | Returns roster for 1942-43 Canadiens |
| `GET /v1/player/8445611/landing` | Returns Bobby Orr career stats; check which fields are null |
| `GET /v1/player/8444891/landing` | Returns Gordie Howe career stats (or similar early-era player) |
| `GET /v1/schedule/1960-01-15` | Returns schedule/games from 1960 |
| `GET /v1/gamecenter/{old-game-id}/play-by-play` | Confirm play-by-play is absent for pre-1998 games |
| `GET /v1/gamecenter/{2010-game-id}/play-by-play` | Confirm coordinates present for 2010 game |
| `GET records.nhl.com/site/api/franchise` | Confirm franchise history endpoint is available |
| `GET records.nhl.com/site/api/award` | Confirm award data endpoint is available |

---

## Summary of Decisions

| # | Topic | Decision |
|---|-------|----------|
| 1a | Standings depth | API covers back to 1917-18. Use as primary source. |
| 1b | Player stats depth | API has career stats for all eras; stat columns reduce going back. |
| 1c | Rosters | API provides rosters back to earliest seasons. |
| 1d | Games/Scores | API has scores back to 1917-18 with decreasing detail. |
| 1e | Play-by-play | Coordinates only from ~2007-08. Gate Rink Instances feature by era. |
| 2a | NHL Records API | Use as supplementary source for franchises and awards. |
| 2b | Hockey-Reference | Verification only, no automated scraping. |
| 2c | Elite Prospects | Future phase for international league stats. |
| 2d | Salary data | Only meaningful from 2005-06 (salary cap introduction). |
| 3 | Stat availability | Detailed matrix by era; "--" for unavailable stats. |
| 4 | UI era differentiation | CSS custom properties + data-era attributes + separator rows. |
| 5 | Schema changes | Make 12+ columns nullable; add StatAvailability table, Season era fields, Ties column. |
| 6 | Data volume | ~7,500 players, ~62,000 games, ~50GB total. PostgreSQL handles this easily. |
| 7a | Loading strategy | Phased: salary cap era first, then expansion, then Original Six. |
| 7b | Ties handling | Show "T" column for pre-2005 standings; adapt PTS% display. |
| 7c | Defunct teams | Need ~15+ defunct franchise entries; pull into scope from future phase. |
| 7d | Rate limiting | 3-5 req/sec, exponential backoff, overnight seed jobs. |
