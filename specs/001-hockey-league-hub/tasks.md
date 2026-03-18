# Tasks: Hockey League Information Hub

**Input**: Design documents from `/specs/001-hockey-league-hub/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted. Add via TDD approach if desired.

**Organization**: Tasks grouped by user story (P1–P11) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/HockeyHub.Api/`
- **Backend tests**: `backend/tests/HockeyHub.Api.Tests/`
- **Frontend**: `frontend/src/app/`
- **Frontend tests**: `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and containerized services

- [ ] T001 Create repository structure with `backend/` and `frontend/` top-level directories per plan.md
- [ ] T002 Initialize .NET 10 Web API project at `backend/src/HockeyHub.Api/` with ASP.NET Core, EF Core 10 (Npgsql), Hangfire, SignalR, and Redis packages
- [ ] T003 Initialize Angular 19 project at `frontend/` with SSR, Angular CDK, RxJS, and Tailwind CSS v3
- [ ] T004 [P] Create `docker-compose.yml` at repository root with PostgreSQL 16 and Redis 7 services
- [ ] T005 [P] Configure Tailwind CSS with antique-book design tokens (light/dark mode CSS custom properties, era tints) in `frontend/src/styles/`
- [ ] T006 [P] Self-host Courier Prime font files (Latin subset, WOFF2) in `frontend/src/assets/fonts/` and configure as `--font-primary` CSS custom property

---

## Phase 1B: UI Prototyping (Static HTML/CSS Mockups)

**Purpose**: Generate standalone HTML/CSS mockups for design review before building Angular components. Each mockup is a self-contained HTML file using the Courier Prime font and antique-book design tokens from Phase 1 (T005/T006). Review and iterate on visual design before committing to implementation.

**Depends on**: T005 (Tailwind/design tokens) and T006 (Courier Prime font)

**Output**: `docs/mockups/` — standalone HTML files viewable in any browser

- [ ] M001 [P] Create global shell mockup (black banner with site name + search bar + hamburger icon, secondary nav bar with sections in order: Scores/Standings/Stats/Players/Teams/Schedule/Salary Cap/Trades/Free Agents/Personnel, static score bar between banner and nav with separate game boxes and left/right arrow scroll buttons when overflow occurs, each score box clickable to Game Hub, hamburger menu flyout with Account/Settings/League Selector/dark mode toggle, all game times/final labels white and bold matching team abbreviation weight, close-game clocks in red when ≤5 min and ≤2 goal difference) showing both light and dark modes in `docs/mockups/01-global-shell.html`
- [ ] M002 [P] Create scores page mockup (4-column score box grid with: collapsed boxes showing away-above-home/scores-right/SOG/record/rank, one expanded box showing period-by-period goals box score + shots on goal box score + vertical stat column PP/HIT/FO%/TK/GV/TOP + away goal/penalty summaries LEFT of stats + home goal/penalty summaries RIGHT of stats, single box per game that expands in-place with other small boxes flowing beside it, pregame collapsed boxes matching active game compact format with expanded view showing top scorers/goalies/PP%/PK%/H2H with W/OTW/SOW per team for season and W/OTW/SOW/T per team all-time, calendar date picker, Game Hub link) in `docs/mockups/02-scores-page.html`
- [ ] M003 [P] Create data table mockup (standings-style table with: all stat columns GP/W/L/OTL/PTS/PTS%/RW/ROW/GF/GA/DIFF/PP%/PK%/FO%, alternating row shading, stat abbreviation hover tooltips, sortable column headers with sort indicator, wild card grouping with division/conference headers, era background tints for Original Six/Expansion/Salary Cap rows, pagination controls) in `docs/mockups/03-data-tables.html`
- [ ] M004 Create Game Hub mockup (Team Stats tab: box score by period at top, away-left/home-right with central stat column SOG/HIT/PP/FO/GV/TK/TOI, goal summaries left/right with period/time/scorer/assists/video hover, penalty summaries below with rule book link, official score sheet; Player Stats tab: side-by-side skater grids with FO% last, goalie section with separate header; pending event with amber pulsing treatment) in `docs/mockups/04-game-hub.html`
- [ ] M005 Create rink diagram mockup (SVG rink with accurate dimensions/measurements, penalty boxes, home/away bench labels, arena stands with seat-color sections and gray fallback, event dots in team colors, goal dots half-green/half-team, small black video indicator dot inside colored dot, hover tooltip showing action/player/time, switchable view buttons for goals/shots/hits/giveaways/takeaways) in `docs/mockups/05-rink-diagram.html`
- [ ] M006 [P] Create team profile mockup (team logo top-left, current record beside, all-time record below, joined year, franchise history timeline, Stanley Cups right side total/since-1973/since-2006; roster table with number/position/handedness/birth place/DOB/draft year/years; depth chart with forward lines LW-C-RW, defense pairings LD-RD, goalies in clean boxes, injured/scratched section, stats view vs cap view toggle) in `docs/mockups/06-team-profile.html`
- [ ] M007 [P] Create player profile mockup (headshot top-left with career gallery on hover, bio info age/birthplace/team/positions/handedness/height/weight/draft, career history with team logos + jersey numbers + awards right side, season-by-season stats table with NHL/Other/Combined tabs and era separator rows with background tints, playing style section with narrative + 2-4 supporting stats, contract section with current contract/history/trades/free agency, EBUG indicator variant) in `docs/mockups/07-player-profile.html`
- [ ] M008 Create trade tree mockup (horizontal DAG visualization: ancestor trades flowing left, focus trade centered with highlight, descendant trades flowing right, trade nodes as cards with date/team logos/asset summary, asset edges labeled with player/pick names, minimap in corner for orientation, mobile fallback as vertical timeline list) in `docs/mockups/08-trade-tree.html`
- [ ] M009 [P] Create salary cap mockup (overview: all 32 teams as cards with logo/players-on-cap/cap-used/cap-available/LTIR; team detail: per-player table with cap hit/years remaining/UFA-RFA/clauses, future projections chart, draft pick inventory; buyout calculator: player selector + year-by-year cap impact table with notes; Cap Explained: searchable guide with legal text + plain-language side by side, glossary) in `docs/mockups/09-salary-cap.html`
- [ ] M010 [P] Create schedule calendar mockup (month grid view with game days showing compact team logos, important dates with distinct badge/highlight treatment for trade deadline/free agent deadline/offer sheet deadline/arbitration deadline/All-Star/bye week, team filter dropdown, month navigation arrows, click-to-scores indication) in `docs/mockups/10-schedule-calendar.html`

**Checkpoint**: All mockups reviewed and design direction approved before proceeding to implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Warning**: No user story work can begin until this phase is complete

### Database & Backend Core

- [ ] T007 Create `HockeyHubDbContext` with connection string configuration in `backend/src/HockeyHub.Api/Data/HockeyHubDbContext.cs`
- [ ] T008 Create League entity in `backend/src/HockeyHub.Api/Models/Entities/League.cs`
- [ ] T009 [P] Create Team entity (with LocationName, PrimaryColor, Stanley Cup counts) in `backend/src/HockeyHub.Api/Models/Entities/Team.cs`
- [ ] T010 [P] Create Season entity (with Era, IsCurrent) in `backend/src/HockeyHub.Api/Models/Entities/Season.cs`
- [ ] T011 [P] Create Arena entity (with dimensions, bench sides, PenaltyBoxSide, LayoutJson) in `backend/src/HockeyHub.Api/Models/Entities/Arena.cs`
- [ ] T012 [P] Create FranchiseHistory entity in `backend/src/HockeyHub.Api/Models/Entities/FranchiseHistory.cs`
- [ ] T013 [P] Create Player entity (with IsEbug, BirthStateProvince) in `backend/src/HockeyHub.Api/Models/Entities/Player.cs`
- [ ] T014 Register all foundational entities in DbContext and create initial EF Core migration in `backend/src/HockeyHub.Api/Data/Migrations/`
- [ ] T015 Create `INhlDataProvider` interface in `backend/src/HockeyHub.Api/Providers/INhlDataProvider.cs` with methods for scores, standings, rosters, players, games, trades, schedule
- [ ] T016 Implement `NhlWebApiProvider` (api-web.nhle.com) in `backend/src/HockeyHub.Api/Providers/NhlWebApiProvider.cs` with HttpClient, rate limiting (3-5 req/s), and exponential backoff
- [ ] T017 Create Redis caching service with configurable TTLs per data type in `backend/src/HockeyHub.Api/Services/Cache/RedisCacheService.cs`
- [ ] T018 [P] Configure Hangfire with PostgreSQL storage and dashboard in `backend/src/HockeyHub.Api/Program.cs`
- [ ] T019 [P] Configure SignalR with Redis backplane in `backend/src/HockeyHub.Api/Program.cs`
- [ ] T020 Create `GameHub` SignalR hub with JoinGameGroup, LeaveGameGroup, JoinAllLiveGames methods in `backend/src/HockeyHub.Api/Hubs/GameHub.cs`
- [ ] T021 Create base API error handling middleware and `DataAsOf` response wrapper in `backend/src/HockeyHub.Api/Middleware/`
- [ ] T022 Create data seed command (`--seed`, `--seed --current-only`) in `backend/src/HockeyHub.Api/Services/Sync/DataSeedService.cs`

### Frontend Shell

- [ ] T023 Create Angular app routing structure with lazy-loaded routes for all 11 sections in `frontend/src/app/app.routes.ts`
- [ ] T024 Create black banner component (site name, search bar placeholder, hamburger menu) in `frontend/src/app/components/layout/banner/`
- [ ] T025 Create secondary navigation bar component (Scores, Standings, Stats, Players, Teams, Schedule, Salary Cap, Trades, Free Agents, Personnel) in `frontend/src/app/components/layout/nav-bar/`
- [ ] T026 [P] Create hamburger menu component (Account, Settings, League Selector, dark mode toggle) in `frontend/src/app/components/layout/hamburger-menu/`
- [ ] T027 [P] Create dark mode toggle service with localStorage persistence and `prefers-color-scheme` default in `frontend/src/app/services/theme.service.ts`
- [ ] T028 Create static score bar component (between banner and nav bar, separate game boxes with left/right arrow scroll overflow, each box clickable to Game Hub, game times/final labels in white matching team abbreviation weight, close-game clocks in red when ≤5 min remaining and ≤2 goal difference, subscribes to SignalR) in `frontend/src/app/components/layout/score-bar/`
- [ ] T029 Create SignalR service (single connection, RxJS Subjects for ScoreUpdate/ClockSync/EventUpdate/TransactionUpdate, reconnection with fallback polling) in `frontend/src/app/services/signalr.service.ts`
- [ ] T030 [P] Create shared stat-table component with alternating row shading, sortable columns, and stat abbreviation tooltips in `frontend/src/app/components/shared/stat-table/`
- [ ] T031 [P] Create shared video modal component (Angular CDK Dialog, focus trap, ESC close, angle switcher) in `frontend/src/app/components/shared/video-modal/`
- [ ] T032 [P] Create shared pagination component (50 rows/page, page controls) in `frontend/src/app/components/shared/pagination/`
- [ ] T033 [P] Create era pipe (season year → 'original-six' | 'expansion' | 'salary-cap') in `frontend/src/app/pipes/era.pipe.ts`
- [ ] T034 [P] Create time-zone pipe (UTC → visitor's detected zone) in `frontend/src/app/pipes/timezone.pipe.ts`
- [ ] T035 [P] Create main page component (league icon grid, currently NHL only) in `frontend/src/app/components/main-page/`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — View Daily Scores and Navigate Leagues (Priority: P1) — MVP

**Goal**: Visitors arrive at the main page, click NHL, and see today's scores with expandable details, pregame matchups, and a live score ticker on all league pages.

**Independent Test**: Load site → click NHL icon → verify scores page shows today's games in correct format → expand a score box → verify period breakdowns and goal/penalty summaries → verify live ticker updates during active games.

### Backend — US1

- [ ] T036 [P] [US1] Create Game entity (with CurrentPeriod, ClockRunning, ClockLastSyncedAt, all game stats) in `backend/src/HockeyHub.Api/Models/Entities/Game.cs`
- [ ] T037 [P] [US1] Create GamePeriodScore entity in `backend/src/HockeyHub.Api/Models/Entities/GamePeriodScore.cs`
- [ ] T038 [P] [US1] Create StandingsSnapshot entity (with FaceoffPct, all ranking fields) in `backend/src/HockeyHub.Api/Models/Entities/StandingsSnapshot.cs`
- [ ] T039 [US1] Add Game, GamePeriodScore, StandingsSnapshot to DbContext and create migration in `backend/src/HockeyHub.Api/Data/`
- [ ] T040 [US1] Create ScoresQueryService (get scores by date, expanded details, live scores, ticker data, pregame matchup) in `backend/src/HockeyHub.Api/Services/Queries/ScoresQueryService.cs`
- [ ] T041 [US1] Create ScoresController with GET scores, GET expanded, GET live, GET ticker, GET pregame endpoints per scores-api contract in `backend/src/HockeyHub.Api/Controllers/ScoresController.cs`
- [ ] T042 [US1] Create ScoresSyncJob (Hangfire recurring: 10-15s during live games, 5min idle) that polls NHL API, updates Redis + PostgreSQL, broadcasts via SignalR in `backend/src/HockeyHub.Api/Services/Sync/ScoresSyncJob.cs`
- [ ] T043 [US1] Create StandingsSyncJob (triggered by game status transitions Scheduled→Live, Live→Final) in `backend/src/HockeyHub.Api/Services/Sync/StandingsSyncJob.cs`

### Frontend — US1

- [ ] T044 [US1] Create scores API service (HTTP + SignalR subscription for live updates) in `frontend/src/app/services/scores-api.service.ts`
- [ ] T045 [US1] Create GameClockService (requestAnimationFrame countdown synced to server pushes) in `frontend/src/app/services/game-clock.service.ts`
- [ ] T046 [US1] Create scores page component (4-column grid, date display, calendar picker, game ordering by start time + location name) in `frontend/src/app/components/scores/scores-page/`
- [ ] T047 [US1] Create score box component (away above home, scores right, SHG, record, rank, Game Hub link, expand/collapse with exclusive open) in `frontend/src/app/components/scores/score-box/`
- [ ] T048 [US1] Create expanded score box component (period-by-period goals + shots on goal box scores, vertical stat column PP/HIT/FO%/TK/GV/TOP, away goal/penalty summaries left of stats, home goal/penalty summaries right of stats, single box per game expanding in-place, small boxes flow beside expanded box) in `frontend/src/app/components/scores/expanded-score-box/`
- [ ] T049 [US1] Create pregame matchup component (collapsed state matches active game compact format, expanded shows top scorers, starting goalies with GAA/SV%, PP%/PK%, head-to-head with W/OTW/SOW per team season and W/OTW/SOW/T per team all-time) in `frontend/src/app/components/scores/pregame-matchup/`
- [ ] T050 [US1] Implement static score bar with separate game boxes, left/right arrow scroll overflow, each box clickable to Game Hub, game times/final labels white and bold, close-game clocks red (≤5 min, ≤2 goals) in `frontend/src/app/components/layout/score-bar/`
- [ ] T051 [US1] Create calendar date picker component (navigate season dates, show results/upcoming) in `frontend/src/app/components/scores/calendar-picker/`
- [ ] T052 [US1] Create tooltip directive for season record and standings rank hover explanations in `frontend/src/app/directives/tooltip.directive.ts`

**Checkpoint**: MVP complete — scores page with live updates, expandable details, pregame matchups, and live ticker

---

## Phase 4: User Story 2 — Explore Game Details via Game Hub (Priority: P2)

**Goal**: Visitors click "Game Hub" on any score box and see detailed game info across four tabs: Team Stats, Player Stats, Rink Instances, and Lineups.

**Independent Test**: Navigate to a completed game's Game Hub → verify Team Stats tab shows box score, team stat comparison, goal/penalty summaries → switch to Player Stats and verify side-by-side grids → switch to Rink Instances and verify rink diagram with event dots.

### Backend — US2

- [ ] T053 [P] [US2] Create GameEvent entity (with ReviewStatus, HasVideo, goal/penalty-specific fields) in `backend/src/HockeyHub.Api/Models/Entities/GameEvent.cs`
- [ ] T054 [P] [US2] Create GamePlayerStat entity (with FaceoffPct last, goalie stats) in `backend/src/HockeyHub.Api/Models/Entities/GamePlayerStat.cs`
- [ ] T055 [P] [US2] Create RuleBookEntry entity in `backend/src/HockeyHub.Api/Models/Entities/RuleBookEntry.cs`
- [ ] T056 [US2] Add GameEvent, GamePlayerStat, RuleBookEntry to DbContext and create migration in `backend/src/HockeyHub.Api/Data/`
- [ ] T057 [US2] Create GameHubQueryService (team stats, player stats, rink events with arena layout) in `backend/src/HockeyHub.Api/Services/Queries/GameHubQueryService.cs`
- [ ] T058 [US2] Create GamesController with GET game, GET player-stats, GET rink-events endpoints per games-api contract in `backend/src/HockeyHub.Api/Controllers/GamesController.cs`
- [ ] T059 [US2] Create GameEventsSyncJob (syncs play-by-play during live games, handles pending/review states) in `backend/src/HockeyHub.Api/Services/Sync/GameEventsSyncJob.cs`

### Frontend — US2

- [ ] T060 [US2] Create Game Hub page component with tab navigation (Team Stats default, Player Stats, Lineups, Rink Instances) in `frontend/src/app/components/game-hub/game-hub-page/`
- [ ] T061 [US2] Create Team Stats tab (box score by period, central stat column SOG/HIT/PP/FO/GV/TK/TOI, goal summaries left/right, penalty summaries, official score sheet) in `frontend/src/app/components/game-hub/team-stats-tab/`
- [ ] T062 [US2] Create goal summary component (period/time, scorer first initial + last name with goal number, assists with assist numbers, video hover) in `frontend/src/app/components/game-hub/goal-summary/`
- [ ] T063 [US2] Create penalty summary component (period/time, offending player first initial + last name, penalty type, season PIM, rule book link, video hover) in `frontend/src/app/components/game-hub/penalty-summary/`
- [ ] T064 [US2] Create player hover card component (headshot, GP, G, A, +/-, PIM) in `frontend/src/app/components/shared/player-hover-card/`
- [ ] T065 [US2] Create Player Stats tab (side-by-side grids: away left/home right, skater stats with FO% last, goalie stats, horizontal scroll) in `frontend/src/app/components/game-hub/player-stats-tab/`
- [ ] T066 [US2] Create rink diagram SVG component using plain Angular bindings (accurately dimensioned rink via SVG viewBox, measurements, bench labels, penalty boxes, stands from LayoutJson with seat colors or gray fallback, coordinate scaling from feet to SVG units) in `frontend/src/app/components/shared/rink-diagram/`
- [ ] T067 [US2] Create Rink Instances tab (switchable views: goals/shots/hits/giveaways/takeaways, event dots positioned via Angular `[attr.cx]`/`[attr.cy]` bindings, team colors, goal dots half-green/half-team, video indicator black dot, hover tooltip, click-to-video) in `frontend/src/app/components/game-hub/rink-instances-tab/`
- [ ] T068 [US2] Create Lineups tab placeholder (tab present, content deferred per spec) in `frontend/src/app/components/game-hub/lineups-tab/`
- [ ] T069 [US2] Create pending event visual treatment (pulsing amber border for events under review) in `frontend/src/app/components/game-hub/pending-event/`

**Checkpoint**: Game Hub fully functional with all four tabs (Lineups placeholder)

---

## Phase 5: User Story 3 — View League Standings (Priority: P3)

**Goal**: Visitors see standings in wild card format (default), with division/conference/league view toggles and column sort.

**Independent Test**: Load Standings page → verify wild card format with correct team ordering → toggle to Conference view → click GF column → verify re-sort.

### Backend — US3

- [ ] T070 [US3] Create StandingsQueryService (wild card, division, conference, league views; column sorting) in `backend/src/HockeyHub.Api/Services/Queries/StandingsQueryService.cs`
- [ ] T071 [US3] Create StandingsController with GET standings endpoint (view, sort, sortDir, season params) per standings-stats-api contract in `backend/src/HockeyHub.Api/Controllers/StandingsController.cs`

### Frontend — US3

- [ ] T072 [US3] Create standings page component (view toggle buttons: wild card/division/conference/league, table with GP/W/L/OTL/PTS/PTS%/RW/ROW/GF/GA/DIFF/PP%/PK%/FO%, sortable headers, alternating rows, group headers) in `frontend/src/app/components/standings/standings-page/`
- [ ] T073 [US3] Create standings API service in `frontend/src/app/services/standings-api.service.ts`

**Checkpoint**: Standings page with all four views and column sorting

---

## Phase 6: User Story 4 — Browse League-Wide Player and Goalie Statistics (Priority: P4)

**Goal**: Visitors browse league-wide stats with section tabs (all players, all goalies, forwards, defensemen, rookie players, rookie goalies), sorting, and pagination.

**Independent Test**: Load Stats page → verify default "All Player Stats" sorted by goals → switch to "All Goalie Stats" → verify sorted by wins → click a column header → verify re-sort → navigate to page 2.

### Backend — US4

- [ ] T074 [P] [US4] Create PlayerSeason entity (with Era, all nullable historical stats, goalie fields) in `backend/src/HockeyHub.Api/Models/Entities/PlayerSeason.cs`
- [ ] T075 [US4] Add PlayerSeason to DbContext and create migration in `backend/src/HockeyHub.Api/Data/`
- [ ] T076 [US4] Create StatsQueryService (section filtering, sorting across full dataset, pagination) in `backend/src/HockeyHub.Api/Services/Queries/StatsQueryService.cs`
- [ ] T077 [US4] Create StatsController with GET stats endpoint (section, sort, sortDir, page, pageSize, season params) per standings-stats-api contract in `backend/src/HockeyHub.Api/Controllers/StatsController.cs`
- [ ] T078 [US4] Create StatsSyncJob (syncs player season stats, triggered by game events) in `backend/src/HockeyHub.Api/Services/Sync/StatsSyncJob.cs`

### Frontend — US4

- [ ] T079 [US4] Create stats page component (section tabs, stat table with all columns per spec, default sorts, pagination) in `frontend/src/app/components/stats/stats-page/`
- [ ] T080 [US4] Create stats API service in `frontend/src/app/services/stats-api.service.ts`

**Checkpoint**: Stats page with all six sections, sorting, and pagination

---

## Phase 7: User Story 5 — Explore Team Profiles, Rosters, and Depth Charts (Priority: P5)

**Goal**: Visitors see team icons sorted by location name, click one to see profile (logo, records, franchise history, Stanley Cups), roster (with birth place), and depth chart (stats/cap toggle).

**Independent Test**: Load Teams page → verify alphabetical by location name → click a team → verify profile data → check roster has birth place → toggle depth chart to cap view.

### Backend — US5

- [ ] T081 [US5] Create TeamsQueryService (index sorted by LocationName, profile with franchise history, roster with birth place, depth chart with stats/cap views, inactive section) in `backend/src/HockeyHub.Api/Services/Queries/TeamsQueryService.cs`
- [ ] T082 [US5] Create TeamsController with GET teams, GET team profile, GET roster, GET depth-chart endpoints per teams-players-api contract in `backend/src/HockeyHub.Api/Controllers/TeamsController.cs`
- [ ] T083 [US5] Create RosterSyncJob (syncs rosters, triggered by game status transitions) in `backend/src/HockeyHub.Api/Services/Sync/RosterSyncJob.cs`

### Frontend — US5

- [ ] T084 [US5] Create teams index page (team icons sorted by location name, clickable) in `frontend/src/app/components/teams/teams-index/`
- [ ] T085 [US5] Create team profile page (logo top-left, current record, all-time record, joined year, franchise history, Stanley Cups right side) in `frontend/src/app/components/teams/team-profile/`
- [ ] T086 [US5] Create team roster component (number, position, handedness, birth place, DOB, draft year, years in league) in `frontend/src/app/components/teams/team-roster/`
- [ ] T087 [US5] Create depth chart component (forward lines LW-C-RW, defense pairings LD-RD, goalies, clean boxes with position/GP/PTS or glove hand/GP/W, injured/scratched section, stats↔cap toggle, tooltips) in `frontend/src/app/components/teams/depth-chart/`
- [ ] T088 [US5] Create teams API service in `frontend/src/app/services/teams-api.service.ts`

**Checkpoint**: Teams section with index, profile, roster, and depth chart (stats + cap views)

---

## Phase 8: User Story 6 — View Player Profiles (Priority: P6)

**Goal**: Visitors see full player profiles with headshot gallery, biographical info, career history, season-by-season stats (NHL/Other/Combined), playing style, and contract/trade history. EBUGs have designated profiles.

**Independent Test**: Navigate to a player profile → hover headshot for gallery → verify biographical info → check NHL stats tab → switch to Other Leagues → verify career history with awards → check contract section with clickable trades.

### Backend — US6

- [ ] T089 [P] [US6] Create PlayerPosition entity in `backend/src/HockeyHub.Api/Models/Entities/PlayerPosition.cs`
- [ ] T090 [P] [US6] Create PlayerHeadshot entity in `backend/src/HockeyHub.Api/Models/Entities/PlayerHeadshot.cs`
- [ ] T091 [P] [US6] Create PlayerStyle entity (with jsonb SupportingStats) in `backend/src/HockeyHub.Api/Models/Entities/PlayerStyle.cs`
- [ ] T092 [P] [US6] Create PlayerTeamHistory entity in `backend/src/HockeyHub.Api/Models/Entities/PlayerTeamHistory.cs`
- [ ] T093 [P] [US6] Create PlayerAward entity in `backend/src/HockeyHub.Api/Models/Entities/PlayerAward.cs`
- [ ] T094 [US6] Add all Player-related entities to DbContext and create migration in `backend/src/HockeyHub.Api/Data/`
- [ ] T095 [US6] Create PlayersQueryService (profile with positions/headshots/style/awards/contracts, stats by tab with era tags) in `backend/src/HockeyHub.Api/Services/Queries/PlayersQueryService.cs`
- [ ] T096 [US6] Create PlayersController with GET player, GET player/stats endpoints per teams-players-api contract in `backend/src/HockeyHub.Api/Controllers/PlayersController.cs`

### Frontend — US6

- [ ] T097 [US6] Create player profile page (headshot top-left with career gallery on hover, bio info, career history with awards right side, EBUG indicator) in `frontend/src/app/components/players/player-profile/`
- [ ] T098 [US6] Create player stats tabs component (NHL default, Other Leagues, Combined; season-by-season with era separators and era background tints) in `frontend/src/app/components/players/player-stats-tabs/`
- [ ] T099 [US6] Create player style section (narrative description, 2-4 supporting stats) in `frontend/src/app/components/players/player-style/`
- [ ] T100 [US6] Create player contract section (current contract, contract history, trade history with clickable trades, free agency history, link to salary cap page) in `frontend/src/app/components/players/player-contract/`
- [ ] T101 [US6] Create players API service in `frontend/src/app/services/players-api.service.ts`

**Checkpoint**: Player profiles with full biographical info, career stats, style, and contract history

---

## Phase 9: User Story 7 — Browse Salary Cap Information (Priority: P7)

**Goal**: Visitors see all teams' cap overview, click a team for detailed per-player cap allocation with buyout calculator, and browse the Salary Cap Explained guide.

**Independent Test**: Load Salary Cap page → verify all 32 teams with cap info → click a team → verify per-player details with clauses → use buyout calculator → search the Cap Explained guide.

### Backend — US7

- [ ] T102 [P] [US7] Create Contract entity in `backend/src/HockeyHub.Api/Models/Entities/Contract.cs`
- [ ] T103 [P] [US7] Create ContractYear entity in `backend/src/HockeyHub.Api/Models/Entities/ContractYear.cs`
- [ ] T104 [P] [US7] Create SalaryCapInfo entity (derived/cached per team) in `backend/src/HockeyHub.Api/Models/Entities/SalaryCapInfo.cs`
- [ ] T105 [US7] Add Contract, ContractYear, SalaryCapInfo to DbContext and create migration in `backend/src/HockeyHub.Api/Data/`
- [ ] T106 [US7] Create SalaryCapQueryService (league overview, team detail with projections/picks, player detail with year-by-year) in `backend/src/HockeyHub.Api/Services/Queries/SalaryCapQueryService.cs`
- [ ] T107 [US7] Create BuyoutCalculatorService (CBA formulas: age-based 2/3 or 1/3, bonus handling, year-by-year cap impact) in `backend/src/HockeyHub.Api/Services/Calculator/BuyoutCalculatorService.cs`
- [ ] T108 [US7] Create SalaryCapController with GET league cap, GET team cap, GET player cap, POST buyout-calculator, GET cap-explained endpoints per salary-cap-api contract in `backend/src/HockeyHub.Api/Controllers/SalaryCapController.cs`

### Frontend — US7

- [ ] T109 [US7] Create salary cap overview page (all teams with logo, players on cap, cap used, cap available, LTIR space) in `frontend/src/app/components/salary-cap/cap-overview/`
- [ ] T110 [US7] Create team cap detail page (per-player: cap hit, years remaining, UFA/RFA, clauses; future projections; draft picks) in `frontend/src/app/components/salary-cap/team-cap-detail/`
- [ ] T111 [US7] Create buyout calculator component (select player, display year-by-year cap impact table with notes) in `frontend/src/app/components/salary-cap/buyout-calculator/`
- [ ] T112 [US7] Create player salary cap page (complete contract history, detailed current contract with year-by-year) in `frontend/src/app/components/salary-cap/player-cap-detail/`
- [ ] T113 [US7] Create Salary Cap Explained page (searchable guide, glossary, plain-language + legal terminology side by side) in `frontend/src/app/components/salary-cap/cap-explained/`
- [ ] T114 [US7] Create salary cap API service in `frontend/src/app/services/salary-cap-api.service.ts`

**Checkpoint**: Salary Cap section with overview, team detail, buyout calculator, and Cap Explained guide

---

## Phase 10: User Story 8 — View Trade History and Trade Trees (Priority: P8)

**Goal**: Visitors browse trades by season/team, search by player, and view bidirectional trade trees tracing both prior and subsequent transactions.

**Independent Test**: Load Trades page → verify current season trades most-recent first → filter by team → search for a player → click a trade → verify bidirectional trade tree with clickable nodes.

### Backend — US8

- [ ] T115 [P] [US8] Create Trade entity (with IsPartial, OriginTradeId) in `backend/src/HockeyHub.Api/Models/Entities/Trade.cs`
- [ ] T116 [P] [US8] Create TradeSide entity in `backend/src/HockeyHub.Api/Models/Entities/TradeSide.cs`
- [ ] T117 [P] [US8] Create TradeAsset entity (with SubsequentTradeId, PriorTradeAssetId) in `backend/src/HockeyHub.Api/Models/Entities/TradeAsset.cs`
- [ ] T118 [P] [US8] Create TradeEdge junction table entity in `backend/src/HockeyHub.Api/Models/Entities/TradeEdge.cs`
- [ ] T119 [US8] Add all Trade-related entities to DbContext and create migration in `backend/src/HockeyHub.Api/Data/`
- [ ] T120 [US8] Create TradeTreeService (bidirectional recursive CTE traversal: ancestors via ChildTradeId→ParentTradeId, descendants via ParentTradeId→ChildTradeId, depth limit 20, graph assembly) in `backend/src/HockeyHub.Api/Services/Calculator/TradeTreeService.cs`
- [ ] T121 [US8] Create TradesQueryService (list with filters/search, trade detail with bidirectional tree) in `backend/src/HockeyHub.Api/Services/Queries/TradesQueryService.cs`
- [ ] T122 [US8] Create TradesController with GET trades, GET trade detail (with tree) endpoints per trades-free-agents-api contract in `backend/src/HockeyHub.Api/Controllers/TradesController.cs`
- [ ] T123 [US8] Create TradesSyncJob (60s during trade deadline, 15min otherwise; handles partial info) in `backend/src/HockeyHub.Api/Services/Sync/TradesSyncJob.cs`

### Frontend — US8

- [ ] T124 [US8] Create trades list page (season filter, team filter, player search, paginated, most-recent first) in `frontend/src/app/components/trades/trades-list/`
- [ ] T125 [US8] Create trade detail page (all trade info, bidirectional trade tree visualization) in `frontend/src/app/components/trades/trade-detail/`
- [ ] T126 [US8] Create trade tree visualization component (server-computed node positions, plain Angular SVG rendering, horizontal timeline: ancestors left/focus center/descendants right, CSS-based pan/zoom via overflow + transform scale, clickable nodes, mobile fallback to vertical list) in `frontend/src/app/components/trades/trade-tree/`
- [ ] T127 [US8] Create trade node component (date, team logos, asset summary, SVG foreignObject, focus-trade highlight) in `frontend/src/app/components/trades/trade-node/`
- [ ] T128 [US8] Create trades API service (with SignalR subscription for TransactionUpdate) in `frontend/src/app/services/trades-api.service.ts`

**Checkpoint**: Trades section with filtered list, detail page, and bidirectional trade tree visualization

---

## Phase 11: User Story 9 — Browse Free Agent Listings (Priority: P9)

**Goal**: Visitors see pending free agents (sorted by cap hit) and recent signings, with clickable navigation to salary cap pages.

**Independent Test**: Load Free Agents page → verify pending tab sorted by cap hit → switch to recent signings → click a signing → verify navigation to player salary cap page with contract auto-expanded.

### Backend — US9

- [ ] T129 [US9] Create FreeAgentsQueryService (pending with full player stats, recent signings) in `backend/src/HockeyHub.Api/Services/Queries/FreeAgentsQueryService.cs`
- [ ] T130 [US9] Create FreeAgentsController with GET free-agents endpoint (tab, sort, pagination) per trades-free-agents-api contract in `backend/src/HockeyHub.Api/Controllers/FreeAgentsController.cs`
- [ ] T131 [US9] Create FreeAgentsSyncJob (syncs with trades, handles partial signing info) in `backend/src/HockeyHub.Api/Services/Sync/FreeAgentsSyncJob.cs`

### Frontend — US9

- [ ] T132 [US9] Create free agents page (pending tab with RFA/UFA, cap hit, team, all player stats, sortable; recent signings tab with click-to-salary-cap navigation) in `frontend/src/app/components/free-agents/free-agents-page/`
- [ ] T133 [US9] Create free agents API service in `frontend/src/app/services/free-agents-api.service.ts`

**Checkpoint**: Free Agents section with both tabs and salary cap navigation

---

## Phase 12: User Story 10 — View Hockey Personnel Database (Priority: P10)

**Goal**: Visitors browse team staff organized by role (coaches, GMs, scouts, trainers, equipment managers, owners), with profiles showing awards, stats, predecessor history, and playing career links.

**Independent Test**: Load Personnel page for a team → verify staff organized by role → click a coach → verify profile with stats, awards, predecessor list → verify playing career link if applicable.

### Backend — US10

- [ ] T134 [P] [US10] Create Personnel entity in `backend/src/HockeyHub.Api/Models/Entities/Personnel.cs`
- [ ] T135 [P] [US10] Create PersonnelHistory entity in `backend/src/HockeyHub.Api/Models/Entities/PersonnelHistory.cs`
- [ ] T136 [P] [US10] Create PersonnelAward entity in `backend/src/HockeyHub.Api/Models/Entities/PersonnelAward.cs`
- [ ] T137 [US10] Add Personnel entities to DbContext and create migration in `backend/src/HockeyHub.Api/Data/`
- [ ] T138 [US10] Create PersonnelQueryService (team staff by role in specified order, profile with stats/awards/predecessors) in `backend/src/HockeyHub.Api/Services/Queries/PersonnelQueryService.cs`
- [ ] T139 [US10] Create PersonnelController with GET team personnel, GET personnel profile endpoints per personnel-api contract in `backend/src/HockeyHub.Api/Controllers/PersonnelController.cs`

### Frontend — US10

- [ ] T140 [US10] Create personnel page (staff organized by role sections: Coaches, GMs, Scouts, Trainers, Equipment Managers, Owners) in `frontend/src/app/components/personnel/personnel-page/`
- [ ] T141 [US10] Create personnel profile component (bio, title, awards, career stats, predecessor history in reverse chronological order, playing career link) in `frontend/src/app/components/personnel/personnel-profile/`
- [ ] T142 [US10] Create personnel API service in `frontend/src/app/services/personnel-api.service.ts`

**Checkpoint**: Personnel section with role-organized staff and detailed profiles

---

## Phase 13: User Story 11 — View Season Schedule (Priority: P11)

**Goal**: Visitors see the full season schedule in calendar format with important dates (trade deadline, free agent deadline, offer sheet deadline, arbitration deadline, All-Star break, bye weeks) prominently marked.

**Independent Test**: Load Schedule page → verify calendar shows games → verify trade deadline is prominently marked → filter by team → click a game date → verify navigation to scores page.

### Backend — US11

- [ ] T143 [P] [US11] Create ImportantDate entity in `backend/src/HockeyHub.Api/Models/Entities/ImportantDate.cs`
- [ ] T144 [US11] Add ImportantDate to DbContext and create migration in `backend/src/HockeyHub.Api/Data/`
- [ ] T145 [US11] Create ScheduleQueryService (season schedule by month, important dates, team filter) in `backend/src/HockeyHub.Api/Services/Queries/ScheduleQueryService.cs`
- [ ] T146 [US11] Create ScheduleController with GET schedule endpoint (season, month, team params) per schedule-api contract in `backend/src/HockeyHub.Api/Controllers/ScheduleController.cs`
- [ ] T147 [US11] Create ScheduleSyncJob (syncs season schedule and seeds important dates) in `backend/src/HockeyHub.Api/Services/Sync/ScheduleSyncJob.cs`

### Frontend — US11

- [ ] T148 [US11] Create schedule page component (month-by-month calendar grid, game days with compact team logos, important dates with distinct visual treatment, team filter, month navigation, click-to-scores navigation) in `frontend/src/app/components/schedule/schedule-page/`
- [ ] T149 [US11] Create schedule API service in `frontend/src/app/services/schedule-api.service.ts`

**Checkpoint**: Schedule page with calendar, important dates, and team filtering

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Global Search

- [ ] T150 Create SearchQueryService (PostgreSQL full-text search with trigram indexing, scoped to league, grouped by entity type, favor most-searched categories) in `backend/src/HockeyHub.Api/Services/Queries/SearchQueryService.cs`
- [ ] T151 Create SearchController with GET leagues/{leagueId}/search endpoint per search-api contract in `backend/src/HockeyHub.Api/Controllers/SearchController.cs`
- [ ] T152 Create global search dropdown component (as-you-type, grouped results by entity type, clickable links, <200ms response, no search on main page) in `frontend/src/app/components/search/search-dropdown/`

### Universal Cross-Linking

- [ ] T153 Create entity link directive (any mention of player/coach/team/GM/trade/season clickable to entity page) in `frontend/src/app/directives/entity-link.directive.ts`
- [ ] T154 Audit all components for cross-linking completeness (FR-007) — verify every entity mention is clickable across all pages

### Accessibility (WCAG 2.1 AA)

- [ ] T155 [P] Create accessible rink diagram table alternative (companion data table below SVG with same event data) in `frontend/src/app/components/shared/rink-diagram/rink-data-table/`
- [ ] T156 [P] Add `aria-describedby` to all stat abbreviations linking to visually hidden full names across all stat tables
- [ ] T157 [P] Add `aria-live="polite"` to live score ticker for screen reader announcements
- [ ] T158 Add keyboard navigation to rink diagram (Tab between dots, Enter/Space to open video, Escape to close modal) in `frontend/src/app/components/shared/rink-diagram/`
- [ ] T159 Run axe-core accessibility audit via Playwright E2E tests across all pages in `frontend/tests/e2e/`

### Historical Data & Eras

- [ ] T160 Create StatAvailability reference table and seed with stat-by-era availability matrix in `backend/src/HockeyHub.Api/Data/`
- [ ] T161 [P] Create HistoricalDataSeedJob (phased: salary cap era first, then expansion, then Original Six) in `backend/src/HockeyHub.Api/Services/Sync/HistoricalDataSeedJob.cs`
- [ ] T162 [P] Implement era separator rows and background tints in player stats tables using data-era attributes and CSS custom properties in `frontend/src/app/components/players/player-stats-tabs/`

### Responsive Design

- [ ] T163 Verify all grid layouts (score boxes, stat tables, depth charts, trade trees) reflow to single-column/scrollable on mobile viewports across all components

### Performance

- [ ] T164 [P] Add Redis caching to all query services with appropriate TTLs (10s live, 1h standings, 3h stats) in `backend/src/HockeyHub.Api/Services/Queries/`
- [ ] T165 [P] Add `Cache-Control` headers to all API responses matching tiered refresh cadences in `backend/src/HockeyHub.Api/Middleware/`
- [ ] T166 Verify Angular SSR renders all pages correctly (client-only defer for rink diagram and trade tree) in `frontend/`

### Final Validation

- [ ] T167 Run quickstart.md validation — verify all setup steps work end-to-end
- [ ] T168 Verify all success criteria (SC-001 through SC-017) from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **UI Prototyping (Phase 1B)**: Depends on T005 + T006 (design tokens + font). Can run in parallel with Phase 2 backend tasks. REVIEW mockups before implementing frontend components.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–13)**: All depend on Foundational phase completion + design approval from Phase 1B
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → ... → P11)
- **Polish (Phase 14)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1) Scores**: Can start after Foundational — No dependencies on other stories
- **US2 (P2) Game Hub**: Can start after Foundational — Requires Game entity from US1 (T036-T039)
- **US3 (P3) Standings**: Can start after Foundational — Uses StandingsSnapshot from US1 (T038)
- **US4 (P4) Stats**: Can start after Foundational — Independent
- **US5 (P5) Teams**: Can start after Foundational — Independent
- **US6 (P6) Players**: Can start after Foundational — Benefits from PlayerSeason (US4, T074)
- **US7 (P7) Salary Cap**: Can start after Foundational — Independent
- **US8 (P8) Trades**: Can start after Foundational — Independent
- **US9 (P9) Free Agents**: Depends on US7 (contracts/cap data) for salary cap navigation
- **US10 (P10) Personnel**: Can start after Foundational — Independent
- **US11 (P11) Schedule**: Can start after Foundational — Independent

### Within Each User Story

- Entities/models before services
- Services before controllers/endpoints
- Backend endpoints before frontend pages
- Core implementation before integration features

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational completes, US1/US3/US4/US5/US7/US8/US10/US11 can all start in parallel
- Entity creation tasks within a story marked [P] can run in parallel
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch backend entity creation in parallel:
Task T036: "Create Game entity"
Task T037: "Create GamePeriodScore entity"
Task T038: "Create StandingsSnapshot entity"

# Then sequentially: migration → services → controllers
Task T039: "Add to DbContext and create migration"
Task T040-T043: "Services and sync jobs"

# Launch frontend components in parallel (after backend endpoints exist):
Task T044: "Scores API service"
Task T045: "GameClockService"
Task T046-T051: "Page and component creation"
```

