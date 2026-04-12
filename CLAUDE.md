# hockey-site Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-11

## Active Technologies
- C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend) + ASP.NET Core 10, Entity Framework Core 10, Hangfire, SignalR, Angular SSR, RxJS, Tailwind CSS v3, Angular CDK (001-hockey-league-hub)
- SQL Server (Azure SQL Database Serverless for deployed, SQL Server 2022 Developer for local Docker), Redis 7 (cache + pub/sub for real-time) (001-hockey-league-hub)

## Project Structure

```text
backend/
├── src/
│   ├── HockeyHub.Core/             # Entities + interfaces (no dependencies)
│   │   ├── Models/Entities/         # League, Team, Season, Arena, Player, Personnel, FranchiseHistory, Game, GamePeriodScore, StandingsSnapshot
│   │   ├── Providers/               # INhlDataProvider interface + DTOs, IScoreBroadcaster
│   │   └── NhlDateHelper.cs         # Shared NHL game day boundary logic (3 AM ET cutoff, DST-aware)
│   ├── HockeyHub.Data/             # Data access (depends on Core)
│   │   ├── Data/HockeyHubDbContext.cs + Migrations/
│   │   ├── Providers/NhlWebApiProvider.cs
│   │   └── Services/
│   │       ├── Cache/               # Redis cache service
│   │       ├── Sync/                # DataSeed, ScoresSync, StandingsSync, ScheduleSync jobs
│   │       └── Queries/             # ScoresQueryService, StandingsQueryService, ScheduleQueryService
│   └── HockeyHub.Api/              # HTTP host (depends on Data + Core)
│       ├── Controllers/             # ScoresController (5), StandingsController, ScheduleController, SearchController, HealthController
│       ├── Hubs/                    # GameHub, SignalRScoreBroadcaster
│       ├── Middleware/              # Error handling, DataAsOf wrapper
│       ├── Program.cs              # App startup + DI wiring
│       └── appsettings.json        # Connection strings
├── Dockerfile                       # Multi-stage build (SDK → runtime)
├── .dockerignore
└── tests/HockeyHub.Api.Tests/

infra/
├── main.bicep                       # All Azure resources (Container Apps, ACR, Key Vault, App Insights, etc.)
├── parameters.dev.json              # Dev environment parameters
└── parameters.prod.json             # Prod environment parameters

.github/workflows/
├── ci.yml                           # PR gate: build, test, lint (both backend + frontend)
├── deploy-dev.yml                   # On merge to main: build → push ACR → migrate → deploy → smoke test
└── deploy-prod.yml                  # Manual/release: same with approval gate

frontend/
├── src/app/
│   ├── components/
│   │   ├── layout/                # Banner, NavBar, ScoreBar (live), HamburgerMenu
│   │   ├── shared/                # StatTable, VideoModal, Pagination
│   │   ├── main-page/             # League selection grid
│   │   ├── scores/                # ScoresPage, ScoreBox, ExpandedScoreBox, PregameMatchup, CalendarPicker
│   │   ├── standings/             # StandingsPage (4 views: wildcard/division/conference/league)
│   │   ├── schedule/              # SchedulePage (monthly game list with navigation)
│   │   └── [stats,...]/           # Placeholder route components (8 remaining)
│   ├── constants.ts               # Shared constants (league ID, polling intervals, SignalR config, close-game thresholds, getPeriodLabel)
│   ├── services/                  # ThemeService, SignalRService, ScoresApiService, GameClockService, StandingsApiService, ScheduleApiService, SearchApiService
│   ├── directives/                # TooltipDirective
│   ├── pipes/                     # EraPipe, TimezonePipe
│   ├── app.routes.ts              # 14 lazy-loaded routes (incl. game-hub/:gameId)
│   └── app.ts                     # Shell: banner + score bar + nav + router-outlet
├── src/assets/fonts/              # Courier Prime (WOFF2)
├── src/styles/                    # Design tokens (light/dark)
├── staticwebapp.config.json         # Azure Static Web Apps routing + headers
└── tests/
```

## Commands

```bash
# Backend
cd backend && dotnet build                            # Build
cd backend && dotnet test                             # Tests
cd backend/src/HockeyHub.Api && dotnet run            # Run API (http://localhost:5072)
cd backend/src/HockeyHub.Api && dotnet run -- --seed  # Seed data from NHL API

# Frontend
cd frontend && npm test && npm run lint               # Tests + lint
cd frontend && ng serve                               # Dev server (http://localhost:4200)

# Infrastructure (local)
docker compose up -d                                  # SQL Server + Redis
cd backend/src/HockeyHub.Api && dotnet ef database update --project ../HockeyHub.Data  # Apply migrations

# Infrastructure (Azure)
az deployment group create -g hockeyhub-dev-rg -f infra/main.bicep -p infra/parameters.dev.json  # Deploy/update Azure resources
```

