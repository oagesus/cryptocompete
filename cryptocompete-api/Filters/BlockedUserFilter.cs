using System.Security.Claims;
using CryptoCompete.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CryptoCompete.Api.Filters;

public class BlockedUserFilter : IAsyncActionFilter
{
    private readonly AppDbContext _db;

    public BlockedUserFilter(AppDbContext db)
    {
        _db = db;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? context.HttpContext.User.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
        {
            var user = await _db.Users.FindAsync(userId);

            if (user?.IsBlocked == true)
            {
                DeleteTokenCookies(context.HttpContext.Response);
                context.Result = new UnauthorizedObjectResult(new { message = "Your account has been blocked" });
                return;
            }
        }

        await next();
    }

    private void DeleteTokenCookies(HttpResponse response)
    {
        response.Cookies.Delete("access_token", new CookieOptions { Path = "/" });
        response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/" });
        response.Cookies.Delete("token_exp", new CookieOptions { Path = "/" });
    }
}