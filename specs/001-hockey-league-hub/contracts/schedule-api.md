# API Contract: Schedule

## GET /api/leagues/{leagueId}/schedule

Returns the season schedule with games and important dates.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| season | string | current | Season label, e.g., "2025-26" |
| month | int | null | Filter by month (1-12). If null, returns full season |
| team | string | null | Team slug to filter by |

**Response** `200 OK`:
```json
{
  "season": "2025-26",
  "dataAsOf": "2026-03-15T20:00:00Z",
  "importantDates": [
    {
      "date": "2026-03-07",
      "label": "Trade Deadline",
      "type": "trade-deadline",
      "description": "Last day for teams to make trades before the playoffs"
    },
    {
      "date": "2026-02-04",
      "label": "All-Star Game",
      "type": "all-star",
      "description": "2026 NHL All-Star Game"
    },
    {
      "date": "2026-07-01",
      "label": "Free Agent Signing Period Opens",
      "type": "free-agent-deadline",
      "description": "Unrestricted free agents can sign with any team"
    },
    {
      "date": "2026-07-15",
      "label": "Offer Sheet Deadline",
      "type": "offer-sheet-deadline",
      "description": "Deadline for RFA offer sheets"
    },
    {
      "date": "2026-08-01",
      "label": "Arbitration Deadline",
      "type": "arbitration-deadline",
      "description": "Deadline for salary arbitration filings"
    }
  ],
  "months": [
    {
      "month": 3,
      "year": 2026,
      "label": "March 2026",
      "days": [
        {
          "date": "2026-03-15",
          "games": [
            {
              "gameId": 2025020850,
              "homeTeam": { "id": 21, "abbreviation": "COL", "logoUrl": "/assets/teams/col.svg" },
              "awayTeam": { "id": 30, "abbreviation": "MIN", "logoUrl": "/assets/teams/min.svg" },
              "scheduledStart": "2026-03-15T23:00:00Z",
              "scheduledStartLocal": "7:00 PM",
              "status": "Final",
              "homeScore": 4,
              "awayScore": 2
            }
          ],
          "importantDates": [],
          "hasNoGames": false
        },
        {
          "date": "2026-03-07",
          "games": [],
          "importantDates": [
            {
              "label": "Trade Deadline",
              "type": "trade-deadline"
            }
          ],
          "hasNoGames": false
        }
      ]
    }
  ]
}
```

**Notes**:
- Important dates are signified visually distinct from regular game dates (FR-045c)
- Important date types include: `trade-deadline`, `free-agent-deadline`, `offer-sheet-deadline`, `arbitration-deadline`, `all-star`, `bye-week`, `draft`, `season-start`, `season-end`, `playoffs-start`
- Days with no games and no important dates are included with `hasNoGames: true`
- Games within a day are ordered by `scheduledStart`
- The `team` filter shows only games involving that team
- Schedule position in navigation: between Teams and Players (FR-006a)
