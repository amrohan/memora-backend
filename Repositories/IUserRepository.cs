using memora_backend.Entities;

namespace memora_backend.Repositories;

public interface IUserRepository
{
    Task AddAsync(User user, CancellationToken cancellationToken);
    Task<List<User>> GetAllUserAsync(CancellationToken cancellationToken);
    Task UpdateAsync(User user, CancellationToken cancellationToken);
    Task DeleteAsync(User user, CancellationToken cancellationToken);
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken);
    Task<UserPreference?> GetUserPreferenceAsync(int id, CancellationToken cancellationToken);
}