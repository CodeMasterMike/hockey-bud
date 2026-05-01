using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HockeyHub.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsRookieToPlayerSeason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRookie",
                table: "PlayerSeasons",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRookie",
                table: "PlayerSeasons");
        }
    }
}