## Code Style

C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend): Follow standard conventions

## Deployment Architecture
- **Azure hosting**: Container Apps (backend API + dev Redis), Azure SQL Database Serverless (GP_S_Gen5_1, auto-pause after 60min idle), Static Web Apps (frontend with CDN), Container Registry, Key Vault, Application Insights
- **CI/CD**: GitHub Actions — `ci.yml` gates PRs (build/test/lint), `deploy-dev.yml` auto-deploys on merge to main, `deploy-prod.yml` requires manual trigger + approval gate
- **Health probes**: `HealthController` exposes `/api/health/live` (liveness) and `/api/health/ready` (readiness, checks DB + Redis) — used by Container Apps for revision routing
- **IaC**: All Azure resources in Bicep templates (`infra/main.bicep`) with env-specific parameter files
- **Zero-downtime**: Container Apps `activeRevisionsMode: Multiple` — new revisions only receive traffic after readiness probe passes
- **Auto-migration**: EF migrations run on startup in Development only (local dev); deployed environments use `ASPNETCORE_ENVIRONMENT=Staging` (dev) or `Production` (prod) to skip startup migrations — CI/CD pipeline handles migrations before updating the container revision
- **CORS**: `Cors:AllowedOrigins` config array (defaults to localhost:4200 for dev); set via Container App env vars in deployed environments

## Key Architecture Decisions
- **3-project split**: Core (entities, interfaces) → Data (DbContext, providers, services) → Api (controllers, hubs, middleware). Dependency flow: Api → Data → Core
- NHL data sourced via `INhlDataProvider` interface (Core) — implemented by `NhlWebApiProvider` (Data), swappable to licensed provider later
- `IScoreBroadcaster` interface (Core) abstracts SignalR broadcasting — implemented by `SignalRScoreBroadcaster` (Api) to maintain dependency flow
- SignalR `GameHub` at `/hubs/scores` for live score push, Redis backplane for multi-server
- Hangfire recurring jobs: `ScoresSyncJob` (every 15s), `StandingsSyncJob` (every 5min), `ScheduleSyncJob` (daily 6 AM UTC), dashboard at `/hangfire`
- Response wrappers: `DataAsOfResponse<T>` and `PaginatedResponse<T>` in Api/Middleware/
- Connection strings in appsettings.json for local dev (DefaultConnection: SQL Server on port 1433, Redis: `localhost:6379`); deployed environments inject via Key Vault secret refs → Container App env vars (`ConnectionStrings__DefaultConnection`, `ConnectionStrings__Redis`)
- EF migrations live in HockeyHub.Data; run `dotnet ef` from Api project with `--project ../HockeyHub.Data`
- Frontend live clock: `GameClockService` uses `requestAnimationFrame` for smooth countdown between server pushes, resyncs on each SignalR `ClockSync` event
- NHL game day boundary: `NhlDateHelper` (Core) centralizes the 3 AM ET cutoff logic — all sync jobs, queries, and controllers must use this instead of raw UTC offsets
- Frontend constants: `constants.ts` holds all magic numbers (polling intervals, SignalR config, close-game thresholds, default league ID) and shared utilities (`getPeriodLabel`) — never hardcode these in components
- All Angular components use `ChangeDetectionStrategy.OnPush` — required for performance given 60fps clock updates during live games
- Subscription cleanup uses `takeUntilDestroyed(destroyRef)` — do not use manual `Subscription[]` + `ngOnDestroy` patterns

