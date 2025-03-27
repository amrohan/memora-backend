using memora_backend.Data;
using memora_backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace memora_backend.Repositories;

public sealed class UserRepository(BookmarkDbContext dbContext) : IUserRepository
{
    public async Task AddAsync(User user, CancellationToken cancellationToken)
    {
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<User>> GetAllUserAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Users.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken)
    {
        dbContext.Users.Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(User user, CancellationToken cancellationToken)
    {
        dbContext.Users.Remove(user);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        return await dbContext.Users.FirstOrDefaultAsync(x => x.UserName == username, cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        return await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
    }

    public Task<UserPreference?> GetUserPreferenceAsync(int id, CancellationToken cancellationToken)
    {
        return dbContext.UserPreferences.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }
}