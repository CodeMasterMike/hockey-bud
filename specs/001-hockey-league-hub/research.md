# Research: Hockey League Information Hub

**Phase 0 Output** — Resolves all NEEDS CLARIFICATION items from the Technical Context.

---

## 1. Data Source Selection

**Decision**: Use the unofficial NHL Web API (`api-web.nhle.com`) for the initial build, with an abstracted data provider interface (`INhlDataProvider`) to support swapping to a licensed provider (Sportradar, ESPN) later.

**Rationale**: The unofficial NHL API provides comprehensive coverage of scores, standings, rosters, player stats, game events (including x/y coordinates for rink diagrams), and schedule data — all needed for the MVP. It is free and does not require an API key. A licensed provider like Sportradar offers guaranteed uptime, SLAs, and additional data (advanced analytics, video embed URLs) but costs $10K–$100K+/year depending on tier. Starting with the free API reduces initial cost while the architecture supports migration.

**Alternatives considered**:
- **Sportradar**: Best data quality and coverage, includes event coordinates and video. Too expensive for an MVP with no revenue. Recommended for production scaling.
- **ESPN Hidden API**: Limited stat coverage, no event coordinates, undocumented. Not sufficient.
- **NHL Stats API (legacy `statsapi.web.nhl.com`)**: Deprecated in favor of the newer `api-web.nhle.com`. Avoid.
- **Self-scraping**: Fragile, legally risky, and high maintenance. Not viable.

**Risk**: The unofficial API could change or be rate-limited without notice. Mitigation: aggressive caching, the provider abstraction layer, and monitoring for API changes.

---

## 2. Frontend Framework: Angular 19

**Decision**: Angular 19 with Angular SSR for server-side rendering, RxJS for reactive data streams and real-time updates, and Angular CDK for accessible UI primitives.

**Rationale**: Aligns with user's preference for Angular. Angular 19 provides a mature, batteries-included framework with built-in routing, forms, HttpClient, and dependency injection. Angular SSR handles server-side rendering for SEO and initial load performance. RxJS integrates with SignalR for real-time push updates on the live score ticker and game events. The caching strategy uses backend-driven `Cache-Control` headers with Angular's HttpClient.

**Alternatives considered**:
- **Next.js 15 (React)**: Best ISR support for static regeneration, but user prefers Angular.
- **Astro**: Excellent SSG but weaker for highly interactive pages (score box expansion, rink diagrams, live polling). Would require more client-side islands.
- **Analog (Angular meta-framework)**: Angular's answer to Next.js with SSG/SSR. Still maturing; using Angular SSR directly gives more control and stability.

---

## 3. Backend Framework: .NET 10 with ASP.NET Core

**Decision**: ASP.NET Core 10 Web API with Entity Framework Core 10 for data access, Hangfire for background job scheduling, and SignalR for real-time push updates.

**Rationale**: Aligns with user's .NET preference. ASP.NET Core provides high-performance REST APIs, built-in DI, and mature middleware. EF Core 10 offers excellent PostgreSQL support via Npgsql. .NET 10 brings improved performance, better AOT support, and enhanced minimal APIs. Hangfire provides persistent, dashboard-visible scheduled jobs for multi-cadence data sync. SignalR provides WebSocket-based real-time push for the live score ticker and near-instant event updates.

**Alternatives considered**:
- **Hangfire vs. IHostedService**: IHostedService is simpler but lacks job persistence, retry logic, and a monitoring dashboard. Hangfire's dashboard helps debug sync failures.
- **Hangfire vs. Quartz.NET**: Quartz is more flexible for complex scheduling but requires more configuration. Hangfire is simpler for recurring jobs at fixed intervals.

---

## 4. Real-Time Score Updates & Live Ticker (Updated)

**Decision**: **SignalR** for real-time push with client-side countdown for the game clock ticker. The .NET backend pushes updates via a `ScoresHub` whenever the NHL API sync detects changes. Angular clients subscribe to the hub for instant updates. A fallback RxJS polling loop (30-second interval) handles cases where WebSocket connections fail.

**Rationale**: The spec has been updated from "60-second polling" to "as fast as possible — ideally within seconds of an event occurring" (Clarification on live scores). This eliminates polling as the primary strategy and requires push-based updates. SignalR is ASP.NET Core's built-in real-time library, supporting WebSockets with automatic fallback to SSE and long-polling. It integrates natively with the .NET DI system and is well-suited for broadcasting score updates to many connected clients.

