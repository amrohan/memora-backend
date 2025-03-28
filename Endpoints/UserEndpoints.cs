using memora_backend.Dtos;
using memora_backend.Entities;
using memora_backend.Repositories;
using StatusCodes = memora_backend.Dtos.StatusCodes;

namespace memora_backend.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoint(this IEndpointRouteBuilder app)
    {
        var userGroup = app.MapGroup("user");

        userGroup.MapGet("/",
            async (IUserRepository userRepository, CancellationToken cancellationToken) =>
            {
                try 
                {
                    var data = await userRepository.GetAllUserAsync(cancellationToken);
                    return Results.Ok(ApiResponse<IEnumerable<User>>.Success(data));
                }
                catch (Exception ex)
                {
                    return Results.BadRequest(
                        ApiResponse<IEnumerable<User>>.Error("Failed to retrieve users", StatusCodes.BadRequest)
                    );
                }
            });
        
        
    }
}