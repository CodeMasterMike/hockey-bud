# hockey-site Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-18

## Active Technologies
- C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend) + ASP.NET Core 10, Entity Framework Core 10, Hangfire, SignalR, Angular SSR, RxJS, Tailwind CSS v3, Angular CDK (001-hockey-league-hub)
- PostgreSQL 16 (persistent), Redis 7 (cache + pub/sub for real-time) (001-hockey-league-hub)

## Project Structure

```text
backend/
├── src/
│   ├── HockeyHub.Core/             # Entities + interfaces (no dependencies)
│   │   ├── Models/Entities/         # League, Team, Season, Arena, Player, Personnel, FranchiseHistory
│   │   └── Providers/INhlDataProvider.cs  # Data provider interface + DTOs
│   ├── HockeyHub.Data/             # Data access (depends on Core)
│   │   ├── Data/HockeyHubDbContext.cs + Migrations/
│   │   ├── Providers/NhlWebApiProvider.cs
│   │   └── Services/{Cache,Sync}/   # Redis cache, data seed
│   └── HockeyHub.Api/              # HTTP host (depends on Data + Core)
│       ├── Hubs/GameHub.cs          # SignalR hub (live scores)
│       ├── Middleware/              # Error handling, DataAsOf wrapper
│       ├── Program.cs              # App startup + DI wiring
│       └── appsettings.json        # Connection strings
└── tests/HockeyHub.Api.Tests/

frontend/
├── src/app/
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
- SignalR `GameHub` at `/hubs/scores` for live score push, Redis backplane for multi-server
- Hangfire for background sync jobs (PostgreSQL storage), dashboard at `/hangfire`
- Response wrappers: `DataAsOfResponse<T>` and `PaginatedResponse<T>` in Api/Middleware/
- Connection strings in appsettings.json (PostgreSQL: `hockeyhub`/`hockeyhub_dev`, Redis: `localhost:6379`)
- EF migrations live in HockeyHub.Data; run `dotnet ef` from Api project with `--project ../HockeyHub.Data`

## Recent Changes
- Phase 2 backend complete: 7 entities, DbContext + migration, NHL API provider with rate limiting, Redis cache service, SignalR GameHub, Hangfire, error middleware, data seed CLI
- Phase 1 complete: Project scaffolding, Docker services, design tokens, Courier Prime font

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
