using System.Text.Json;

namespace HockeyHub.Core.Models.Entities;

public class Arena
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string City { get; set; }
    public int? HomeTeamId { get; set; }
    public decimal IceWidthFeet { get; set; } = 85;
    public decimal IceLengthFeet { get; set; } = 200;
    public required string HomeBenchSide { get; set; }
    public required string AwayBenchSide { get; set; }
    public required string PenaltyBoxSide { get; set; }
    public JsonDocument? LayoutJson { get; set; }

    public Team? HomeTeam { get; set; }
}
