using Hangfire;
using Hangfire.SqlServer;
using HockeyHub.Api.Hubs;
using HockeyHub.Api.Middleware;
using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Providers;
using HockeyHub.Data.Services.Cache;
using HockeyHub.Data.Services.Queries;
using HockeyHub.Data.Services.Sync;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<HockeyHubDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis shared connection + distributed cache
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnectionString))
{
    builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(
        StackExchange.Redis.ConnectionMultiplexer.Connect(new StackExchange.Redis.ConfigurationOptions
        {
            EndPoints = { redisConnectionString },
            AbortOnConnectFail = false,
            ConnectRetry = 5,
        }));
}

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnectionString;
    options.InstanceName = "HockeyHub:";
});

// SignalR with Redis backplane
builder.Services.AddSignalR()
    .AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis")!, options =>
    {
        options.Configuration.ChannelPrefix = new StackExchange.Redis.RedisChannel("HockeyHub", StackExchange.Redis.RedisChannel.PatternMode.Literal);
        options.Configuration.AbortOnConnectFail = false;
        options.Configuration.ConnectRetry = 5;
    });

// Hangfire
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();

// NHL data provider
builder.Services.AddHttpClient<INhlDataProvider, NhlWebApiProvider>();

// Application services
builder.Services.AddSingleton<RedisCacheService>();
builder.Services.AddScoped<DataSeedService>();
builder.Services.AddScoped<ScoresQueryService>();
builder.Services.AddScoped<StandingsQueryService>();
builder.Services.AddScoped<ScheduleQueryService>();
builder.Services.AddScoped<TeamsQueryService>();
builder.Services.AddScoped<GameHubQueryService>();
builder.Services.AddScoped<TradesQueryService>();
builder.Services.AddScoped<SeasonModeService>();
builder.Services.AddScoped<PlayoffBracketQueryService>();
builder.Services.AddScoped<DraftQueryService>();
builder.Services.AddScoped<TradeSyncJob>();
builder.Services.AddScoped<ScoresSyncJob>();
builder.Services.AddScoped<StandingsSyncJob>();
builder.Services.AddScoped<ScheduleSyncJob>();
builder.Services.AddSingleton<IScoreBroadcaster, SignalRScoreBroadcaster>();

// Response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// Controllers & CORS
builder.Services.AddControllers();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:4200", "https://localhost:4200"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

var app = builder.Build();

// Apply pending EF migrations on startup (local dev only — CI/CD handles this in deployed environments)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<HockeyHubDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    for (var attempt = 1; attempt <= 10; attempt++)
    {
        try
        {
            await db.Database.MigrateAsync();
            logger.LogInformation("Database migration completed on attempt {Attempt}", attempt);
            break;
        }
        catch (Exception ex) when (attempt < 10)
        {
            logger.LogWarning(ex, "Database migration attempt {Attempt} failed, retrying in 5s...", attempt);
            await Task.Delay(5000);
        }
    }
}

// Middleware pipeline
app.UseResponseCompression();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors("AppCors");

// Security headers for API responses (frontend has its own via Static Web Apps config)
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/hubs/scores");

// Hangfire dashboard only accessible in Development (no auth required locally).
// Deployed environments (Staging/Production) do not expose the dashboard.
if (app.Environment.IsDevelopment())
{
    app.MapHangfireDashboard("/hangfire");
}

// Hangfire recurring jobs
app.Services.GetRequiredService<IRecurringJobManager>().AddOrUpdate<ScoresSyncJob>(
    "scores-sync",
    job => job.SyncAsync(CancellationToken.None),
    "*/15 * * * * *"); // Every 15 seconds

app.Services.GetRequiredService<IRecurringJobManager>().AddOrUpdate<StandingsSyncJob>(
    "standings-sync",
    job => job.SyncAsync(CancellationToken.None),
    "*/5 * * * *"); // Every 5 minutes

app.Services.GetRequiredService<IRecurringJobManager>().AddOrUpdate<ScheduleSyncJob>(
    "schedule-sync",
    job => job.SyncAsync(CancellationToken.None),
    "0 6 * * *"); // Daily at 6 AM UTC

app.Services.GetRequiredService<IRecurringJobManager>().AddOrUpdate<TradeSyncJob>(
    "trade-sync",
    job => job.SyncAsync(CancellationToken.None),
    "0 7 * * *"); // Daily at 7 AM UTC

// Data seed command: dotnet run -- --seed [--current-only]
if (args.Contains("--seed"))
{
    using var scope = app.Services.CreateScope();
    var seedService = scope.ServiceProvider.GetRequiredService<DataSeedService>();
    var currentOnly = args.Contains("--current-only");
    await seedService.SeedAsync(currentOnly);
    return;
}

app.Run();
