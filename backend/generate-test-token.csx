#!/usr/bin/env dotnet-script

#r "nuget: System.IdentityModel.Tokens.Jwt, 7.1.2"

using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

// JWT Configuration - should match appsettings.Development.json
var secretKey = "this-is-a-very-secure-jwt-secret-key-for-development-only-32-characters-minimum";
var issuer = "Easel";
var audience = "EaselUsers";

// Create signing key
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

// Create claims for a test user
var claims = new[]
{
    new Claim(ClaimTypes.NameIdentifier, "1"),
    new Claim(ClaimTypes.Name, "test@example.com"),
    new Claim(ClaimTypes.Email, "test@example.com"),
    new Claim("sub", "1"),
    new Claim("email", "test@example.com"),
    new Claim("userId", "1")
};

// Create token
var token = new JwtSecurityToken(
    issuer: issuer,
    audience: audience,
    claims: claims,
    expires: DateTime.Now.AddHours(1),
    signingCredentials: creds);

var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

Console.WriteLine("Generated JWT Token:");
Console.WriteLine(tokenString);
Console.WriteLine();
Console.WriteLine("Use this token in the Authorization header as:");
Console.WriteLine($"Authorization: Bearer {tokenString}");
