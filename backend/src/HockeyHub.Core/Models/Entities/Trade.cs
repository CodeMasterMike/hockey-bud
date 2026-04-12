namespace HockeyHub.Core.Models.Entities;

public class Trade
{
    public int Id { get; set; }
    public int SeasonId { get; set; }
    public DateOnly TradeDate { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset LastUpdated { get; set; }

    public Season Season { get; set; } = null!;
    public ICollection<TradeAsset> Assets { get; set; } = [];
}
