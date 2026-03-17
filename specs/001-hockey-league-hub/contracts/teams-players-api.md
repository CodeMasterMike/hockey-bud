# API Contract: Teams & Players

## GET /api/leagues/{leagueId}/teams

Returns all teams for the teams index page.

**Response** `200 OK`:
```json
{
  "teams": [
    {
      "id": 21,
      "locationName": "Colorado",
      "name": "Avalanche",
      "abbreviation": "COL",
      "logoUrl": "/assets/teams/col.svg"
    }
  ]
}
```

Teams sorted alphabetically by location name (e.g., Florida Panthers under "F" for Florida) (FR-046).

---

## GET /api/teams/{teamSlug}

Returns full team profile.

**Response** `200 OK`:
```json
{
  "id": 21,
  "locationName": "Colorado",
  "name": "Avalanche",
  "abbreviation": "COL",
  "logoUrl": "/assets/teams/col.svg",
  "primaryColor": "#6F263D",
  "currentSeasonRecord": { "wins": 42, "losses": 20, "overtimeLosses": 5 },
  "allTimeRecord": { "wins": 1205, "losses": 890, "ties": 122, "overtimeLosses": 180 },
  "joinedSeasonYear": 1995,
  "originalJoinYear": 1979,
  "stanleyCups": {
    "total": 3,
    "since1973": 3,
    "since2006": 1
  },
  "franchiseHistory": [
    { "city": "Quebec", "name": "Nordiques", "yearStart": 1979, "yearEnd": 1995 }
  ],
  "division": "Central",
  "conference": "Western",
  "dataAsOf": "2026-03-15T20:00:00Z"
}
```

---

## GET /api/teams/{teamSlug}/roster

Returns the team's full roster.

**Response** `200 OK`:
```json
{
  "teamId": 21,
  "season": "2025-26",
  "players": [
    {
      "playerId": 8478420,
      "firstName": "Nathan",
      "lastName": "MacKinnon",
      "jerseyNumber": 29,
      "position": "C",
      "shootsCatches": "R",
      "birthCity": "Cole Harbour",
      "birthCountry": "Canada",
      "dateOfBirth": "1995-09-01",
      "draftYear": 2013,
      "yearsInLeague": 13
    }
  ]
}
```

---

## GET /api/teams/{teamSlug}/depth-chart

Returns the depth chart organized by lines/pairings.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| view | string | "stats" | "stats" or "cap" |

**Response** `200 OK` (stats view):
```json
{
  "teamId": 21,
  "season": "2025-26",
  "view": "stats",
  "forwardLines": [
    {
      "lineNumber": 1,
      "players": [
        {
          "playerId": 8476455,
          "name": "Gabriel Landeskog",
          "mainPosition": "LW",
          "secondaryPositions": [],
          "gamesPlayed": 47,
          "points": 29
        },
        {
          "playerId": 8478420,
          "name": "Nathan MacKinnon",
          "mainPosition": "C",
          "secondaryPositions": [],
          "gamesPlayed": 64,
          "points": 109
        },
        {
          "playerId": 8480039,
          "name": "Martin Necas",
          "mainPosition": "C",
          "secondaryPositions": ["RW"],
          "gamesPlayed": 62,
          "points": 80
        }
      ]
    }
  ],
  "defensePairs": [
    {
      "pairNumber": 1,
      "players": [
        {
          "playerId": 8480070,
          "name": "Devon Toews",
          "mainPosition": "LD",
          "secondaryPositions": [],
          "gamesPlayed": 52,
          "points": 17
        },
        {
          "playerId": 8480069,
          "name": "Cale Makar",
          "mainPosition": "RD",
          "secondaryPositions": [],
          "gamesPlayed": 65,
          "points": 67
        }
      ]
    }
  ],
  "goalies": [
    {
      "playerId": 8479406,
      "name": "Scott Wedgewood",
      "gloveHand": "L",
      "gamesPlayed": 36,
      "wins": 25
    }
  ],
  "inactive": {
    "injured": [
      { "playerId": 123, "name": "J. Doe", "position": "LW", "injuryType": "Lower body" }
    ],
    "scratched": [
      { "playerId": 456, "name": "J. Smith", "position": "RD" }
    ]
  }
}
```