**Architecture**:
- **Backend**: Hangfire job polls the NHL API every 10-15 seconds for live games. When data changes, the job calls `ScoresHub.Clients.All.SendAsync("ScoreUpdate", data)`.
- **SignalR Hub (`/hubs/scores`)**: Broadcasts live game updates (scores, period, clock) and game events (goals, penalties — including pending events under review).
- **Live Score Ticker (FR-006b)**: Angular component subscribes to SignalR hub. Between server pushes, the game clock counts down client-side using `requestAnimationFrame` for smooth updates. Client-side clock resets/resyncs on each server push.
- **Pending Events**: When the NHL API shows an event under review, it's broadcast with `isPending: true`. When confirmed, a follow-up broadcast updates the status.
- **Fallback**: If WebSocket connection drops, the Angular service falls back to REST polling at 30-second intervals via `GET /api/scores/live`.

**Alternatives considered**:
- **60-second RxJS polling (original approach)**: Too slow given the "within seconds" requirement. Still used as a fallback.
- **Server-Sent Events (SSE)**: Simpler than WebSockets but unidirectional and no native .NET abstraction. SignalR provides SSE as a fallback transport automatically.
- **Third-party event streaming (Pusher, Ably)**: Adds external dependency and cost. SignalR is free and built into ASP.NET Core.

**Redis Pub/Sub Integration**: In a multi-server deployment, SignalR uses the Redis backplane (`Microsoft.AspNetCore.SignalR.StackExchangeRedis`) to broadcast messages across all server instances.

**SignalR Hub Contract**:
- **Hub name**: `GameHub` (endpoint: `/hubs/scores`)
- **Server-to-client methods**: `ReceiveScoreUpdate`, `ReceiveClockSync`, `ReceiveEventUpdate`, `ReceiveTransactionUpdate`
- **Client-to-server methods**: `JoinGameGroup(gameId)`, `LeaveGameGroup(gameId)`, `JoinAllLiveGames()`, `LeaveAllLiveGames()`

**Game Clock Ticker Architecture**: Hybrid server-sync + client-side countdown. Server pushes clock state (period, timeRemainingMs, clockRunning, serverTimestampMs) via SignalR every 10-15 seconds and immediately on state changes (goals, stoppages, period transitions). Between pushes, the Angular component interpolates using `requestAnimationFrame`: `displayTime = timeRemainingMs - (Date.now() - serverTimestampMs)`. Clock freezes when `clockRunning: false`. Each server push corrects drift (typically <100ms over 10-15 seconds).

**Pending Event Handling**: The NHL API play-by-play includes review/challenge events. When a goal goes under review, the sync job sets `ReviewStatus: "UnderReview"` and broadcasts via SignalR with both the current score (including the goal) and the pending score (excluding it). When resolved: `"Confirmed"` (goal stands) or `"Overturned"` (goal removed). The UI shows a visually distinct "Under Review" treatment (pulsing amber border).

**Angular RxJS Patterns**: Centralized `LiveGameService` using RxJS Subjects fed by a single SignalR connection. Per-component subscriptions via selectors. `shareReplay(1)` for late subscribers. `scan` operator for accumulating game state from event deltas. `combineLatest` for the ticker aggregating all live games.

---

## 5. Rink Diagram Rendering (Updated)

**Decision**: Custom SVG Angular component for the rink outline with plain Angular bindings for event dot placement, hover interactions, and coordinate mapping. Arena dimensions stored in the database per venue. Penalty boxes included in the rink template. Arena stands rendered from per-venue SVG templates stored as static assets. D3.js deferred — add only if the plain SVG/Angular approach proves insufficient.

**Rationale**: SVG provides resolution-independent rendering, CSS styling for team colors, and native DOM event handling for hover/click interactions. The rink coordinate math is straightforward (scale from feet to SVG viewBox units) and does not require D3's data-binding abstractions. Angular's template bindings (`[attr.cx]`, `[attr.cy]`, `@for`) handle dot rendering, and Angular event bindings handle hover/click. A custom Angular component gives full control over the rink's visual accuracy.

