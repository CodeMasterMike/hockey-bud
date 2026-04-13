using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.RateLimiting;
using HockeyHub.Core.Providers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Providers;

public class NhlWebApiProvider : INhlDataProvider, IDisposable
{
    private readonly HttpClient _http;
    private readonly RateLimiter _rateLimiter;
    private readonly ILogger<NhlWebApiProvider> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public NhlWebApiProvider(HttpClient http, ILogger<NhlWebApiProvider> logger, IConfiguration config)
    {
        _http = http;
        _http.BaseAddress = new Uri(config["ExternalApis:NhlBaseUrl"] ?? "https://api-web.nhle.com/");
        _http.DefaultRequestHeaders.Add("User-Agent", "HockeyHub/1.0");
        _logger = logger;
        _rateLimiter = new SlidingWindowRateLimiter(new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 4,
            Window = TimeSpan.FromSeconds(1),
            SegmentsPerWindow = 2,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 10
        });
    }

    public async Task<IReadOnlyList<NhlTeamData>> GetTeamsAsync(CancellationToken ct = default)
    {
        if (await GetJsonAsync("v1/standings/now", ct) is not { } json) return [];

        var teams = new List<NhlTeamData>();
        if (json.TryGetProperty("standings", out var standings))
        {
            foreach (var entry in standings.EnumerateArray())
            {
                try
                {
                    var abbrev = entry.GetProperty("teamAbbrev").GetProperty("default").GetString()!;
                    var name = entry.GetProperty("teamName").GetProperty("default").GetString()!;
                    var logo = entry.GetProperty("teamLogo").GetString()!;
                    var locationName = ExtractLocationName(name, abbrev);

                    teams.Add(new NhlTeamData(
                        Id: 0,
                        Abbreviation: abbrev,
                        LocationName: locationName,
                        Name: ExtractTeamName(name, locationName),
                        LogoUrl: logo,
                        PrimaryColor: "#000000"
                    ));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse team entry from NHL API, skipping");
                }
            }
        }

        return teams.DistinctBy(t => t.Abbreviation).ToList();
    }

    public async Task<IReadOnlyList<NhlPlayerData>> GetRosterAsync(string teamAbbreviation, CancellationToken ct = default)
    {
        if (await GetJsonAsync($"v1/roster/{teamAbbreviation}/current", ct) is not { } json) return [];

        var players = new List<NhlPlayerData>();
        foreach (var group in new[] { "forwards", "defensemen", "goalies" })
        {
            if (!json.TryGetProperty(group, out var list)) continue;
            foreach (var p in list.EnumerateArray())
            {
                players.Add(ParsePlayer(p, teamAbbreviation));
            }
        }

        return players;
    }

    public async Task<NhlPlayerData?> GetPlayerAsync(int externalId, CancellationToken ct = default)
    {
        if (await GetJsonAsync($"v1/player/{externalId}/landing", ct) is not { } json) return null;

        var teamAbbrev = json.TryGetProperty("currentTeamAbbrev", out var ta)
            ? ta.GetString() ?? ""
            : "";

        return ParsePlayer(json, teamAbbrev);
    }

    public async Task<IReadOnlyList<NhlGameData>> GetScoresAsync(DateOnly date, CancellationToken ct = default)
    {
        var dateStr = date.ToString("yyyy-MM-dd");
        if (await GetJsonAsync($"v1/score/{dateStr}", ct) is not { } json) return [];

        var games = new List<NhlGameData>();
        if (json.TryGetProperty("games", out var gamesArr))
        {
            foreach (var g in gamesArr.EnumerateArray())
            {
                try
                {
                    games.Add(ParseGame(g));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse game entry from NHL API, skipping");
                }
            }
        }

        return games;
    }

    public async Task<NhlGameDetailData?> GetGameDetailAsync(int gameId, CancellationToken ct = default)
    {
        if (await GetJsonAsync($"v1/gamecenter/{gameId}/landing", ct) is not { } landing) return null;
        if (await GetJsonAsync($"v1/gamecenter/{gameId}/boxscore", ct) is not { } boxscore) return null;
        var playByPlay = await GetJsonAsync($"v1/gamecenter/{gameId}/play-by-play", ct);

        return ParseGameDetail(gameId, landing, boxscore, playByPlay);
    }

    public async Task<IReadOnlyList<NhlStandingsEntry>> GetStandingsAsync(string season, CancellationToken ct = default)
    {
        if (await GetJsonAsync($"v1/standings/{season}", ct) is not { } json) return [];

        var entries = new List<NhlStandingsEntry>();
        if (json.TryGetProperty("standings", out var standings))
        {
            foreach (var entry in standings.EnumerateArray())
            {
                try
                {
                    entries.Add(ParseStandingsEntry(entry));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse standings entry from NHL API, skipping");
                }
            }
        }

        return entries;
    }

    public Task<IReadOnlyList<NhlTradeData>> GetTradesAsync(string season, CancellationToken ct = default)
    {
        // NHL Web API does not provide a trades endpoint.
        // Trade data will need a separate provider or manual entry.
        _logger.LogWarning("Trades endpoint not available via NHL Web API — requires alternate data source");
        return Task.FromResult<IReadOnlyList<NhlTradeData>>([]);
    }

    public async Task<IReadOnlyList<NhlScheduleGame>> GetScheduleAsync(string season, CancellationToken ct = default)
    {
        if (await GetJsonAsync($"v1/schedule/{season}", ct) is not { } json) return [];

        var games = new List<NhlScheduleGame>();
        if (json.TryGetProperty("gameWeek", out var weeks))
        {
            foreach (var week in weeks.EnumerateArray())
            {
                if (!week.TryGetProperty("games", out var gamesArr)) continue;
                foreach (var g in gamesArr.EnumerateArray())
                {
                    var gameId = g.GetProperty("id").GetInt32();
                    var dateStr = week.GetProperty("date").GetString()!;
                    var homeAbbrev = g.GetProperty("homeTeam").GetProperty("abbrev").GetString()!;
                    var awayAbbrev = g.GetProperty("awayTeam").GetProperty("abbrev").GetString()!;
                    var venue = g.TryGetProperty("venue", out var v) ? v.GetProperty("default").GetString() : null;
                    var startTime = g.TryGetProperty("startTimeUTC", out var st)
                        ? DateTimeOffset.Parse(st.GetString()!)
                        : DateTimeOffset.MinValue;

                    games.Add(new NhlScheduleGame(
                        GameId: gameId,
                        GameDate: DateOnly.Parse(dateStr),
                        ScheduledStart: startTime,
                        HomeTeamAbbreviation: homeAbbrev,
                        AwayTeamAbbreviation: awayAbbrev,
                        ArenaName: venue,
                        Status: g.TryGetProperty("gameState", out var gs) ? gs.GetString()! : "FUT"
                    ));
                }
            }
        }

        return games;
    }

    public async Task<IReadOnlyList<NhlSeasonData>> GetSeasonsAsync(CancellationToken ct = default)
    {
        if (await GetJsonAsync("v1/season", ct) is not { } json) return [];

        var seasons = new List<NhlSeasonData>();
        // The NHL API returns an array of season IDs (e.g., 20252026)
        if (json.ValueKind == JsonValueKind.Array)
        {
            foreach (var s in json.EnumerateArray())
            {
                var id = s.GetInt32();
                var yearStart = id / 10000;
                var yearEnd = id % 10000;
                seasons.Add(new NhlSeasonData(
                    YearStart: yearStart,
                    YearEnd: yearEnd,
                    Label: $"{yearStart}-{yearEnd.ToString()[2..]}",
                    IsCurrent: false
                ));
            }

            if (seasons.Count > 0)
            {
                var last = seasons[^1];
                seasons[^1] = last with { IsCurrent = true };
            }
        }

        return seasons;
    }

    public async Task<IReadOnlyList<NhlTeamSeasonStats>> GetTeamSeasonStatsAsync(string season, CancellationToken ct = default)
    {
        // Uses the NHL Stats REST API (different base URL from the Web API)
        var seasonId = season.Replace("-", "");
        var url = $"https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId={seasonId}%20and%20gameTypeId=2";

        var stats = new List<NhlTeamSeasonStats>();
        try
        {
            using var lease = await _rateLimiter.AcquireAsync(1, ct);
            if (!lease.IsAcquired) return [];

            _logger.LogDebug("NHL Stats API request: team/summary for season {Season}", season);
            using var response = await _http.GetAsync(url, ct);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions, ct);

            if (json.TryGetProperty("data", out var data))
            {
                foreach (var t in data.EnumerateArray())
                {
                    try
                    {
                        stats.Add(new NhlTeamSeasonStats(
                            TeamFullName: t.TryGetProperty("teamFullName", out var name) ? name.GetString() ?? "" : "",
                            PowerPlayPct: t.TryGetProperty("powerPlayPct", out var pp) ? pp.GetDecimal() : 0,
                            PenaltyKillPct: t.TryGetProperty("penaltyKillPct", out var pk) ? pk.GetDecimal() : 0,
                            FaceoffWinPct: t.TryGetProperty("faceoffWinPct", out var fo) ? fo.GetDecimal() : 0
                        ));
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse team stats entry, skipping");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch team season stats from NHL Stats API");
        }

        return stats;
    }

    public async Task<NhlPlayoffBracketData?> GetPlayoffBracketAsync(string season, CancellationToken ct = default)
    {
        if (await GetJsonAsync($"v1/playoff-bracket/{season}", ct) is not { } json) return null;

        var rounds = new List<NhlPlayoffRound>();

        // NHL API returns rounds as numbered properties or an array
        if (json.TryGetProperty("rounds", out var roundsArr))
        {
            foreach (var round in roundsArr.EnumerateArray())
            {
                try
                {
                    var roundNum = round.GetProperty("roundNumber").GetInt32();
                    var roundLabel = roundNum switch
                    {
                        1 => "First Round",
                        2 => "Second Round",
                        3 => "Conference Finals",
                        4 => "Stanley Cup Final",
                        _ => $"Round {roundNum}"
                    };

                    var seriesList = new List<NhlPlayoffSeries>();
                    if (round.TryGetProperty("series", out var seriesArr))
                    {
                        foreach (var s in seriesArr.EnumerateArray())
                        {
                            seriesList.Add(ParsePlayoffSeries(s));
                        }
                    }

                    rounds.Add(new NhlPlayoffRound(roundNum, roundLabel, seriesList));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse playoff round, skipping");
                }
            }
        }
        // Some API versions use a flat series array with roundNumber on each series
        else if (json.TryGetProperty("series", out var flatSeries))
        {
            var grouped = new Dictionary<int, List<NhlPlayoffSeries>>();
            foreach (var s in flatSeries.EnumerateArray())
            {
                try
                {
                    var roundNum = s.TryGetProperty("roundNumber", out var rn) ? rn.GetInt32()
                        : s.TryGetProperty("round", out var r) ? r.GetInt32() : 1;

                    if (!grouped.ContainsKey(roundNum))
                        grouped[roundNum] = [];

                    grouped[roundNum].Add(ParsePlayoffSeries(s));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse playoff series, skipping");
                }
            }

            foreach (var (roundNum, seriesList) in grouped.OrderBy(g => g.Key))
            {
                var roundLabel = roundNum switch
                {
                    1 => "First Round",
                    2 => "Second Round",
                    3 => "Conference Finals",
                    4 => "Stanley Cup Final",
                    _ => $"Round {roundNum}"
                };
                rounds.Add(new NhlPlayoffRound(roundNum, roundLabel, seriesList));
            }
        }

        return rounds.Count > 0 ? new NhlPlayoffBracketData(season, rounds) : null;
    }

    public async Task<NhlDraftData?> GetDraftAsync(int year, CancellationToken ct = default)
    {
        if (await GetJsonAsync($"v1/draft/{year}", ct) is not { } json) return null;

        var rounds = new List<NhlDraftRound>();

        // NHL API: { drafts: [ { draftYear: ..., rounds: [ { round: N, picks: [...] } ] } ] }
        var draftsArr = json.TryGetProperty("drafts", out var d) ? d : json;
        JsonElement? draftObj = null;

        if (draftsArr.ValueKind == JsonValueKind.Array)
        {
            foreach (var draft in draftsArr.EnumerateArray())
            {
                draftObj = draft;
                break; // Take the first (and usually only) entry
            }
        }

        if (draftObj is not { } obj) return null;

        if (obj.TryGetProperty("rounds", out var roundsArr))
        {
            foreach (var round in roundsArr.EnumerateArray())
            {
                try
                {
                    var roundNum = round.TryGetProperty("round", out var rn) ? rn.GetInt32()
                        : round.TryGetProperty("roundNumber", out var rn2) ? rn2.GetInt32() : 1;

                    var picks = new List<NhlDraftPick>();
                    if (round.TryGetProperty("picks", out var picksArr))
                    {
                        foreach (var p in picksArr.EnumerateArray())
                        {
                            try
                            {
                                var teamAbbrev = p.TryGetProperty("teamAbbrev", out var ta)
                                    ? ta.GetString() ?? ""
                                    : "";
                                var teamLogo = p.TryGetProperty("teamLogo", out var tl)
                                    ? tl.GetString() : null;

                                var firstName = p.TryGetProperty("firstName", out var fn)
                                    ? (fn.ValueKind == JsonValueKind.Object
                                        ? fn.GetProperty("default").GetString() ?? ""
                                        : fn.GetString() ?? "")
                                    : "";

                                var lastName = p.TryGetProperty("lastName", out var ln)
                                    ? (ln.ValueKind == JsonValueKind.Object
                                        ? ln.GetProperty("default").GetString() ?? ""
                                        : ln.GetString() ?? "")
                                    : "";

                                var position = p.TryGetProperty("position", out var pos)
                                    ? pos.GetString() : null;
                                var country = p.TryGetProperty("birthCountry", out var bc)
                                    ? bc.GetString() : null;
                                var prevClub = p.TryGetProperty("amateurClubName", out var ac)
                                    ? ac.GetString() : null;
                                var prevLeague = p.TryGetProperty("amateurLeague", out var al)
                                    ? al.GetString() : null;
                                var playerId = p.TryGetProperty("playerId", out var pid) && pid.ValueKind == JsonValueKind.Number
                                    ? (int?)pid.GetInt32() : null;

                                picks.Add(new NhlDraftPick(
                                    OverallPick: p.TryGetProperty("overallPickNumber", out var op) ? op.GetInt32()
                                        : p.TryGetProperty("pickInDraft", out var pd2) ? pd2.GetInt32() : 0,
                                    PickInRound: p.TryGetProperty("pickInRound", out var pir) ? pir.GetInt32() : 0,
                                    TeamAbbreviation: teamAbbrev,
                                    TeamLogoUrl: teamLogo,
                                    FirstName: firstName,
                                    LastName: lastName,
                                    Position: position,
                                    BirthCountry: country,
                                    PreviousClub: prevClub,
                                    PreviousLeague: prevLeague,
                                    PlayerId: playerId
                                ));
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to parse draft pick, skipping");
                            }
                        }
                    }

                    rounds.Add(new NhlDraftRound(roundNum, picks));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse draft round, skipping");
                }
            }
        }

        return rounds.Count > 0 ? new NhlDraftData(year, rounds) : null;
    }

    private static NhlPlayoffSeries ParsePlayoffSeries(JsonElement s)
    {
        string GetTeamAbbrev(JsonElement team) =>
            team.TryGetProperty("abbrev", out var a) ? a.GetString() ?? ""
            : team.TryGetProperty("teamAbbrev", out var ta)
                ? (ta.ValueKind == JsonValueKind.Object ? ta.GetProperty("default").GetString() ?? "" : ta.GetString() ?? "")
            : "";

        string? GetLogo(JsonElement team) =>
            team.TryGetProperty("logo", out var l) ? l.GetString()
            : team.TryGetProperty("teamLogo", out var tl) ? tl.GetString()
            : null;

        var topSeed = s.TryGetProperty("topSeedTeam", out var ts) ? ts
            : s.TryGetProperty("matchupTeams", out var mt)
                ? mt.EnumerateArray().FirstOrDefault()
                : default;

        var bottomSeed = s.TryGetProperty("bottomSeedTeam", out var bs) ? bs
            : s.TryGetProperty("matchupTeams", out var mt2)
                ? mt2.EnumerateArray().Skip(1).FirstOrDefault()
                : default;

        var topAbbrev = topSeed.ValueKind != JsonValueKind.Undefined ? GetTeamAbbrev(topSeed) : "";
        var bottomAbbrev = bottomSeed.ValueKind != JsonValueKind.Undefined ? GetTeamAbbrev(bottomSeed) : "";

        int GetWins(JsonElement team) =>
            team.TryGetProperty("wins", out var w) ? w.GetInt32()
            : team.TryGetProperty("seriesWins", out var sw) ? sw.GetInt32() : 0;

        string GetRecord(JsonElement team)
        {
            var w = team.TryGetProperty("regularSeasonWins", out var rw) ? rw.GetInt32() : 0;
            var l = team.TryGetProperty("regularSeasonLosses", out var rl) ? rl.GetInt32() : 0;
            var otl = team.TryGetProperty("regularSeasonOtLosses", out var ro) ? ro.GetInt32() : 0;
            if (w == 0 && l == 0 && otl == 0) return "";
            return $"{w}-{l}-{otl}";
        }

        int GetSeed(JsonElement team) =>
            team.TryGetProperty("seed", out var seed) ? seed.GetInt32()
            : team.TryGetProperty("conferenceSeed", out var cs) ? cs.GetInt32()
            : team.TryGetProperty("seriesSeed", out var ss) ? ss.GetInt32() : 0;

        var conference = s.TryGetProperty("conference", out var conf)
            ? (conf.ValueKind == JsonValueKind.Object ? conf.GetProperty("name").GetString() ?? "" : conf.GetString() ?? "")
            : s.TryGetProperty("conferenceName", out var cn) ? cn.GetString() ?? "" : "";

        var seriesLetter = s.TryGetProperty("seriesLetter", out var sl) ? sl.GetString() ?? ""
            : s.TryGetProperty("seriesCode", out var sc) ? sc.GetString() ?? "" : "";

        var seriesStatus = "Preview";
        var topWins = topSeed.ValueKind != JsonValueKind.Undefined ? GetWins(topSeed) : 0;
        var bottomWins = bottomSeed.ValueKind != JsonValueKind.Undefined ? GetWins(bottomSeed) : 0;
        if (topWins == 4 || bottomWins == 4) seriesStatus = "Complete";
        else if (topWins > 0 || bottomWins > 0) seriesStatus = "In Progress";

        var games = new List<NhlPlayoffSeriesGame>();
        if (s.TryGetProperty("games", out var gamesArr))
        {
            var gameNum = 1;
            foreach (var g in gamesArr.EnumerateArray())
            {
                var gameId = g.TryGetProperty("id", out var gid) ? gid.GetInt32()
                    : g.TryGetProperty("gameId", out var gid2) ? gid2.GetInt32() : 0;
                var state = g.TryGetProperty("gameState", out var gs) ? gs.GetString() ?? "FUT"
                    : g.TryGetProperty("status", out var st) ? st.GetString() ?? "FUT" : "FUT";
                var status = state switch
                {
                    "FINAL" or "OFF" => "Final",
                    "LIVE" or "CRIT" => "Live",
                    _ => "Scheduled"
                };

                games.Add(new NhlPlayoffSeriesGame(
                    GameId: gameId,
                    GameNumber: gameNum++,
                    Status: status,
                    HomeScore: g.TryGetProperty("homeTeam", out var ht) && ht.TryGetProperty("score", out var hs) ? hs.GetInt32() : null,
                    AwayScore: g.TryGetProperty("awayTeam", out var at) && at.TryGetProperty("score", out var aws) ? aws.GetInt32() : null,
                    HomeTeamAbbreviation: g.TryGetProperty("homeTeam", out var ht2) ? GetTeamAbbrev(ht2) : "",
                    AwayTeamAbbreviation: g.TryGetProperty("awayTeam", out var at2) ? GetTeamAbbrev(at2) : ""
                ));
            }
        }

        return new NhlPlayoffSeries(
            SeriesLetter: seriesLetter,
            TopSeedAbbreviation: topAbbrev,
            BottomSeedAbbreviation: bottomAbbrev,
            TopSeedLogoUrl: topSeed.ValueKind != JsonValueKind.Undefined ? GetLogo(topSeed) : null,
            BottomSeedLogoUrl: bottomSeed.ValueKind != JsonValueKind.Undefined ? GetLogo(bottomSeed) : null,
            TopSeedConferenceSeed: topSeed.ValueKind != JsonValueKind.Undefined ? GetSeed(topSeed) : 0,
            BottomSeedConferenceSeed: bottomSeed.ValueKind != JsonValueKind.Undefined ? GetSeed(bottomSeed) : 0,
            TopSeedWins: topWins,
            BottomSeedWins: bottomWins,
            TopSeedRegularRecord: topSeed.ValueKind != JsonValueKind.Undefined ? GetRecord(topSeed) : "",
            BottomSeedRegularRecord: bottomSeed.ValueKind != JsonValueKind.Undefined ? GetRecord(bottomSeed) : "",
            Conference: conference,
            SeriesStatus: seriesStatus,
            Games: games
        );
    }

    private async Task<JsonElement?> GetJsonAsync(string path, CancellationToken ct)
    {
        using var lease = await _rateLimiter.AcquireAsync(1, ct);
        if (!lease.IsAcquired)
        {
            _logger.LogWarning("Rate limit exceeded for NHL API request: {Path}", path);
            return null;
        }

        const int maxRetries = 3;
        for (var attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                _logger.LogDebug("NHL API request: {Path} (attempt {Attempt})", path, attempt + 1);
                using var response = await _http.GetAsync(path, ct);

                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt + 1));
                    _logger.LogWarning("NHL API rate limited, retrying in {Delay}s", delay.TotalSeconds);
                    await Task.Delay(delay, ct);
                    continue;
                }

                response.EnsureSuccessStatusCode();
                var doc = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions, ct);
                return doc;
            }
            catch (HttpRequestException ex) when (attempt < maxRetries - 1)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt + 1));
                _logger.LogWarning(ex, "NHL API request failed for {Path}, retrying in {Delay}s", path, delay.TotalSeconds);
                await Task.Delay(delay, ct);
            }
        }

        _logger.LogError("NHL API request failed after {MaxRetries} attempts: {Path}", maxRetries, path);
        return null;
    }

    private static NhlGameData ParseGame(JsonElement g)
    {
        var homeTeam = g.GetProperty("homeTeam");
        var awayTeam = g.GetProperty("awayTeam");
        var state = g.GetProperty("gameState").GetString()!;

        var status = state switch
        {
            "FUT" or "PRE" => "Scheduled",
            "LIVE" or "CRIT" => "Live",
            "FINAL" or "OFF" => "Final",
            "PPD" => "Postponed",
            "CAN" => "Cancelled",
            _ => state
        };

        int? period = null;
        string? periodLabel = null;
        string? timeRemaining = null;
        int? timeRemainingSeconds = null;
        var clockRunning = false;

        if (g.TryGetProperty("clock", out var clock))
        {
            timeRemaining = clock.TryGetProperty("timeRemaining", out var tr) ? tr.GetString() : null;
            clockRunning = clock.TryGetProperty("running", out var cr) && cr.GetBoolean();
            if (clock.TryGetProperty("secondsRemaining", out var sr))
                timeRemainingSeconds = sr.GetInt32();
        }

        if (g.TryGetProperty("periodDescriptor", out var pd))
        {
            period = pd.TryGetProperty("number", out var pn) ? pn.GetInt32() : null;
            periodLabel = pd.TryGetProperty("periodType", out var pt) ? pt.GetString() : null;
        }

        return new NhlGameData(
            Id: g.GetProperty("id").GetInt32(),
            Status: status,
            ScheduledStart: DateTimeOffset.Parse(g.GetProperty("startTimeUTC").GetString()!),
            HomeTeamAbbreviation: homeTeam.GetProperty("abbrev").GetString()!,
            AwayTeamAbbreviation: awayTeam.GetProperty("abbrev").GetString()!,
            HomeScore: homeTeam.TryGetProperty("score", out var hs) ? hs.GetInt32() : null,
            AwayScore: awayTeam.TryGetProperty("score", out var aws) ? aws.GetInt32() : null,
            HomeShotsOnGoal: homeTeam.TryGetProperty("sog", out var hsog) ? hsog.GetInt32() : null,
            AwayShotsOnGoal: awayTeam.TryGetProperty("sog", out var asog) ? asog.GetInt32() : null,
            CurrentPeriod: period,
            CurrentPeriodLabel: periodLabel,
            PeriodTimeRemaining: timeRemaining,
            PeriodTimeRemainingSeconds: timeRemainingSeconds,
            ClockRunning: clockRunning,
            IsOvertime: period > 3,
            IsShootout: periodLabel == "SO"
        );
    }

    private static NhlPlayerData ParsePlayer(JsonElement p, string teamAbbreviation)
    {
        // Roster endpoint uses "id", landing uses "playerId"
        var id = p.TryGetProperty("playerId", out var pid) ? pid.GetInt32() : p.GetProperty("id").GetInt32();
        var position = p.TryGetProperty("positionCode", out var pos) ? pos.GetString()!
            : p.TryGetProperty("position", out var pos2) ? pos2.GetString()! : "F";

        int? draftYear = null, draftRound = null, draftPick = null;
        string? draftTeam = null;

        if (p.TryGetProperty("draftDetails", out var draft))
        {
            draftYear = draft.TryGetProperty("year", out var y) ? y.GetInt32() : null;
            draftRound = draft.TryGetProperty("round", out var r) ? r.GetInt32() : null;
            draftPick = draft.TryGetProperty("pickInRound", out var pk) ? pk.GetInt32() : null;
            draftTeam = draft.TryGetProperty("teamAbbrev", out var dt) ? dt.GetString() : null;
        }

        return new NhlPlayerData(
            Id: id,
            FirstName: p.GetProperty("firstName").GetProperty("default").GetString()!,
            LastName: p.GetProperty("lastName").GetProperty("default").GetString()!,
            DateOfBirth: DateOnly.Parse(p.GetProperty("birthDate").GetString()!),
            BirthCity: p.TryGetProperty("birthCity", out var bc)
                ? bc.GetProperty("default").GetString()!
                : "",
            BirthStateProvince: p.TryGetProperty("birthStateProvince", out var bsp)
                ? bsp.GetProperty("default").GetString()
                : null,
            BirthCountry: p.TryGetProperty("birthCountry", out var bco) ? bco.GetString()! : "",
            HeightInches: p.TryGetProperty("heightInInches", out var h) ? h.GetInt32() : 0,
            WeightPounds: p.TryGetProperty("weightInPounds", out var w) ? w.GetInt32() : 0,
            ShootsCatches: p.TryGetProperty("shootsCatches", out var sc) ? sc.GetString()! : "L",
            Position: position,
            JerseyNumber: p.TryGetProperty("sweaterNumber", out var jn) ? jn.GetInt32() : null,
            DraftYear: draftYear,
            DraftRound: draftRound,
            DraftPick: draftPick,
            DraftTeamAbbreviation: draftTeam,
            TeamAbbreviation: teamAbbreviation,
            HeadshotUrl: p.TryGetProperty("headshot", out var hs) ? hs.GetString() : null,
            IsActive: p.TryGetProperty("isActive", out var ia) ? ia.GetBoolean() : true
        );
    }

    private static NhlStandingsEntry ParseStandingsEntry(JsonElement entry)
    {
        return new NhlStandingsEntry(
            TeamAbbreviation: entry.GetProperty("teamAbbrev").GetProperty("default").GetString()!,
            Division: entry.GetProperty("divisionName").GetString()!,
            Conference: entry.GetProperty("conferenceName").GetString()!,
            GamesPlayed: entry.GetProperty("gamesPlayed").GetInt32(),
            Wins: entry.GetProperty("wins").GetInt32(),
            Losses: entry.GetProperty("losses").GetInt32(),
            OvertimeLosses: entry.GetProperty("otLosses").GetInt32(),
            Points: entry.GetProperty("points").GetInt32(),
            PointsPct: entry.GetProperty("pointPctg").GetDecimal(),
            RegulationWins: entry.GetProperty("regulationWins").GetInt32(),
            RegulationPlusOTWins: entry.GetProperty("regulationPlusOtWins").GetInt32(),
            GoalsFor: entry.GetProperty("goalFor").GetInt32(),
            GoalsAgainst: entry.GetProperty("goalAgainst").GetInt32(),
            PowerPlayPct: entry.TryGetProperty("powerPlayPctg", out var pp) ? pp.GetDecimal() : 0,
            PenaltyKillPct: entry.TryGetProperty("penaltyKillPctg", out var pk) ? pk.GetDecimal() : 0,
            FaceoffPct: entry.TryGetProperty("faceoffWinPctg", out var fo) ? fo.GetDecimal() : null
        );
    }

    private static NhlGameDetailData ParseGameDetail(
        int gameId,
        JsonElement landing,
        JsonElement boxscore,
        JsonElement? playByPlay)
    {
        // Build team ID → abbreviation lookup from the boxscore's team info
        var teamIdToAbbrev = new Dictionary<int, string>();
        if (boxscore.TryGetProperty("homeTeam", out var bsHome)
            && bsHome.TryGetProperty("id", out var homeId)
            && bsHome.TryGetProperty("abbrev", out var homeAbbrev))
        {
            teamIdToAbbrev[homeId.GetInt32()] = homeAbbrev.GetString()!;
        }
        if (boxscore.TryGetProperty("awayTeam", out var bsAway)
            && bsAway.TryGetProperty("id", out var awayId)
            && bsAway.TryGetProperty("abbrev", out var awayAbbrev))
        {
            teamIdToAbbrev[awayId.GetInt32()] = awayAbbrev.GetString()!;
        }

        // Extract per-period shot counts from the boxscore
        var periodShotsByPeriod = new Dictionary<int, (int Home, int Away)>();
        if (boxscore.TryGetProperty("shotsByPeriod", out var shotsByPeriod))
        {
            foreach (var sp in shotsByPeriod.EnumerateArray())
            {
                var period = sp.GetProperty("period").GetInt32();
                var homeSog = sp.TryGetProperty("home", out var hs) ? hs.GetInt32() : 0;
                var awaySog = sp.TryGetProperty("away", out var aws) ? aws.GetInt32() : 0;
                periodShotsByPeriod[period] = (homeSog, awaySog);
            }
        }

        var periodScores = new List<NhlPeriodScore>();
        if (landing.TryGetProperty("summary", out var summary)
            && summary.TryGetProperty("linescore", out var linescore)
            && linescore.TryGetProperty("byPeriod", out var byPeriod))
        {
            foreach (var p in byPeriod.EnumerateArray())
            {
                var periodNum = p.GetProperty("period").GetInt32();
                var shots = periodShotsByPeriod.GetValueOrDefault(periodNum);
                periodScores.Add(new NhlPeriodScore(
                    Period: periodNum,
                    PeriodLabel: p.TryGetProperty("periodDescriptor", out var pd)
                        ? pd.GetProperty("periodType").GetString()!
                        : "",
                    HomeGoals: p.TryGetProperty("home", out var h) ? h.GetInt32() : 0,
                    AwayGoals: p.TryGetProperty("away", out var a) ? a.GetInt32() : 0,
                    HomeShots: shots.Home,
                    AwayShots: shots.Away
                ));
            }
        }

        var events = new List<NhlGameEvent>();
        if (playByPlay?.TryGetProperty("plays", out var plays) == true)
        {
            foreach (var play in plays.EnumerateArray())
            {
                var typeCode = play.TryGetProperty("typeDescKey", out var td)
                    ? td.GetString() ?? ""
                    : "";

                var eventType = typeCode switch
                {
                    "goal" => "Goal",
                    "penalty" => "Penalty",
                    "shot-on-goal" => "Shot",
                    "hit" => "Hit",
                    "giveaway" => "Giveaway",
                    "takeaway" => "Takeaway",
                    _ => (string?)null
                };

                if (eventType is null) continue;

                var details = play.TryGetProperty("details", out var d) ? d : (JsonElement?)null;

                // Resolve team abbreviation from eventOwnerTeamId
                var teamAbbrev = "";
                if (details?.TryGetProperty("eventOwnerTeamId", out var ownerTeamId) == true)
                    teamIdToAbbrev.TryGetValue(ownerTeamId.GetInt32(), out teamAbbrev!);

                events.Add(new NhlGameEvent(
                    EventType: eventType,
                    Period: play.TryGetProperty("periodDescriptor", out var pd2)
                        ? pd2.GetProperty("number").GetInt32()
                        : 0,
                    GameClockTime: play.TryGetProperty("timeInPeriod", out var tip)
                        ? tip.GetString()!
                        : "00:00",
                    TeamAbbreviation: teamAbbrev,
                    PrimaryPlayerId: details?.TryGetProperty("scoringPlayerId", out var sp) == true
                        ? sp.GetInt32()
                        : details?.TryGetProperty("committedByPlayerId", out var cbp) == true
                            ? cbp.GetInt32()
                            : null,
                    SecondaryPlayerId: details?.TryGetProperty("assist1PlayerId", out var a1) == true
                        ? a1.GetInt32()
                        : null,
                    TertiaryPlayerId: details?.TryGetProperty("assist2PlayerId", out var a2) == true
                        ? a2.GetInt32()
                        : null,
                    CoordinateX: details?.TryGetProperty("xCoord", out var x) == true
                        ? x.GetDecimal()
                        : null,
                    CoordinateY: details?.TryGetProperty("yCoord", out var y) == true
                        ? y.GetDecimal()
                        : null,
                    VideoUrl: null,
                    Description: details?.TryGetProperty("descKey", out var dk) == true
                        ? dk.GetString()
                        : null,
                    IsPowerPlay: details?.TryGetProperty("goalModifier", out var gm) == true
                        && gm.GetString() == "power-play",
                    IsShortHanded: details?.TryGetProperty("goalModifier", out var sh) == true
                        && sh.GetString() == "short-handed",
                    IsEmptyNet: details?.TryGetProperty("goalModifier", out var en) == true
                        && en.GetString() == "empty-net",
                    PenaltyType: details?.TryGetProperty("descKey", out var pt) == true
                        ? pt.GetString()
                        : null,
                    PenaltyMinutes: details?.TryGetProperty("duration", out var dur) == true
                        ? dur.GetInt32()
                        : null
                ));
            }
        }

        // Extract team stats from boxscore
        var homeStats = ParseTeamStats(boxscore, "homeTeam");
        var awayStats = ParseTeamStats(boxscore, "awayTeam");

        return new NhlGameDetailData(
            GameId: gameId,
            PeriodScores: periodScores,
            Events: events,
            PlayerStats: [],
            HomeStats: homeStats,
            AwayStats: awayStats
        );
    }

    private static NhlGameTeamStats ParseTeamStats(JsonElement boxscore, string teamKey)
    {
        if (!boxscore.TryGetProperty(teamKey, out var team))
            return new NhlGameTeamStats(0, 0, 0, 0, 0, 0, 0, null);

        var teamStats = team.TryGetProperty("teamGameStats", out var stats) ? stats : (JsonElement?)null;

        int GetStat(string key) =>
            teamStats?.EnumerateArray()
                .Where(s => s.GetProperty("category").GetString() == key)
                .Select(s => (int?)s.GetProperty("value").GetInt32())
                .FirstOrDefault() ?? 0;

        decimal GetDecimalStat(string key) =>
            teamStats?.EnumerateArray()
                .Where(s => s.GetProperty("category").GetString() == key)
                .Select(s => (decimal?)s.GetProperty("value").GetDecimal())
                .FirstOrDefault() ?? 0;

        return new NhlGameTeamStats(
            ShotsOnGoal: GetStat("sog"),
            Hits: GetStat("hits"),
            PowerPlayGoals: GetStat("powerPlay"),      // boxscore format: "x/y"
            PowerPlayOpps: GetStat("powerPlayPctg"),    // may need adjustment per API version
            FaceoffPct: GetDecimalStat("faceoffWinningPctg"),
            Takeaways: GetStat("takeaways"),
            Giveaways: GetStat("giveaways"),
            TimeOnAttack: null
        );
    }

    private static readonly Dictionary<string, string> LocationMap = new()
    {
        ["ANA"] = "Anaheim", ["ARI"] = "Arizona", ["BOS"] = "Boston", ["BUF"] = "Buffalo",
        ["CGY"] = "Calgary", ["CAR"] = "Carolina", ["CHI"] = "Chicago", ["COL"] = "Colorado",
        ["CBJ"] = "Columbus", ["DAL"] = "Dallas", ["DET"] = "Detroit", ["EDM"] = "Edmonton",
        ["FLA"] = "Florida", ["LAK"] = "Los Angeles", ["MIN"] = "Minnesota", ["MTL"] = "Montréal",
        ["NSH"] = "Nashville", ["NJD"] = "New Jersey", ["NYI"] = "New York", ["NYR"] = "New York",
        ["OTT"] = "Ottawa", ["PHI"] = "Philadelphia", ["PIT"] = "Pittsburgh", ["SJS"] = "San Jose",
        ["SEA"] = "Seattle", ["STL"] = "St. Louis", ["TBL"] = "Tampa Bay", ["TOR"] = "Toronto",
        ["UTA"] = "Utah", ["VAN"] = "Vancouver", ["VGK"] = "Vegas", ["WSH"] = "Washington",
        ["WPG"] = "Winnipeg"
    };

    private static string ExtractLocationName(string fullName, string abbreviation)
    {
        return LocationMap.GetValueOrDefault(abbreviation, fullName.Split(' ')[0]);
    }

    private static string ExtractTeamName(string fullName, string locationName)
    {
        if (fullName.StartsWith(locationName))
        {
            var name = fullName[locationName.Length..].Trim();
            return string.IsNullOrEmpty(name) ? fullName : name;
        }
        return fullName;
    }

    public void Dispose()
    {
        _rateLimiter.Dispose();
    }
}
