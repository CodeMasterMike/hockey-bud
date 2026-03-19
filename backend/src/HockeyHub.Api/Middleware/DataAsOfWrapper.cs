namespace HockeyHub.Api.Middleware;

/// <summary>
/// Standard response wrapper that includes a dataAsOf timestamp indicating
/// when the data was last refreshed from the source.
/// </summary>
public record DataAsOfResponse<T>(T Data, DateTimeOffset DataAsOf);

/// <summary>
/// Paginated response wrapper.
/// </summary>
public record PaginatedResponse<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages,
    DateTimeOffset DataAsOf
);
