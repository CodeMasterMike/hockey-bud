using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HockeyHub.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSeriesStatusToGame : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SeriesStatus",
                table: "Games",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SeriesStatus",
                table: "Games");
        }
    }
}
