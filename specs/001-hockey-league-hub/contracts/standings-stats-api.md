# API Contract: Standings & Stats

## GET /api/leagues/{leagueId}/standings

Returns league standings with all stat columns.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| view | string | "wildcard" | "wildcard", "division", "conference", "league" |
| sort | string | "pointsPct" | Any stat field name |
| sortDir | string | "desc" | "asc" or "desc" |
| season | string | current | Season label, e.g., "2025-26" |

**Response** `200 OK`:
```json
{
  "season": "2025-26",
  "view": "wildcard",
  "sortedBy": "pointsPct",
  "dataAsOf": "2026-03-15T20:00:00Z",
  "groups": [
    {
      "label": "Central Division",
      "conference": "Western",
      "teams": [
        {
          "teamId": 21,
          "abbreviation": "COL",
          "logoUrl": "/assets/teams/col.svg",
          "name": "Colorado Avalanche",
          "gamesPlayed": 67,
          "wins": 42,
          "losses": 20,
          "overtimeLosses": 5,
          "points": 89,
          "pointsPct": 0.664,
          "regulationWins": 35,
          "regulationPlusOTWins": 39,
          "goalsFor": 234,
          "goalsAgainst": 189,
          "goalDifferential": 45,
          "powerPlayPct": 24.5,
          "penaltyKillPct": 82.1,
          "faceoffPct": 51.3,
          "divisionRank": 1,
          "conferenceRank": 2,
          "leagueRank": 5,
          "wildCardRank": null
        }
      ]
    }
  ]
}
```

**Notes**:
- Wild card view: groups are divisions within conferences, with wild card teams grouped separately per conference
- All other views: teams are grouped by their respective grouping and ranked within
- Sorting applies within groups; client can request global sort via `view=league`
- Alternating row shading handled by frontend (FR-009)

---

## GET /api/leagues/{leagueId}/stats

Returns league-wide player/goalie stats for the Stats page.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| section | string | "all-players" | "all-players", "all-goalies", "all-forwards", "all-defensemen", "rookie-players", "rookie-goalies" |
| sort | string | "goals" (skaters) / "wins" (goalies) | Any stat field name |
| sortDir | string | "desc" | "asc" or "desc" |
| page | int | 1 | Page number |
| pageSize | int | 50 | Rows per page (FR-045a) |
| season | string | current | Season label |

**Response** `200 OK`:
```json
{
  "section": "all-players",
  "season": "2025-26",
  "sortedBy": "goals",
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 832,
    "totalPages": 17
  },
  "dataAsOf": "2026-03-15T18:00:00Z",
  "players": [
    {
      "playerId": 8478420,
      "name": "Nathan MacKinnon",
      "teamId": 21,
      "teamAbbreviation": "COL",
      "teamLogoUrl": "/assets/teams/col.svg",
      "gamesPlayed": 64,
      "goals": 35,
      "assists": 74,
      "points": 109,
      "plusMinus": 28,
      "hits": 32,
      "penaltyMinutes": 18,
      "timeOnIcePerGame": 21.5,
      "shots": 245,
      "shootingPct": 14.3,
      "blockedShots": 15,
      "evenStrengthPoints": 72,
      "powerPlayPoints": 35,
      "shortHandedPoints": 2,
      "giveaways": 45,
      "takeaways": 38,
      "war": null,
      "xGFPer60": null,
      "xGAPer60": null,
      "shootoutPct": 50.0,
      "faceoffPct": 52.8
    }
  ]
}
```

**Goalie response** (when section is a goalie section):
```json
{
  "goalies": [
    {
      "playerId": 8479406,
      "name": "Scott Wedgewood",
      "teamId": 21,
      "teamAbbreviation": "COL",
      "gamesPlayed": 36,
      "wins": 25,
      "losses": 8,
      "overtimeLosses": 3,
      "savePct": 0.912,
      "goalsAgainstAvg": 2.65,
      "shotsAgainst": 1050,
      "saves": 958,
      "goalsAgainst": 92,
      "gamesStarted": 34,
      "highDangerChances": 180,
      "highDangerSaves": 150,
      "lowDangerChances": 420,
      "lowDangerSaves": 415,
      "war": null,
      "goals": 0,
      "assists": 1
    }
  ]
}
```

**Notes**:
- Sorting applies across the full dataset, not just the visible page (FR-045a)
- Advanced stats (WAR, xGF/60, xGA/60) return null when unavailable — frontend displays "—"
- Section filtering is done server-side using player position data