---

## Parallel Example: Multi-Story

```bash
# After Foundational completes, launch multiple stories in parallel:
Developer A: US1 (Scores) — T036-T052
Developer B: US5 (Teams) — T081-T088
Developer C: US7 (Salary Cap) — T102-T114
Developer D: US8 (Trades) — T115-T128
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 1B: UI Prototyping — review and approve design direction
3. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
4. Complete Phase 3: User Story 1 (Scores + Live Ticker)
5. **STOP and VALIDATE**: Test scores page independently with live data
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + UI Prototyping (review mockups) + Foundational → Foundation ready
2. US1 (Scores) → Test → Deploy (MVP!)
3. US2 (Game Hub) → Test → Deploy
4. US3 (Standings) + US4 (Stats) → Test → Deploy (can be parallel)
5. US5 (Teams) + US6 (Players) → Test → Deploy (can be parallel)
6. US7 (Salary Cap) → Test → Deploy
7. US8 (Trades) + US9 (Free Agents) → Test → Deploy
8. US10 (Personnel) + US11 (Schedule) → Test → Deploy
9. Polish (Search, A11y, Historical Data, Performance) → Final release

### Parallel Team Strategy

With 4 developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Dev A: US1 → US2 (sequential, US2 depends on US1 Game entity)
   - Dev B: US3 → US4 (sequential, both stat-focused)
   - Dev C: US5 → US6 (sequential, both team/player-focused)
   - Dev D: US7 → US8 (sequential, both financial/transaction-focused)
3. Remaining stories split across team as capacity allows
4. Everyone contributes to Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Historical data seed (T161) is a long-running background process — don't block launch on it
- Arena stand layouts (LayoutJson) launch with gray fallback — curate incrementally post-launch