## Recent Changes
- Search: `GET /api/search?q=...&limit=10` queries Players (name) and Teams (location/name/abbreviation) with grouped results; banner search input wired with 300ms debounce and live dropdown showing Teams/Players sections with navigation links
- Schedule page: `ScheduleSyncJob` (daily 6 AM UTC Hangfire job) calls `GetScheduleAsync` to populate the full season of games into the Games table; `ScheduleQueryService` groups games by month/day with optional month + team filters (6h Redis cache); `ScheduleController` exposes `GET /api/leagues/{leagueId}/schedule`; frontend page with month navigation, day cards showing matchups/times/scores
- Standings page (US3): Added `GoalDifferential`, `DivisionRank`, `ConferenceRank`, and nullable `WildCardRank` to `StandingsSnapshot` (closes the data-model.md gap) with EF migration `AddStandingsRanks`; `StandingsSyncJob` now computes all four during the sync loop with NHL wild-card rules (top 3 per division qualify, top 2 of remaining per conference get WC1/WC2, rest are eliminated) and busts `standings:*` cache keys after save; new `StandingsQueryService` shapes 4 view modes (wildcard / division / conference / league) with 1h Redis TTL; new `StandingsController` exposes `GET /api/leagues/{leagueId}/standings?view=...` with view validation; frontend placeholder replaced with full responsive page (side-by-side conferences ≥1200px, tabbed below) using OnPush + signals + `takeUntilDestroyed`; sortable column headers with WC1/WC2 labels, dashed cut line, and muted styling for eliminated teams in default sort order
- Redis connectivity fix (Azure dev): Backend was using HTTP-style FQDN `<app>.internal.<defaultDomain>:6379` for the Redis connection string, which resolves to the Container Apps Envoy ingress IP (HTTP-only, can't proxy raw Redis protocol). Switched to bare app name `<app>:6379` which resolves to the k8s service ClusterIP and reaches the Redis pod directly. For TCP ingress between Container Apps in the same env, always use the bare app name. Also added `sqlLocation: centralus` to `parameters.dev.json` (the SQL Server lives in Central US due to East US quota; missing param caused redeploys to attempt re-creation in East US and fail with `InvalidResourceLocation`).
- Database migration: Switched from PostgreSQL 16 to SQL Server (Azure SQL Database Serverless for dev with auto-pause, SQL Server 2022 Developer for local Docker); replaced Npgsql with Microsoft.EntityFrameworkCore.SqlServer, Hangfire.PostgreSql with Hangfire.SqlServer; added JsonDocument value converter for SQL Server compatibility; regenerated EF migrations; renamed connection string key to DefaultConnection; updated Bicep, Docker Compose, CI/CD workflows, and all documentation
- Deploy pipeline fixes: Replaced dev PostgreSQL Container App (Azure File permission failures) with Azure SQL Database Serverless (GP_S_Gen5_1, auto-pause after 60min idle); fixed Bicep conditionals that skipped secrets/env vars/probes when `backendImage` was empty; changed deployed dev environment from `Development` to `Staging` to prevent EF migration crash loop on startup; increased smoke test retries from 5 to 10 for cold-start tolerance
- Azure hosting & CI/CD: Dockerfile (multi-stage .NET build), HealthController (liveness + readiness probes), Bicep IaC templates (Container Apps, ACR, Key Vault, App Insights, alert rules, dev Redis container, Azure SQL Database), GitHub Actions workflows (ci.yml PR gate, deploy-dev.yml auto-deploy, deploy-prod.yml manual with approval), Static Web App config, configurable CORS origins, auto-migration restricted to Development environment
- Code quality pass: Consolidated 4 inconsistent timezone/game-day calculations into `NhlDateHelper`; added `TryParseExact` validation on ScoresController date param; fixed incomplete `TeamAbbreviation` (was always empty) and `HomeShots`/`AwayShots` (was always 0) in NhlWebApiProvider by extracting from boxscore; added `HttpResponseMessage` disposal; made `HasLiveGames` async; added error handlers to ExpandedScoreBox/PregameMatchup subscriptions; extracted all magic numbers to `constants.ts`; added `OnPush` change detection to all 13 components; standardized subscription cleanup on `takeUntilDestroyed`; replaced `any` types in SignalR service with proper types
- Mockup/spec edit 5: Team profile — Active Roster/Depth Chart as navigable tabs, depth chart condensed with Defense/Goalies beside Forwards in 2-column layout with clear section labels; Schedule — 3 view modes (Detailed/Clean/Compact), Strength of Schedule tab placeholder; Player profile — P/PG stat added, Regular Season/Playoffs sub-tabs, top-level Overview & Stats / Contracts & Trades tabs, clickable birth nation → nation players page with search and past-player filter, multi-team player mockup planned; Players page — most searched players default with day/week/month/year filter, search bar searches players + nations
- Mockup/spec edit 4: Rink diagram goal dots changed from half-green to half-white/half-team-color; Salary Cap overview teams reordered alphabetically by location, CHIP stat added to team cards, CHIP Graph tab added between Team Detail and Buyout Calculator, future cap commitments expanded to 5 years, draft pick inventory expanded to 5 years, Escrow added to Cap Explained; Trade tree removed entirely and replaced with simple chronological trade list with team/season filters
- Mockup/spec edit 3: Dark mode banner inverted to beige/dark-blue (#F5F0E1 bg, #0A1628 text) with banner-specific CSS tokens for interactive elements; dark mode set as default; expanded score box stats condensed to half width with Season/All-Time H2H tables adjacent; pregame box shows top goal scorer, assist maker, and points getter alongside goalie stats (same player listed for each stat they lead); Game Hub goals and penalties merged into single card with sharp divider; reduced vertical spacing in Game Hub
- Phase 3 (US1 Scores MVP) complete: Game/GamePeriodScore/StandingsSnapshot entities, AddGamesAndStandings migration, ScoresQueryService (5 queries + full DTOs), ScoresController (5 endpoints), ScoresSyncJob + StandingsSyncJob (Hangfire), IScoreBroadcaster abstraction, scores page (4-column grid, expand/collapse, date navigation), score box, expanded score box (period box scores, stats, goal/penalty summaries), pregame matchup, calendar picker, tooltip directive, live score bar with API data, GameClockService (rAF countdown), ScoresApiService (HTTP + SignalR)
- Phase 2 frontend shell complete: 13 lazy-loaded routes, banner/nav/score bar/hamburger menu layout, dark mode service, SignalR service, stat table/video modal/pagination shared components, era + timezone pipes, main page, 12 placeholder route components
- Phase 2 backend complete: 7 entities, DbContext + migration, NHL API provider with rate limiting, Redis cache service, SignalR GameHub, Hangfire, error middleware, data seed CLI
- Phase 1B mockups revised: global shell (ticker colors/ordering), scores page (layout), standings (3 versions, no era tints), game hub (shots box score + adjacent comparison)
- Phase 1 complete: Project scaffolding, Docker services, design tokens, Courier Prime font

<!-- MANUAL ADDITIONS START -->

## TODO

### Active Blockers (Azure dev)
- _None — Redis connectivity fixed 2026-04-08 by switching connection string from `<app>.internal.<defaultDomain>:6379` (Envoy ingress IP, HTTP-only) to bare `<app>:6379` (k8s service ClusterIP, direct to pod). For TCP ingress between Container Apps in the same env, always use the bare app name._

### Security (Remaining — see docs/audit-2026-04-05.md)
- **Rate limiting**: Add `Microsoft.AspNetCore.RateLimiting` middleware to API
- **Redis auth**: Add `--requirepass` to dev Redis container; use Azure Cache for Redis in prod
- **Migration rollback**: Add validation/rollback step to deploy workflows
- **ACR SKU**: Upgrade to Standard for prod (enables image vulnerability scanning)
- **SQL threat protection**: Add `securityAlertPolicies` and `auditingSettings` to Bicep
- **SQL admin password rotation**: Initial deploy password is in shell history

### Missing Implementation
- **Database entities (14 missing)**: PlayerPosition, PlayerHeadshot, PlayerStyle, PlayerSeason, PlayerTeamHistory, PlayerAward, Contract, ContractYear, GameEvent, GamePlayerStat, Trade, TradeAsset, ImportantDate, RuleBook
- **API endpoints (17 missing)**: Game Hub (3), Stats (1), Teams (4), Players (2), Salary Cap (5), Trades (2), Free Agents (1), Personnel (1)
- **Frontend pages (8 placeholders)**: Stats, Players, Teams, Salary Cap, Trades, Free Agents, Personnel, Game Hub — all currently render placeholder text

### Data Quality Bugs in NhlWebApiProvider
- **`GetStandingsAsync` doesn't populate `PowerPlayPct`, `PenaltyKillPct`, `FaceoffPct`** — they come back as `0.0` / `null` for every team. Surfaced 2026-04-08 during standings smoke test. The standings page renders "0.0" / "—" until the provider extracts those fields from the NHL API response.

### Testing
- **Frontend unit tests**: Only a placeholder test exists (`app.spec.ts`). Real unit tests needed for components (ScoreBox, ExpandedScoreBox, PregameMatchup, CalendarPicker, etc.) and services (ScoresApiService, GameClockService, SignalRService, ThemeService). Test infrastructure is set up: Vitest + jsdom via `@angular/build:unit-test`.
- **Backend tests**: Expand coverage for ScoresQueryService, sync jobs, NhlWebApiProvider, HealthController

<!-- MANUAL ADDITIONS END -->
