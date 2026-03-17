# Hockey League Hub

Comprehensive hockey league information website starting with NHL — scores, standings, stats, teams, players, salary cap, trades, free agents, and personnel with an antique-book visual theme and deep cross-linking.

## Tech Stack

- **Backend**: C# 14 / .NET 10, ASP.NET Core 10, Entity Framework Core 10, Hangfire, SignalR
- **Frontend**: TypeScript 5.x / Angular 19, Angular SSR, RxJS, Tailwind CSS v3, Angular CDK
- **Database**: PostgreSQL 16 (persistent), Redis 7 (cache + pub/sub)

## Project Structure

```
backend/
├── src/HockeyHub.Api/          # ASP.NET Core Web API
└── tests/HockeyHub.Api.Tests/  # Backend tests

frontend/
├── src/app/                    # Angular application
├── src/assets/fonts/           # Self-hosted Courier Prime (WOFF2)
├── src/styles/tokens.css       # Antique-book design tokens (light/dark)
├── src/styles/fonts.css        # @font-face declarations
└── tests/                      # Frontend tests

docs/
└── mockups/                    # Static HTML/CSS design mockups

specs/
└── 001-hockey-league-hub/      # Feature spec, plan, tasks, data model, API contracts
```

## Design

The site uses an **antique-book aesthetic** — Courier Prime typewriter font, warm beige pages in light mode, deep navy in dark mode. Three historical eras (Original Six, Expansion, Salary Cap) get subtle background tints in data tables.

## UI Mockups

Standalone HTML/CSS mockups for design review, viewable in any browser from `docs/mockups/`:

| # | Mockup | Description |
|---|--------|-------------|
| 01 | [Global Shell](docs/mockups/01-global-shell.html) | Banner, search, hamburger menu, live score ticker, secondary nav, dark mode |
| 02 | [Scores Page](docs/mockups/02-scores-page.html) | 4-column score box grid — collapsed, expanded, and pregame states |
| 03 | [Data Tables](docs/mockups/03-data-tables.html) | Wild card standings with sortable columns, era tints, pagination |
| 04 | [Game Hub](docs/mockups/04-game-hub.html) | Team Stats and Player Stats tabs with box scores and stat comparisons |
| 05 | [Rink Diagram](docs/mockups/05-rink-diagram.html) | SVG rink with event dots, tooltips, and view switcher |
| 06 | [Team Profile](docs/mockups/06-team-profile.html) | Roster table, depth chart with stats/cap toggle, franchise history |
| 07 | [Player Profile](docs/mockups/07-player-profile.html) | Bio, career stats with era separators, playing style, contracts |
| 08 | [Trade Tree](docs/mockups/08-trade-tree.html) | Horizontal DAG visualization with minimap and mobile fallback |
| 09 | [Salary Cap](docs/mockups/09-salary-cap.html) | Team overview, per-player detail, buyout calculator, CBA guide |
| 10 | [Schedule Calendar](docs/mockups/10-schedule-calendar.html) | Month grid with games, trade deadline, All-Star, bye week badges |

## Development Status

- **Phase 1 (Setup)**: Complete — project scaffolding, design tokens, fonts
- **Phase 1B (UI Prototyping)**: Complete — all 10 mockups ready for design review
- **Phase 2 (Foundation)**: Not started — database, API infrastructure, frontend shell
- **Phases 3–14**: Not started — user stories and polish
