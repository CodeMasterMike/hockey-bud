# API Contract: Global Search

## GET /api/leagues/{leagueId}/search

Returns search results grouped by entity type, scoped to the selected league. Powers the global search bar in the black banner (FR-005a). No search bar on the main page.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| q | string | required | Search query (minimum 2 characters) |
| limit | int | 5 | Max results per entity type |

**Response** `200 OK`:
```json
{
  "query": "MacKinnon",
  "results": {
    "players": [
      {
        "playerId": 8478420,
        "name": "Nathan MacKinnon",
        "teamAbbreviation": "COL",
        "position": "C",
        "headshot": "/assets/headshots/8478420.jpg",
        "url": "/nhl/players/8478420"
      }
    ],
    "teams": [],
    "trades": [
      {
        "tradeId": 4500,
        "date": "2013-06-30",
        "description": "COL selects Nathan MacKinnon 1st overall",
        "url": "/nhl/trades/4500"
      }
    ],
    "personnel": [],
    "contracts": []
  },
  "totalResults": 2
}
```

**Implementation notes**:
- Search is scoped to the selected league only — prevents cross-league clutter (FR-005a)
- No search bar appears on the main page (league selection screen)
- Search is performed across: Player names, Team names/locations/abbreviations, Trade descriptions, Personnel names
- Results are grouped by entity type, favoring most-searched categories first, then alphabetical (FR-005a)
- Results are grouped by entity type with up to `limit` results per group
- Search uses PostgreSQL full-text search with trigram indexing for fuzzy matching
- The frontend renders results in a dropdown grouped by type, each result clickable to its entity page
- Minimum query length of 2 characters prevents overly broad searches
- Response time target: < 200ms (fast enough for as-you-type results)
