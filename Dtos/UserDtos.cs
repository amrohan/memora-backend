using System.ComponentModel.DataAnnotations;

namespace memora_backend.Dtos;

public record RegisterDto
{
    [Required]
    [StringLength(30, MinimumLength = 3)]
    public string UserName { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;

    public string? Name { get; init; }
}

public record LoginDto
{
    [Required]
    public string UserNameOrEmail { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;
}

public record AuthResponseDto
{
    public string Token { get; init; } = string.Empty;
    public DateTime Expiration { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}