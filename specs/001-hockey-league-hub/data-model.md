# Data Model: Hockey League Information Hub

**Phase 1 Output** — Entity definitions extracted from the feature specification.

---

## Entity Relationship Overview

```
League 1──* Team 1──* Player (via Roster)
                  1──* Personnel
                  1──* Contract
                  1──* SalaryCapSnapshot

Team *──* Trade (via TradeSide)
Player *──* Trade (via TradeAsset)

Player 1──* PlayerSeason (stats per team per season)
Player 1──* Contract
Player 1──* PlayerHeadshot
Player 1──1 PlayerStyle

Game *──1 Season
Game 2──1 Team (home, away)
Game 1──* GameEvent (goals, penalties, shots, hits, etc.)
Game 1──* GamePlayerStat
Game 1──1 Arena

Trade 1──* TradeAsset
Trade *──* Trade (bidirectional DAG: via TradeEdge junction table)

Arena 1──* Game
Season 1──* Game
Season 1──* StandingsSnapshot
Season 1──* ImportantDate

Personnel 1──* PersonnelHistory (predecessors)
```

---

## Entities

### League

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| Name | string | e.g., "NHL" |
| Abbreviation | string | e.g., "NHL" |
| LogoUrl | string | Path to league logo asset |
| IsActive | bool | Whether league is currently available on site |

**Relationships**: Has many Teams, Seasons.

---

### Team

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| LeagueId | int (FK) | |
| LocationName | string | e.g., "Colorado", "Florida" — used for alphabetical sort (FR-046) |
| Name | string | e.g., "Avalanche", "Panthers" |
| Abbreviation | string(3) | e.g., "COL", "FLA" |
| LogoUrl | string | |
| PrimaryColor | string | Hex color, used for rink diagram dots |
| JoinedSeasonYear | int | e.g., 1995 (year franchise joined/relocated to current city) |
| OriginalJoinYear | int | e.g., 1979 (original franchise entry, e.g., as Quebec Nordiques) |
| StanleyCupsTotal | int | |
| StanleyCupsSince1973 | int | |
| StanleyCupsSince2006 | int | |
| IsActive | bool | |

**Relationships**: Has many Players (via Roster), Personnel, Contracts, Games (as home/away), Trades (via TradeSide). Belongs to League.

**Note**: `LocationName` replaces the prior `City` field. Team alphabetical ordering uses this field throughout the site (e.g., Florida Panthers sorted under "F").

---

### FranchiseHistory

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| CurrentTeamId | int (FK → Team) | The current team this history belongs to |
| PreviousLocationName | string | e.g., "Quebec" |
| PreviousName | string | e.g., "Nordiques" |
| YearStart | int | |
| YearEnd | int | |
| SortOrder | int | Chronological order |

---

### Season

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| LeagueId | int (FK) | |
| YearStart | int | e.g., 2025 |
| YearEnd | int | e.g., 2026 |
| Label | string | e.g., "2025-26" |
| Era | string | "original-six" (≤1972), "expansion" (1973-2005), "salary-cap" (2006+) |
| IsCurrent | bool | |

**Relationships**: Has many Games, PlayerSeasons, StandingsSnapshots, Trades, ImportantDates.

---

### Player

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| ExternalId | string | ID from data provider |
| FirstName | string | |
| LastName | string | |
| DateOfBirth | DateOnly | |
| BirthCity | string | |
| BirthStateProvince | string? | |
| BirthCountry | string | |
| Height | int | Inches |
| Weight | int | Pounds |
| ShootsCatches | string(1) | "L" or "R" |
| DraftYear | int? | Null if undrafted |
| DraftRound | int? | |
| DraftPick | int? | Overall selection number |
| DraftTeamId | int? (FK → Team) | |
| CurrentTeamId | int? (FK → Team) | Null if free agent / retired |
| JerseyNumber | int? | Current jersey number |
| IsActive | bool | |
| IsEbug | bool | Emergency goaltender (FR-061a) |

