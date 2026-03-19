namespace HockeyHub.Core.Models.Entities;

public class League
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Abbreviation { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }

    public ICollection<Team> Teams { get; set; } = [];
    public ICollection<Season> Seasons { get; set; } = [];
}
