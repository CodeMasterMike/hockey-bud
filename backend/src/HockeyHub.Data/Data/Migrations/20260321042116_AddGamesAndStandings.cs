using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HockeyHub.Data.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGamesAndStandings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Games",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExternalId = table.Column<int>(type: "integer", nullable: false),
                    SeasonId = table.Column<int>(type: "integer", nullable: false),
                    HomeTeamId = table.Column<int>(type: "integer", nullable: false),
                    AwayTeamId = table.Column<int>(type: "integer", nullable: false),
                    ArenaId = table.Column<int>(type: "integer", nullable: true),
                    ScheduledStart = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GameDateLocal = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CurrentPeriod = table.Column<int>(type: "integer", nullable: true),
                    CurrentPeriodLabel = table.Column<string>(type: "text", nullable: true),
                    PeriodTimeRemaining = table.Column<string>(type: "text", nullable: true),
                    PeriodTimeRemainingSeconds = table.Column<int>(type: "integer", nullable: true),
                    ClockRunning = table.Column<bool>(type: "boolean", nullable: false),
                    ClockLastSyncedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    HomeScore = table.Column<int>(type: "integer", nullable: true),
                    AwayScore = table.Column<int>(type: "integer", nullable: true),
                    HomeShotsOnGoal = table.Column<int>(type: "integer", nullable: true),
                    AwayShotsOnGoal = table.Column<int>(type: "integer", nullable: true),
                    HomeHits = table.Column<int>(type: "integer", nullable: true),
                    AwayHits = table.Column<int>(type: "integer", nullable: true),
                    HomePowerPlayGoals = table.Column<int>(type: "integer", nullable: true),
                    HomePowerPlayOpps = table.Column<int>(type: "integer", nullable: true),
                    AwayPowerPlayGoals = table.Column<int>(type: "integer", nullable: true),
                    AwayPowerPlayOpps = table.Column<int>(type: "integer", nullable: true),
                    HomeFaceoffPct = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: true),
                    AwayFaceoffPct = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: true),
                    HomeTakeaways = table.Column<int>(type: "integer", nullable: true),
                    AwayTakeaways = table.Column<int>(type: "integer", nullable: true),
                    HomeGiveaways = table.Column<int>(type: "integer", nullable: true),
                    AwayGiveaways = table.Column<int>(type: "integer", nullable: true),
                    HomeTimeOnAttack = table.Column<TimeSpan>(type: "interval", nullable: true),
                    AwayTimeOnAttack = table.Column<TimeSpan>(type: "interval", nullable: true),
                    IsOvertime = table.Column<bool>(type: "boolean", nullable: false),
                    IsShootout = table.Column<bool>(type: "boolean", nullable: false),
                    LastUpdated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Games", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Games_Arenas_ArenaId",
                        column: x => x.ArenaId,
                        principalTable: "Arenas",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Games_Seasons_SeasonId",
                        column: x => x.SeasonId,
                        principalTable: "Seasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Games_Teams_AwayTeamId",
                        column: x => x.AwayTeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Games_Teams_HomeTeamId",
                        column: x => x.HomeTeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StandingsSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<int>(type: "integer", nullable: false),
                    SeasonId = table.Column<int>(type: "integer", nullable: false),
                    Division = table.Column<string>(type: "text", nullable: false),
                    Conference = table.Column<string>(type: "text", nullable: false),
                    GamesPlayed = table.Column<int>(type: "integer", nullable: false),
                    Wins = table.Column<int>(type: "integer", nullable: false),
                    Losses = table.Column<int>(type: "integer", nullable: false),
                    OvertimeLosses = table.Column<int>(type: "integer", nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    PointsPct = table.Column<decimal>(type: "numeric(5,3)", precision: 5, scale: 3, nullable: false),
                    RegulationWins = table.Column<int>(type: "integer", nullable: false),
                    RegulationPlusOTWins = table.Column<int>(type: "integer", nullable: false),
                    GoalsFor = table.Column<int>(type: "integer", nullable: false),
                    GoalsAgainst = table.Column<int>(type: "integer", nullable: false),
                    PowerPlayPct = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: false),
                    PenaltyKillPct = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: false),
                    FaceoffPct = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: true),
                    LeagueRank = table.Column<int>(type: "integer", nullable: false),
                    LastUpdated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StandingsSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StandingsSnapshots_Seasons_SeasonId",
                        column: x => x.SeasonId,
                        principalTable: "Seasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StandingsSnapshots_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GamePeriodScores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    Period = table.Column<int>(type: "integer", nullable: false),
                    PeriodLabel = table.Column<string>(type: "text", nullable: false),
                    HomeGoals = table.Column<int>(type: "integer", nullable: false),
                    AwayGoals = table.Column<int>(type: "integer", nullable: false),
                    HomeShots = table.Column<int>(type: "integer", nullable: false),
                    AwayShots = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GamePeriodScores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GamePeriodScores_Games_GameId",
                        column: x => x.GameId,
                        principalTable: "Games",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GamePeriodScores_GameId_Period",
                table: "GamePeriodScores",
                columns: new[] { "GameId", "Period" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Games_ArenaId",
                table: "Games",
                column: "ArenaId");

            migrationBuilder.CreateIndex(
                name: "IX_Games_AwayTeamId",
                table: "Games",
                column: "AwayTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Games_ExternalId",
                table: "Games",
                column: "ExternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Games_GameDateLocal",
                table: "Games",
                column: "GameDateLocal");

            migrationBuilder.CreateIndex(
                name: "IX_Games_HomeTeamId",
                table: "Games",
                column: "HomeTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Games_SeasonId_GameDateLocal",
                table: "Games",
                columns: new[] { "SeasonId", "GameDateLocal" });

            migrationBuilder.CreateIndex(
                name: "IX_Games_Status",
                table: "Games",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StandingsSnapshots_LeagueRank",
                table: "StandingsSnapshots",
                column: "LeagueRank");

            migrationBuilder.CreateIndex(
                name: "IX_StandingsSnapshots_SeasonId",
                table: "StandingsSnapshots",
                column: "SeasonId");

            migrationBuilder.CreateIndex(
                name: "IX_StandingsSnapshots_TeamId_SeasonId",
                table: "StandingsSnapshots",
                columns: new[] { "TeamId", "SeasonId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GamePeriodScores");

            migrationBuilder.DropTable(
                name: "StandingsSnapshots");

            migrationBuilder.DropTable(
                name: "Games");
        }
    }
}
