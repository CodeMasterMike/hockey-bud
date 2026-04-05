using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Cache;

public class RedisCacheService(IDistributedCache cache, ILogger<RedisCacheService> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    // Default TTLs per data type
    public static readonly TimeSpan LiveScoresTtl = TimeSpan.FromSeconds(10);
    public static readonly TimeSpan StandingsTtl = TimeSpan.FromHours(1);
    public static readonly TimeSpan StatsTtl = TimeSpan.FromHours(3);
    public static readonly TimeSpan RosterTtl = TimeSpan.FromHours(1);
    public static readonly TimeSpan ScheduleTtl = TimeSpan.FromHours(6);
    public static readonly TimeSpan TeamsTtl = TimeSpan.FromHours(24);

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class
    {
        var data = await cache.GetStringAsync(key, ct);
        if (data is null) return null;

        try
        {
            return JsonSerializer.Deserialize<T>(data, JsonOptions);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "Failed to deserialize cached value for key {Key}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default) where T : class
    {
        var json = JsonSerializer.Serialize(value, JsonOptions);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl
        };
        await cache.SetStringAsync(key, json, options, ct);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        await cache.RemoveAsync(key, ct);
    }

    public async Task<T> GetOrSetAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan ttl,
        CancellationToken ct = default) where T : class
    {
        var cached = await GetAsync<T>(key, ct);
        if (cached is not null) return cached;

        var value = await factory(ct);
        await SetAsync(key, value, ttl, ct);
        return value;
    }

    public async Task<(T? Value, DateTimeOffset? CachedAt)> GetWithTimestampAsync<T>(
        string key,
        CancellationToken ct = default) where T : class
    {
        var data = await cache.GetStringAsync(key, ct);
        if (data is null) return (null, null);

        try
        {
            var wrapper = JsonSerializer.Deserialize<CachedWrapper<T>>(data, JsonOptions);
            return (wrapper?.Value, wrapper?.CachedAt);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "Failed to deserialize cached wrapper for key {Key}, falling back to raw value", key);
            var value = JsonSerializer.Deserialize<T>(data, JsonOptions);
            return (value, null);
        }
    }

    public async Task SetWithTimestampAsync<T>(
        string key,
        T value,
        TimeSpan ttl,
        CancellationToken ct = default) where T : class
    {
        var wrapper = new CachedWrapper<T>(value, DateTimeOffset.UtcNow);
        var json = JsonSerializer.Serialize(wrapper, JsonOptions);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl
        };
        await cache.SetStringAsync(key, json, options, ct);
    }

    private record CachedWrapper<T>(T Value, DateTimeOffset CachedAt);
}
