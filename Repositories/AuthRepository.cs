using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using memora_backend.Data;
using memora_backend.Dtos;
using memora_backend.Entities;
using Microsoft.IdentityModel.Tokens;

namespace memora_backend.Repositories;

public class AuthRepository(BookmarkDbContext dbContext,IConfiguration configuration) : IAuthRepository
{
    public Task<AuthResponseDto> RegisterUserAsync(RegisterDto registerDto, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<AuthResponseDto> LoginUserAsync(CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public  string GenerateTokenAsync(User user, CancellationToken cancellationToken)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName),
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.GetValue<string>("Jwt:Secret")!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);
        var tokenDescriptor = new JwtSecurityToken(
            issuer:configuration.GetValue<string>("Jwt:Issuer"),
            audience:configuration.GetValue<string>("Jwt:Audience"),
            claims: claims,
            expires: DateTime.Now.AddDays(1),
            signingCredentials: creds
            );
        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }
}


