**Relationships**: Has many PlayerSeasons, Contracts, PlayerHeadshots, TradeAssets. Has one PlayerStyle. Belongs to Team (current).

---

### PlayerPosition

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| PlayerId | int (FK) | |
| Position | string | C, LW, RW, LD, RD, G |
| IceTimePct5v5Last2Years | decimal | For ordering (FR-056) |
| IceTimePct5v5Last5Years | decimal | Tiebreaker |
| SortOrder | int | Computed from the above |

---

### PlayerHeadshot

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| PlayerId | int (FK) | |
| TeamId | int (FK) | Team at time of photo |
| SeasonId | int (FK) | |
| ImageUrl | string | |
| IsCurrent | bool | |

---

### PlayerStyle

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| PlayerId | int (FK, unique) | One-to-one |
| Description | string | Brief narrative of playing style |
| SupportingStats | jsonb | Array of {label, value, unit} objects (2-4 items) |

---

### PlayerSeason

Per-player, per-team, per-season stat line.

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| PlayerId | int (FK) | |
| TeamId | int (FK) | |
| SeasonId | int (FK) | |
| LeagueAbbreviation | string | "NHL", "AHL", "SHL", etc. — for Other Leagues tab |
| Era | string | "original-six", "expansion", "salary-cap" — denormalized from Season for query convenience |
| GamesPlayed | int | |
| Goals | int | |
| Assists | int | |
| Points | int | |
| PlusMinus | int | |
| Hits | int? | Null for pre-2005 eras |
| PenaltyMinutes | int | |
| TimeOnIcePerGame | decimal? | Null for pre-1998 eras |
| Shots | int? | |
| ShootingPct | decimal? | |
| BlockedShots | int? | Null for pre-2005 eras |
| EvenStrengthPoints | int? | |
| PowerPlayPoints | int? | |
| ShortHandedPoints | int? | |
| Giveaways | int? | Null for pre-2005 eras |
| Takeaways | int? | Null for pre-2005 eras |
| FaceoffPct | decimal? | |
| ShootoutPct | decimal? | |
| War | decimal? | Null if unavailable |
| XGFPer60 | decimal? | |
| XGAPer60 | decimal? | |

**Goalie-specific fields** (null for skaters):

| Field | Type | Notes |
|-------|------|-------|
| Wins | int? | |
| Losses | int? | |
| OvertimeLosses | int? | |
| SavePct | decimal? | |
| GoalsAgainstAvg | decimal? | |
| ShotsAgainst | int? | |
| Saves | int? | |
| GoalsAgainst | int? | |
| GamesStarted | int? | |
| HighDangerChances | int? | |
| HighDangerSaves | int? | |
| LowDangerChances | int? | |
| LowDangerSaves | int? | |
| GoalieGoals | int? | Rare — goalie scoring while playing goalie |
| GoalieAssists | int? | |
| IsRookie | bool | From NHL API `rookieFlag` — true for the player's rookie season |

**Unique constraint**: (PlayerId, TeamId, SeasonId, LeagueAbbreviation)

**Note**: Many stat fields are nullable to handle historical eras where they weren't tracked. Frontend displays "—" for null values.

---

### PlayerTeamHistory

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| PlayerId | int (FK) | |
| TeamId | int (FK) | |
| JerseyNumber | int | |
| SeasonStart | int | |
| SeasonEnd | int? | Null if current |

---

### PlayerAward

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| PlayerId | int (FK) | |
| TeamId | int (FK) | Team when award was won |
| SeasonId | int (FK) | |
| AwardName | string | e.g., "Hart Trophy" |

---

### Contract

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| PlayerId | int (FK) | |
| TeamId | int (FK) | |
| CapHit | decimal | Annual average value |
| TotalValue | decimal | |
| YearsTotal | int | |
| YearsRemaining | int | |
| StartSeasonId | int (FK) | |
| EndSeasonId | int (FK) | |
| SigningDate | DateOnly? | |
| ExpiryStatus | string | "UFA" or "RFA" |
| HasNoMovementClause | bool | |
| HasNoTradeClause | bool | |
| HasModifiedNoTradeClause | bool | |
| SigningBonus | decimal? | |
| PerformanceBonus | decimal? | |
| IsCurrent | bool | |
| AcquisitionType | string | "Draft", "Trade", "FreeAgent", "Waivers" |

