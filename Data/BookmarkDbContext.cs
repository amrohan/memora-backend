using memora_backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace memora_backend.Data;

public sealed class BookmarkDbContext(DbContextOptions<BookmarkDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<UserPreference> UserPreferences { get; set; }
}