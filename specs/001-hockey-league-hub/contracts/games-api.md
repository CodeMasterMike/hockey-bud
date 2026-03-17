# API Contract: Game Hub

## GET /api/games/{gameId}

Returns full Game Hub data for the Team Stats tab (default tab).

**Response** `200 OK`:
```json
{
  "gameId": 2025020850,
  "status": "Final",
  "homeTeam": { "id": 21, "abbreviation": "COL", "name": "Avalanche", "logoUrl": "..." },
  "awayTeam": { "id": 30, "abbreviation": "MIN", "name": "Wild", "logoUrl": "..." },
  "arena": { "name": "Ball Arena", "city": "Denver" },
  "periodScores": [
    { "period": "1st", "homeGoals": 1, "awayGoals": 0, "homeShots": 10, "awayShots": 8 }
  ],
  "teamStats": {
    "shotsOnGoal": { "home": 32, "away": 28 },
    "hits": { "home": 24, "away": 19 },
    "powerPlay": { "home": "1/3", "away": "0/2" },
    "faceoffPct": { "home": 52.1, "away": 47.9 },
    "giveaways": { "home": 7, "away": 4 },
    "takeaways": { "home": 5, "away": 8 },
    "timeOnAttack": { "home": "31:22", "away": "28:38" }
  },
  "goalSummaries": { "home": [], "away": [] },
  "penaltySummaries": { "home": [], "away": [] },
  "scoreSheet": {
    "officials": { "referees": [], "linesmen": [] },
    "threeStars": [],
    "attendance": 17809,
    "duration": "2:34"
  },
  "dataAsOf": "2026-03-15T23:45:00Z"
}
```

Goal and penalty summary objects follow the same structure as the expanded scores endpoint.

---

## GET /api/games/{gameId}/player-stats

Returns per-player stats for the Player Stats tab.

**Response** `200 OK`:
```json
{
  "gameId": 2025020850,
  "home": {
    "skaters": [
      {
        "playerId": 8478420,
        "name": "N. MacKinnon",
        "jerseyNumber": 29,
        "position": "C",
        "goals": 1,
        "assists": 2,
        "points": 3,
        "plusMinus": 2,
        "hits": 1,
        "penaltyMinutes": 0,
        "timeOnIce": "22:14",
        "shots": 5,
        "giveaways": 1,
        "takeaways": 2,
        "war": null,
        "xGFPer60": null,
        "faceoffPct": 58.3
      }
    ],
    "goalies": [
      {
        "playerId": 8479406,
        "name": "S. Wedgewood",
        "jerseyNumber": 41,
        "shotsAgainst": 28,
        "saves": 26,
        "savePct": 0.929,
        "timeOnIce": "60:00",
        "highDangerChances": 8,
        "highDangerSaves": 7,
        "lowDangerChances": 12,
        "lowDangerSaves": 12,
        "war": null
      }
    ]
  },
  "away": { "skaters": [], "goalies": [] }
}
```

---

## GET /api/games/{gameId}/rink-events

Returns event coordinates for the Rink Instances tab.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string | "goals" | "goals", "shots", "hits", "giveaways", "takeaways" |

**Response** `200 OK`:
```json
{
  "gameId": 2025020850,
  "eventType": "goals",
  "arena": {
    "name": "Ball Arena",
    "lengthFeet": 200,
    "widthFeet": 85,
    "homeBenchSide": "Left",
    "awayBenchSide": "Right",
    "penaltyBoxSide": "Right",
    "standsLayout": {
      "available": true,
      "svgTemplateUrl": "/assets/arenas/ball-arena-stands.svg",
      "seatColorsAvailable": true
    }
  },
  "events": [
    {
      "id": 12345,
      "teamId": 21,
      "teamColor": "#6F263D",
      "x": 65.2,
      "y": -12.5,
      "period": "1st",
      "time": "12:57",
      "displayTime": "1st 12:57",
      "player": { "playerId": 8478420, "name": "N. MacKinnon" },
      "description": "N. MacKinnon (35) - Wrist Shot",
      "videoUrl": "https://...",
      "hasVideo": true,
      "isPending": false
    }
  ]
}
```

**Notes**:
- Coordinates are in feet from center ice (x=horizontal, y=vertical from centerline)
- For "shots" type, includes goals (with `isGoal: true`) and non-goal shots
- Goal dots rendered half bright-green, half team color (FR-036)
- `hasVideo: true` triggers a small black dot inside the colored event dot as video indicator (FR-037)
- `isPending: true` indicates the event is under review — rendered with distinct visual treatment
- Arena stands layout provided as SVG template; if `seatColorsAvailable: false`, frontend renders washed-out gray (FR-034)
