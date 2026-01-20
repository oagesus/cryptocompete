using Microsoft.AspNetCore.SignalR;

namespace CryptoCompete.Api.Hubs;

public class CryptoPriceHub : Hub
{
    public async Task SubscribeToSymbol(string symbol)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, symbol.ToUpperInvariant());
    }
}