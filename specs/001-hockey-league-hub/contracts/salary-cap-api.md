# API Contract: Salary Cap

## GET /api/leagues/{leagueId}/salary-cap

Returns league-wide salary cap overview for all teams.

**Response** `200 OK`:
```json
{
  "season": "2025-26",
  "leagueCeiling": 88000000,
  "leagueFloor": 65000000,
  "dataAsOf": "2026-03-15T18:00:00Z",
  "teams": [
    {
      "teamId": 21,
      "abbreviation": "COL",
      "logoUrl": "/assets/teams/col.svg",
      "name": "Colorado Avalanche",
      "playersOnCap": 23,
      "totalCapUsed": 84500000,
      "totalCapUsedDisplay": "$84.5M",
      "capAvailable": 3500000,
      "capAvailableDisplay": "$3.5M",
      "ltirCapSpace": 5200000,
      "ltirCapSpaceDisplay": "$5.2M"
    }
  ]
}
```

---

## GET /api/teams/{teamSlug}/salary-cap

Returns detailed team salary cap allocation.

**Response** `200 OK`:
```json
{
  "teamId": 21,
  "season": "2025-26",
  "capCeiling": 88000000,
  "totalCapUsed": 84500000,
  "capAvailable": 3500000,
  "ltirCapSpace": 5200000,
  "players": [
    {
      "playerId": 8478420,
      "name": "Nathan MacKinnon",
      "position": "C",
      "capHit": 12600000,
      "capHitDisplay": "$12.6M",
      "yearsRemaining": 6,
      "expiryStatus": "UFA",
      "expiryYear": "2030-31",
      "hasNoMovementClause": true,
      "hasNoTradeClause": false,
      "hasModifiedNoTradeClause": false,
      "baseSalaryThisYear": 13500000,
      "signingBonusThisYear": 0,
      "performanceBonusThisYear": 0
    }
  ],
  "futureProjections": [
    {
      "season": "2026-27",
      "projectedCapUsed": 78200000,
      "playersUnderContract": 18,
      "expiringContracts": 5,
      "projectedCapSpace": 9800000
    }
  ],
  "draftPicks": [
    {
      "year": 2026,
      "round": 1,
      "originalTeam": "COL",
      "isOwned": true,
      "note": null
    },
    {
      "year": 2026,
      "round": 2,
      "originalTeam": "COL",
      "isOwned": false,
      "note": "Traded to MIN in Nichushkin deal"
    }
  ],
  "dataAsOf": "2026-03-15T18:00:00Z"
}
```

---

## GET /api/players/{playerId}/salary-cap

Returns player-specific salary cap detail with full contract history.

**Response** `200 OK`:
```json
{
  "playerId": 8478420,
  "name": "Nathan MacKinnon",
  "currentContract": {
    "capHit": 12600000,
    "capHitDisplay": "$12.6M",
    "totalValue": 100800000,
    "yearsTotal": 8,
    "yearsRemaining": 6,
    "startSeason": "2023-24",
    "endSeason": "2030-31",
    "expiryStatus": "UFA",
    "signingDate": "2023-09-15",
    "hasNoMovementClause": true,
    "hasNoTradeClause": false,
    "hasModifiedNoTradeClause": false,
    "yearByYear": [
      {
        "season": "2023-24",
        "baseSalary": 13500000,
        "signingBonus": 0,
        "performanceBonus": 0,
        "capHit": 12600000
      }
    ]
  },
  "contractHistory": [
    {
      "team": "COL",
      "startSeason": "2016-17",
      "endSeason": "2022-23",
      "capHit": 6300000,
      "totalValue": 44100000,
      "yearsTotal": 7,
      "acquisitionType": "Draft"
    }
  ],
  "tradeHistory": [],
  "freeAgencyHistory": []
}
```

---

## POST /api/teams/{teamSlug}/buyout-calculator

Calculates buyout cap implications for a given player.

**Request Body**:
```json
{
  "playerId": 8478420
}
```

**Response** `200 OK`:
```json
{
  "playerId": 8478420,
  "name": "Nathan MacKinnon",
  "age": 30,
  "ageCategory": "26+",
  "buyoutCostFraction": "2/3",
  "remainingSalary": 81000000,
  "totalBuyoutCost": 54000000,
  "capImpact": [
    {
      "season": "2026-27",
      "buyoutCapCharge": 4500000,
      "salarySavings": 13500000,
      "netCapSavings": 9000000
    },
    {
      "season": "2027-28",
      "buyoutCapCharge": 4500000,
      "salarySavings": 13500000,
      "netCapSavings": 9000000
    }
  ],
  "notes": [
    "Buyout cost is 2/3 of remaining salary (player age 26+)",
    "Cap charge spread over 12 years (2x remaining 6-year term)"
  ]
}
```

---

## GET /api/salary-cap/explained

Returns the Salary Cap Explained guide content.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| search | string | null | Search query to filter sections |

**Response** `200 OK`:
```json
{
  "sections": [
    {
      "id": "cap-ceiling",
      "title": "Salary Cap Ceiling",
      "officialText": "The Upper Limit of the Midpoint, as defined in Article 50.5(b)(i)...",
      "plainLanguageText": "The salary cap ceiling is the maximum amount a team can spend on player salaries in a given season...",
      "category": "Basics",
      "relatedTerms": ["Upper Limit", "Cap Ceiling", "Salary Cap"]
    }
  ],
  "glossary": [
    {
      "term": "AAV",
      "fullName": "Average Annual Value",
      "definition": "The cap hit of a contract, calculated by dividing the total contract value by the number of years."
    }
  ]
}
```
