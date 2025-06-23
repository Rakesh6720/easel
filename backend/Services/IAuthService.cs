using backend.Models;

namespace backend.Services;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(Models.RegisterRequest request);
    Task<AuthResult> LoginAsync(Models.LoginRequest request);
    Task<AuthResult> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeTokenAsync(string refreshToken);
    Task<User?> GetUserByIdAsync(int userId);
    Task<User?> GetUserByEmailAsync(string email);
    string GenerateJwtToken(User user);
    RefreshToken GenerateRefreshToken(string ipAddress);
}

public class AuthResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public User? User { get; set; }
    public string? JwtToken { get; set; }
    public string? RefreshToken { get; set; }
}