using System.Text;
using Prometheus;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Filters;
using CryptoCompete.Api.Hubs;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Resend;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<BlockedUserFilter>();

builder.Services.AddControllers(options =>
{
    options.Filters.Add<BlockedUserFilter>();
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"] 
                    ?? throw new InvalidOperationException("Jwt:Secret is not configured"))),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["access_token"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }

                // SignalR sends token via query string
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? throw new InvalidOperationException("Cors:AllowedOrigins is not configured");
        
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddSignalR();

builder.Services.AddOptions();
builder.Services.AddHttpClient<ResendClient>();
builder.Services.Configure<ResendClientOptions>(o =>
{
    o.ApiToken = builder.Configuration["Resend:ApiKey"]!;
});
builder.Services.AddTransient<IResend, ResendClient>();
builder.Services.AddTransient<IEmailService, EmailService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<ICurrencyService, CurrencyService>();
builder.Services.AddHttpClient<ICryptocurrencyListService, CryptocurrencyListService>();
builder.Services.AddHttpClient<IKlineService, KlineService>();
builder.Services.AddHttpClient<IPayPalService, PayPalService>();
builder.Services.AddHttpClient<ITurnstileService, TurnstileService>();
builder.Services.AddHostedService<CryptocurrencyListBackgroundService>();
builder.Services.AddSingleton<CryptoPriceBackgroundService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<CryptoPriceBackgroundService>());
builder.Services.AddSingleton<ILeaderboardService, LeaderboardService>();
builder.Services.AddHostedService<LeaderboardBackgroundService>();
builder.Services.AddHostedService<SubscriptionExpiryBackgroundService>();
builder.Services.AddHostedService<PriceAlarmBackgroundService>();
builder.Services.AddHostedService<RefreshTokenCleanupBackgroundService>();

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.UseHttpMetrics();

app.MapControllers();
app.MapHub<CryptoPriceHub>("/hubs/prices");
app.MapMetrics();

app.Run();