using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace backend.Services;

public class AuthService : IAuthService
{
    private readonly EaselDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        EaselDbContext context, 
        IConfiguration configuration, 
        ILogger<AuthService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "A user with this email already exists"
                };
            }

            // Create new user
            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Company = request.Company,
                EmailVerified = false // In production, implement email verification
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate tokens
            var jwtToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken(GetIpAddress());
            
            refreshToken.UserId = user.Id;
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return new AuthResult
            {
                Success = true,
                User = user,
                JwtToken = jwtToken,
                RefreshToken = refreshToken.Token
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration");
            return new AuthResult
            {
                Success = false,
                ErrorMessage = "Registration failed. Please try again."
            };
        }
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Invalid email or password"
                };
            }

            if (!user.IsActive)
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Account is deactivated. Please contact support."
                };
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            
            // Generate tokens
            var jwtToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken(GetIpAddress());
            
            refreshToken.UserId = user.Id;
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return new AuthResult
            {
                Success = true,
                User = user,
                JwtToken = jwtToken,
                RefreshToken = refreshToken.Token
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user login");
            return new AuthResult
            {
                Success = false,
                ErrorMessage = "Login failed. Please try again."
            };
        }
    }

    public async Task<AuthResult> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            var token = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (token == null || !token.IsActive)
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Invalid or expired refresh token"
                };
            }

            // Revoke old token and create new one
            token.IsRevoked = true;
            
            var newRefreshToken = GenerateRefreshToken(GetIpAddress());
            newRefreshToken.UserId = token.UserId;
            _context.RefreshTokens.Add(newRefreshToken);

            await _context.SaveChangesAsync();

            var jwtToken = GenerateJwtToken(token.User);

            return new AuthResult
            {
                Success = true,
                User = token.User,
                JwtToken = jwtToken,
                RefreshToken = newRefreshToken.Token
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return new AuthResult
            {
                Success = false,
                ErrorMessage = "Token refresh failed"
            };
        }
    }

    public async Task<bool> RevokeTokenAsync(string refreshToken)
    {
        try
        {
            var token = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
            
            if (token == null || !token.IsActive)
                return false;

            token.IsRevoked = true;
            await _context.SaveChangesAsync();
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking refresh token");
            return false;
        }
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users
            .Include(u => u.AzureCredentials)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .Include(u => u.AzureCredentials)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public string GenerateJwtToken(User user)
    {
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured"));
        var tokenHandler = new JwtSecurityTokenHandler();
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("userId", user.Id.ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(1), // Short-lived JWT
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public RefreshToken GenerateRefreshToken(string ipAddress)
    {
        using var rng = RandomNumberGenerator.Create();
        var randomBytes = new byte[64];
        rng.GetBytes(randomBytes);
        
        return new RefreshToken
        {
            Token = Convert.ToBase64String(randomBytes),
            ExpiresAt = DateTime.UtcNow.AddDays(30), // Long-lived refresh token
            CreatedByIp = ipAddress
        };
    }

    private string GetIpAddress()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            _logger.LogWarning("HttpContext is null when getting IP address");
            return "unknown";
        }

        // Check for IP behind proxy/load balancer
        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            // X-Forwarded-For can contain multiple IPs, take the first one (original client)
            var firstIp = forwardedFor.Split(',')[0].Trim();
            if (IsValidIpAddress(firstIp))
            {
                return firstIp;
            }
        }

        // Check for Real IP header (used by some proxies)
        var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp) && IsValidIpAddress(realIp))
        {
            return realIp;
        }

        // Check for Cloudflare connecting IP
        var cfConnectingIp = httpContext.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(cfConnectingIp) && IsValidIpAddress(cfConnectingIp))
        {
            return cfConnectingIp;
        }

        // Fall back to direct connection IP
        var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString();
        if (!string.IsNullOrEmpty(remoteIp))
        {
            // Handle IPv6 loopback and map it to IPv4
            if (remoteIp == "::1")
                return "127.0.0.1";
            
            // Handle IPv4-mapped IPv6 addresses
            if (remoteIp.StartsWith("::ffff:"))
                return remoteIp.Substring(7);
            
            return remoteIp;
        }

        _logger.LogWarning("Unable to determine client IP address");
        return "unknown";
    }

    private static bool IsValidIpAddress(string ipAddress)
    {
        return System.Net.IPAddress.TryParse(ipAddress, out _);
    }
}