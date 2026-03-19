# Implementation Plan: Hockey League Information Hub

**Branch**: `001-hockey-league-hub` | **Date**: 2026-03-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-hockey-league-hub/spec.md`

## Summary

Build a comprehensive hockey league information website starting with the NHL, featuring near-real-time scores with a persistent live ticker, standings, league-wide stats, team profiles with depth charts, player profiles with career data, salary cap tools (including buyout calculator), bidirectional trade trees, free agent tracking, personnel database, and a season schedule with important dates. The site uses an antique-book visual theme (Courier Prime typewriter font, beige/dark-blue color scheme) with deep cross-linking between all entities. Historical data extends as far back as reliable data allows, with era differentiation (Original 6–1972, 1973–2005, 2006–present). The backend is ASP.NET Core 10 with PostgreSQL and Redis; the frontend is Angular 19 with SSR, RxJS, and Tailwind CSS. Rink diagrams and trade trees use plain SVG with Angular bindings (D3.js/d3-dag deferred — add if needed).

## Technical Context

**Language/Version**: C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend)
**Primary Dependencies**: ASP.NET Core 10, Entity Framework Core 10, Hangfire, SignalR, Angular SSR, RxJS, Tailwind CSS v3, Angular CDK
**Storage**: PostgreSQL 16 (persistent), Redis 7 (cache + pub/sub for real-time)
**Testing**: xUnit (backend), Karma + Jasmine (frontend unit), Playwright + axe-core (E2E + WCAG)
**Target Platform**: Web (CDN-served, SSR for SEO), all modern browsers + mobile responsive
**Project Type**: Full-stack web application (REST API + SPA with SSR)
**Performance Goals**: <2s page load (SC-002), <1s sort/expand (SC-003/SC-006), sub-60s live score updates (SC-016), 5,000+ concurrent visitors (SC-007), <200ms search response
**Constraints**: 99.9% uptime (SC-017), WCAG 2.1 AA (FR-011c), real-time game clock on ticker (FR-006b)
**Scale/Scope**: ~32 teams, ~800+ players, 1,312 games/season, historical data back to ~1917, 11 primary navigation sections + Game Hub

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution file found — gate passes by default. No project-level constraints to evaluate.

## Project Structure

### Documentation (this feature)

```text
specs/001-hockey-league-hub/
├── plan.md                      # This file
├── research.md                  # Phase 0 output — core decisions
├── research-historical-data.md  # Phase 0 deep-dive — historical data & eras
├── data-model.md                # Phase 1 output
├── quickstart.md                # Phase 1 output
├── contracts/                   # Phase 1 output
│   ├── scores-api.md
│   ├── games-api.md
│   ├── standings-stats-api.md
│   ├── teams-players-api.md
│   ├── salary-cap-api.md
│   ├── trades-free-agents-api.md
│   ├── personnel-api.md
│   ├── search-api.md
│   └── schedule-api.md
└── tasks.md                     # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── HockeyHub.Core/             # Entities, interfaces, DTOs (no dependencies)
│   │   ├── Models/Entities/         # EF Core entity classes
│   │   └── Providers/
│   │       └── INhlDataProvider.cs  # Data provider interface + DTOs
│   ├── HockeyHub.Data/             # Data access layer (depends on Core)
│   │   ├── Data/
│   │   │   ├── HockeyHubDbContext.cs
│   │   │   └── Migrations/
│   │   ├── Providers/
│   │   │   └── NhlWebApiProvider.cs # api-web.nhle.com implementation
│   │   └── Services/
│   │       ├── Cache/               # Redis caching layer
│   │       ├── Sync/                # Data sync jobs + seed service
│   │       └── Calculator/          # Buyout calculator, trade tree builder
│   └── HockeyHub.Api/              # HTTP host (depends on Data + Core)
│       ├── Controllers/             # API endpoints
│       ├── Hubs/                    # SignalR hubs (live scores, ticker)
│       ├── Middleware/              # Error handling, response wrappers
│       ├── Models/Dtos/             # API response DTOs
│       └── Program.cs
├── tests/
│   └── HockeyHub.Api.Tests/
│       ├── Unit/
│       ├── Integration/
│       └── Contract/
└── docker-compose.yml

frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── layout/          # Banner, nav bar, ticker, hamburger menu
│   │   │   ├── scores/          # Score boxes, expandable details, pregame matchup
│   │   │   ├── game-hub/        # Game Hub tabs (Team Stats, Player Stats, Rink, Lineups)
│   │   │   ├── standings/
│   │   │   ├── stats/
│   │   │   ├── teams/           # Team index, profile, roster, depth chart
│   │   │   ├── schedule/        # Season calendar with important dates
│   │   │   ├── players/         # Player profile, stats tabs, style section
│   │   │   ├── salary-cap/      # Team cap, player cap, buyout calculator
│   │   │   ├── trades/          # Trade list, trade detail, trade tree
│   │   │   ├── free-agents/     # Pending & recent signings
│   │   │   ├── personnel/       # Staff profiles, predecessor history
│   │   │   ├── search/          # Global search dropdown
│   │   │   └── shared/          # Stat table, tooltip, video modal, rink diagram
│   │   ├── services/            # API services, SignalR service, theme service
│   │   ├── models/              # TypeScript interfaces
│   │   ├── pipes/               # Stat formatting, time zone, era formatting
│   │   └── app.routes.ts
│   ├── assets/
│   │   ├── fonts/               # Courier Prime (self-hosted)
│   │   ├── teams/               # Team logos (SVG)
│   │   └── rink/                # Base rink SVG template
│   ├── environments/
│   └── styles/                  # Tailwind config, CSS custom properties, theme tokens
├── tests/
│   ├── unit/
│   └── e2e/                     # Playwright specs
└── angular.json
```

**Structure Decision**: Web application with `backend/` and `frontend/` top-level directories. The backend uses a 3-project split: **Core** (entities, interfaces — no dependencies), **Data** (DbContext, providers, services — depends on Core), and **Api** (HTTP host, hubs, middleware — depends on Data + Core). This enables isolated testing and potential future worker process extraction. The frontend is an Angular 19 SPA with SSR. Infrastructure (PostgreSQL, Redis) is containerized via docker-compose.

## Complexity Tracking

> No constitution violations — section intentionally left empty.
