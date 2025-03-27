using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace memora_backend.Entities;

public sealed class User
{
    public enum UserRole
    {
        User,
        Moderator,
        Admin
    }

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(30, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 30 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$",
        ErrorMessage = "Username can only contain letters, numbers, and underscores")]
    public string UserName { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string? Name { get; set; }

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [JsonIgnore]
    [StringLength(255, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters long")]
    public string Password { get; set; } = string.Empty;

    [Required] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    public bool IsActive { get; set; } = true;

    public UserPreference? UserPreference { get; set; }

    public string? ProfileImageUrl { get; set; }

    public UserRole Role { get; set; } = UserRole.User;
}

public sealed class UserPreference
{
    [Key] public int Id { get; set; }

    [Required] public int UserId { get; set; }

    public User? User { get; set; }

    public bool DarkMode { get; set; } = false;

    public string? Language { get; set; } = "en";

    public bool EmailNotificationsEnabled { get; set; } = true;

    public DateTime? LastUpdated { get; set; } = DateTime.UtcNow;
}