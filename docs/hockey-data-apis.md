# Hockey Data APIs Research

Researched: 2026-03-17

## Free / No-Auth APIs

### NHL Web API (`api-web.nhle.com/v1/`)
- **Data:** Schedules, standings, rosters, play-by-play, player stats, NHL EDGE tracking (shot speed, skate speed)
- **Cost:** Free, no key required
- **Freshness:** Near-real-time during games
- **Caveat:** Undocumented, unsupported — endpoints can change without notice
- **Community docs:**
  - https://github.com/Zmalski/NHL-API-Reference
  - https://gitlab.com/dword4/nhlapi
- **C# wrapper:** [Nhl.Api NuGet package](https://www.nuget.org/packages/Nhl.Api) (v3.9.1) — typed models, ASP.NET Core DI-ready via `Nhl.Api.Extensions.Microsoft.DependencyInjection`
  - GitHub: https://github.com/Afischbacher/Nhl.Api

### NHL Stats REST API (`api.nhle.com/stats/rest/`)
- **Data:** Historical player/team statistics, all-time records, milestones
- **Cost:** Free, no key required
- **Freshness:** Updated as games complete

### ESPN Hidden API (`site.api.espn.com/apis/site/v2/sports/hockey/nhl/`)
- **Data:** Scoreboard, news, teams, rosters, standings
- **Cost:** Free, no auth
- **Endpoints:** `/scoreboard`, `/news`, `/teams`, `/teams/:id`
- **Caveat:** Unofficial, can break without warning
- **Docs:** https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b

---

## Free Data Downloads (CSV — ETL into SQL Server)

### MoneyPuck (`moneypuck.com/data.htm`)
- **Data:** 1.7M+ shots (2007-08 to present, 124 attributes per shot), xG models, advanced player/goalie/team stats, playoff probabilities
- **Cost:** Free (attribution requested)
- **Format:** CSV files — ideal for nightly Hangfire ETL job into SQL Server
- **Freshness:** Updated nightly during season

### Natural Stat Trick (`naturalstattrick.com`)
- **Data:** Corsi, Fenwick, high-danger chances, 5v5/PP/PK splits, on-ice shooting %, GSAX, advanced metrics (2007-08 to present)
- **Cost:** Free
- **Access:** Manual CSV download or web scraping (no formal API)

---

## Low-Cost Paid APIs

### BALLDONTLIE (`nhl.balldontlie.io`)
- **Data:** Player search, games, standings, betting odds, team stats, 150+ functions
- **Cost:**
  - Free tier: basic endpoints, **5 requests/minute**
  - ALL-STAR: $9.99/mo
  - GOAT: $39.99/mo
  - ALL-ACCESS (all sports): $299.99/mo
- **Auth:** API key
- **Freshness:** Near-real-time
- **Note:** Has an official MCP server for AI integration

### API-Sports (`api-sports.io/sports/hockey`)
- **Data:** Leagues, cups, standings, games, odds, teams, players, stats — NHL + international leagues
- **Cost:**
  - Free: 100 requests/day (all endpoints, no credit card)
  - Paid: from ~$10/mo, scales up to 1.5M req/day
- **Auth:** API key (`x-apisports-key` header)
- **Coverage:** NHL plus many international leagues (12 sports total)

### MySportsFeeds (`mysportsfeeds.com`)
- **Data:** Schedules, scores, box scores, standings, play-by-play, lineups, injuries, DFS, odds, projections
- **Cost:**
  - **Free for non-commercial use** (students/hobbyists)
  - Commercial plans: contact sales
  - Add-ons (DFS, odds, projections): ~$29/mo each
- **Auth:** HTTP Basic Auth (username + API key)
- **Formats:** JSON, XML, CSV

### SportDevs (`sportdevs.com/hockey`)
- **Data:** Stadiums, match stats, players, teams, livescores, predictions, odds, leagues, seasons, lineups, injuries, standings
- **Cost:**
  - Free trial: 300 requests/day
  - Paid: contact for pricing