---

### ContractYear

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| ContractId | int (FK) | |
| SeasonId | int (FK) | |
| BaseSalary | decimal | |
| SigningBonus | decimal | |
| PerformanceBonus | decimal | |
| CapHit | decimal | |

---

### Game

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| ExternalId | string | Data provider game ID |
| SeasonId | int (FK) | |
| HomeTeamId | int (FK) | |
| AwayTeamId | int (FK) | |
| ArenaId | int (FK) | |
| ScheduledStart | DateTimeOffset | UTC |
| GameDateLocal | DateOnly | The "game day" in UTC-8 for display grouping |
| Status | string | "Scheduled", "Live", "Final", "Postponed", "Cancelled" |
| CurrentPeriod | int? | For live games: current period number |
| CurrentPeriodLabel | string? | "1st", "2nd", "3rd", "OT", "2OT", "SO" |
| PeriodTimeRemaining | string? | e.g., "14:22" — for live ticker |
| PeriodTimeRemainingSeconds | int? | Numeric for client-side countdown |
| ClockRunning | bool | Whether the game clock is currently ticking (false during stoppages) |
| ClockLastSyncedAt | DateTimeOffset? | Server timestamp of last clock sync — used with PeriodTimeRemainingSeconds for client interpolation |
| RescheduledDate | DateOnly? | If postponed |
| HomeScore | int? | |
| AwayScore | int? | |
| HomeShotsOnGoal | int? | |
| AwayShotsOnGoal | int? | |
| HomeHits | int? | |
| AwayHits | int? | |
| HomeFaceoffPct | decimal? | |
| AwayFaceoffPct | decimal? | |
| HomePowerPlayGoals | int? | |
| HomePowerPlayOpps | int? | |
| AwayPowerPlayGoals | int? | |
| AwayPowerPlayOpps | int? | |
| HomeGiveaways | int? | |
| AwayGiveaways | int? | |
| HomeTakeaways | int? | |
| AwayTakeaways | int? | |
| HomeTimeOnAttack | TimeSpan? | Time of possession |
| AwayTimeOnAttack | TimeSpan? | |
| IsOvertime | bool | |
| IsShootout | bool | |
| SeriesStatus | string? | Playoff series status from NHL API (e.g. "COL 3 - LAK 0"), null for regular season |
| LastUpdated | DateTimeOffset | For "Data as of" indicator |

**Relationships**: Has many GameEvents, GamePlayerStats, GamePeriodScores. Belongs to Season, Arena, HomeTeam, AwayTeam.

**Note**: `CurrentPeriod`, `CurrentPeriodLabel`, `PeriodTimeRemaining`, `PeriodTimeRemainingSeconds` are populated only for live games and power the live score ticker (FR-006b).

---

### GamePeriodScore

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| GameId | int (FK) | |
| Period | int | 1, 2, 3, 4 (OT), 5 (SO), etc. |
| PeriodLabel | string | "1st", "2nd", "3rd", "OT", "2OT", "SO" |
| HomeGoals | int | |
| AwayGoals | int | |
| HomeShots | int | |
| AwayShots | int | |

---

### GameEvent

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| GameId | int (FK) | |
| EventType | string | "Goal", "Penalty", "Shot", "Hit", "Giveaway", "Takeaway" |
| Period | int | |
| GameClockTime | string | e.g., "12:57" — time remaining |
| TeamId | int (FK) | Team that performed the action |
| PrimaryPlayerId | int (FK) | Scorer, penalty-taker, hitter, etc. |
| SecondaryPlayerId | int? (FK) | Primary assist, hit recipient, etc. |
| TertiaryPlayerId | int? (FK) | Secondary assist |
| CoordinateX | decimal? | Feet from center ice |
| CoordinateY | decimal? | Feet from center ice |
| VideoUrl | string? | Embed URL if available |
| HasVideo | bool | For rendering the video indicator dot (FR-037) |
| ReviewStatus | string | "Confirmed", "UnderReview", "Overturned" — tracks event review state |
| Description | string? | Short text description |

