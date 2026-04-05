# Tech Stack: Hockey League Information Hub

## Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| C# | 14 | Language |
| .NET | 10 | Runtime |
| ASP.NET Core | 10 | Web API framework |
| Entity Framework Core | 10 | ORM / data access (SQL Server via Microsoft.EntityFrameworkCore.SqlServer) |
| Hangfire | Latest | Background job scheduling (60s/1h/3h sync cadences) |

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| TypeScript | 5.x | Language |
| Angular | 19 | SPA framework |
| Angular SSR | 19 | Server-side rendering (SEO, initial load) |
| Angular CDK | 19 | Accessible UI primitives (overlays, focus trap, a11y) |
| RxJS | 7.x | Reactive data streams, live score polling |
| Tailwind CSS | 3 | Utility-first styling |
| ~~D3.js~~ | ~~7~~ | ~~Rink diagrams, trade tree visualizations~~ — **Deferred**: using plain SVG + Angular bindings instead. Add D3.js/d3-dag if plain approach proves insufficient. |

## Infrastructure

| Technology | Version | Purpose |
|-----------|---------|---------|
| SQL Server | 2022 (local Docker) / Azure SQL Database Serverless (deployed) | Persistent data store (source of truth) |
| Redis | 7 | Application cache (live scores 30s TTL, API response caching) |
| Docker | Latest | Local dev (SQL Server, Redis containers) |
| CDN | — | Edge caching via Cache-Control headers |

## Testing

| Technology | Purpose |
|-----------|---------|
| xUnit | Backend unit/integration tests |
| Karma + Jasmine | Frontend unit tests |
| Playwright | E2E tests with axe-core (WCAG 2.1 AA) |

## Data Source

| Technology | Purpose |
|-----------|---------|
| NHL Web API (`api-web.nhle.com`) | Game data, stats, rosters, events |
| `INhlDataProvider` abstraction | Swap to licensed provider (Sportradar) later |

## Design

| Choice | Detail |
|--------|--------|
| Font | Courier Prime (self-hosted, typewriter aesthetic) |
| Theme | Antique-book visual with light/dark mode via CSS custom properties |
| Accessibility | WCAG 2.1 AA via Angular CDK + semantic HTML |
