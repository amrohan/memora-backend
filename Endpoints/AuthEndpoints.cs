using memora_backend.Dtos;
using memora_backend.Entities;
using memora_backend.Repositories;

namespace memora_backend.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoint(this IEndpointRouteBuilder app)
    {
        var authGroup = app.MapGroup("auth");

        authGroup.MapPost("/register",
             (IAuthRepository dbContext,RegisterDto modal, CancellationToken cancellationToken) =>
            {
                User user = new ();
                user.Email = "rohan@gmail.com";
                user.Password = "123456";
                user.UserName = "rohan";
                var token =  dbContext.GenerateTokenAsync(user, cancellationToken);
                return Results.Ok(ApiResponse<string>.Success(token));
            });

        authGroup.MapPost("/login",
            (LoginDto modal, CancellationToken cancellationToken) => { return TypedResults.Ok("Login successful"); });
    }
}