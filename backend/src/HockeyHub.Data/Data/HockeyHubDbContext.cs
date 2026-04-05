using System.Text.Json;
using HockeyHub.Core.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Data;

public class HockeyHubDbContext(DbContextOptions<HockeyHubDbContext> options) : DbContext(options)
{
    public DbSet<League> Leagues => Set<League>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Season> Seasons => Set<Season>();
    public DbSet<Arena> Arenas => Set<Arena>();
    public DbSet<FranchiseHistory> FranchiseHistories => Set<FranchiseHistory>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Personnel> Personnel => Set<Personnel>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<GamePeriodScore> GamePeriodScores => Set<GamePeriodScore>();
    public DbSet<StandingsSnapshot> StandingsSnapshots => Set<StandingsSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<League>(entity =>
        {
            entity.HasIndex(e => e.Abbreviation).IsUnique();
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasIndex(e => e.Abbreviation).IsUnique();
            entity.HasIndex(e => e.LocationName);

            entity.HasOne(e => e.League)
                .WithMany(l => l.Teams)
                .HasForeignKey(e => e.LeagueId);
        });

        modelBuilder.Entity<Season>(entity =>
        {
            entity.HasIndex(e => new { e.LeagueId, e.YearStart }).IsUnique();
            entity.HasIndex(e => e.IsCurrent);

            entity.HasOne(e => e.League)
                .WithMany(l => l.Seasons)
                .HasForeignKey(e => e.LeagueId);
        });

        modelBuilder.Entity<Arena>(entity =>
        {
            entity.Property(e => e.IceWidthFeet).HasPrecision(5, 1);
            entity.Property(e => e.IceLengthFeet).HasPrecision(5, 1);
            entity.Property(e => e.LayoutJson)
                .HasColumnType("nvarchar(max)")
                .HasConversion(
                    v => v == null ? null : v.RootElement.GetRawText(),
                    v => v == null ? null : JsonDocument.Parse(v, default));

            entity.HasOne(e => e.HomeTeam)
                .WithMany()
                .HasForeignKey(e => e.HomeTeamId)
                .IsRequired(false);
        });

        modelBuilder.Entity<FranchiseHistory>(entity =>
        {
            entity.HasOne(e => e.CurrentTeam)
                .WithMany(t => t.FranchiseHistories)
                .HasForeignKey(e => e.CurrentTeamId);
        });

        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasIndex(e => e.ExternalId).IsUnique();
            entity.HasIndex(e => e.CurrentTeamId);
            entity.HasIndex(e => e.IsActive);

            entity.HasOne(e => e.CurrentTeam)
                .WithMany(t => t.Players)
                .HasForeignKey(e => e.CurrentTeamId)
                .IsRequired(false);

            entity.HasOne(e => e.DraftTeam)
                .WithMany()
                .HasForeignKey(e => e.DraftTeamId)
                .IsRequired(false);
        });

        modelBuilder.Entity<Personnel>(entity =>
        {
            entity.HasIndex(e => new { e.TeamId, e.Role });

            entity.HasOne(e => e.Team)
                .WithMany(t => t.Personnel)
                .HasForeignKey(e => e.TeamId);

            entity.HasOne(e => e.FormerPlayer)
                .WithMany()
                .HasForeignKey(e => e.FormerPlayerId)
                .IsRequired(false);
        });

        modelBuilder.Entity<Game>(entity =>
        {
            entity.HasIndex(e => e.ExternalId).IsUnique();
            entity.HasIndex(e => e.GameDateLocal);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.SeasonId, e.GameDateLocal });

            entity.Property(e => e.HomeFaceoffPct).HasPrecision(5, 1);
            entity.Property(e => e.AwayFaceoffPct).HasPrecision(5, 1);

            entity.HasOne(e => e.Season)
                .WithMany()
                .HasForeignKey(e => e.SeasonId);

            entity.HasOne(e => e.HomeTeam)
                .WithMany()
                .HasForeignKey(e => e.HomeTeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AwayTeam)
                .WithMany()
                .HasForeignKey(e => e.AwayTeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Arena)
                .WithMany()
                .HasForeignKey(e => e.ArenaId)
                .IsRequired(false);
        });

        modelBuilder.Entity<GamePeriodScore>(entity =>
        {
            entity.HasIndex(e => new { e.GameId, e.Period }).IsUnique();

            entity.HasOne(e => e.Game)
                .WithMany(g => g.PeriodScores)
                .HasForeignKey(e => e.GameId);
        });

        modelBuilder.Entity<StandingsSnapshot>(entity =>
        {
            entity.HasIndex(e => new { e.TeamId, e.SeasonId }).IsUnique();
            entity.HasIndex(e => e.LeagueRank);

            entity.Property(e => e.PointsPct).HasPrecision(5, 3);
            entity.Property(e => e.PowerPlayPct).HasPrecision(5, 1);
            entity.Property(e => e.PenaltyKillPct).HasPrecision(5, 1);
            entity.Property(e => e.FaceoffPct).HasPrecision(5, 1);

            entity.HasOne(e => e.Team)
                .WithMany()
                .HasForeignKey(e => e.TeamId);

            entity.HasOne(e => e.Season)
                .WithMany()
                .HasForeignKey(e => e.SeasonId);
        });
    }
}
