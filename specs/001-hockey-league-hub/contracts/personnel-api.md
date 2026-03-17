# API Contract: Personnel

## GET /api/teams/{teamSlug}/personnel

Returns all staff for a team, organized by role.

**Response** `200 OK`:
```json
{
  "teamId": 21,
  "teamName": "Colorado Avalanche",
  "dataAsOf": "2026-03-15T18:00:00Z",
  "roleGroups": [
    {
      "role": "Coach",
      "staff": [
        {
          "personnelId": 1001,
          "firstName": "Jared",
          "lastName": "Bednar",
          "title": "Head Coach",
          "isActive": true,
          "formerPlayerId": null,
          "awards": [
            { "name": "Jack Adams Award", "year": 2022 }
          ],
          "stats": {
            "seasons": 10,
            "wins": 380,
            "losses": 250,
            "overtimeLosses": 60,
            "playoffAppearances": 6,
            "stanleyCups": 1
          }
        }
      ]
    },
    {
      "role": "GM",
      "staff": [
        {
          "personnelId": 1002,
          "firstName": "Chris",
          "lastName": "MacFarland",
          "title": "General Manager",
          "isActive": true,
          "formerPlayerId": null,
          "awards": [],
          "stats": {
            "seasons": 3,
            "trades": 28,
            "draftPicks": 21
          }
        }
      ]
    },
    { "role": "Scout", "staff": [] },
    { "role": "Trainer", "staff": [] },
    { "role": "EquipmentManager", "staff": [] },
    { "role": "Owner", "staff": [] }
  ]
}
```

**Notes**:
- Roles are always returned in the order specified by FR-072: Coaches, GMs, Scouts, Trainers, Equipment Managers, Owners
- Empty role groups are included with empty `staff` arrays

---

## GET /api/personnel/{personnelId}

Returns full personnel profile.

**Response** `200 OK`:
```json
{
  "personnelId": 1001,
  "firstName": "Jared",
  "lastName": "Bednar",
  "title": "Head Coach",
  "currentTeam": {
    "teamId": 21,
    "abbreviation": "COL",
    "name": "Colorado Avalanche"
  },
  "role": "Coach",
  "isActive": true,
  "formerPlayer": null,
  "awards": [
    { "name": "Jack Adams Award", "year": 2022 }
  ],
  "stats": {
    "regularSeason": {
      "seasons": 10,
      "gamesCoached": 690,
      "wins": 380,
      "losses": 250,
      "overtimeLosses": 60,
      "winPct": 0.551
    },
    "playoffs": {
      "appearances": 6,
      "gamesCoached": 75,
      "wins": 45,
      "losses": 30,
      "stanleyCups": 1
    }
  },
  "careerHistory": [
    {
      "team": "Colorado Avalanche",
      "teamId": 21,
      "title": "Head Coach",
      "yearStart": 2016,
      "yearEnd": null
    }
  ],
  "predecessors": [
    {
      "personnelId": 900,
      "name": "Patrick Roy",
      "title": "Head Coach",
      "yearStart": 2013,
      "yearEnd": 2016,
      "formerPlayerId": 8449019
    },
    {
      "personnelId": null,
      "name": "Joe Sacco",
      "title": "Head Coach",
      "yearStart": 2009,
      "yearEnd": 2013,
      "formerPlayerId": null
    }
  ],
  "dataAsOf": "2026-03-15T18:00:00Z"
}
```

**Notes**:
- `formerPlayer` links to the player profile if the staff member had a playing career (FR-073)
- `predecessors` lists all known predecessors in the same role for the same team, in reverse chronological order
- Personnel without sufficient data return empty stats objects rather than null
