using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using backend.Models;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register([FromBody] Models.RegisterRequest request)
    {
        try
        {
            // Validate model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new { message = "Validation failed", errors });
            }

            // Additional custom validation
            var emailValidation = InputValidator.ValidateEmail(request.Email);
            if (!emailValidation.IsValid)
            {
                return BadRequest(new { message = "Email validation failed", errors = emailValidation.Errors });
            }

            var passwordValidation = InputValidator.ValidatePassword(request.Password);
            if (!passwordValidation.IsValid)
            {
                return BadRequest(new { message = "Password validation failed", errors = passwordValidation.Errors });
            }

            // Sanitize inputs
            request.Email = InputValidator.SanitizeString(request.Email.ToLowerInvariant(), 256);
            request.FirstName = InputValidator.SanitizeString(request.FirstName, 50);
            request.LastName = InputValidator.SanitizeString(request.LastName, 50);
            request.Company = string.IsNullOrWhiteSpace(request.Company) ? null : InputValidator.SanitizeString(request.Company, 100);

            var result = await _authService.RegisterAsync(request);

            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            // Set refresh token as HTTP-only cookie
            SetRefreshTokenCookie(result.RefreshToken!);

            _logger.LogInformation("User registered successfully: {Email}", request.Email);

            return Ok(new
            {
                message = "Registration successful",
                user = new
                {
                    id = result.User!.Id,
                    email = result.User.Email,
                    firstName = result.User.FirstName,
                    lastName = result.User.LastName,
                    company = result.User.Company
                },
                token = result.JwtToken
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for email: {Email}", request?.Email ?? "unknown");
            return StatusCode(500, new { message = "Registration failed. Please try again." });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login([FromBody] Models.LoginRequest request)
    {
        try
        {
            // Validate model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new { message = "Validation failed", errors });
            }

            // Additional email validation
            var emailValidation = InputValidator.ValidateEmail(request.Email);
            if (!emailValidation.IsValid)
            {
                return BadRequest(new { message = "Invalid email format" });
            }

            // Sanitize email input
            request.Email = InputValidator.SanitizeString(request.Email.ToLowerInvariant(), 256);

            // Rate limiting check could be added here in production
            
            var result = await _authService.LoginAsync(request);

            if (!result.Success)
            {
                _logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
                return BadRequest(new { message = result.ErrorMessage });
            }

            // Set refresh token as HTTP-only cookie
            SetRefreshTokenCookie(result.RefreshToken!);

            _logger.LogInformation("User logged in successfully: {Email}", request.Email);

            return Ok(new
            {
                message = "Login successful",
                user = new
                {
                    id = result.User!.Id,
                    email = result.User.Email,
                    firstName = result.User.FirstName,
                    lastName = result.User.LastName,
                    company = result.User.Company
                },
                token = result.JwtToken
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", request?.Email ?? "unknown");
            return StatusCode(500, new { message = "Login failed. Please try again." });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult> Refresh()
    {
        try
        {
            var refreshToken = Request.Cookies["refreshToken"];
            
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return BadRequest(new { message = "Refresh token not found" });
            }

            // Validate refresh token format (base64)
            try
            {
                Convert.FromBase64String(refreshToken);
            }
            catch
            {
                return BadRequest(new { message = "Invalid refresh token format" });
            }

            var result = await _authService.RefreshTokenAsync(refreshToken);

            if (!result.Success)
            {
                // Clear invalid refresh token
                Response.Cookies.Delete("refreshToken");
                return BadRequest(new { message = result.ErrorMessage });
            }

            // Set new refresh token as HTTP-only cookie
            SetRefreshTokenCookie(result.RefreshToken!);

            return Ok(new
            {
                message = "Token refreshed successfully",
                user = new
                {
                    id = result.User!.Id,
                    email = result.User.Email,
                    firstName = result.User.FirstName,
                    lastName = result.User.LastName,
                    company = result.User.Company
                },
                token = result.JwtToken
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new { message = "Token refresh failed" });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout()
    {
        try
        {
            var refreshToken = Request.Cookies["refreshToken"];
            
            if (!string.IsNullOrEmpty(refreshToken))
            {
                await _authService.RevokeTokenAsync(refreshToken);
            }

            // Clear refresh token cookie
            Response.Cookies.Delete("refreshToken");

            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            _logger.LogInformation("User logged out: {Email}", userEmail ?? "unknown");

            return Ok(new { message = "Logout successful" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "Logout failed" });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId) || userId <= 0)
            {
                return BadRequest(new { message = "Invalid user ID in token" });
            }

            var user = await _authService.GetUserByIdAsync(userId);
            
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                company = user.Company,
                emailVerified = user.EmailVerified,
                createdAt = user.CreatedAt,
                lastLoginAt = user.LastLoginAt,
                azureCredentials = user.AzureCredentials
                    .Where(c => c.IsActive)
                    .Select(c => new
                    {
                        id = c.Id,
                        subscriptionName = c.SubscriptionName,
                        displayName = c.DisplayName,
                        isDefault = c.IsDefault,
                        lastValidated = c.LastValidated
                    })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "Failed to get user information" });
        }
    }

    [HttpPost("revoke-token")]
    [Authorize]
    public async Task<ActionResult> RevokeToken([FromBody] RevokeTokenRequest request)
    {
        try
        {
            var tokenToRevoke = request.Token ?? Request.Cookies["refreshToken"];
            
            if (string.IsNullOrWhiteSpace(tokenToRevoke))
            {
                return BadRequest(new { message = "Token is required" });
            }

            var success = await _authService.RevokeTokenAsync(tokenToRevoke);
            
            if (!success)
            {
                return BadRequest(new { message = "Invalid or already revoked token" });
            }

            return Ok(new { message = "Token revoked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking token");
            return StatusCode(500, new { message = "Token revocation failed" });
        }
    }

    [HttpPost("validate-email")]
    public ActionResult ValidateEmail([FromBody] ValidateEmailRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            var validation = InputValidator.ValidateEmail(request.Email);
            
            return Ok(new
            {
                isValid = validation.IsValid,
                errors = validation.Errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating email");
            return StatusCode(500, new { message = "Email validation failed" });
        }
    }

    [HttpPost("validate-password")]
    public ActionResult ValidatePassword([FromBody] ValidatePasswordRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Password is required" });
            }

            var validation = InputValidator.ValidatePassword(request.Password);
            
            return Ok(new
            {
                isValid = validation.IsValid,
                errors = validation.Errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating password");
            return StatusCode(500, new { message = "Password validation failed" });
        }
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true, // Prevent XSS attacks
            Secure = Request.IsHttps, // HTTPS only in production
            SameSite = SameSiteMode.Strict, // CSRF protection
            Expires = DateTime.UtcNow.AddDays(30), // Match refresh token expiration
            Path = "/api/auth" // Limit cookie scope
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}

public class RevokeTokenRequest
{
    public string? Token { get; set; }
}

public class ValidateEmailRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ValidatePasswordRequest
{
    public string Password { get; set; } = string.Empty;
}