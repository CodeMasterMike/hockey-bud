# hockey-site Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-21

## Active Technologies
- C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend) + ASP.NET Core 10, Entity Framework Core 10, Hangfire, SignalR, Angular SSR, RxJS, Tailwind CSS v3, Angular CDK (001-hockey-league-hub)
- PostgreSQL 16 (persistent), Redis 7 (cache + pub/sub for real-time) (001-hockey-league-hub)

## Project Structure

```text
backend/
├── src/
│   ├── HockeyHub.Core/             # Entities + interfaces (no dependencies)
│   │   ├── Models/Entities/         # League, Team, Season, Arena, Player, Personnel, FranchiseHistory, Game, GamePeriodScore, StandingsSnapshot
│   │   └── Providers/               # INhlDataProvider interface + DTOs, IScoreBroadcaster
│   ├── HockeyHub.Data/             # Data access (depends on Core)
│   │   ├── Data/HockeyHubDbContext.cs + Migrations/
│   │   ├── Providers/NhlWebApiProvider.cs
│   │   └── Services/
│   │       ├── Cache/               # Redis cache service
│   │       ├── Sync/                # DataSeed, ScoresSync, StandingsSync jobs
│   │       └── Queries/             # ScoresQueryService
│   └── HockeyHub.Api/              # HTTP host (depends on Data + Core)
│       ├── Controllers/             # ScoresController (5 endpoints)
│       ├── Hubs/                    # GameHub, SignalRScoreBroadcaster
│       ├── Middleware/              # Error handling, DataAsOf wrapper
│       ├── Program.cs              # App startup + DI wiring
│       └── appsettings.json        # Connection strings
└── tests/HockeyHub.Api.Tests/

frontend/
├── src/app/
│   ├── components/
│   │   ├── layout/                # Banner, NavBar, ScoreBar (live), HamburgerMenu
│   │   ├── shared/                # StatTable, VideoModal, Pagination
│   │   ├── main-page/             # League selection grid
│   │   ├── scores/                # ScoresPage, ScoreBox, ExpandedScoreBox, PregameMatchup, CalendarPicker
│   │   └── [standings,...]/       # Placeholder route components (11 remaining)
│   ├── services/                  # ThemeService, SignalRService, ScoresApiService, GameClockService
│   ├── directives/                # TooltipDirective
│   ├── pipes/                     # EraPipe, TimezonePipe
│   ├── app.routes.ts              # 14 lazy-loaded routes (incl. game-hub/:gameId)
│   └── app.ts                     # Shell: banner + score bar + nav + router-outlet
├── src/assets/fonts/              # Courier Prime (WOFF2)
├── src/styles/                    # Design tokens (light/dark)
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

# Infrastructure
docker compose up -d                                  # PostgreSQL + Redis
cd backend/src/HockeyHub.Api && dotnet ef database update --project ../HockeyHub.Data  # Apply migrations
```

## Code Style

C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend): Follow standard conventions

## Key Architecture Decisions
- **3-project split**: Core (entities, interfaces) → Data (DbContext, providers, services) → Api (controllers, hubs, middleware). Dependency flow: Api → Data → Core
- NHL data sourced via `INhlDataProvider` interface (Core) — implemented by `NhlWebApiProvider` (Data), swappable to licensed provider later
- `IScoreBroadcaster` interface (Core) abstracts SignalR broadcasting — implemented by `SignalRScoreBroadcaster` (Api) to maintain dependency flow
- SignalR `GameHub` at `/hubs/scores` for live score push, Redis backplane for multi-server
- Hangfire recurring jobs: `ScoresSyncJob` (every 15s), `StandingsSyncJob` (every 5min), dashboard at `/hangfire`
- Response wrappers: `DataAsOfResponse<T>` and `PaginatedResponse<T>` in Api/Middleware/
- Connection strings in appsettings.json (PostgreSQL: `hockeyhub`/`hockeyhub_dev`, Redis: `localhost:6379`)
- EF migrations live in HockeyHub.Data; run `dotnet ef` from Api project with `--project ../HockeyHub.Data`
- Frontend live clock: `GameClockService` uses `requestAnimationFrame` for smooth countdown between server pushes, resyncs on each SignalR `ClockSync` event

## Recent Changes
- Mockup/spec edit 4: Rink diagram goal dots changed from half-green to half-white/half-team-color; Salary Cap overview teams reordered alphabetically by location, CHIP stat added to team cards, CHIP Graph tab added between Team Detail and Buyout Calculator, future cap commitments expanded to 5 years, draft pick inventory expanded to 5 years, Escrow added to Cap Explained; Trade tree removed entirely and replaced with simple chronological trade list with team/season filters
- Mockup/spec edit 3: Dark mode banner inverted to beige/dark-blue (#F5F0E1 bg, #0A1628 text) with banner-specific CSS tokens for interactive elements; dark mode set as default; expanded score box stats condensed to half width with Season/All-Time H2H tables adjacent; pregame box shows top goal scorer, assist maker, and points getter alongside goalie stats (same player listed for each stat they lead); Game Hub goals and penalties merged into single card with sharp divider; reduced vertical spacing in Game Hub
- Phase 3 (US1 Scores MVP) complete: Game/GamePeriodScore/StandingsSnapshot entities, AddGamesAndStandings migration, ScoresQueryService (5 queries + full DTOs), ScoresController (5 endpoints), ScoresSyncJob + StandingsSyncJob (Hangfire), IScoreBroadcaster abstraction, scores page (4-column grid, expand/collapse, date navigation), score box, expanded score box (period box scores, stats, goal/penalty summaries), pregame matchup, calendar picker, tooltip directive, live score bar with API data, GameClockService (rAF countdown), ScoresApiService (HTTP + SignalR)
- Phase 2 frontend shell complete: 13 lazy-loaded routes, banner/nav/score bar/hamburger menu layout, dark mode service, SignalR service, stat table/video modal/pagination shared components, era + timezone pipes, main page, 12 placeholder route components
- Phase 2 backend complete: 7 entities, DbContext + migration, NHL API provider with rate limiting, Redis cache service, SignalR GameHub, Hangfire, error middleware, data seed CLI
- Phase 1B mockups revised: global shell (ticker colors/ordering), scores page (layout), standings (3 versions, no era tints), game hub (shots box score + adjacent comparison)
- Phase 1 complete: Project scaffolding, Docker services, design tokens, Courier Prime font

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
