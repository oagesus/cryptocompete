using CryptoCompete.Api.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Hubs;

public class CryptoPriceHub : Hub
{
    private readonly AppDbContext _db;

    public CryptoPriceHub(AppDbContext db)
    {
        _db = db;
    }

    public async Task SubscribeToAll()
    {
        var symbols = await _db.Cryptocurrencies
            .Where(c => c.IsActive)
            .Select(c => c.Symbol)
            .ToListAsync();

        foreach (var symbol in symbols)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, symbol.ToUpperInvariant());
        }
    }
}