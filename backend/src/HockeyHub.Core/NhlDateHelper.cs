namespace HockeyHub.Core;

/// <summary>
/// Centralizes NHL game day boundary logic. The NHL considers games starting before
/// 3 AM Eastern as belonging to the previous calendar day. Using TimeZoneInfo handles
/// DST transitions automatically, unlike raw UTC offsets.
/// </summary>
public static class NhlDateHelper
{
    private static readonly TimeZoneInfo EasternTz =
        TimeZoneInfo.FindSystemTimeZoneById("America/New_York");

    /// <summary>
    /// Hours subtracted from Eastern time to determine the NHL game day boundary.
    /// Games starting before 3 AM ET belong to the previous day's slate.
    /// </summary>
    private const int GameDayBoundaryHours = 3;

    /// <summary>
    /// Returns the current NHL game day, accounting for the 3 AM ET boundary.
    /// Uses the provided TimeProvider for testability, defaults to system clock.
    /// </summary>
    public static DateOnly GetCurrentGameDay(TimeProvider? timeProvider = null) =>
        DateOnly.FromDateTime(GetEasternNow(timeProvider).AddHours(-GameDayBoundaryHours));

    /// <summary>
    /// Converts a UTC DateTimeOffset to Eastern time for display purposes.
    /// </summary>
    public static DateTimeOffset ToEastern(DateTimeOffset utc) =>
        TimeZoneInfo.ConvertTime(utc, EasternTz);

    /// <summary>
    /// Formats a scheduled start time in Eastern time (e.g. "7:00 PM").
    /// </summary>
    public static string FormatStartTimeEastern(DateTimeOffset scheduledStart) =>
        TimeZoneInfo.ConvertTime(scheduledStart, EasternTz).ToString("h:mm tt");

    private static DateTime GetEasternNow(TimeProvider? timeProvider = null) =>
        TimeZoneInfo.ConvertTimeFromUtc((timeProvider ?? TimeProvider.System).GetUtcNow().UtcDateTime, EasternTz);
}
