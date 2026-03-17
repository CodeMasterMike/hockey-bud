# API Contract: Trades & Free Agents

## GET /api/leagues/{leagueId}/trades

Returns trade list with filtering and search.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| season | string | current | Season label, e.g., "2025-26" |
| team | string | null | Team slug to filter by |
| player | string | null | Player name search |
| page | int | 1 | Page number |
| pageSize | int | 50 | Rows per page |

**Response** `200 OK`:
```json
{
  "season": "2025-26",
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 42,
    "totalPages": 1
  },
  "dataAsOf": "2026-03-15T18:00:00Z",
  "trades": [
    {
      "id": 5001,
      "tradeDate": "2026-03-07",
      "tradeDateDisplay": "03/07/2026",
      "sides": [
        {
          "teamId": 21,
          "teamAbbreviation": "COL",
          "teamLogoUrl": "/assets/teams/col.svg",
          "acquired": [
            {
              "assetType": "Player",
              "playerId": 8480010,
              "name": "Jake DeBrusk",
              "position": "LW"
            }
          ],
          "traded": [
            {
              "assetType": "DraftPick",
              "description": "2027 2nd round pick"
            },
            {
              "assetType": "Player",
              "playerId": 8480222,
              "name": "Prospect Name",
              "position": "C"
            }
          ]
        },
        {
          "teamId": 6,
          "teamAbbreviation": "BOS",
          "teamLogoUrl": "/assets/teams/bos.svg",
          "acquired": [
            {
              "assetType": "DraftPick",
              "description": "2027 2nd round pick"
            },
            {
              "assetType": "Player",
              "playerId": 8480222,
              "name": "Prospect Name",
              "position": "C"
            }
          ],
          "traded": [
            {
              "assetType": "Player",
              "playerId": 8480010,
              "name": "Jake DeBrusk",
              "position": "LW"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## GET /api/trades/{tradeId}

Returns full trade detail including trade tree.

**Response** `200 OK`:
```json
{
  "id": 5001,
  "tradeDate": "2026-03-07",
  "sides": [],
  "description": "Colorado acquires Jake DeBrusk from Boston for a 2027 2nd round pick and Prospect Name.",
  "tradeTree": {
    "focusTradeId": 5001,
    "ancestors": [
      {
        "id": "anc-1",
        "type": "trade",
        "tradeId": 4800,
        "tradeDate": "2025-07-01",
        "label": "BOS ↔ VAN",
        "assets": [
          {
            "assetType": "Player",
            "playerId": 8480010,
            "name": "Jake DeBrusk",
            "acquiredBy": "VAN",
            "linkedToFocusTrade": true
          }
        ]
      }
    ],
    "focusTrade": {
      "id": "focus",
      "type": "trade",
      "tradeId": 5001,
      "tradeDate": "2026-03-07",
      "label": "COL ↔ BOS",
      "sides": []
    },
    "descendants": [
      {
        "id": "desc-1",
        "type": "trade",
        "tradeId": 5050,
        "tradeDate": "2026-06-28",
        "label": "BOS ↔ TOR",
        "originAsset": {
          "assetType": "DraftPick",
          "description": "2027 2nd round pick",
          "acquiredBy": "BOS"
        },
        "children": []
      }
    ]
  },
  "dataAsOf": "2026-03-15T18:00:00Z"
}
```

**Notes**:
- Trade tree traces BOTH directions: `ancestors` (trades that led to this one) and `descendants` (subsequent trades of the pieces) (FR-069)
- The tree structure is pre-computed on the server using recursive CTEs for both ancestor and descendant traversal
- Each asset node is clickable: players link to player profiles, picks link to draft info
- Tree depth is unlimited — follows chains as deep as they extend in both directions
- `focusTradeId` identifies the central trade being viewed; the tree radiates outward from it
- Partial trade/signing information shows a `"isPartial": true` flag with a "More information is still processing" note

---

## GET /api/leagues/{leagueId}/free-agents

Returns pending and recently signed free agents.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| tab | string | "pending" | "pending" or "recent-signings" |
| sort | string | "capHit" (pending) / "signingDate" (recent) | Any stat field name |
| sortDir | string | "desc" | "asc" or "desc" |
| page | int | 1 | Page number |
| pageSize | int | 50 | Rows per page |

**Response** `200 OK` (pending tab):
```json
{
  "tab": "pending",
  "season": "2025-26",
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 215,
    "totalPages": 5
  },
  "dataAsOf": "2026-03-15T18:00:00Z",
  "freeAgents": [
    {
      "playerId": 8478420,
      "name": "Nathan MacKinnon",
      "teamId": 21,
      "teamAbbreviation": "COL",
      "teamLogoUrl": "/assets/teams/col.svg",
      "freeAgentType": "UFA",
      "currentCapHit": 12600000,
      "currentCapHitDisplay": "$12.6M",
      "position": "C",
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

**Response** (recent-signings tab):
```json
{
  "tab": "recent-signings",
  "signings": [
    {
      "playerId": 8480010,
      "name": "Jake DeBrusk",
      "teamId": 21,
      "teamAbbreviation": "COL",
      "signingDate": "2026-07-01",
      "contractCapHit": 5500000,
      "contractCapHitDisplay": "$5.5M",
      "contractYears": 5,
      "freeAgentType": "UFA",
      "previousTeam": "BOS"
    }
  ]
}
```

**Notes**:
- Clicking a recent signing navigates to `/players/{playerId}/salary-cap` with `autoExpand=true` query param
- Pending free agents include all standard player stats matching the Stats page columns
- Default sort for pending is by current cap hit descending (FR-070)
