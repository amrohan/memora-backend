using memora_backend.Dtos;

namespace memora_backend.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoint(this IEndpointRouteBuilder app)
    {
        var authGroup = app.MapGroup("auth");

        authGroup.MapPost("/register",
            (RegisterDto modal, CancellationToken cancellationToken) =>
            {
                return TypedResults.Ok("Registered Successfully");
            });

        authGroup.MapPost("/login",
            (LoginDto modal, CancellationToken cancellationToken) => { return TypedResults.Ok("Login successful"); });
    }
}