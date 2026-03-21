# Feature Specification: Hockey League Information Hub

**Feature Branch**: `001-hockey-league-hub`
**Created**: 2026-03-16
**Status**: In Progress — Phase 3 (US1: Scores MVP) complete, ready for Phase 4 (US2: Game Hub)
**Input**: User description: "Comprehensive hockey league information website starting with NHL — scores, standings, stats, teams, players, salary cap, trades, free agents, and personnel with an antique-book visual theme and deep cross-linking"

## Clarifications

### Session 2026-03-19

- Q: What colors are allowed in the top score bar (ticker)? → A: The only non-white text color allowed in the ticker is red, and only for the game clock text when there are 5 minutes or less remaining in the entire game (3rd period or OT). All other text — scores, team abbreviations, "Final", scheduled times — must remain white at all times. The previous 2-goal-difference condition for the red clock is removed; the sole trigger is ≤5 minutes left in the game.
- Q: How should games be ordered in the ticker? → A: By start time, earliest first. Final games first, then live games ordered by most advanced period, then scheduled games by start time.
- Q: Should the inline scoreboard remain in the expanded score box? → A: No. Remove the scoreboard (team names/scores block) between the game clock and the box score header. The game clock and box score header remain.
- Q: How should the goals and shots box scores be laid out in the expanded score box? → A: Each box score should be half width, placed side by side horizontally. This consolidates space and allows the remaining stats/summaries to fit in a more compact layout.
- Q: How should small boxes flow next to an expanded box? → A: Exactly 3 small boxes should fit vertically beside one expanded box. After 3, remaining small boxes drop to the next row in the standard 4-column format. Small boxes remain 1x1 (one row, one column) — they must not stretch to fill the expanded box's height.
- Q: How large should the pregame expanded box be? → A: The pregame expanded box should be 2x2 (2 rows, 2 columns) rather than the full 3-column width of the live/final expanded box. Above the head-to-head stats, include a stat comparison showing each team's GF/GP, GA/GP, SF/GP, SA/GP, PP%, and PK%.
- Q: Should era background tinting appear on the Standings page? → A: No. Historical era tinting and era-related information is deferred from the Standings page entirely. It will be reintroduced later in a different section of the site (likely player career stats).
- Q: How should the Standings page display both conferences? → A: Three layout options are being evaluated: (1) Eastern above Western with scroll, (2) Eastern and Western side by side in separate scrollable grids, (3) Tabbed view with clickable "Eastern Conference" / "Western Conference" tabs at the top.
- Q: Should the Game Hub include a shots-by-period box score? → A: Yes. A shots-by-period box score should appear alongside the goals-by-period box score. Both should be half width and side by side. The Team Comparison section should be placed adjacent (to the right) of both box scores, not below them, to reduce vertical scrolling.

### Session 2026-03-18

- Q: Should the global shell mockup include its own scores content section? → A: No. The global shell's content area had a "Today's Scores" section that duplicated the dedicated scores page. The global shell should simply link to the scores page via navigation; the scores page mockup (M002) is the canonical scores layout.
- Q: How should the live score ticker bar behave? → A: The ticker bar should be static (not auto-scrolling). Scores should appear in individual separated boxes/rectangles. The bar should be slightly larger than the current design. When there are too many games to fit in the visible area, left/right arrow buttons appear on the edges to scroll through additional games. Each score box in the ticker is clickable and navigates the user to that game's Game Hub page.
- Q: What is the correct order for the secondary navigation bar? → A: Scores, Standings, Stats, Players, Teams, Schedule, Salary Cap, Trades, Free Agents, Personnel. Players is placed between Stats and Teams.
- Q: What should the Players navigation link show? → A: The Players page shows the most searched players in the last week by default. A filter allows the user to switch between most searched players in the last day, last week (default), last month, and last year.
- Q: How should game times, scoreboard times, and final outcomes be color-coded? → A: All game times, scoreboard times, and "Final" status labels should be white and the same boldness/weight as the team abbreviations, for readability. *(Superseded by 2026-03-19 clarification: red clock applies when ≤5 min remaining in the entire game — 3rd period or OT — regardless of score difference.)*
- Q: How should the expanded score box be laid out? → A: The expanded box should be one row wider than the current design. The stats (PP, HIT, FO%, TK, GV) should be arranged in a vertical column instead of a horizontal row, and Time of Possession (TOP) should be added to that stat list. Home team goal summaries and penalty summaries go to the right of the stats column; away team goal summaries and penalty summaries go to the left. Below the period-by-period goals box score, add a second box score table showing shots on goal per period. If the expanded box feels too cramped, the original inline scoreboard (team rows with scores) may be removed from the expanded view; if removed, add the season record and league standings rank next to each team in the box score table headers.
- Q: How should the score grid handle expanded boxes? → A: There should only be one box per game at any time — either small or large, never both. When a box is expanded, other games' small boxes should flow to the right or left of the expanded box as long as they fit, only wrapping to a new row when necessary. This maximizes visible information without unnecessary scrolling.
- Q: How should pregame (unstarted) boxes appear in collapsed vs expanded state? → A: In collapsed state, pregame boxes should look like active game small boxes — showing start time and basic team info in the same compact format. Additional pregame stats (top scorers, goalies, special teams, H2H) are only shown when expanded into the large box view.
- Q: How should the head-to-head matchup record be displayed in the pregame expanded view? → A: For clarity, show each team's breakdown separately. Season record: each team's number of wins, overtime wins, and shootout wins against the other. All-time record: each team's number of wins, overtime wins, shootout wins, and ties against the other. Display in a clean stat-type format.

### Session 2026-03-16