**Enhanced requirements**:
- **Penalty boxes**: Added to the base rink SVG template. Standard NHL rink layout has penalty boxes on one side between the blue lines. The `Arena.PenaltyBoxSide` field determines placement.
- **Arena stands**: Per-venue SVG templates stored as static assets (`/assets/arenas/{arena-slug}-stands.svg`). The `ArenaStandsLayout` entity tracks whether seat colors are available. If not, the SVG is rendered with a uniform `#D3D3D3` (washed-out gray) fill.
- **Video indicator dot**: Event dots with available video display a small inner black dot (a concentric circle at ~30% radius). This is a CSS-stylable SVG element with a configurable class for easy future changes.

**Data sources for arena stands**:
- Arena seating maps are **not available via API** (no NHL, Ticketmaster, or SeatGeek public endpoint provides this data).
- Stand layouts stored as JSON in the `Arena.LayoutJson` column (jsonb) with section paths, seat colors, bench positions, and penalty box locations per venue.
- Seat color data manually curated where available; derived from broadcast footage and arena photos.
- **Launch plan**: Ship with gray-seat fallback for all 32 arenas (fully satisfying FR-034's explicit fallback). Populate actual seat colors incrementally, starting with most-played arenas. This removes arena curation from the critical path.

**Stand rendering performance**: Render stands as simplified SVG `<path>` sections (4-8 paths per arena, not individual seats). Use SVG `<pattern>` element for seat texture (repeating tile simulating rows of seats). Total SVG DOM for full arena diagram: ~120-260 elements — well under the ~5,000-10,000 threshold where browsers show strain. No Canvas/WebGL needed.

**Implementation note**: NHL standard rink is 200ft × 85ft. The SVG viewBox maps to these dimensions. Event x/y coordinates from the API are in feet from center ice. The component transforms these to SVG coordinates. The stands layer is rendered behind the rink surface, with the rink surface having a semi-transparent ice fill so the stands are visible around the edges.

**Alternatives considered**:
- **Canvas (HTML5)**: Better performance for thousands of elements but harder to make accessible (WCAG AA requirement) and doesn't support native DOM events for individual dots.
- **Recharts / Victory**: General-purpose chart libraries don't support custom rink shapes. Too constrained.
- **Pre-rendered rink images with overlay**: Simple but doesn't scale to different arena dimensions and loses SVG interactivity.

---

## 6. Trade Tree Visualization (Updated — Bidirectional)

**Decision**: Plain Angular SVG components for the trade tree visualization. The tree traces transactions in **both directions** from a focus trade: ancestors (trades that contributed assets to this trade) and descendants (subsequent transactions of the traded pieces). Nodes represent trades; edges connect via traded assets. D3.js and d3-dag are deferred — the server computes node positions using a simple layered layout algorithm, and Angular renders the positioned nodes as SVG. If the layout becomes too complex, d3-dag can be added later.

**Rationale**: The spec now requires trade trees to show "all prior and subsequent transactions" (FR-069). This is a DAG, not a tree — a trade can have multiple ancestor trades (assets from different prior trades converging) and multiple descendant branches (assets re-traded separately). D3's force-directed layout or custom DAG layout handles variable-depth, variable-width graphs well.

**Implementation**:
- **Database traversal**: Two recursive CTEs in PostgreSQL:
  1. **Descendants**: Starting from the focus trade, follow `TradeAsset.SubsequentTradeId` chains forward
  2. **Ancestors**: Starting from the focus trade's assets, follow `TradeAsset.PriorTradeAssetId` chains backward, plus `Trade.OriginTradeId`
- **Server-side graph building**: A `TradeTreeService` executes both CTEs and assembles the full DAG. The response separates `ancestors`, `focusTrade`, and `descendants`.
- **Client-side rendering**: The focus trade is centered. Ancestors flow left (earlier in time), descendants flow right (later in time). Horizontal axis = time, vertical axis = branching.
- **Interaction**: Each trade node is clickable (navigates to that trade's detail page, which re-centers the tree). Each asset node (player, pick) is clickable to its entity page.

**Layout computation**: The server computes node x/y positions using a simple layered algorithm: group trades by depth (ancestors at negative depths, descendants at positive depths), assign horizontal position by depth and vertical position by index within each depth layer. This avoids any client-side layout library. For ~90% of trade trees (linear chains, <10 nodes), this produces clean results. If complex multi-parent DAGs with edge crossing problems arise, `d3-dag` (Sugiyama algorithm) can be added as a client-side layout engine later.

**Database traversal**: Add a `TradeEdge` junction table to normalize the graph relationships (ParentTradeId, ChildTradeId, TradeAssetId, LinkType). This enables symmetric bidirectional traversal in a single recursive CTE instead of two asymmetric FK walks. The existing `OriginTradeId` and `SubsequentTradeId` columns remain the source-of-truth for data entry; `TradeEdge` is a derived/maintained denormalization.

**Component architecture**: Three Angular components — `TradeTreeContainerComponent` (data fetching, state), `TradeTreeCanvasComponent` (SVG rendering with CSS-based pan/zoom via `overflow: auto` + `transform: scale()`), `TradeNodeComponent` (per-node rendering via SVG `foreignObject`). Responsive fallback: on mobile (<768px), collapse to vertical timeline list.

**Alternatives considered (deferred)**:
- **d3-dag**: Sugiyama algorithm for DAG layout with minimized edge crossings. Add if server-side layout produces poor results for complex trees.
- **d3-hierarchy**: Simpler tree layout. Add if needed as intermediate step before d3-dag.
- **d3-zoom**: Smooth pan/zoom behavior. Add if CSS-based zoom proves insufficient for large trees.
- **Cytoscape.js**: Powerful (~400KB) but heavy. Not needed for <100 nodes.

**Performance**: The most complex NHL trade tree (Eric Lindros, 1992) has ~20-30 nodes across multiple decades. Even the deepest trees are computationally trivial. The recursive CTE with `UNION ALL` and a depth limit of 50 prevents runaway queries.

---

## 7. Video Embedding (Updated)

**Decision**: Modal component with an `<iframe>` for provider embed URLs (NHL.com video embeds). Triggered from hover-to-click interactions on goals, penalties, and rink dots. Falls back to text-only when no video URL is available. Updated to support **multiple replays from multiple angles** when available.

**Rationale**: The spec now requires videos with "multiple replays from multiple angles" (Clarification on video). The modal component will display the primary video embed along with angle selector controls if the data provider supplies multiple URLs for the same event.

**Implementation note**: The `INhlDataProvider` interface includes:
- `videoUrl`: Primary video embed URL
- `videoAngles`: Optional array of `{label, url}` objects for alternate angles (e.g., "Overhead", "Behind Net", "Slow Motion")

The modal uses Angular CDK's `Dialog` overlay for accessibility (focus trap, ESC to close, screen reader announcements). An angle switcher (tabs or dropdown) appears above the video player when multiple angles are available.

---

## 8. Buyout Calculator

**Decision**: Server-side calculation in a .NET service (`BuyoutCalculatorService`) implementing the CBA buyout formulas. Inputs: player age, remaining salary per year, remaining term, signing bonuses, performance bonuses. Output: year-by-year cap hit impact table.

**Rationale**: The CBA buyout formula is deterministic but has age-dependent branching (26+ vs. under 26) and bonus considerations. Keeping the calculation server-side ensures a single source of truth and simplifies updates when the CBA changes.

**Formula summary**:
- **Age 26+**: Buyout cost = 2/3 of remaining salary. Cap charge spread over 2× remaining term.
- **Age 25 and under**: Buyout cost = 1/3 of remaining salary. Cap charge spread over 2× remaining term.
- Signing bonuses already paid are not recaptured. Future signing bonuses are forfeited.
- Performance bonuses: if likely to be earned (based on prior year), included in buyout cost calculation.
- Annual cap charge = total buyout cost / (remaining years × 2), with salary savings offsetting in the first half.

---

## 9. Typewriter Font Selection

**Decision**: **Courier Prime** (Google Fonts) as the primary font site-wide. CSS `letter-spacing: -0.02em` on data tables for compactness.

**Rationale**: The spec requires a "typewriter-style font that remains compact and easy to read" (FR-003). Courier Prime is a refined version of Courier designed for readability — it has better kerning, more consistent stroke widths, and includes bold/italic variants. It's available as a free Google Font with WOFF2 delivery for fast loading.

**Alternatives considered**:
- **Special Elite**: Very authentic typewriter look but only available in Regular weight (no bold/italic). Limits emphasis options in data-heavy tables.
- **American Typewriter**: Not available as a web font (system font on macOS only). Inconsistent cross-platform.
- **IBM Plex Mono**: Clean and compact but reads as "developer tool" rather than "typewriter." Doesn't match the antique-book theme.

**Implementation**: Self-host the font files (subset to Latin characters) for performance. Define as `--font-primary` CSS custom property. Fallback stack: `'Courier Prime', 'Courier New', monospace`.

---

## 10. Caching Strategy (Updated)

**Decision**: Three-tier caching with SignalR push for real-time data. Updated refresh cadences per spec changes.

| Tier | Technology | TTL | Content |
|------|-----------|-----|---------|
| Edge (CDN) | CDN cache | 10s–3h | SSR pages via Cache-Control headers |
| Application | Redis 7 | 10s–3h | API responses, live scores, aggregated stats |
| Database | PostgreSQL | Persistent | All historical data, source of truth |

**Updated refresh cadences** (per spec Clarification on data refresh):

| Data Type | Old Cadence | New Cadence | Strategy |
|-----------|------------|-------------|----------|
| Live game scores | 60s polling | 10-15s server poll → SignalR push | Hangfire job polls NHL API; broadcasts via SignalR |
| Standings & rosters | 1 hour | Before/after each game | Triggered by game status transitions (Scheduled→Live, Live→Final) |
| Stats | 3 hours | Before/after each game | Same trigger as standings |
| Trades | 3 hours | Near real-time | Dedicated high-frequency sync job (60s) during trade deadline; 15min otherwise |
| Free agents | 3 hours | Near real-time | Same as trades |

**Implementation details**:
- **Live scores**: Hangfire recurring job every 10-15s during active games (detected by `Game.Status = 'Live'`). When changes detected → Redis update + SignalR broadcast. When no games live → job frequency drops to 5 minutes.
- **Game-triggered syncs**: When a game transitions to "Live", a Hangfire job triggers standings/roster/stats sync. Another fires when a game reaches "Final". This ensures data is fresh "just before and after each game."
- **Trade/free agent near-real-time**: During trade deadline windows (configurable), a dedicated Hangfire job polls the trades endpoint every 60 seconds. Outside those windows, every 15 minutes. Partial trade information is stored with `IsPartial = true`.
- **Data source outage**: Redis serves stale data (TTL extended) with a `dataAsOf` timestamp in the API response. Frontend renders the "Data as of [timestamp]" banner (FR-011a).

---

## 11. Historical Data & Era Support (New)

**Decision**: Extend historical data as far back as the NHL API provides, supplemented by hockey-reference.com data for gaps. Implement era classification and visual differentiation.

**Rationale**: The spec now requires data "as far back as reliable data can go" with era differentiation (Original 6 to 1972, 1973-2005, 2006-present). The NHL Web API (`api-web.nhle.com`) provides historical data back to the 1917-18 season for basic stats (GP, G, A, PTS, PIM) and team records. However, many modern stats were not tracked in earlier eras.

**Data availability by era**:

| Stat Category | Original Six (≤1972) | Expansion (1973-2005) | Salary Cap (2006+) |
|--------------|---------------------|----------------------|-------------------|
| GP, G, A, PTS, PIM | ✓ | ✓ | ✓ |
| +/- | Partial (from ~1968) | ✓ | ✓ |
| SOG, SH% | Partial | ✓ | ✓ |
| TOI | ✗ | Partial (from ~1998) | ✓ |
| Hits, Blocks, GV, TK | ✗ | ✗ | ✓ (from ~2005) |
| FO% | ✗ | Partial | ✓ |
| WAR, xGF/60, xGA/60 | ✗ | ✗ | Depends on analytics provider |
| Goalie SV%, GAA | Partial | ✓ | ✓ |

**Approximate data volume**:
- ~7,500+ players across all eras
- ~30,000+ season stat lines
- ~100+ teams (including relocated/defunct franchises)
- ~80,000+ regular season games

**Initial data seeding**: The full historical sync will take ~30-60 minutes on first run. Subsequent syncs are incremental.

**Visual differentiation**:
- Each `Season` has an `Era` field: `"original-six"`, `"expansion"`, `"salary-cap"`
- Each `PlayerSeason` denormalizes the era for query convenience
- Frontend uses CSS classes per era: alternating background tints, bold separator lines between era boundaries in career stat tables
- Tailwind classes: `bg-era-original/5`, `bg-era-expansion/5`, `bg-era-salarycap/5` with subtle tints

---

## 12. Advanced Stats Availability

**Decision**: Advanced metrics (WAR, xGF/60, xGA/60) are architecture-supported but display "—" at launch unless a licensed data provider is integrated.

**Rationale**: The unofficial NHL API does not provide WAR, expected goals, or other advanced analytics. These metrics come from third-party analytics sites (Evolving-Hockey, MoneyPuck, Natural Stat Trick) which don't offer public APIs. The data model includes columns for all advanced stats, and the UI renders them, but values default to null (displayed as "—" per the spec edge case). When a licensed provider with advanced stats is added, the `INhlDataProvider` implementation populates these fields.

---

## 13. Accessibility (WCAG 2.1 AA) Approach

**Decision**: Use Angular CDK (Component Dev Kit) for interactive components (overlays, focus trap, a11y utilities), semantic HTML throughout, and automated accessibility testing with axe-core in the Playwright E2E suite.

**Rationale**: The spec requires WCAG 2.1 AA compliance (FR-011c). Angular CDK provides unstyled, accessible building blocks — `CdkOverlay` for tooltips/modals/dropdowns, `FocusTrapDirective` for modal focus management, `LiveAnnouncer` for screen reader announcements, and `ListKeyManager` for keyboard navigation. Combined with semantic HTML (`<table>`, `<nav>`, `<main>`, headings hierarchy), this provides a strong accessibility baseline.

**Key considerations**:
- Color contrast: Both light mode (black on beige) and dark mode (beige on dark blue) must meet 4.5:1 contrast ratio. The antique-book theme's color choices naturally meet this.
- Rink diagrams: Provide an accessible table alternative showing the same event data for screen reader users.
- Stat abbreviation tooltips: Use `aria-describedby` linking the abbreviation to a visually hidden full name, so screen readers announce the full name without requiring hover.
- Video modals: Focus trap, ESC to close, descriptive labels.
- Live ticker: Use `aria-live="polite"` for score updates so screen readers announce changes without interrupting.

---

## 14. Dark Mode Implementation

**Decision**: CSS custom properties (design tokens) toggled via a `data-theme` attribute on `<html>`. User preference persisted in `localStorage`, with system preference (`prefers-color-scheme`) as the default.

**Rationale**: The spec defines two specific color schemes (FR-001, FR-002). CSS custom properties enable theme switching without re-rendering Angular components. The toggle lives in the hamburger menu (FR-005, Clarification on hamburger contents).

**Color tokens**:
- Light mode: `--bg-page: #F5F0E1` (soft yellow-beige), `--text-primary: #1A1A1A` (near-black), `--bg-banner: #000000`
- Dark mode: `--bg-page: #0A1628` (very dark blue), `--text-primary: #F5F0E1` (soft yellow-beige), `--bg-banner: #000000`
- Alternating row shading: `--bg-row-alt: rgba(0,0,0,0.04)` (light), `rgba(255,255,255,0.06)` (dark)
- Era tints: subtle variations of the row shading per era for visual differentiation

---

## 15. Schedule Page (New)

**Decision**: A dedicated Schedule page positioned between Teams and Players in the navigation (FR-006a). Calendar-based view of the full season with important league dates prominently marked.

**Rationale**: The spec adds a new primary navigation section for the schedule with important dates (trade deadline, free agent deadline, offer sheet deadline, arbitration deadline, All-Star break, bye weeks). This complements the scores page calendar (which shows a single day's games) with a full season overview.

**Implementation**:
- **Data source**: The NHL API provides the full season schedule via the schedule endpoint. Important dates (trade deadline, etc.) are stored in the `ImportantDate` table — initially seeded manually since these are league-level dates that change annually.
- **UI**: A month-by-month calendar grid. Game days show team logos (compact). Important dates use a distinct visual treatment (highlighted background, icon, or badge).
- **Filtering**: Filter by team to show only that team's schedule. Month navigation.
- **Integration with scores**: Clicking a game date navigates to the scores page for that date.

---

## 16. Pregame Matchup Summaries (New)

**Decision**: Expandable pregame matchup data for games that have not yet started (FR-021a). Data is assembled server-side from existing cached stats.

**Rationale**: The spec adds a pregame summary when expanding unstarted game score boxes, including: top scorers, starting goalie stats, PP%/PK%, and head-to-head records. This data already exists in the standings and player stats caches — it just needs to be aggregated into a single endpoint.

**Implementation**:
- **Endpoint**: `GET /api/leagues/{leagueId}/scores/{gameId}/pregame`
- **Starting goalie**: The NHL API sometimes announces starting goalies before game time. If unknown, the response returns `confirmed: false` and the UI shows "Awaiting starting goalie confirmation."
- **Head-to-head**: Computed from historical game results between the two teams. Current season and all-time splits.
- **Caching**: Pregame data is cached with a 1-hour TTL (it doesn't change rapidly). Starting goalie status may update closer to game time.
