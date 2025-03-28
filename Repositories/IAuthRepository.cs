using memora_backend.Dtos;
using memora_backend.Entities;

namespace memora_backend.Repositories;

public interface IAuthRepository
{
    Task<AuthResponseDto> RegisterUserAsync(RegisterDto registerDto, CancellationToken cancellationToken);
    Task<AuthResponseDto> LoginUserAsync(CancellationToken cancellationToken);
    string GenerateTokenAsync(User user, CancellationToken cancellationToken);
}