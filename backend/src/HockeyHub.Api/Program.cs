using Hangfire;
using Hangfire.PostgreSql;
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
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQL")));

// Redis distributed cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "HockeyHub:";
});

// SignalR with Redis backplane
builder.Services.AddSignalR()
    .AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis")!, options =>
    {
        options.Configuration.ChannelPrefix = new StackExchange.Redis.RedisChannel("HockeyHub", StackExchange.Redis.RedisChannel.PatternMode.Literal);
    });

// Hangfire
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options =>
        options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("PostgreSQL")!)));
builder.Services.AddHangfireServer();

// NHL data provider
builder.Services.AddHttpClient<INhlDataProvider, NhlWebApiProvider>();

// Application services
builder.Services.AddSingleton<RedisCacheService>();
builder.Services.AddScoped<DataSeedService>();
builder.Services.AddScoped<ScoresQueryService>();
builder.Services.AddScoped<ScoresSyncJob>();
builder.Services.AddScoped<StandingsSyncJob>();
builder.Services.AddSingleton<IScoreBroadcaster, SignalRScoreBroadcaster>();

// Controllers & CORS
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy => policy
        .WithOrigins("http://localhost:4200", "https://localhost:4200")
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

var app = builder.Build();

// Apply pending EF migrations on startup
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<HockeyHubDbContext>();
    db.Database.Migrate();
}

// Middleware pipeline
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors("DevCors");
app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/hubs/scores");
app.MapHangfireDashboard("/hangfire");

// Hangfire recurring jobs
app.Services.GetRequiredService<IRecurringJobManager>().AddOrUpdate<ScoresSyncJob>(
    "scores-sync",
    job => job.SyncAsync(CancellationToken.None),
    "*/15 * * * * *"); // Every 15 seconds

app.Services.GetRequiredService<IRecurringJobManager>().AddOrUpdate<StandingsSyncJob>(
    "standings-sync",
    job => job.SyncAsync(CancellationToken.None),
    "*/5 * * * *"); // Every 5 minutes

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
