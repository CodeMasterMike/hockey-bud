# hockey-site Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-16

## Active Technologies
- C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend) + ASP.NET Core 10, Entity Framework Core 10, Hangfire, SignalR, Angular SSR, RxJS, Tailwind CSS v3, Angular CDK (001-hockey-league-hub)
- PostgreSQL 16 (persistent), Redis 7 (cache + pub/sub for real-time) (001-hockey-league-hub)

## Project Structure

```text
backend/
├── src/HockeyHub.Api/
└── tests/HockeyHub.Api.Tests/

frontend/
├── src/app/
└── tests/
```

## Commands

npm test && npm run lint

## Code Style

C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend): Follow standard conventions

## Recent Changes
- 001-hockey-league-hub: Added C# 14 / .NET 10 (backend), TypeScript 5.x / Angular 19 (frontend) + ASP.NET Core 10, Entity Framework Core 10, Hangfire, SignalR, Angular SSR, RxJS, Tailwind CSS v3, Angular CDK + PostgreSQL 16, Redis 7. D3.js/d3-dag deferred — using plain SVG + Angular bindings for rink diagrams and trade trees.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
