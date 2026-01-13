using System.Security.Claims;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/portfolios")]
[Authorize]
public class PortfolioController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrencyService _currencyService;

    public PortfolioController(AppDbContext db, ICurrencyService currencyService)
    {
        _db = db;
        _currencyService = currencyService;
    }

    [HttpGet("{profilePublicId}")]
    public async Task<IActionResult> GetPortfolio(Guid profilePublicId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized();
        }

        var profile = await _db.Profiles
            .Include(p => p.Holdings)
                .ThenInclude(h => h.Cryptocurrency)
            .FirstOrDefaultAsync(p => p.PublicId == profilePublicId && p.UserId == userId);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found" });
        }

        var displayCurrency = user.DisplayCurrency;
        var exchangeRate = await _currencyService.GetExchangeRateAsync("EUR", displayCurrency);
        var convertedBalance = profile.Balance * exchangeRate;

        var holdings = profile.Holdings
            .Where(h => h.Amount > 0)
            .Select(h => new HoldingDto(
                h.Cryptocurrency.Symbol,
                h.Cryptocurrency.Name,
                h.Amount,
                h.UpdatedAt
            ))
            .ToList();

        return Ok(new PortfolioResponse(
            profile.PublicId,
            profile.Username,
            convertedBalance,
            displayCurrency,
            holdings
        ));
    }
}

public record HoldingDto(string Symbol, string Name, decimal Amount, DateTimeOffset UpdatedAt);
public record PortfolioResponse(Guid ProfilePublicId, string Username, decimal Balance, string Currency, List<HoldingDto> Holdings);