- **Auth:** Bearer token

### MoreHockeyStats (`morehockeystats.com/data/api`)
- **Data:** Games, shifts, player stats, coaches, divisions (MongoDB-style query interface)
- **Cost:** Some collections free; paid collections charge per record (e.g., games: $0.20/record). PayPal prepaid balance.

---

## Enterprise-Grade APIs ($500+/mo)

### Sportradar (`developer.sportradar.com`)
- **Data:** Schedules, live scores, play-by-play, box scores, standings, team/player stats, odds, injuries, lineups
- **Cost:** ~$500–1,000+/mo (custom quotes). 30-day trial available.
- **Auth:** API key (40-char string in request header)
- **Rate Limits:** 25,000 requests/30 days (trial)
- **Freshness:** Real-time
- **Note:** NHL's official data partner. Most comprehensive commercial feed.

### SportsDataIO / FantasyData (`sportsdata.io/nhl-api`)
- **Data:** Live scores, play-by-play, box scores, player/team stats, standings, schedules, injuries, news, DFS projections, odds
- **Cost:** Free trial (1,000 calls/mo, scrambled data). Production: ~$500+/mo (contact sales).
- **Auth:** API key (`Ocp-Apim-Subscription-Key` header)
- **Rate Limits:** Unlimited on production plans

---

## Specialty APIs

### Elite Prospects (`eliteprospects.com/api`)
- **Data:** Player profiles across 900+ leagues (U14 to pro), draft history, transfer records, coaching data
- **Cost:** Free for non-commercial use. Current-season data free. Historical depth available as one-time purchase.
- **Auth:** API key (email api@eliteprospects.com)
- **Coverage:** NHL, CHL, SHL, KHL, Liiga, DEL, and hundreds more
- **Note:** Used by NHL.com itself

### Sportbex (`sportbex.com/hockey-api`)
- **Data:** Fixtures, live scores, player stats, injuries, odds, historical data (since 2010)
- **Cost:** Contact for pricing
- **Coverage:** NHL, KHL, SHL, Liiga, DEL, NLA, Czech Extraliga, ICEHL, IIHF, Olympics

### Highlightly (`highlightly.net/documentation/nhl/`)
- **Data:** Live scores, match predictions, video highlights, game recaps, post-match interviews
- **Cost:** Free tier available; paid plans via RapidAPI

---

## Fantasy Hockey APIs

### Yahoo Fantasy Sports API (`developer.yahoo.com/fantasysports`)
- **Data:** Fantasy league data, rosters, player stats, draft results, transactions, matchups (user's own leagues only)
- **Cost:** Free
- **Auth:** OAuth 2.0 (requires Yahoo developer app registration)
- **C# wrapper:** https://github.com/isaacrlevin/YahooFantasyWrapper

### SportsDataIO DFS
- **Data:** DFS projections, fantasy points, ownership %, salary data (DraftKings/FanDuel)
- **Cost:** Included with SportsDataIO production plans

---

## RapidAPI Marketplace Options

| API | Data | Free Tier |
|-----|------|-----------|
| Tank01 NHL | Real-time in-game stats, schedules, rosters | 1,000 req/mo |
| APIFactory NHL | Games, teams, players, drafts, live data | Free tier available |
| Highlightly NHL/NCAAH | Scores, predictions, video highlights | Free tier available |

---

## Recommended Strategy

1. **Start with `Nhl.Api` NuGet package** — free, C#-native, covers scores/stats/schedules/EDGE data
2. **Add MoneyPuck CSVs** via nightly Hangfire job for advanced analytics (xG, shot maps)
3. **ESPN API** for quick news/scoreboard widgets on Angular side
4. **Elite Prospects** for prospect/draft/international coverage
5. **Upgrade to API-Sports or BALLDONTLIE** (~$10–40/mo) if a supported SLA is needed
6. **Sportradar** only if going commercial and needing guaranteed uptime
