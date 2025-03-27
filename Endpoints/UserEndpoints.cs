using memora_backend.Repositories;

namespace memora_backend.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoint(this IEndpointRouteBuilder app)
    {
        var userGroup = app.MapGroup("user");

        userGroup.MapGet("/",
            async (IUserRepository userRepository, CancellationToken cancellationToken) =>
            {
                var data = await userRepository.GetAllUserAsync(cancellationToken);
                return Results.Ok(data);
            });
    }
}