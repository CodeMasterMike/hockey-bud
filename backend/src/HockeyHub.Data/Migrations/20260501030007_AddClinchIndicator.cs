using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HockeyHub.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddClinchIndicator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClinchIndicator",
                table: "StandingsSnapshots",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClinchIndicator",
                table: "StandingsSnapshots");
        }
    }
}
