namespace CryptoCompete.Api.Services;

public interface IKlineService
{
    Task<KlineData> GetKlinesAsync(string symbol, KlineTimeframe timeframe, CancellationToken cancellationToken = default);
}

public enum KlineTimeframe
{
    Day1,
    Day7,
    Month1,
    Month3,
    Year1,
    YearToDate
}

public record KlineData(
    string Symbol,
    KlineTimeframe Timeframe,
    string Interval,
    List<Kline> Klines,
    bool FromCache,
    DateTimeOffset FetchedAt
);

public record Kline(
    long OpenTime,
    decimal Open,
    decimal High,
    decimal Low,
    decimal Close,
    decimal Volume,
    long CloseTime
);