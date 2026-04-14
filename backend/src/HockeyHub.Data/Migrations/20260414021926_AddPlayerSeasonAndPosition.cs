using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HockeyHub.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerSeasonAndPosition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Position",
                table: "Players",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "PlayerSeasons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlayerId = table.Column<int>(type: "int", nullable: false),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    SeasonId = table.Column<int>(type: "int", nullable: false),
                    LeagueAbbreviation = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Era = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GamesPlayed = table.Column<int>(type: "int", nullable: false),
                    Goals = table.Column<int>(type: "int", nullable: false),
                    Assists = table.Column<int>(type: "int", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    PlusMinus = table.Column<int>(type: "int", nullable: false),
                    Hits = table.Column<int>(type: "int", nullable: true),
                    PenaltyMinutes = table.Column<int>(type: "int", nullable: false),
                    TimeOnIcePerGame = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    Shots = table.Column<int>(type: "int", nullable: true),
                    ShootingPct = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: true),
                    BlockedShots = table.Column<int>(type: "int", nullable: true),
                    EvenStrengthPoints = table.Column<int>(type: "int", nullable: true),
                    PowerPlayPoints = table.Column<int>(type: "int", nullable: true),
                    ShortHandedPoints = table.Column<int>(type: "int", nullable: true),
                    Giveaways = table.Column<int>(type: "int", nullable: true),
                    Takeaways = table.Column<int>(type: "int", nullable: true),
                    FaceoffPct = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: true),
                    ShootoutPct = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: true),
                    War = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    XGFPer60 = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    XGAPer60 = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    Wins = table.Column<int>(type: "int", nullable: true),
                    Losses = table.Column<int>(type: "int", nullable: true),
                    OvertimeLosses = table.Column<int>(type: "int", nullable: true),
                    SavePct = table.Column<decimal>(type: "decimal(5,3)", precision: 5, scale: 3, nullable: true),
                    GoalsAgainstAvg = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    ShotsAgainst = table.Column<int>(type: "int", nullable: true),
                    Saves = table.Column<int>(type: "int", nullable: true),
                    GoalsAgainst = table.Column<int>(type: "int", nullable: true),
                    GamesStarted = table.Column<int>(type: "int", nullable: true),
                    HighDangerChances = table.Column<int>(type: "int", nullable: true),
                    HighDangerSaves = table.Column<int>(type: "int", nullable: true),
                    LowDangerChances = table.Column<int>(type: "int", nullable: true),
                    LowDangerSaves = table.Column<int>(type: "int", nullable: true),
                    GoalieGoals = table.Column<int>(type: "int", nullable: true),
                    GoalieAssists = table.Column<int>(type: "int", nullable: true),
                    LastUpdated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerSeasons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerSeasons_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlayerSeasons_Seasons_SeasonId",
                        column: x => x.SeasonId,
                        principalTable: "Seasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlayerSeasons_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Players_Position",
                table: "Players",
                column: "Position");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSeasons_PlayerId_TeamId_SeasonId_LeagueAbbreviation",
                table: "PlayerSeasons",
                columns: new[] { "PlayerId", "TeamId", "SeasonId", "LeagueAbbreviation" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSeasons_SeasonId_LeagueAbbreviation",
                table: "PlayerSeasons",
                columns: new[] { "SeasonId", "LeagueAbbreviation" });

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSeasons_TeamId_SeasonId",
                table: "PlayerSeasons",
                columns: new[] { "TeamId", "SeasonId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlayerSeasons");

            migrationBuilder.DropIndex(
                name: "IX_Players_Position",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Position",
                table: "Players");
        }
    }
}
