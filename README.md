# Hockey League Hub

Comprehensive hockey league information website starting with NHL — scores, standings, stats, teams, players, salary cap, trades, free agents, and personnel with an antique-book visual theme and deep cross-linking.

## Tech Stack

- **Backend**: C# 14 / .NET 10, ASP.NET Core 10, Entity Framework Core 10, Hangfire, SignalR
- **Frontend**: TypeScript 5.x / Angular 19, Angular SSR, RxJS, Tailwind CSS v3, Angular CDK
- **Database**: PostgreSQL 16 (persistent), Redis 7 (cache + pub/sub)

## Project Structure

```
backend/
├── src/
│   ├── HockeyHub.Core/             # Entities + interfaces (no dependencies)
│   │   ├── Models/Entities/         # EF Core entities (10: League through StandingsSnapshot)
│   │   └── Providers/               # INhlDataProvider, IScoreBroadcaster + DTOs
│   ├── HockeyHub.Data/             # Data access layer (depends on Core)
│   │   ├── Data/                    # DbContext, EF Core migrations
│   │   ├── Providers/               # NhlWebApiProvider (api-web.nhle.com)
│   │   └── Services/
│   │       ├── Cache/               # Redis caching service
│   │       ├── Sync/                # DataSeed, ScoresSync, StandingsSync jobs
│   │       └── Queries/             # ScoresQueryService (scores, expanded, live, ticker, pregame)
│   └── HockeyHub.Api/              # HTTP host (depends on Data + Core)
│       ├── Controllers/             # ScoresController (5 REST endpoints)
│       ├── Hubs/                    # GameHub, SignalRScoreBroadcaster
│       ├── Middleware/              # Error handling, response wrappers
│       └── Program.cs              # App startup, DI, Hangfire jobs
└── tests/HockeyHub.Api.Tests/      # Backend tests

frontend/
├── src/app/
│   ├── components/
│   │   ├── layout/                  # Banner, NavBar, ScoreBar (live data), HamburgerMenu
│   │   ├── shared/                  # StatTable, VideoModal, Pagination
│   │   ├── main-page/               # League selection grid
│   │   ├── scores/                  # ScoresPage, ScoreBox, ExpandedScoreBox, PregameMatchup, CalendarPicker
│   │   └── [11 placeholders]/       # Standings, Stats, Teams, etc.
│   ├── services/                    # Theme, SignalR, ScoresApi, GameClock services
│   ├── directives/                  # TooltipDirective
│   ├── pipes/                       # EraPipe, TimezonePipe
│   └── app.routes.ts                # 14 lazy-loaded routes (incl. game-hub/:gameId)
├── src/assets/fonts/                # Self-hosted Courier Prime (WOFF2)
├── src/styles/                      # Design tokens (light/dark mode)
└── tests/                           # Frontend tests

docs/
└── mockups/                       # Static HTML/CSS design mockups

specs/
└── 001-hockey-league-hub/         # Feature spec, plan, tasks, data model, API contracts
```

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/) and npm
- [Docker](https://www.docker.com/) (for PostgreSQL 16 and Redis 7)
- [EF Core CLI](https://learn.microsoft.com/en-us/ef/core/cli/dotnet): `dotnet tool install --global dotnet-ef`

## Getting Started

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL 16 (port 5432, db: `hockeyhub`, user: `hockeyhub`, password: `hockeyhub_dev`) and Redis 7 (port 6379).

### 2. Backend setup

```bash
cd backend/src/HockeyHub.Api

# Restore and build
dotnet restore
dotnet build

# Apply database migrations (from Api project, targeting Data project)
dotnet ef database update --project ../HockeyHub.Data

# Run the API
dotnet run
```

The API starts at **http://localhost:5072** (HTTP) or **https://localhost:7103** (HTTPS).

### 3. Seed data from NHL API

```bash
cd backend/src/HockeyHub.Api

# Full seed (league, all seasons, teams, rosters)
dotnet run -- --seed

# Current season only (faster for dev)
dotnet run -- --seed --current-only
```

### 4. Frontend setup

```bash
cd frontend

npm install
ng serve
```

The frontend starts at **http://localhost:4200**.

## Debugging

### Backend (VS Code)

Add this configuration to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "HockeyHub API",
      "type": "coreclr",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/HockeyHub.Api/bin/Debug/net10.0/HockeyHub.Api.dll",
      "args": [],
      "cwd": "${workspaceFolder}/backend/src/HockeyHub.Api",
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  ]
}
```

### Backend (Visual Studio)

Open `backend/HockeyHub.slnx` — the launch profiles are pre-configured in `Properties/launchSettings.json`.

### Backend (CLI with hot reload)

```bash
cd backend/src/HockeyHub.Api
dotnet watch run
```

Changes to `.cs` files trigger automatic rebuild and restart.

### Frontend

```bash
cd frontend
ng serve    # Dev server with hot reload at http://localhost:4200
```

### Verifying services are running

```bash
# PostgreSQL
docker exec hockeyhub-postgres pg_isready -U hockeyhub

