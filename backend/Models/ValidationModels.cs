using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace backend.Models;

public class RegisterRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [StringLength(256, ErrorMessage = "Email cannot exceed 256 characters")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 128 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]",
        ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "First name is required")]
    [StringLength(50, MinimumLength = 1, ErrorMessage = "First name must be between 1 and 50 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]+$", ErrorMessage = "First name can only contain letters, spaces, hyphens, and apostrophes")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(50, MinimumLength = 1, ErrorMessage = "Last name must be between 1 and 50 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]+$", ErrorMessage = "Last name can only contain letters, spaces, hyphens, and apostrophes")]
    public string LastName { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Company name cannot exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z0-9\s\-&.,()]+$", ErrorMessage = "Company name contains invalid characters")]
    public string? Company { get; set; }
}

public class LoginRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(128, MinimumLength = 1, ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;
}

public class AddAzureCredentialsRequest
{
    [Required(ErrorMessage = "Subscription ID is required")]
    [RegularExpression(@"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
        ErrorMessage = "Subscription ID must be a valid GUID")]
    public string SubscriptionId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tenant ID is required")]
    [RegularExpression(@"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
        ErrorMessage = "Tenant ID must be a valid GUID")]
    public string TenantId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Client ID is required")]
    [RegularExpression(@"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
        ErrorMessage = "Client ID must be a valid GUID")]
    public string ClientId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Client Secret is required")]
    [StringLength(512, MinimumLength = 1, ErrorMessage = "Client Secret is required")]
    public string ClientSecret { get; set; } = string.Empty;

    [Required(ErrorMessage = "Display name is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Display name must be between 1 and 100 characters")]
    [RegularExpression(@"^[a-zA-Z0-9\s\-_()]+$", ErrorMessage = "Display name contains invalid characters")]
    public string DisplayName { get; set; } = string.Empty;
}

public class CreateProjectRequest
{
    [Required(ErrorMessage = "Project name is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Project name must be between 1 and 100 characters")]
    [RegularExpression(@"^[a-zA-Z0-9\s\-_()]+$", ErrorMessage = "Project name contains invalid characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "User requirements are required")]
    [StringLength(5000, MinimumLength = 10, ErrorMessage = "Requirements must be between 10 and 5000 characters")]
    public string UserRequirements { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Azure credential ID must be a positive number")]
    public int? AzureCredentialId { get; set; }
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
}

public static class InputValidator
{
    public static ValidationResult ValidateEmail(string email)
    {
        var result = new ValidationResult { IsValid = true };

        if (string.IsNullOrWhiteSpace(email))
        {
            result.IsValid = false;
            result.Errors.Add("Email is required");
            return result;
        }

        email = email.Trim();

        // Check length
        if (email.Length > 256)
        {
            result.IsValid = false;
            result.Errors.Add("Email cannot exceed 256 characters");
        }

        // Check format with more robust regex
        var emailRegex = new Regex(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
        if (!emailRegex.IsMatch(email))
        {
            result.IsValid = false;
            result.Errors.Add("Please enter a valid email address");
        }

        // Check for common suspicious patterns
        if (email.Contains("..") || email.StartsWith(".") || email.EndsWith("."))
        {
            result.IsValid = false;
            result.Errors.Add("Email format is invalid");
        }

        return result;
    }

    public static ValidationResult ValidatePassword(string password)
    {
        var result = new ValidationResult { IsValid = true };

        if (string.IsNullOrWhiteSpace(password))
        {
            result.IsValid = false;
            result.Errors.Add("Password is required");
            return result;
        }

        // Length check
        if (password.Length < 8)
        {
            result.IsValid = false;
            result.Errors.Add("Password must be at least 8 characters long");
        }

        if (password.Length > 128)
        {
            result.IsValid = false;
            result.Errors.Add("Password cannot exceed 128 characters");
        }

        // Complexity checks
        if (!password.Any(char.IsLower))
        {
            result.IsValid = false;
            result.Errors.Add("Password must contain at least one lowercase letter");
        }

        if (!password.Any(char.IsUpper))
        {
            result.IsValid = false;
            result.Errors.Add("Password must contain at least one uppercase letter");
        }

        if (!password.Any(char.IsDigit))
        {
            result.IsValid = false;
            result.Errors.Add("Password must contain at least one number");
        }

        if (!password.Any(c => "@$!%*?&".Contains(c)))
        {
            result.IsValid = false;
            result.Errors.Add("Password must contain at least one special character (@$!%*?&)");
        }

        // Check for common weak passwords
        var commonPasswords = new[] { "password", "12345678", "qwertyui", "password123" };
        if (commonPasswords.Any(p => password.ToLower().Contains(p)))
        {
            result.IsValid = false;
            result.Errors.Add("Password is too common. Please choose a stronger password");
        }

        return result;
    }

    public static string SanitizeString(string input, int maxLength = 0)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Remove dangerous characters that could be used for injection
        input = input.Trim();
        input = input.Replace("<", "&lt;").Replace(">", "&gt;");
        input = input.Replace("'", "&#39;").Replace("\"", "&quot;");
        
        // Remove null bytes and control characters
        input = Regex.Replace(input, @"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "");

        if (maxLength > 0 && input.Length > maxLength)
        {
            input = input.Substring(0, maxLength);
        }

        return input;
    }

    public static bool IsValidGuid(string guid)
    {
        return Guid.TryParse(guid, out _);
    }

    public static ValidationResult ValidateAzureCredentials(AddAzureCredentialsRequest request)
    {
        var result = new ValidationResult { IsValid = true };

        if (!IsValidGuid(request.SubscriptionId))
        {
            result.IsValid = false;
            result.Errors.Add("Subscription ID must be a valid GUID");
        }

        if (!IsValidGuid(request.TenantId))
        {
            result.IsValid = false;
            result.Errors.Add("Tenant ID must be a valid GUID");
        }

        if (!IsValidGuid(request.ClientId))
        {
            result.IsValid = false;
            result.Errors.Add("Client ID must be a valid GUID");
        }

        if (string.IsNullOrWhiteSpace(request.ClientSecret))
        {
            result.IsValid = false;
            result.Errors.Add("Client Secret is required");
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            result.IsValid = false;
            result.Errors.Add("Display name is required");
        }

        return result;
    }
}