using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HockeyHub.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Leagues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Abbreviation = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LogoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leagues", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Seasons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LeagueId = table.Column<int>(type: "int", nullable: false),
                    YearStart = table.Column<int>(type: "int", nullable: false),
                    YearEnd = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Era = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsCurrent = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seasons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Seasons_Leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "Leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LeagueId = table.Column<int>(type: "int", nullable: false),
                    LocationName = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Abbreviation = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LogoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PrimaryColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JoinedSeasonYear = table.Column<int>(type: "int", nullable: false),
                    OriginalJoinYear = table.Column<int>(type: "int", nullable: false),
                    StanleyCupsTotal = table.Column<int>(type: "int", nullable: false),
                    StanleyCupsSince1973 = table.Column<int>(type: "int", nullable: false),
                    StanleyCupsSince2006 = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teams_Leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "Leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Arenas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HomeTeamId = table.Column<int>(type: "int", nullable: true),
                    IceWidthFeet = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    IceLengthFeet = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    HomeBenchSide = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AwayBenchSide = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PenaltyBoxSide = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LayoutJson = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Arenas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Arenas_Teams_HomeTeamId",
                        column: x => x.HomeTeamId,
                        principalTable: "Teams",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FranchiseHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CurrentTeamId = table.Column<int>(type: "int", nullable: false),
                    PreviousLocationName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PreviousName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    YearStart = table.Column<int>(type: "int", nullable: false),
                    YearEnd = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FranchiseHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FranchiseHistories_Teams_CurrentTeamId",
                        column: x => x.CurrentTeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExternalId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: false),
                    BirthCity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BirthStateProvince = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BirthCountry = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Height = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<int>(type: "int", nullable: false),
                    ShootsCatches = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DraftYear = table.Column<int>(type: "int", nullable: true),
                    DraftRound = table.Column<int>(type: "int", nullable: true),
                    DraftPick = table.Column<int>(type: "int", nullable: true),
                    DraftTeamId = table.Column<int>(type: "int", nullable: true),
                    CurrentTeamId = table.Column<int>(type: "int", nullable: true),
                    JerseyNumber = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsEbug = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Players_Teams_CurrentTeamId",
                        column: x => x.CurrentTeamId,
                        principalTable: "Teams",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Players_Teams_DraftTeamId",
                        column: x => x.DraftTeamId,
                        principalTable: "Teams",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "StandingsSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    SeasonId = table.Column<int>(type: "int", nullable: false),
                    Division = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Conference = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GamesPlayed = table.Column<int>(type: "int", nullable: false),
                    Wins = table.Column<int>(type: "int", nullable: false),
                    Losses = table.Column<int>(type: "int", nullable: false),
                    OvertimeLosses = table.Column<int>(type: "int", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    PointsPct = table.Column<decimal>(type: "decimal(5,3)", precision: 5, scale: 3, nullable: false),
                    RegulationWins = table.Column<int>(type: "int", nullable: false),
                    RegulationPlusOTWins = table.Column<int>(type: "int", nullable: false),
                    GoalsFor = table.Column<int>(type: "int", nullable: false),
                    GoalsAgainst = table.Column<int>(type: "int", nullable: false),
                    PowerPlayPct = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    PenaltyKillPct = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    FaceoffPct = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: true),
                    LeagueRank = table.Column<int>(type: "int", nullable: false),
                    LastUpdated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StandingsSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StandingsSnapshots_Seasons_SeasonId",
                        column: x => x.SeasonId,
                        principalTable: "Seasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StandingsSnapshots_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Games",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExternalId = table.Column<int>(type: "int", nullable: false),
                    SeasonId = table.Column<int>(type: "int", nullable: false),
                    HomeTeamId = table.Column<int>(type: "int", nullable: false),
                    AwayTeamId = table.Column<int>(type: "int", nullable: false),
                    ArenaId = table.Column<int>(type: "int", nullable: true),
                    ScheduledStart = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    GameDateLocal = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CurrentPeriod = table.Column<int>(type: "int", nullable: true),
                    CurrentPeriodLabel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PeriodTimeRemaining = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PeriodTimeRemainingSeconds = table.Column<int>(type: "int", nullable: true),
                    ClockRunning = table.Column<bool>(type: "bit", nullable: false),
                    ClockLastSyncedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    HomeScore = table.Column<int>(type: "int", nullable: true),
                    AwayScore = table.Column<int>(type: "int", nullable: true),
                    HomeShotsOnGoal = table.Column<int>(type: "int", nullable: true),
                    AwayShotsOnGoal = table.Column<int>(type: "int", nullable: true),
                    HomeHits = table.Column<int>(type: "int", nullable: true),
                    AwayHits = table.Column<int>(type: "int", nullable: true),
                    HomePowerPlayGoals = table.Column<int>(type: "int", nullable: true),
                    HomePowerPlayOpps = table.Column<int>(type: "int", nullable: true),
                    AwayPowerPlayGoals = table.Column<int>(type: "int", nullable: true),
                    AwayPowerPlayOpps = table.Column<int>(type: "int", nullable: true),
                    HomeFaceoffPct = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: true),
                    AwayFaceoffPct = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: true),
                    HomeTakeaways = table.Column<int>(type: "int", nullable: true),
                    AwayTakeaways = table.Column<int>(type: "int", nullable: true),
                    HomeGiveaways = table.Column<int>(type: "int", nullable: true),
                    AwayGiveaways = table.Column<int>(type: "int", nullable: true),
                    HomeTimeOnAttack = table.Column<TimeSpan>(type: "time", nullable: true),
                    AwayTimeOnAttack = table.Column<TimeSpan>(type: "time", nullable: true),
                    IsOvertime = table.Column<bool>(type: "bit", nullable: false),
                    IsShootout = table.Column<bool>(type: "bit", nullable: false),
                    LastUpdated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
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
                name: "Personnel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    FormerPlayerId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Personnel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Personnel_Players_FormerPlayerId",
                        column: x => x.FormerPlayerId,
                        principalTable: "Players",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Personnel_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GamePeriodScores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GameId = table.Column<int>(type: "int", nullable: false),
                    Period = table.Column<int>(type: "int", nullable: false),
                    PeriodLabel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HomeGoals = table.Column<int>(type: "int", nullable: false),
                    AwayGoals = table.Column<int>(type: "int", nullable: false),
                    HomeShots = table.Column<int>(type: "int", nullable: false),
                    AwayShots = table.Column<int>(type: "int", nullable: false)
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
                name: "IX_Arenas_HomeTeamId",
                table: "Arenas",
                column: "HomeTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_FranchiseHistories_CurrentTeamId",
                table: "FranchiseHistories",
                column: "CurrentTeamId");

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
                name: "IX_Leagues_Abbreviation",
                table: "Leagues",
                column: "Abbreviation",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Personnel_FormerPlayerId",
                table: "Personnel",
                column: "FormerPlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_Personnel_TeamId_Role",
                table: "Personnel",
                columns: new[] { "TeamId", "Role" });

            migrationBuilder.CreateIndex(
                name: "IX_Players_CurrentTeamId",
                table: "Players",
                column: "CurrentTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_DraftTeamId",
                table: "Players",
                column: "DraftTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_ExternalId",
                table: "Players",
                column: "ExternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_IsActive",
                table: "Players",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Seasons_IsCurrent",
                table: "Seasons",
                column: "IsCurrent");

            migrationBuilder.CreateIndex(
                name: "IX_Seasons_LeagueId_YearStart",
                table: "Seasons",
                columns: new[] { "LeagueId", "YearStart" },
                unique: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_Teams_Abbreviation",
                table: "Teams",
                column: "Abbreviation",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teams_LeagueId",
                table: "Teams",
                column: "LeagueId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_LocationName",
                table: "Teams",
                column: "LocationName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FranchiseHistories");

            migrationBuilder.DropTable(
                name: "GamePeriodScores");

            migrationBuilder.DropTable(
                name: "Personnel");

            migrationBuilder.DropTable(
                name: "StandingsSnapshots");

            migrationBuilder.DropTable(
                name: "Games");

            migrationBuilder.DropTable(
                name: "Players");

            migrationBuilder.DropTable(
                name: "Arenas");

            migrationBuilder.DropTable(
                name: "Seasons");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "Leagues");
        }
    }
}