**Goal-specific fields**:

| Field | Type | Notes |
|-------|------|-------|
| GoalNumber | int? | Scorer's season goal count including this one |
| Assist1Number | int? | Primary assister's season assist count |
| Assist2Number | int? | Secondary assister's season assist count |
| IsPowerPlay | bool | |
| IsShortHanded | bool | |
| IsEmptyNet | bool | |
| IsGameWinning | bool | |

**Penalty-specific fields**:

| Field | Type | Notes |
|-------|------|-------|
| PenaltyType | string? | e.g., "Tripping" |
| PenaltyMinutes | int? | |
| PlayerSeasonPIM | int? | Player's season PIM total including this one |
| RuleBookReference | string? | Rule number for linking to rule book |

---

### GamePlayerStat

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| GameId | int (FK) | |
| PlayerId | int (FK) | |
| TeamId | int (FK) | |
| IsHome | bool | |
| JerseyNumber | int | |
| Position | string | Position played in this game |
| Goals | int | |
| Assists | int | |
| Points | int | |
| PlusMinus | int | |
| Hits | int | |
| PenaltyMinutes | int | |
| TimeOnIce | TimeSpan | |
| Shots | int | |
| Giveaways | int | |
| Takeaways | int | |
| War | decimal? | |
| XGFPer60 | decimal? | |
| FaceoffPct | decimal? | Last in column order per spec (FR-031) |

**Goalie game stats** (separate or nullable fields):

| Field | Type | Notes |
|-------|------|-------|
| ShotsAgainst | int? | |
| Saves | int? | |
| SavePct | decimal? | |
| HighDangerChances | int? | |
| HighDangerSaves | int? | |
| LowDangerChances | int? | |
| LowDangerSaves | int? | |

---

### Arena

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| Name | string | e.g., "Ball Arena" |
| City | string | |
| HomeTeamId | int? (FK) | |
| IceWidthFeet | decimal | Standard: 85 |
| IceLengthFeet | decimal | Standard: 200 |
| HomeBenchSide | string | "Left" or "Right" relative to TV view |
| AwayBenchSide | string | |
| PenaltyBoxSide | string | "Left" or "Right" — which side penalty boxes are on |
| LayoutJson | jsonb? | Arena stand/bench/penalty box layout. Null = use default symmetric layout with gray seats |

**Relationships**: Has many Games.

