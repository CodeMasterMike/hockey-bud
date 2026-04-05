# Quickstart: Hockey League Information Hub

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/) and npm
- [SQL Server 2022 Developer](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (or Docker)
- [Redis 7](https://redis.io/download/) (or Docker)
- [Docker](https://www.docker.com/) (optional, for containerized services)

## Project Setup

### 1. Clone and checkout

```bash
git clone <repo-url>
cd hockey-site
git checkout 001-hockey-league-hub
```

### 2. Start infrastructure (Docker)

```bash
# Start SQL Server and Redis
docker compose up -d sqlserver redis
```

Or use local installations — update connection strings accordingly.

### 3. Backend setup

```bash
cd backend/src/HockeyHub.Api

# Restore dependencies
dotnet restore

# Set up user secrets for local development
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost,1433;Database=HockeyHub;User Id=sa;Password=HockeyHub_Dev1!;TrustServerCertificate=True"
dotnet user-secrets set "ConnectionStrings:Redis" "localhost:6379"
dotnet user-secrets set "NhlApi:BaseUrl" "https://api-web.nhle.com"

# Run database migrations (from Api project, targeting Data project)
dotnet ef database update --project ../HockeyHub.Data

# Start the API (runs on https://localhost:5001)
dotnet run
```

### 4. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL in environment
cp src/environments/environment.ts src/environments/environment.local.ts
# Edit environment.local.ts:
#   apiUrl: 'https://localhost:5001/api'
#   signalRUrl: 'https://localhost:5001/hubs/scores'

# Start dev server (runs on http://localhost:4200)
ng serve
```

### 5. Seed initial data

```bash
# From backend directory — runs an initial full sync from the NHL API
dotnet run -- --seed

# This populates:
# - All current NHL teams, rosters, and personnel
# - Current season standings and player stats
# - Current season trades and free agents
# - Arena data for rink diagrams (dimensions, bench sides)
# - Season schedule and important dates
# - Historical data (all available eras — takes ~30-60 minutes for full history)
#
# Use --seed --current-only to skip historical data for faster dev setup (~5 minutes)
```

## Development Workflow

### Running tests

```bash
# Backend unit tests
cd backend && dotnet test

# Frontend unit tests
cd frontend && npm test

# E2E tests (requires both backend and frontend running)
cd frontend && ng e2e

# Lint
cd frontend && npm run lint
```

### Key URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:4200 | Angular dev server |
| Backend API | https://localhost:5001/api | .NET Web API |
| Swagger | https://localhost:5001/swagger | API documentation |
| Hangfire Dashboard | https://localhost:5001/hangfire | Background job monitoring |
| SignalR Hub | wss://localhost:5001/hubs/scores | Live score updates |

### Common tasks

**Add a new API endpoint**:
1. Add DTO in `backend/src/HockeyHub.Api/Models/Dtos/`
2. Add query service in `backend/src/HockeyHub.Api/Services/Queries/`
3. Add controller action in appropriate controller
4. Add contract test in `backend/tests/HockeyHub.Api.Tests/Contract/`

**Add a new frontend page**:
1. Generate component via `ng generate component pages/<page-name>`
2. Add route in `frontend/src/app/app.routes.ts`
3. Add API service method in `frontend/src/app/services/`
4. Add components in `frontend/src/app/components/`

**Add a new SignalR event**:
1. Add method to `ScoresHub` in `backend/src/HockeyHub.Api/Hubs/`
2. Add handler in `frontend/src/app/services/signalr.service.ts`
3. Subscribe in the relevant Angular component

**Trigger a manual data sync**:
```bash
# Via Hangfire dashboard or curl:
curl -X POST https://localhost:5001/api/admin/sync/standings
curl -X POST https://localhost:5001/api/admin/sync/stats
curl -X POST https://localhost:5001/api/admin/sync/scores
curl -X POST https://localhost:5001/api/admin/sync/trades
curl -X POST https://localhost:5001/api/admin/sync/schedule
```

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Visitor     │────▶│   CDN        │────▶│  Angular     │
│   Browser     │     │   (Edge)     │     │  (SSR/SPA)   │
└──────┬───────┘     └──────────────┘     └──────┬───────┘
       │                                          │
       │ SignalR (WebSocket)                      │ SSG data fetch
       │ + REST fallback (30s)                    │
       │                                          │
       ▼                                          ▼
┌──────────────┐                          ┌──────────────┐
│  .NET API    │◀─────────────────────────│  Hangfire    │
│  + SignalR   │     Background sync      │  Jobs        │
│  (ASP.NET    │     (10s live /          │              │
│   Core 10)   │      event-driven)       │              │
└──────┬───────┘                          └──────────────┘
       │
       ├──▶ Redis (live cache + SignalR backplane)
       │
       └──▶ SQL Server (persistent store, full history)
                ▲
                │ Data sync
       ┌────────┴────────┐
       │  NHL Web API    │
       │  (External)     │
       └─────────────────┘
```

### Data Flow: Live Score Updates

```
NHL API ──(10-15s poll)──▶ Hangfire Job
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
              Redis Cache         SignalR Hub
              (15s TTL)               │
                    │           ┌─────┴──────┐
                    │           ▼            ▼
                    │     WebSocket      WebSocket
                    │     Client 1       Client N
                    │
                    ▼
              REST Fallback
              (30s polling)
```

### Navigation Structure

```
Main Page (League Selection)
└── NHL (league pages)
    ├── Scores ──▶ Game Hub (per-game)
    ├── Standings
    ├── Stats
    ├── Teams ──▶ Team Profile
    ├── Schedule
    ├── Players ──▶ Player Profile
    ├── Salary Cap ──▶ Team Cap / Buyout Calculator
    ├── Trades ──▶ Trade Detail + Trade Tree
    ├── Free Agents
    └── Personnel ──▶ Staff Profile
```