**Cap view** replaces `gamesPlayed`/`points` with:
```json
{
  "capHit": 12600000,
  "capHitDisplay": "12.6m",
  "yearsRemaining": 6,
  "display": "12.6m/6"
}
```

---

## GET /api/players/{playerId}

Returns full player profile.

**Response** `200 OK`:
```json
{
  "id": 8478420,
  "firstName": "Nathan",
  "lastName": "MacKinnon",
  "age": 30,
  "birthCity": "Cole Harbour",
  "birthCountry": "Canada",
  "currentTeam": { "id": 21, "abbreviation": "COL" },
  "positions": [
    { "position": "C", "isPrimary": true }
  ],
  "shootsCatches": "R",
  "heightInches": 72,
  "heightDisplay": "6'0\"",
  "weightLbs": 200,
  "draftYear": 2013,
  "draftPick": 1,
  "draftTeam": { "id": 21, "abbreviation": "COL" },
  "headshots": {
    "current": { "url": "...", "teamAbbreviation": "COL", "season": "2025-26" },
    "history": [
      { "url": "...", "teamAbbreviation": "COL", "season": "2024-25" }
    ]
  },
  "teamHistory": [
    {
      "teamId": 21,
      "teamAbbreviation": "COL",
      "teamName": "Colorado Avalanche",
      "jerseyNumbers": [29],
      "seasonStart": "2013-14",
      "seasonEnd": null,
      "awards": [
        { "name": "Hart Trophy", "season": "2023-24" },
        { "name": "Conn Smythe Trophy", "season": "2021-22" }
      ]
    }
  ],
  "style": {
    "description": "Elite two-way center with explosive skating and elite playmaking vision. Drives possession and transition play at the highest level.",
    "supportingStats": [
      { "label": "Skating Top Speed", "value": "23.4", "unit": "mph" },
      { "label": "20+ MPH Bursts/60", "value": "8.2", "unit": "" },
      { "label": "Primary Assists/60", "value": "1.42", "unit": "" }
    ]
  },
  "contract": {
    "currentContract": {
      "capHit": 12600000,
      "capHitDisplay": "$12.6M",
      "totalValue": 100800000,
      "yearsTotal": 8,
      "yearsRemaining": 6,
      "expiryStatus": "UFA",
      "hasNoMovementClause": true,
      "hasNoTradeClause": false,
      "signingDate": "2023-09-15"
    },
    "contractHistory": [],
    "tradeHistory": [],
    "freeAgencyHistory": []
  },
  "isEbug": false,
  "dataAsOf": "2026-03-15T18:00:00Z"
}
```

**Notes**:
- `isEbug: true` for emergency goaltenders — profile UI displays EBUG status prominently (FR-061a)
- Player stats seasons include an `era` field for visual differentiation in historical data

---

## GET /api/players/{playerId}/stats

Returns player season-by-season stats.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| tab | string | "nhl" | "nhl", "other-leagues", "combined" |

**Response** `200 OK`:
```json
{
  "playerId": 8478420,
  "tab": "nhl",
  "seasons": [
    {
      "season": "2025-26",
      "league": "NHL",
      "teamAbbreviation": "COL",
      "teamId": 21,
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
      "faceoffPct": 52.8,
      "era": "salary-cap"
    }
  ]
}
```

**Notes**:
- "other-leagues" tab shows stats from AHL, SHL, Liiga, etc. where data is available
- "combined" tab merges both, sorted by season descending
- For mid-season trades, multiple rows appear for the same season with different teams
- `era` field values: `"original-six"` (to 1972), `"expansion"` (1973-2005), `"salary-cap"` (2006+) — used for visual era differentiation (shading/separators)
- Stats unavailable for older eras (e.g., TOI before ~1998, hits before ~2005) return null — frontend displays "—"