**Note on LayoutJson**: Stores the full arena bowl layout as a JSON document with sections (SVG path data, section names, seat colors), bench positions, and penalty box positions. When null, the Angular component renders a generic symmetric arena with gray seats. The JSON schema includes:
- `sections[]`: Each with `id`, `name`, `level`, `path` (SVG path data), `seatColor` (hex or null)
- `benchPositions`: Home and away bench coordinates
- `penaltyBoxes`: Home and away penalty box coordinates
- Stand sections are rendered as SVG `<path>` elements with an SVG `<pattern>` for seat texture. If `seatColor` is null for a section, it renders in washed-out gray (#D3D3D3).

---

### StandingsSnapshot

Denormalized standings computed and cached on each sync.

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| SeasonId | int (FK) | |
| TeamId | int (FK) | |
| Division | string | e.g., "Central" |
| Conference | string | e.g., "Western" |
| GamesPlayed | int | |
| Wins | int | |
| Losses | int | |
| OvertimeLosses | int | |
| Points | int | |
| PointsPct | decimal | PTS% — primary ranking metric |
| RegulationWins | int | |
| RegulationPlusOTWins | int | ROW |
| GoalsFor | int | |
| GoalsAgainst | int | |
| GoalDifferential | int | |
| PowerPlayPct | decimal | |
| PenaltyKillPct | decimal | |
| FaceoffPct | decimal? | Team FO% — added per FR-039 |
| WildCardRank | int? | Computed |
| DivisionRank | int | |
| ConferenceRank | int | |
| LeagueRank | int | |
| ClinchIndicator | string? | From NHL API: x=playoffs, y=division, z=conference, p=presidents, e=eliminated |
| LastUpdated | DateTimeOffset | |

**Unique constraint**: (SeasonId, TeamId)

---

### Trade

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| SeasonId | int (FK) | |
| TradeDate | DateOnly | |
| OriginTradeId | int? (FK → Trade) | For trade tree: the trade this one stems from (forward direction) |
| Description | string? | Summary text |
| IsPartial | bool | True when confirmed but details incomplete — "More information is still processing" |
| LastUpdated | DateTimeOffset | |

**Relationships**: Has many TradeSides, TradeAssets. Self-references via OriginTradeId for trade trees. Bidirectional traversal via OriginTradeId (ancestors) and TradeAsset.SubsequentTradeId (descendants).

---

### TradeSide

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| TradeId | int (FK) | |
| TeamId | int (FK) | |
| Direction | string | "Acquired" or "Traded" |

---

### TradeAsset

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| TradeId | int (FK) | |
| TradeSideId | int (FK) | |
| AssetType | string | "Player", "DraftPick", "FutureConsiderations", "Cash" |
| PlayerId | int? (FK) | If AssetType = Player |
| DraftPickYear | int? | If AssetType = DraftPick |
| DraftPickRound | int? | |
| DraftPickOriginalTeamId | int? (FK → Team) | Whose pick it originally was |
| Description | string? | e.g., "2027 3rd round pick (originally BOS)" |
| SubsequentTradeId | int? (FK → Trade) | If this asset was later re-traded (descendant direction) |
| PriorTradeAssetId | int? (FK → TradeAsset) | If this asset came from a prior trade (ancestor direction) |

**Note**: Bidirectional trade tree traversal uses:
- **Descendants**: Follow `SubsequentTradeId` chains forward in time
- **Ancestors**: Follow `PriorTradeAssetId` chains backward in time, plus `Trade.OriginTradeId`
- Server builds the full graph using recursive CTEs in both directions (FR-069)
- The `TradeEdge` junction table (below) normalizes these relationships for efficient symmetric traversal

---

### TradeEdge

Derived junction table normalizing trade graph relationships for efficient bidirectional recursive CTE traversal. Maintained in sync with `Trade.OriginTradeId` and `TradeAsset.SubsequentTradeId`.

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| ParentTradeId | int (FK → Trade) | The earlier trade |
| ChildTradeId | int (FK → Trade) | The later trade |
| TradeAssetId | int? (FK → TradeAsset) | The specific asset linking them (null for origin-chain-only links) |
| LinkType | string | "AssetRetraded" or "OriginChain" |

**Unique constraint**: (ParentTradeId, ChildTradeId)
**Indexes**: (ChildTradeId) for ancestor lookups, (ParentTradeId) for descendant lookups

---

### ImportantDate

League-level important dates for the schedule page (FR-045b, FR-045c).

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| SeasonId | int (FK) | |
| LeagueId | int (FK) | |
| Date | DateOnly | |
| Label | string | e.g., "Trade Deadline" |
| Type | string | "trade-deadline", "free-agent-deadline", "offer-sheet-deadline", "arbitration-deadline", "all-star", "bye-week", "draft", "season-start", "season-end", "playoffs-start" |
| Description | string? | Optional longer description |

---

### Personnel

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| FirstName | string | |
| LastName | string | |
| TeamId | int (FK) | Current team |
| Role | string | "Coach", "GM", "Scout", "Trainer", "EquipmentManager", "Owner" |
| Title | string | Specific title, e.g., "Head Coach", "Assistant GM" |
| IsActive | bool | |
| FormerPlayerId | int? (FK → Player) | If they had a playing career |

**Relationships**: Has many PersonnelHistory entries, PersonnelAwards.

---

### PersonnelHistory

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| TeamId | int (FK) | |
| Role | string | Same role category |
| Title | string | |
| PersonnelId | int? (FK) | If person is in our system |
| PersonnelName | string | For historical figures not in the system |
| YearStart | int | |
| YearEnd | int? | Null if current |
| SortOrder | int | Reverse chronological |

---

### PersonnelAward

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| PersonnelId | int (FK) | |
| AwardName | string | |
| Year | int | |

---

### RuleBookEntry

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| RuleNumber | string | e.g., "Rule 57" |
| Title | string | e.g., "Tripping" |
| OfficialText | string | Full rule text |
| PlainLanguageText | string | Accessible explanation |
| Section | string | Category for navigation |

---

### SalaryCapInfo (derived/cached)

Team-level salary cap summary, computed from Contract data and cached.

| Field | Type | Notes |
|-------|------|-------|
| Id | int (PK) | |
| TeamId | int (FK, unique) | |
| SeasonId | int (FK) | |
| PlayersOnCap | int | |
| TotalCapUsed | decimal | |
| CapAvailable | decimal | |
| LTIRCapSpace | decimal | |
| LastUpdated | DateTimeOffset | |

---

## Indexes

Key indexes for query performance:

- `Game`: (GameDateLocal, SeasonId), (HomeTeamId), (AwayTeamId), (Status), (Status) WHERE Status = 'Live'
- `GameEvent`: (GameId, EventType), (GameId, Period), (GameId, ReviewStatus)
- `GamePlayerStat`: (GameId, TeamId), (PlayerId)
- `PlayerSeason`: (PlayerId, SeasonId), (TeamId, SeasonId), (LeagueAbbreviation, SeasonId, Goals DESC) for stats page sorting
- `StandingsSnapshot`: (SeasonId, PointsPct DESC)
- `Trade`: (SeasonId, TradeDate DESC), (OriginTradeId)
- `TradeAsset`: (TradeId), (PlayerId), (SubsequentTradeId), (PriorTradeAssetId)
- `Contract`: (PlayerId, IsCurrent), (TeamId, IsCurrent)
- `Personnel`: (TeamId, Role)
- `ImportantDate`: (SeasonId, Date)
- `TradeEdge`: (ParentTradeId), (ChildTradeId), (ParentTradeId, ChildTradeId) unique
- `Player`: GIN index on (FirstName || ' ' || LastName) for full-text search

---

## State Transitions

### Game.Status
```
Scheduled → Live → Final
Scheduled → Postponed → Scheduled (with RescheduledDate)
Scheduled → Cancelled
```

### GameEvent.ReviewStatus
```
"Confirmed" (default — event accepted)
"UnderReview" → "Confirmed" (event upheld after review)
"UnderReview" → "Overturned" (event reversed — kept for historical record, marked as not counting)
```

### Contract.IsCurrent
```
true → false (when new contract signed, player bought out, or contract expires)
```

### Player.IsActive
```
true → false (retirement, moved to non-tracked league)
```

### Trade.IsPartial
```
true → false (when all trade details become available)
```

---

## Era Classification

Historical data uses three eras for visual differentiation (background shading/separator lines):

| Era | Years | Key Characteristics |
|-----|-------|-------------------|
| `original-six` | ≤ 1972 | 6–15 teams, limited stat tracking |
| `expansion` | 1973–2005 | Major expansion, pre-salary cap |
| `salary-cap` | 2006–present | Salary cap era, modern analytics |

Stats unavailable by era:
- **Pre-1998**: TOI not tracked → `TimeOnIcePerGame` null
- **Pre-2005**: Hits, blocks, giveaways, takeaways not tracked → respective fields null
- **All eras**: WAR, xGF/60, xGA/60 depend on analytics provider → null until integrated