# Redis
docker exec hockeyhub-redis redis-cli ping

# Backend API (should return JSON or 404)
curl http://localhost:5072/hangfire

# SignalR hub endpoint
# Connect via ws://localhost:5072/hubs/scores
```

### Hangfire Dashboard

Background job monitoring is available at **http://localhost:5072/hangfire** when the API is running.

### Common issues

| Problem | Solution |
|---------|----------|
| `Connection refused` on backend start | Ensure Docker containers are running: `docker compose up -d` |
| EF Core migration errors | Run `dotnet ef database update --project ../HockeyHub.Data` from `backend/src/HockeyHub.Api/` |
| NHL API rate limiting | The provider auto-retries with exponential backoff; wait and retry |
| Redis connection failed | Check Redis container: `docker exec hockeyhub-redis redis-cli ping` |
| Port 5072 in use | Kill existing process or change port in `Properties/launchSettings.json` |

## Design

The site uses an **antique-book aesthetic** — Courier Prime typewriter font, warm beige pages in light mode, deep navy in dark mode. Three historical eras (Original Six, Expansion, Salary Cap) get subtle background tints in data tables.

## UI Mockups

Standalone HTML/CSS mockups for design review, viewable in any browser from `docs/mockups/`:

| # | Mockup | Description |
|---|--------|-------------|
| 01 | [Global Shell](docs/mockups/01-global-shell.html) | Banner, search, hamburger menu, live score ticker, secondary nav, dark mode |
| 02 | [Scores Page](docs/mockups/02-scores-page.html) | 4-column score box grid — collapsed, expanded, and pregame states |
| 03 | [Data Tables](docs/mockups/03-data-tables.html) | Standings with 3 layout variants (stacked, side-by-side, tabbed) |
| 04 | [Game Hub](docs/mockups/04-game-hub.html) | Team Stats with side-by-side goals/shots box scores and adjacent team comparison |
| 05 | [Rink Diagram](docs/mockups/05-rink-diagram.html) | SVG rink with event dots, tooltips, and view switcher |
| 06 | [Team Profile](docs/mockups/06-team-profile.html) | Roster table, depth chart with stats/cap toggle, franchise history |
| 07 | [Player Profile](docs/mockups/07-player-profile.html) | Bio, career stats with era separators, playing style, contracts |
| 08 | [Trade Tree](docs/mockups/08-trade-tree.html) | Horizontal DAG visualization with minimap and mobile fallback |
| 09 | [Salary Cap](docs/mockups/09-salary-cap.html) | Team overview, per-player detail, buyout calculator, CBA guide |
| 10 | [Schedule Calendar](docs/mockups/10-schedule-calendar.html) | Month grid with games, trade deadline, All-Star, bye week badges |

## Key URLs (Development)

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:4200 | Angular dev server |
| Backend API | http://localhost:5072 | .NET Web API |
| Hangfire Dashboard | http://localhost:5072/hangfire | Background job monitoring |
| SignalR Hub | ws://localhost:5072/hubs/scores | Live score updates |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leagues/{id}/scores?date=yyyy-MM-dd` | Games for a date (default: today UTC-8) |
| GET | `/api/leagues/{id}/scores/{gameId}/expanded` | Expanded score box (periods, stats, summaries) |
| GET | `/api/scores/live` | Currently live games (lightweight) |
| GET | `/api/leagues/{id}/scores/ticker` | Minimal ticker data for score bar |
| GET | `/api/leagues/{id}/scores/{gameId}/pregame` | Pregame matchup (goalies, PP/PK, H2H) |

## Development Status

- **Phase 1 (Setup)**: Complete — project scaffolding, Docker services, design tokens, fonts
- **Phase 1B (UI Prototyping)**: Complete — 10 mockups (global shell, scores, standings, game hub, rink, team/player profiles, trade tree, salary cap, schedule)
- **Phase 2 (Foundation) — Backend**: Complete — 7 entities, DbContext, EF migration, NHL API provider, Redis cache, SignalR hub, Hangfire, error middleware, data seed CLI
- **Phase 2 (Foundation) — Frontend**: Complete — 13 lazy-loaded routes, layout shell, dark mode, SignalR, shared components, pipes, main page, placeholder routes
- **Phase 3 (US1: Scores MVP)**: Complete — Game/GamePeriodScore/StandingsSnapshot entities, ScoresController (5 endpoints), ScoresSyncJob + StandingsSyncJob, live score bar, scores page with 4-column grid, score box, expanded score box, pregame matchup, calendar picker, GameClockService (rAF countdown), tooltip directive
- **Phases 4–14**: Not started — Game Hub, Standings, Stats, Teams, Players, Salary Cap, Trades, Free Agents, Personnel, Schedule, Polish
