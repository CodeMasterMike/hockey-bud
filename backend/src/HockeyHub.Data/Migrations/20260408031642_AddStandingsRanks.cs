using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HockeyHub.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStandingsRanks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ConferenceRank",
                table: "StandingsSnapshots",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DivisionRank",
                table: "StandingsSnapshots",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "GoalDifferential",
                table: "StandingsSnapshots",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WildCardRank",
                table: "StandingsSnapshots",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConferenceRank",
                table: "StandingsSnapshots");

            migrationBuilder.DropColumn(
                name: "DivisionRank",
                table: "StandingsSnapshots");

            migrationBuilder.DropColumn(
                name: "GoalDifferential",
                table: "StandingsSnapshots");

            migrationBuilder.DropColumn(
                name: "WildCardRank",
                table: "StandingsSnapshots");
        }
    }
}
