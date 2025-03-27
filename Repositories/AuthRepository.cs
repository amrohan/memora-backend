using memora_backend.Data;
using memora_backend.Dtos;

namespace memora_backend.Repositories;

public class AuthRepository(BookmarkDbContext dbContext) : IAuthRepository
{
    public Task<AuthResponseDto> RegisterUserAsync(RegisterDto registerDto, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<AuthResponseDto> LoginUserAsync(CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }
}