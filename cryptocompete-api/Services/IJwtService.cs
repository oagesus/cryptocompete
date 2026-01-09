using CryptoCompete.Api.Models;

namespace CryptoCompete.Api.Services;

public interface IJwtService
{
    string GenerateAccessToken(User user, IEnumerable<Role> roles);
    (string token, string tokenHash) GenerateRefreshToken();
    bool ValidateAccessToken(string token);
}