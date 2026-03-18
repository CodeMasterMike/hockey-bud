# API Contract: Scores

## GET /api/leagues/{leagueId}/scores

Returns all games for a given date, formatted for the scores page.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| date | string (yyyy-MM-dd) | today (UTC-8) | Game date to retrieve |

**Response** `200 OK`:
```json
{
  "date": "2026-03-15",
  "dateDisplay": "03/15",
  "showPreviousDay": false,
  "dataAsOf": "2026-03-15T22:30:00Z",
  "games": [
    {
      "id": 2025020850,
      "status": "Final",
      "scheduledStart": "2026-03-15T23:00:00Z",
      "scheduledStartLocal": "7:00 PM",
      "homeTeam": {
        "id": 21,
        "abbreviation": "COL",
        "logoUrl": "/assets/teams/col.svg",
        "score": 4,
        "shotsOnGoal": 32,
        "record": "42-20-5",
        "pointsPct": 0.664,
        "leagueRank": 5
      },
      "awayTeam": {
        "id": 30,
        "abbreviation": "MIN",
        "logoUrl": "/assets/teams/min.svg",
        "score": 2,
        "shotsOnGoal": 28,
        "record": "38-25-4",
        "pointsPct": 0.597,
        "leagueRank": 12
      }
    }
  ]
}
```

**Notes**:
- `showPreviousDay`: true when within 2 hours of last game ending (FR-014)
- Games ordered by `scheduledStart` ASC, then team location name alphabetically (FR-016)
- `scheduledStartLocal` shown in place of scores when `status` = "Scheduled" (FR-017)

---

## GET /api/leagues/{leagueId}/scores/{gameId}/expanded

Returns expanded score box data for a single game.

**Response** `200 OK`:
```json
{
  "gameId": 2025020850,
  "periodScores": [
    { "period": "1st", "homeGoals": 1, "awayGoals": 0, "homeShots": 10, "awayShots": 8 },
    { "period": "2nd", "homeGoals": 2, "awayGoals": 1, "homeShots": 12, "awayShots": 11 },
    { "period": "3rd", "homeGoals": 1, "awayGoals": 1, "homeShots": 10, "awayShots": 9 }
  ],
  "stats": {
    "homePowerPlay": "1/3",
    "awayPowerPlay": "0/2",
    "homeHits": 24,
    "awayHits": 19,
    "homeFaceoffPct": 52.1,
    "awayFaceoffPct": 47.9,
    "homeTakeaways": 5,
    "awayTakeaways": 8,
    "homeGiveaways": 7,
    "awayGiveaways": 4,
    "homeTimeOfPossession": "10:42",
    "awayTimeOfPossession": "9:18"
  },
  "goalSummaries": {
    "home": [
      {
        "period": "1st",
        "time": "12:57",
        "displayTime": "1st 12:57",
        "scorer": { "playerId": 8478420, "name": "N. MacKinnon", "goalNumber": 35 },
        "assists": [
          { "playerId": 8480069, "name": "C. Makar", "assistNumber": 52 }
        ],
        "isPowerPlay": true,
        "videoUrl": "https://..."
      }
    ],
    "away": []
  },
  "penaltySummaries": {
    "home": [
      {
        "period": "2nd",
        "time": "8:33",
        "displayTime": "2nd 8:33",
        "player": { "playerId": 8475233, "name": "J. Manson" },
        "penaltyType": "Tripping",
        "penaltyMinutes": 2,
        "playerSeasonPIM": 42,
        "ruleBookRef": "Rule 57",
        "videoUrl": null
      }
    ],
    "away": []
  }
}
```

---

## GET /api/scores/live

Returns only currently live games for client-side polling. Lightweight endpoint optimized for 60-second intervals.

**Response** `200 OK`:
```json
{
  "dataAsOf": "2026-03-15T23:45:00Z",
  "games": [
    {
      "id": 2025020850,
      "status": "Live",
      "period": 2,
      "periodTimeRemaining": "14:22",
      "homeScore": 2,
      "awayScore": 1,
      "homeShotsOnGoal": 18,
      "awayShotsOnGoal": 15
    }
  ]
}
```

**Caching**: Redis 15-second TTL. SignalR pushes updates to connected clients in real time; fallback to client polling every 30 seconds (SC-016).

---

## GET /api/leagues/{leagueId}/scores/ticker

Returns minimal live game data for the persistent score ticker bar (FR-006b). Extremely lightweight.

**Response** `200 OK`:
```json
{
  "dataAsOf": "2026-03-15T23:45:00Z",
  "games": [
    {
      "id": 2025020850,
      "status": "Live",
      "period": 2,
      "periodTimeRemaining": "14:22",
      "periodTimeRemainingSeconds": 862,
      "homeTeam": { "id": 21, "abbreviation": "COL", "logoUrl": "/assets/teams/col.svg" },
      "awayTeam": { "id": 30, "abbreviation": "MIN", "logoUrl": "/assets/teams/min.svg" },
      "homeScore": 2,
      "awayScore": 1
    }
  ]
}
```

**Notes**:
- `periodTimeRemainingSeconds` used for client-side countdown between server updates
- Delivered via SignalR hub (`/hubs/scores`) for real-time push; REST endpoint as fallback
- Shown on ALL league pages between the black banner and navigation tabs

---

## GET /api/leagues/{leagueId}/scores/{gameId}/pregame

Returns pregame matchup summary for games that have not started (FR-021a).

**Response** `200 OK`:
```json
{
  "gameId": 2025020851,
  "status": "Scheduled",
  "homeTeam": {
    "id": 21,
    "abbreviation": "COL",
    "topGoalScorers": [
      { "playerId": 8478420, "name": "N. MacKinnon", "goals": 35 }
    ],
    "topPointGetters": [
      { "playerId": 8478420, "name": "N. MacKinnon", "points": 109 }
    ],
    "startingGoalie": {
      "playerId": 8479406,
      "name": "S. Wedgewood",
      "gaa": 2.65,
      "savePct": 0.912,
      "confirmed": true
    },
    "powerPlayPct": 24.5,
    "penaltyKillPct": 82.1
  },
  "awayTeam": {
    "id": 30,
    "abbreviation": "MIN",
    "topGoalScorers": [],
    "topPointGetters": [],
    "startingGoalie": {
      "playerId": null,
      "name": null,
      "gaa": null,
      "savePct": null,
      "confirmed": false
    },
    "powerPlayPct": 21.8,
    "penaltyKillPct": 79.5
  },
  "headToHead": {
    "currentSeason": {
      "home": { "wins": 2, "overtimeWins": 0, "shootoutWins": 0 },
      "away": { "wins": 1, "overtimeWins": 0, "shootoutWins": 0 }
    },
    "allTime": {
      "home": { "wins": 62, "overtimeWins": 14, "shootoutWins": 9, "ties": 8 },
      "away": { "wins": 51, "overtimeWins": 12, "shootoutWins": 9, "ties": 8 }
    }
  }
}
```

**Notes**:
- `startingGoalie.confirmed: false` triggers "Awaiting starting goalie confirmation" text in the UI
- Top scorers/points limited to top 3 per team
- Head-to-head "allTime" covers all available historical data
