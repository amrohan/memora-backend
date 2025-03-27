using memora_backend.Dtos;

namespace memora_backend.Repositories;

public interface IAuthRepository
{
    Task<AuthResponseDto> RegisterUserAsync(RegisterDto registerDto, CancellationToken cancellationToken);
    Task<AuthResponseDto> LoginUserAsync(CancellationToken cancellationToken);
}