- Q: How do visitors navigate between sections (Scores, Standings, Stats, Teams, etc.) within a league? → A: Persistent secondary navigation bar below the black banner, visible on all league pages.
- Q: How frequently should live game scores update during active games? → A: As fast as possible — ideally within seconds of an event occurring, so fans watching a game can see the site updated nearly in real time. If an action happens within the game (e.g., a goal that could still go under review), mark the play as pending until it is 100% confirmed. The absolute minimum acceptable cadence is every 60 seconds without page refresh.
- Q: How should large result sets (800+ players) be handled on Stats, Free Agents, and similar pages? → A: Paginated tables with 50 rows per page and page controls.
- Q: Should the site provide a global search capability across all entities? → A: Yes, a global search bar in the black banner that searches across all entities (players, teams, trades, staff, etc.) within the selected league. No search bar on the main league-selection page. Results favor the most-searched categories first, then alphabetical order. Search is scoped to the selected league only, to avoid cluttering results across all leagues.
- Q: What should visitors see when the underlying data source is temporarily unavailable? → A: Show last cached data with a visible "Data as of [timestamp]" indicator.
- Q: Should the site be responsive across devices (mobile, tablet, desktop)? → A: Fully responsive — all pages adapt to mobile, tablet, and desktop viewports.
- Q: What is the primary external data source for game data, stats, and video? → A: NHL official APIs or a licensed aggregator (e.g., Sportradar).
- Q: What level of WCAG accessibility compliance should the site target? → A: WCAG 2.1 AA compliance across all pages.
- Q: How should postponed or cancelled games be displayed? → A: Show the game in its scheduled slot with a status label ("Postponed", "Cancelled") and rescheduled date if available.
- Q: What should the hamburger menu contain in this phase beyond the dark mode toggle? → A: The hamburger menu will show Account, Settings, and League Selector. It is possible some sections (like games) will be moved from the banner to the hamburger bar. There may also be added sections like Donations, Feedback, Site Mission, etc.
- Q: How frequently should non-live data (standings, stats, rosters, trades, free agents) refresh from the data source? → A: Standings, stats, and rosters should update just before and after each game. Trades and free agents should update as soon as possible, allowing visitors to view it like a broker would watch a stock ticker. When a signing or trade is confirmed but all of the information is not known, put any available information with a note to the user that more information is still processing. This directive applies to all data refresh frequencies.
- Q: How far back should historical data extend for player career stats, trade history, and team records? → A: As far back as reliable data can go. Differentiate eras with background shading or bold separation lines. The eras are: Original 6 to 1972 (15 or fewer teams in the league), 1973 to 2005, and 2006 to present (salary cap era).
- Q: How should video content be delivered when a visitor clicks to watch a play? → A: Embed video from the data provider (e.g., NHL.com or Sportradar embed URLs) in a modal player on-site. Include videos with multiple replays from multiple angles.
- Q: What is the target uptime/availability for the site? → A: 99.9% overall (~8.7 hours/year downtime), with scheduled maintenance only during non-game windows.
- Q: What caching strategy should be used to serve pages to 5,000+ concurrent visitors? → A: Static site generation with incremental rebuilds at each data refresh interval, served via CDN.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Daily Scores and Navigate Leagues (Priority: P1)

A visitor arrives at the main page and sees league icons (currently only NHL). They click the NHL icon and are taken to the scores page showing today's games. They see each game's teams, scores (or start times for future games), shots on goal, team records, and league standings rank. They can click the date to browse other days via a calendar. They can expand any score box to see period-by-period breakdowns, power play stats, hits, faceoff percentage, and goal/penalty summaries. Only one expanded box is visible at a time.

**Why this priority**: The scores page is the default landing experience after selecting a league. It is the most frequently visited page on any sports site and serves as the gateway to all other content.

**Independent Test**: Can be fully tested by loading the site, selecting NHL, and verifying that all game scores for the current day are displayed in the correct format with expandable details.

**Acceptance Scenarios**:

1. **Given** a visitor on the main page, **When** they click the NHL icon, **Then** they are directed to the scores page showing today's games using UTC-8 as the default time zone.
2. **Given** a game ended late at night (e.g., 10:47 PM on 3/6), **When** a visitor loads the scores page within 2 hours of the final game ending (before 12:47 AM on 3/7), **Then** the previous day's scores are still displayed.
3. **Given** the scores page is displayed, **When** the visitor clicks the date (mm/dd format), **Then** a calendar opens allowing navigation to any day in the current season, showing previous results and upcoming scheduled games.
4. **Given** multiple games on the same day, **When** the scores page loads, **Then** games appear in order of start time, with ties broken by alphabetical order of the team's location name (e.g., Florida Panthers sorted under "F" for Florida, not the city).
5. **Given** a score box is displayed, **When** the visitor clicks to expand it, **Then** a single enlarged box (3 columns wide, 3 rows tall in the grid) replaces the collapsed box (never showing both), displaying: period-by-period goals box score and shots on goal box score side by side at half width each, a vertical stat column (PP, HIT, FO%, TK, GV, TOP), away team goal/penalty summaries to the left of the stats, and home team goal/penalty summaries to the right of the stats. The inline scoreboard is removed. Any previously expanded box collapses. Exactly 3 small boxes (1x1 each) fit vertically beside the expanded box; remaining boxes wrap to the next row in 4-column format.
6. **Given** a game has not started, **When** the score box is displayed in collapsed state, **Then** it appears in the same compact format as active games, showing the start time (adjusted to user's time zone) and basic team info. **When** the visitor expands the box, **Then** the pregame matchup summary shows: the stats of the top goal scorers on each team, the top points getters of each team, the GAA and SV% of the starting goalies (if known; if not, indicate "Awaiting starting goalie confirmation"), each team's PP% and PK%, and the head-to-head matchup record for the current season (each team's W/OTW/SOW) and all time (each team's W/OTW/SOW/T) in a clean stat format.
7. **Given** a score box, **When** displayed, **Then** the away team appears above the home team, scores are to the right, "SHG" with shot counts appear beneath each team in smaller text, and the team's season record with standings rank (by PTS%) appear above the abbreviation in faint text.
8. **Given** a visitor hovers over a team's season record or standings rank, **When** the tooltip appears, **Then** it explains what the value represents.

---

### User Story 2 - Explore Game Details via Game Hub (Priority: P2)

A visitor clicks "Game Hub" on any score box and is taken to a detailed game page with tabs: Team Stats (default), Player Stats, Lineups, and Rink Instances. In Team Stats, they see the box score by period, head-to-head team stat comparison, goal summaries, and penalty summaries with player hover cards and video links. In Player Stats, they see per-player stat grids for both teams. In Rink Instances, they see an accurate rink diagram with color-coded dots showing where game events occurred, with hover details and video playback. Game Hub is not a primary navigation section — it is accessible only through the scores page.

**Why this priority**: The Game Hub provides the deepest game-level information and is the primary destination for fans wanting to understand what happened in a specific game.

**Independent Test**: Can be tested by navigating to any completed game's Game Hub and verifying all four tabs display correct, interactive information.

**Acceptance Scenarios**:

1. **Given** a visitor on the Game Hub Team Stats tab, **When** they view the layout, **Then** a goals-by-period box score and a shots-by-period box score are displayed side by side at half width each at the top, with the Team Comparison (SOG, HIT, PP, FO, GV, TK, TOI showing away on left and home on right) placed adjacent to the right of the box scores. Goal summaries appear below, to the left (away) and right (home) of the stat column, with penalty summaries beneath each team's goals.
2. **Given** a goal summary entry, **When** displayed, **Then** it shows the period and game clock time, scorer (first initial and last name) with season goal number, and assisting players (first initial and last name) with season assist numbers.
3. **Given** a visitor hovers over a goal in the summary, **When** the hover state activates, **Then** an option to click to view a video of the goal appears (if video is available).
4. **Given** a visitor hovers over a penalty in the summary, **When** the hover state activates, **Then** options appear to view a video of the penalty or navigate to the corresponding rule book entry.
5. **Given** a visitor hovers over a player name anywhere in the Game Hub, **When** the popup appears, **Then** it displays the player's headshot and season stats (GP, G, A, +/-, PIM).
6. **Given** the Player Stats tab, **When** the grids load, **Then** two side-by-side grids appear (away on left, home on right) with skater rows showing #, G, A, PTS, +/-, HIT, PIM, TOI, SOG, GV, TK, WAR, xGF/60, FO%. Goalie rows have a separate header showing SA, SV, SV%, TOI, HDC/HDS, LDC/LDS, WAR. Rows alternate in shading and the grid scrolls horizontally if needed.
7. **Given** the Rink Instances tab, **When** displayed, **Then** an accurately dimensioned rink diagram shows rink measurements, penalty boxes, and indicates which side has the home bench and which has the away bench. The diagram includes an accurate view of the layout of the stands with actual seat colors if available; if seat color information is unavailable, an outline of the stands using best available information with washed-out gray seats.
8. **Given** the Rink Instances tab, **When** the visitor selects the "Goals" view, **Then** dots appear on the ice at each goal's location, each dot half bright green and half the scoring team's primary color.
9. **Given** a visitor hovers over any event dot on the rink, **When** the tooltip appears, **Then** it shows the action type, the player who performed it, and the game clock time.
10. **Given** a visitor clicks a dot that has corresponding video, **When** they click, **Then** a video player pops up with footage of the play. Dots with available video display a small, unintrusive indicator — a small black dot within the colored dot (not a play button) — that users will learn indicates video availability. This indicator must be easily changeable in the future.
11. **Given** the Team Stats tab, **When** displayed, **Then** a complete official score sheet with all standard information appears beneath the summaries.

---

### User Story 3 - View League Standings (Priority: P3)

A visitor navigates to the Standings page and sees the current NHL standings in the default wild card format, divided by division and conference, ranked by point percentage. They can switch views between wild card, divisional, conference, and total league. They can click any column header to re-sort the standings by that stat.

**Why this priority**: Standings are the primary way fans track the playoff race and team performance throughout the season.

**Independent Test**: Can be tested by loading the Standings page and verifying correct team ordering, all stat columns, view toggles, and re-sorting functionality.

**Acceptance Scenarios**:

1. **Given** the Standings page loads, **When** the default view appears, **Then** teams are displayed in wild card format, grouped by division and conference, ranked by point percentage, with alternating row shading. No historical era tinting or era-related information is shown on the Standings page (era differentiation is deferred to player career stats).
2. **Given** the Standings page, **When** displayed, **Then** the following stats are shown for each team: GP, W, L, OTL, PTS, PTS%, RW, ROW, GF, GA, DIFF, PP%, PK%, FO%.
3. **Given** the Standings page, **When** a visitor clicks the "GF" column header, **Then** teams re-sort by goals for in descending order.
4. **Given** the Standings page, **When** a visitor selects "Conference" view, **Then** teams are grouped by conference only (no division separation) with the same stats displayed.
5. **Given** the Standings page, **When** both conferences are displayed, **Then** the layout MUST show both Eastern and Western Conference standings without requiring page navigation. The final layout will be one of: (a) stacked vertically with scroll, (b) side by side in independently scrollable grids, or (c) tabbed with clickable conference tabs at the top.

---

### User Story 4 - Browse League-Wide Player and Goalie Statistics (Priority: P4)

A visitor navigates to the Stats page and views league-wide statistics broken into sections: all players, all goalies, all forwards, all defensemen, all rookie players, and all rookie goalies. Each section displays a sortable grid with comprehensive stats. Default sort for skaters is goals; for goalies, wins.

**Why this priority**: League-wide stats allow fans to compare players across teams and track individual award races.

**Independent Test**: Can be tested by loading the Stats page, switching between player categories, and verifying all stat columns and sort functionality.

**Acceptance Scenarios**:

1. **Given** the Stats page with "All Player Stats" selected, **When** the grid loads, **Then** players appear sorted by goals (highest first) with columns: team, GP, G, A, PTS, +/-, HIT, PIM, TOI/GP, SOG, SH%, BLK, EVP, PPP, SHP, GV, TK, WAR, xGF/60, xGA/60, SO%, FO%.
2. **Given** the Stats page with "All Goalie Stats" selected, **When** the grid loads, **Then** goalies appear sorted by wins (highest first) with columns: team, GP, W, L, OTL, SV%, GAA, SA, SV, GA, GS, HDC/HDS, LDC/LDS, WAR, G, A.
3. **Given** any stats grid, **When** a visitor clicks a column header, **Then** the list re-sorts by that stat in descending order.
4. **Given** any stats grid, **When** displayed, **Then** rows alternate in background shading and all stat abbreviations show full names on hover.

---

### User Story 5 - Explore Team Profiles, Rosters, and Depth Charts (Priority: P5)

A visitor navigates to the Teams page, sees all current NHL team icons listed alphabetically by team location name (e.g., Florida Panthers sorted under "F" for Florida), clicks one, and views the team's profile. The profile shows the team logo, current and all-time records, franchise history, Stanley Cup wins (total, since 1973, since 2006), and the full roster. A depth chart tab organizes the roster by lines and pairings with a toggle between stats view and salary cap view.

**Why this priority**: Team profiles are the primary way fans explore their favorite team's roster and organizational structure.

**Independent Test**: Can be tested by clicking any team and verifying the profile, roster, and depth chart views are complete and accurate.

**Acceptance Scenarios**:

1. **Given** a visitor on the Teams index page, **When** displayed, **Then** all current NHL team icons are listed alphabetically by team location name (e.g., Florida Panthers under "F" for Florida).
2. **Given** a visitor clicks a team icon, **When** the team profile loads, **Then** it displays the team logo (top left), current season record beside it, all-time record below that, the year/season the team joined the league, franchise relocation history (if applicable), and on the right side: total Stanley Cup wins, Stanley Cups since 1973, and Stanley Cups since 2006.
3. **Given** the team profile roster view, **When** displayed, **Then** each player lists their number, position, stick handedness, place of birth, date of birth, draft year, and years in the league.
4. **Given** the depth chart tab, **When** displayed, **Then** players are organized by forward lines (LW-C-RW), defense pairings (LD-RD), and goalies, each in a clean box showing main position, secondary positions, and GP/PTS (or GP/W for goalies, with glove handedness).
5. **Given** the depth chart tab, **When** the visitor toggles to cap view, **Then** each player's display changes from position/stats to cap hit and years remaining (e.g., "12.6m/6").
6. **Given** the depth chart, **When** players are injured or regularly scratched, **Then** they appear in a separate section below the active depth chart, organized by position, with their status (injured or scratched) indicated.
7. **Given** any stat or cap value in the depth chart, **When** the visitor hovers over it, **Then** a tooltip explains what the value represents.

---

### User Story 6 - View Player Profiles (Priority: P6)

A visitor navigates to a player's profile page and sees their headshot (with career headshot gallery on hover), biographical info, position history, career team/number/award history, comprehensive season-by-season stats (NHL by default, with tabs for other leagues and combined), a brief playing style profile with supporting stats, and contract/trade/free agency history. Every entity mentioned is clickable. Emergency goaltenders (EBUGs) are included with their own player profiles, clearly indicating EBUG status.

**Why this priority**: Player profiles are the deepest individual content and serve as a hub connecting to teams, trades, and salary cap information.

**Independent Test**: Can be tested by navigating to any player's profile and verifying all biographical info, stats tabs, player style section, and contract history are displayed with correct cross-links.

**Acceptance Scenarios**:

1. **Given** a player profile page, **When** the visitor hovers over the player's headshot (top left), **Then** all career headshots are displayed.
2. **Given** a player profile, **When** biographical info is displayed, **Then** it shows age, birthplace, team, position(s), stick handedness, height, weight, draft year, draft selection number, and drafting team.
3. **Given** a player profile, **When** position is displayed, **Then** it shows any position played at least 5% of total 5-on-5 ice time in the past 5 years, ordered by most ice time in the last 2 years 5-on-5, with 5-year totals as tiebreaker.
4. **Given** a player profile, **When** the career history section is displayed, **Then** it shows every team the player has played for, the jersey numbers worn on each team, and any awards won with those teams (displayed to the right of the biographical info).
5. **Given** the stats section, **When** the "Other Leagues" tab is selected, **Then** the player's stats from all non-NHL leagues where data is available are displayed.
6. **Given** the "Combined" tab, **When** selected, **Then** stats from both NHL and other leagues appear together.
7. **Given** the player style profile section, **When** displayed, **Then** it includes a brief description of the player's playing style and 2-4 supporting stats that are verified, legitimate, and relevant to that style (e.g., skating top speed for a speedster, hardest shot for a power forward).
8. **Given** the contract section, **When** a trade is listed, **Then** it is clickable and navigates the visitor to the detailed trade page.
9. **Given** the contract section, **When** the visitor clicks the player's salary cap information, **Then** they are navigated to a dedicated salary cap page showing complete contract history and a detailed current contract overview.
10. **Given** an EBUG player profile, **When** displayed, **Then** the profile clearly indicates the player's EBUG status and includes any available stats.

---

### User Story 7 - Browse Salary Cap Information (Priority: P7)

A visitor navigates to the Salary Cap page and sees all NHL teams with their logo, number of players on cap, total cap used, cap available, and LTIR cap space. They click a team to see detailed per-player cap allocation with years remaining, UFA/RFA status, contract clauses, future cap projections, draft pick inventory, and a buyout calculator. A "Salary Cap Explained" guide provides searchable, plain-language explanations of all cap rules.

**Why this priority**: Salary cap information is essential for understanding team-building decisions and is highly sought after by engaged fans.

**Independent Test**: Can be tested by navigating to the Salary Cap page, selecting a team, verifying all cap details and the buyout calculator, and browsing the Salary Cap Explained guide.

**Acceptance Scenarios**:

1. **Given** the Salary Cap default page, **When** displayed, **Then** all 32 NHL teams show their logo, number of players on cap, total cap used, cap available, and LTIR cap space.
2. **Given** a team's cap detail page, **When** displayed, **Then** each player shows cap hit, years remaining, UFA/RFA status, and any special clauses (NMC, NTC, etc.), with a forward-looking focus on team-building implications.
3. **Given** the team cap detail page, **When** displayed, **Then** it includes projected salary cap usage for coming years and available draft picks.
4. **Given** the buyout calculator, **When** a visitor selects a player, **Then** the calculator shows the cap implications of buying out that player over the applicable years.
5. **Given** the "Salary Cap Explained" page, **When** the visitor searches for a term, **Then** the search returns relevant sections with legal terms explained in plain language alongside the original terminology.
6. **Given** a section of the Salary Cap Explained guide, **When** the visitor reads it, **Then** an adjacent plain-language companion explains the legal terms in an accessible way.

---

### User Story 8 - View Trade History and Trade Trees (Priority: P8)

A visitor navigates to the Trades page and sees all trades from the current season listed with the most recent first. They filter by season or team and search for a specific player. Clicking a trade opens a detailed page with all known trade information and a visual trade tree showing all prior and subsequent transactions involving the traded pieces, traced as deep as the chain extends in both directions.

**Why this priority**: Trade information connects players, teams, and draft picks across time and is a highly engaging research feature for dedicated fans.

**Independent Test**: Can be tested by searching for a known traded player, viewing the trade details, and navigating the complete trade tree.

**Acceptance Scenarios**:

1. **Given** the Trades page, **When** displayed, **Then** all trades from the current season appear with the most recent at the top.
2. **Given** the Trades page, **When** a visitor filters by a specific team, **Then** only trades involving that team are shown.
3. **Given** the Trades page, **When** a visitor searches for a player by name, **Then** that player's complete trade history is displayed.
4. **Given** a trade detail page, **When** a trade tree exists, **Then** it displays a clean, navigable visualization of all prior and subsequent transactions involving the traded pieces, with each branch going as deep as necessary in both directions.
5. **Given** a trade tree, **When** any player or pick within the tree is displayed, **Then** it is clickable to navigate to the relevant player profile or draft information.

---

### User Story 9 - Browse Free Agent Listings (Priority: P9)

A visitor navigates to the Free Agents page and sees a list of pending free agents for the upcoming offseason with RFA/UFA status, current cap hit, current team, and full player stats, sorted by cap hit. A second tab shows recent free agent signings. Clicking a signing navigates to the player's salary cap section with contract details automatically expanded.

**Why this priority**: Free agent tracking is critical during the offseason and trade deadline periods for engaged fans.

**Independent Test**: Can be tested by loading the Free Agents page and verifying both pending and recent signing tabs with all required data and navigation.

**Acceptance Scenarios**:

1. **Given** the pending free agents tab, **When** displayed, **Then** players are listed with RFA/UFA status, current cap hit, current team, and all standard player stats, sorted by current cap hit by default.
2. **Given** the recent signings tab, **When** a visitor clicks a signing, **Then** they are navigated to the player's salary cap page with the contract explanation automatically opened.
3. **Given** either tab, **When** a visitor clicks a stat column header, **Then** the list re-sorts by that stat.

---

### User Story 10 - View Hockey Personnel Database (Priority: P10)

A visitor navigates to the Personnel page and browses staff members for each team, organized by role: coaches, GMs, scouts, trainers, equipment managers, and owners. Each person's profile shows hockey-related information, awards, career stats (if applicable), a link to their playing career (if they had one), and a history of predecessors at their position.

**Why this priority**: Personnel information completes the organizational picture beyond just players and is valuable for historically minded fans.

**Independent Test**: Can be tested by navigating to any team's coaching staff and verifying profiles, awards, and predecessor history.

**Acceptance Scenarios**:

1. **Given** the Personnel page for a team, **When** displayed, **Then** staff are organized in sections by role: coaches, GMs, scouts, trainers, equipment managers, and owners.
2. **Given** a staff profile for someone who had a playing career, **When** displayed, **Then** it includes a link to their player profile page.
3. **Given** a staff profile, **When** the predecessor history is shown, **Then** it lists all known predecessors in that role for that team in reverse chronological order.
4. **Given** a staff profile, **When** displayed, **Then** all relevant awards, coaching/managerial stats, and hockey-related achievements are listed.

---

### User Story 11 - View Season Schedule (Priority: P11)

A visitor navigates to the Schedule page (located between Teams and Players in the navigation) and sees the season schedule with important dates prominently marked, including the trade deadline, free agent deadline, offer sheet deadline, arbitration deadline, All-Star break, and bye weeks.

**Why this priority**: A dedicated schedule view with key dates provides fans a comprehensive calendar of the season's important milestones.

**Independent Test**: Can be tested by loading the Schedule page and verifying the calendar displays all games and important dates correctly.

**Acceptance Scenarios**:

1. **Given** the Schedule page, **When** displayed, **Then** all season games appear in a calendar format.
2. **Given** the Schedule page, **When** important dates exist, **Then** they are visually signified and distinct from regular game dates (trade deadline, free agent deadline, offer sheet deadline, arbitration deadline, etc.).

---

### Edge Cases

- **No games scheduled**: When no games are scheduled for the selected day, display a message indicating no games are scheduled and show the next upcoming game date.
- **Overtime and shootout games**: Additional periods (OT, SO) are appended to period breakdowns in box scores, score boxes, and Game Hub. The game clock format for OT follows the same "Period Time" convention (e.g., "OT 3:22").
- **Mid-season trades**: A traded player's stats appear under their current team on the Stats page. Their player profile shows stats broken down by team within the season. Trade history is accessible from the player profile.
- **Offseason behavior**: During the offseason, the scores page displays the most recent completed season's final day of games with a notice that the season has ended and the next season's schedule when available.
- **Time zone edge cases**: Display times are adjusted to the visitor's detected time zone. The "game day" shown on the scores page reflects the UTC-8 date to maintain consistency with NHL scheduling even if the visitor is in a different time zone.
- **Non-standard rink dimensions**: The rink diagram reflects the actual dimensions of each arena (e.g., international-size rinks for exhibition games), with measurements displayed on the diagram.
- **Unavailable video**: When video is unavailable for a particular play, the video link/option is not shown and the video indicator dot is not displayed; only the text summary is displayed.
- **All-Star break, bye weeks, and significant dates**: The calendar reflects days with no games, and the scores/schedule pages show contextual messages. Significant league dates (trade deadline, free agent deadline, offer sheet deadline, arbitration deadline, etc.) are prominently marked on the schedule and calendar.
- **Players with no advanced stats**: When advanced metrics (WAR, xGF/60, etc.) are unavailable for a player, those cells display a dash ("—") rather than zero.
- **Franchise relocations**: Teams with relocation history (e.g., Hartford Whalers becoming Carolina Hurricanes) display the full franchise lineage on the team profile.
- **Buyout calculator edge cases**: When a player's contract has special structures (performance bonuses, signing bonuses), the calculator factors these into the buyout projection or notes their impact.
- **Player with no trade history**: The trade history section is omitted from the player profile if no trades exist.
- **Goalie recording goals or assists**: A goalie will never play as a skater, but can rarely notch a goal or assist while playing goalie. If a goalie records goals/assists, those appear in the goalie stat line under the G and A columns.
- **Postponed or cancelled games**: Games that are postponed or cancelled appear in their originally scheduled slot on the scores page with a visible status label ("Postponed" or "Cancelled"). If a rescheduled date is known, it is displayed beneath the status label. The Game Hub link is not shown for games that have not been played.
- **Data source outage**: When the data source is temporarily unavailable, all pages display the last cached data with a "Data as of [timestamp]" banner. The banner is dismissed automatically once live data is restored.
- **Pending game events**: When a game event (e.g., a goal) is under review, it must be displayed as pending until officially confirmed. The pending state should be visually distinct.
- **Emergency goaltenders (EBUGs)**: EBUGs receive player profiles that clearly indicate their EBUG status. Any stats they accumulate are tracked and displayed.
- **Partial trade/signing information**: When a trade or signing is confirmed but details are incomplete, display all available information with a note that "More information is still processing."

## Requirements *(mandatory)*

### Functional Requirements

#### Global Design & Navigation
- **FR-001**: The site MUST display pages in a soft yellow-beige color (antique book tone) with black text by default.
- **FR-002**: The site MUST provide a dark mode with a very dark blue page color and the same soft yellow-beige used in light mode for text.
- **FR-003**: All text MUST be rendered in a typewriter-style font that remains compact and easy to read.
- **FR-004**: All text, language, and shorthand MUST be written in American English.
- **FR-005**: The site MUST display a black banner at the top of every page with the site name "To Be Determined" on the left, a global search bar in the center (on league pages only — no search bar on the main page), and a hamburger menu button on the right.
- **FR-005a**: The global search bar MUST search across all entity types (players, teams, trades, staff, etc.) within the currently selected league and display results grouped by entity type with clickable links to the relevant pages. Results MUST favor the most-searched categories first, followed by alphabetical order. The search bar MUST NOT appear on the main page (league selection).
- **FR-006**: The site name in the banner MUST be clickable from any page to return to the main page.
- **FR-006a**: A persistent secondary navigation bar MUST appear below the black banner on all league pages, providing direct links to each section in this order: Scores, Standings, Stats, Players, Teams, Schedule, Salary Cap, Trades, Free Agents, and Personnel. The active section MUST be visually highlighted.
- **FR-006b**: A score bar MUST appear between the top black banner and the secondary navigation tabs on all league pages. Scores MUST be displayed in separate, distinct boxes/rectangles. The bar MUST be static (not auto-scrolling). When there are too many games to fit in the visible area, left/right arrow buttons MUST appear on the edges of the bar to allow manual scrolling. Each score box MUST be clickable, navigating the user to that game's Game Hub page. The bar MUST display team icons, current score, period, and game clock. This bar is visible on every page within a league.
- **FR-006b-i**: All text in the score bar (ticker) MUST be white — including scores, team abbreviations, "Final" labels, and scheduled times. The ONLY non-white color permitted is red, applied exclusively to the game clock text when there are 5 minutes or fewer remaining in the entire game (3rd period or overtime). No goal-difference condition applies; the sole trigger is ≤5 minutes remaining in a period that could end the game.
- **FR-007**: Any mention of a player, coach, team, GM, trade, season, or other entity with a dedicated page MUST be clickable to navigate to that entity's page.
- **FR-008**: All stat abbreviations MUST display the full stat name when the visitor hovers over them.
- **FR-009**: All grids and charts MUST use alternating row background shading for readability.
- **FR-010**: All times MUST be adjusted to the visitor's detected time zone.
- **FR-011**: All in-game action times MUST be displayed in game clock format showing period and remaining time (e.g., "2nd 12:57").
- **FR-011a**: When the underlying data source is temporarily unavailable, the site MUST display the last cached data with a visible "Data as of [timestamp]" indicator. The indicator MUST be removed once fresh data is restored.
- **FR-011b**: All pages MUST be fully responsive, adapting layouts to mobile, tablet, and desktop viewports. Grid-based layouts (score boxes, stat tables, depth charts, side-by-side grids) MUST reflow to single-column or scrollable formats on narrow screens while preserving all content and interactivity.
- **FR-011c**: The site MUST meet WCAG 2.1 AA compliance across all pages, including sufficient color contrast ratios, full keyboard navigability, screen reader compatibility, and accessible alternatives for interactive elements (hover tooltips, rink diagrams, video players).
- **FR-011d**: All data entities MUST refresh as fast as possible from the data source. Standings, stats, and rosters MUST update just before and after each game. Trades and free agent data MUST update in near real-time to support competitive information seekers. Live game scores MUST refresh at a sub-60-second cadence per FR-016/SC-016.

#### Main Page
- **FR-012**: The main page MUST display icons for each available hockey league, currently limited to the NHL.

#### Scores Page
- **FR-013**: Clicking a league icon MUST navigate to that league's scores page, defaulting to the current day's games based on UTC-8.
- **FR-014**: The scores page MUST continue displaying the previous day's scores for 2 hours after the final game of that day ends.
- **FR-015**: The date (mm/dd format) MUST be displayed above the scores on the left and MUST be clickable to open a calendar for navigating to any day in the current season, showing previous results and upcoming scheduled games.
- **FR-016**: Game score boxes MUST display in a 4-column grid, ordered by start time with ties broken by alphabetical order of the team's location name (e.g., Florida Panthers under "F" for Florida). This location name convention applies throughout the site wherever alphabetical team ordering is used.
- **FR-017**: Each score box MUST show team logos, 3-letter abbreviations, scores (or start time for future games), shots on goal ("SHG") beneath each team in smaller thinner text, the team's season record above the abbreviation in smaller faint text, and the team's league standings rank by point percentage in parentheses next to the record.
- **FR-018**: The away team MUST appear above the home team in each score box, with scores to the right of their respective teams.
- **FR-019**: Season records and standings rank MUST display explanatory tooltips on hover.
- **FR-020**: Each score box MUST include a clickable "Game Hub" link at the bottom.
- **FR-021**: Score boxes MUST be expandable. The expanded view MUST include: (a) a period-by-period goals box score and a period-by-period shots on goal box score placed side by side at half width each, (b) a vertical stat column containing PP, HIT, FO%, TK, GV, and TOP (time of possession), (c) away team goal summaries and penalty summaries to the LEFT of the stat column, (d) home team goal summaries and penalty summaries to the RIGHT of the stat column. The inline scoreboard (team names/scores block) is removed from the expanded view; each team's season record and league standings rank MUST be shown next to the team name in the box score table headers.
- **FR-021a**: Score boxes for games that have not started MUST appear in collapsed state using the same compact format as active games — showing the start time and basic team info. When expanded, the pregame box MUST be 2x2 (2 rows, 2 columns) and show a matchup summary including: a stat comparison table showing each team's GF/GP, GA/GP, SF/GP, SA/GP, PP%, and PK%; head-to-head record showing each team's W/OTW/SOW for the current season and W/OTW/SOW/T all time; top goal scorers per team; top points getters per team; and starting goalie GAA and SV% (or "Awaiting starting goalie confirmation").
- **FR-022**: Only one expanded score box may be visible at a time; expanding a new box MUST collapse the previously expanded one. Only one box per game MUST exist (either small or large, never both simultaneously). When a box is expanded, exactly 3 small boxes MUST fit vertically beside the expanded box (the expanded box spans 3 rows and 3 columns in a 4-column grid). Small boxes remain 1x1 and MUST NOT stretch to fill the expanded box's height. Remaining small boxes wrap to subsequent rows in the standard 4-column format.

#### Game Hub
- **FR-023**: The Game Hub MUST provide tabs for Team Stats (default), Player Stats, Lineups, and Rink Instances. Game Hub is accessible only via score boxes on the Scores page — it is not a primary navigation section.
- **FR-024**: The Team Stats tab MUST display a goals-by-period box score and a shots-by-period box score side by side at half width each at the top. The Team Comparison section (SOG, HIT, PP, FO, GV, TK, TOI with away on left and home on right) MUST be placed adjacent to the right of the box scores, not below them, to minimize vertical scrolling.
- **FR-025**: Goal summaries MUST appear to the left (away team) and right (home team) of the central stats, showing period/time, scorer (first initial and last name) with season goal number, and assisting players (first initial and last name) with season assist numbers.
- **FR-026**: Penalty summaries MUST appear beneath each team's goal summaries, showing period/time, offending player (first initial and last name), penalty type, and the player's season penalty minute total.
- **FR-027**: Each goal MUST be hoverable to reveal an option to view a video of the goal (when available).
- **FR-028**: Each penalty MUST be hoverable to reveal options to view a video of the penalty or navigate to the corresponding rule book entry.
- **FR-029**: Hovering over any player name in the Game Hub MUST display a popup with the player's headshot and season stats (GP, G, A, +/-, PIM).
- **FR-030**: The Team Stats tab MUST include a complete official score sheet beneath the summaries.
- **FR-031**: The Player Stats tab MUST display two side-by-side grids (away left, home right) with skater stats: #, G, A, PTS, +/-, HIT, PIM, TOI, SOG, GV, TK, WAR, xGF/60, FO% (FO% last).
- **FR-032**: Goalie stats in the Player Stats tab MUST include SA, SV, SV%, TOI, HDC/HDS, LDC/LDS, and WAR in a separate header section.
- **FR-033**: Player stat grids MUST scroll horizontally if columns exceed the display width.
- **FR-034**: The Rink Instances tab MUST display an accurately dimensioned diagram of the game's rink, including measurements and labels for the home bench and away bench sides, penalty boxes, and an accurate view of the layout of the stands with actual seat colors if available. If seat color information is unavailable, display an outline of the stands based on best available information with seats shown in washed-out gray.
- **FR-035**: The rink diagram MUST support switchable views for goals, shots (including goals), hits, giveaways, and takeaways, with the ability to add more views in the future.
- **FR-036**: Event dots on the rink MUST use the acting team's primary color; goal dots MUST be half bright green and half the scoring team's color.
- **FR-037**: Hovering over a rink dot MUST display the action type, player, and game clock time. Clicking a dot with available video MUST open a modal containing an embedded video player (sourced from the data provider) with footage of the play including multiple replays from multiple angles. Dots with available video MUST show a small, unintrusive indicator: a small black dot within the colored dot (not a traditional play button). This indicator design must be easily changeable.

#### Standings
- **FR-038**: The Standings page MUST default to wild card format, grouped by division and conference, ranked by point percentage.
- **FR-039**: Displayed stats MUST include GP, W, L, OTL, PTS, PTS%, RW, ROW, GF, GA, DIFF, PP%, PK%, and FO%.
- **FR-040**: Alternate views MUST be available: wild card (default), divisional, conference, and total league.
- **FR-041**: Clicking any stat column header MUST re-sort the standings by that stat.

#### Stats
- **FR-042**: The Stats page MUST provide sections for all players, all goalies, all forwards, all defensemen, all rookie players, and all rookie goalies.
- **FR-043**: Skater stats MUST include: team, GP, G, A, PTS, +/-, HIT, PIM, TOI/GP, SOG, SH%, BLK, EVP, PPP, SHP, GV, TK, WAR, xGF/60, xGA/60, SO%, FO%, with default sort by G descending.
- **FR-044**: Goalie stats MUST include: team, GP, W, L, OTL, SV%, GAA, SA, SV, GA, GS, HDC/HDS, LDC/LDS, WAR, G, A, with default sort by W descending.
- **FR-045**: Clicking any stat column header MUST re-sort the list by that stat.
- **FR-045a**: Stats, Free Agents, and other pages with large result sets MUST paginate results at 50 rows per page with page navigation controls. Re-sorting by a stat column MUST apply across the full data set, not just the visible page.

#### Schedule
- **FR-045b**: The Schedule page MUST display the full season schedule in a calendar format with all games.
- **FR-045c**: Important league dates MUST be prominently displayed on the schedule: trade deadline, free agent deadline, offer sheet deadline, arbitration deadline, All-Star break, bye weeks, and any other significant dates.

#### Teams
- **FR-046**: The Teams index page MUST display all current NHL team icons sorted alphabetically by team location name (e.g., Florida Panthers under "F" for Florida). This convention applies to all team alphabetical ordering across the site.
- **FR-047**: Each team profile MUST display the team logo (top left), current season record (beside the logo), all-time record (below the current record), the year/season the team joined the league, and franchise relocation history with years active (if applicable).
- **FR-048**: Each team profile MUST display Stanley Cup wins on the right side: total count, count since the 1973 final, and count since the 2006 final.
- **FR-049**: The team roster MUST display each player's number, position, stick handedness, place of birth, date of birth, draft year, and years in the league.
- **FR-050**: The depth chart tab MUST organize players by forward lines (LW-C-RW), defense pairings (LD-RD), and goalies in clean boxes, showing main position, secondary positions, and GP/PTS (or glove handedness and GP/W for goalies).
- **FR-051**: The depth chart MUST include a separate section below the active roster for scratched and injured players, organized by position, with their status indicated.
- **FR-052**: The depth chart MUST provide a toggle between stats view (position, GP/PTS) and cap view (cap hit/years remaining).
- **FR-053**: All statistics and cap information in the depth chart MUST display explanatory tooltips on hover.

#### Players
- **FR-053a**: The Players navigation link MUST take the user to a page listing the most searched players in the last week by default. A filter MUST allow switching between most searched players in the last day, last week (default), last month, and last year. Each player listing MUST be clickable to navigate to that player's profile page.
- **FR-054**: The player profile MUST display the most recent headshot in the top left, with a career headshot gallery appearing on hover.
- **FR-055**: Biographical information MUST include age, birthplace, team, position(s), stick handedness, height, weight, draft year, draft selection number, and drafting team.
- **FR-056**: Position display MUST show any position played at least 5% of total 5-on-5 ice time in the past 5 years, ordered by most ice time in the last 2 years 5-on-5 (5-year totals as tiebreaker).
- **FR-057**: To the right of biographical info, the profile MUST show every team the player has played for, jersey numbers worn on each team, and awards won with each team.
- **FR-058**: Player season-by-season stats MUST be displayed with three tabs: NHL (default), Other Leagues, and Combined.
- **FR-059**: The player style profile MUST include a brief narrative of the player's playing style with 2-4 verified, legitimate supporting statistics relevant to that style.
- **FR-060**: The contract/history section MUST include current contract summary, contract history, trade history (each trade clickable to the trade detail page), and free agency history.
- **FR-061**: Clicking the player's salary cap information MUST navigate to a dedicated page showing complete contract history and detailed current contract overview.
- **FR-061a**: Emergency goaltenders (EBUGs) MUST have player profiles that clearly indicate EBUG status, with all available stats displayed.

#### Salary Cap
- **FR-062**: The default Salary Cap page MUST list all NHL teams with their logo, number of players on cap, total cap used, cap available, and LTIR cap space.
- **FR-063**: Clicking a team MUST open a detailed page showing each player's cap hit, years remaining, UFA/RFA status, and contract clauses (NMC, NTC, etc.).
- **FR-064**: The team cap detail page MUST include projected salary cap usage for coming years and available draft picks.
- **FR-065**: The team cap detail page MUST include a buyout calculator that computes and displays the cap implications of buying out a selected player.
- **FR-066**: A "Salary Cap Explained" button MUST open a searchable guide with all salary cap rules, featuring a glossary and plain-language explanations alongside the original legal terminology.

#### Trades
- **FR-067**: The Trades page MUST list all trades from the current season, most recent first.
- **FR-068**: Filters MUST be available for previous seasons and specific teams; a search box MUST allow searching by player name.
- **FR-069**: Clicking a trade MUST display all known details and a clean, navigable visual trade tree showing all prior and subsequent transactions involving the traded pieces, traced as deep as necessary in both directions.

#### Free Agents
- **FR-070**: The pending free agents tab MUST list upcoming free agents with RFA/UFA status, current cap hit, current team, and all standard player stats, sorted by cap hit by default.
- **FR-071**: The recent signings tab MUST list signings most recent first, clickable to navigate to the player's salary cap page with the contract details auto-expanded.

#### Personnel
- **FR-072**: The Personnel section MUST provide a database of team staff organized by role: coaches, GMs, scouts, trainers, equipment managers, and owners (in that order).
- **FR-073**: Each staff profile MUST include hockey-related information, awards, stats (if applicable), a link to their playing career (if applicable), and a history of predecessors at their position.

### Key Entities

- **League**: A professional hockey league (e.g., NHL). Contains teams, a schedule, standings, and league-wide statistics. Identified by name and logo.
- **Team**: An organization within a league. Has a roster, depth chart, salary cap allocation, franchise history (including relocation history), personnel, and trade history. Identified by location name, team name, 3-letter abbreviation, logo, and primary color.
- **Player**: An individual athlete. Has biographical info, career stats across multiple leagues, headshots (current and historical), playing style profile, contract history, trade history, and free agency history. Identified by name, headshot, and jersey number. Includes EBUGs with designated status.
- **Game**: A single contest between two teams on a specific date at a specific venue. Contains scores by period, play-by-play events (goals, penalties, shots, hits, giveaways, takeaways), player stats, and an official score sheet. Events include location coordinates for rink diagrams. Events under review are marked as pending.
- **Trade**: An exchange of players, draft picks, or other assets between teams. Forms trade trees through both prior and subsequent transactions involving the traded pieces. Has a date and the participating teams.
- **Contract**: A player's employment agreement with a team. Includes cap hit, term/years remaining, signing bonuses, performance bonuses, clauses (NMC, NTC), and UFA/RFA status at expiration.
- **Personnel**: Non-player staff member of a team. Categorized as coach, GM, scout, trainer, equipment manager, or owner. Has career history, awards, predecessor lineage, and optionally a playing career link.
- **Free Agent**: A player whose contract has or will expire. Classified as RFA (Restricted Free Agent) or UFA (Unrestricted Free Agent) based on age and years of service.
- **Season**: A year of league play. Contains a schedule, standings snapshots, player statistics, trades, and free agent transactions. Identified by year range (e.g., 2025-26).
- **Rink/Arena**: A physical venue with specific ice surface dimensions, bench locations, penalty box locations, and stand/seat layout. Used for accurate rink instance diagrams.
- **Rule Book Entry**: A specific rule from the official league rule book, referenced from penalty summaries, with both official text and accessible explanation.
- **Important Date**: A significant league date (trade deadline, free agent deadline, offer sheet deadline, arbitration deadline, etc.) displayed on the schedule and calendar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visitors can navigate from the main page to any specific game's expanded score box within 3 clicks and under 10 seconds.
- **SC-002**: The scores page loads and displays all game boxes for a given day within 2 seconds on a standard broadband connection.
- **SC-003**: Expanding a score box reveals all detailed stats within 1 second with no visible layout shift.
- **SC-004**: Visitors can reach any player's profile from any page where that player is mentioned in a single click.
- **SC-005**: 100% of stat abbreviations across all pages display their full name on hover.
- **SC-006**: Standings and stat tables can be re-sorted by any column and display the updated order within 1 second.
- **SC-007**: The site supports at least 5,000 concurrent visitors without noticeable performance degradation.
- **SC-017**: The site maintains 99.9% uptime (~8.7 hours/year maximum downtime). Scheduled maintenance MUST occur only during non-game windows.
- **SC-008**: 90% of first-time visitors can locate a specific player's season stats within 60 seconds in usability testing.
- **SC-009**: All game clock times are displayed in the correct "Period Time" format (e.g., "2nd 12:57") with zero formatting errors across the site.
- **SC-010**: Both light mode and dark mode are fully usable with all content readable, no contrast issues, and consistent visual hierarchy.
- **SC-011**: Rink diagrams accurately reflect each venue's dimensions and correctly identify home and away bench sides, penalty boxes, and stand layout.
- **SC-012**: Trade trees display the complete chain of transactions with no missing links for trades where data is available, tracing both prior and subsequent transactions.
- **SC-013**: The buyout calculator produces cap impact figures that match official CBA buyout formulas.
- **SC-014**: 90% of visitors rate the site's readability and ease of navigation as "easy" or "very easy" in user testing.
- **SC-015**: All cross-links between entities (players, teams, trades, contracts) correctly navigate to the intended destination page with zero broken links.
- **SC-016**: During live games, scores on the scores page, Game Hub, and the live score ticker update automatically at the fastest feasible cadence (target: sub-60 seconds) without requiring a page refresh.

## Assumptions

- The initial release covers the NHL only; other leagues (AHL, ECHL, KHL, SHL, Liiga, etc.) will be added in future phases with all applicable data integration.
- The hamburger menu will contain Account, Settings, and League Selector. Additional items (Donations, Feedback, Site Mission) may be added. Some navigation sections may be moved from the banner to the hamburger menu.
- Multi-language support (French, Swedish, Finnish, Russian) is deferred to a future phase.
- The Games section (trivia, fantasy hockey, multiplayer) is deferred to a future phase.
- The primary data source for game data, player stats, event coordinates, and video is the NHL official API or a licensed data aggregator (e.g., Sportradar). Video content is delivered by embedding the provider's video URLs in a modal player on-site with multiple replays and angles; no video is self-hosted. Video content availability depends on the licensing agreement with the chosen provider; plays without available video simply do not display a video option.
- Player style profiles will be derived from available statistical data and publicly known player characterizations, using only verified statistics.
- The "Salary Cap Explained" guide content will be curated based on the official CBA, written in accessible language by the content team.
- The NHL rule book content referenced in penalty hover states will be maintained as an internal reference within the site.
- AHL and ECHL affiliate roster integration in the team depth chart is deferred to a future phase.
- Historical/defunct team profiles on the Teams page are deferred to a future phase.
- Historical data extends as far back as reliable data can go, with era differentiation (Original 6 to 1972, 1973-2005, 2006-present salary cap era).
- A Schedule page with season calendar and important dates is a primary navigation section, positioned between Teams and Players.
- All data refreshes as fast as possible. Standings, stats, and rosters update just before and after each game. Trades and free agents update in near real-time. Live game scores update at sub-60-second cadence.
- Rink diagrams are based on publicly available arena dimension data for each NHL venue, including stand layouts and seat colors where available.
- The site is delivered as a statically generated site with incremental rebuilds triggered at each data refresh interval, served via CDN. Client-side polling handles live score updates between rebuilds.
- Advanced stats (WAR, xGF/60, xGA/60, etc.) depend on a data source providing these metrics; cells display "—" when data is unavailable.
- The initial stat column set on each page is fixed; user customization of displayed stats is deferred to the account management future phase.
- Manual time zone override is deferred to the account management future phase; the system relies on automatic detection initially.
- When a trade or signing is confirmed with incomplete details, available information is shown with a "More information is still processing" indicator.

## Scope Boundaries

### In Scope
- All primary sections: Main Page, Scores, Standings, Stats, Players, Teams, Schedule, Salary Cap, Trades, Free Agents, Personnel
- Game Hub (accessible through Scores, not a primary navigation section)
- Light mode and dark mode with the specified color schemes
- Typewriter-style font across the site
- Global navigation with persistent black banner and clickable site name
- Live score ticker between banner and navigation tabs on all league pages
- Universal entity cross-linking (every mention of a player, team, trade, etc. is clickable)
- Stat abbreviation hover tooltips on all pages
- Alternating row shading in all data grids
- Automatic time zone detection and adjustment
- Game clock time format for all in-game events
- Calendar-based score browsing within the current season
- Expandable score boxes with exclusive open behavior and pregame matchup summaries
- Sortable stat columns across standings, stats, and free agent pages
- Rink event diagrams with team-colored dots, five switchable views, penalty boxes, and stand layout
- Trade trees with full transaction chain visualization in both directions (prior and subsequent)
- Buyout calculator on team salary cap pages
- Salary Cap Explained searchable guide with plain-language companion
- Official score sheet display in Game Hub
- Player career headshot gallery
- Depth chart with stats/cap toggle view
- EBUG player profiles
- Schedule page with important league dates
- Pending state for game events under review
- Partial information display for confirmed but incomplete trades/signings
- Historical data extending as far back as reliable data allows, with era differentiation
- FO% added to standings stats

### Out of Scope (Future Phases)
- User accounts, authentication, and personalization settings
- Custom stat column selection through account settings
- Multi-language support (French, Swedish, Finnish, Russian, etc.)
- Games section (trivia, fantasy hockey, multiplayer)
- AHL/ECHL affiliate roster integration in depth charts
- Historical/defunct team profiles
- Manual time zone override in account management
- Additional rink diagram views beyond the initial five (goals, shots, hits, giveaways, takeaways)
- Lineups tab content in Game Hub (tab is present but detailed specification to be defined separately)
- Past teams on the Teams index page
- Integration of the same data for additional leagues (AHL, ECHL, KHL, SHL, Liiga, etc.)
