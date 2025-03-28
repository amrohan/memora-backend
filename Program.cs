using memora_backend.Data;
using memora_backend.Endpoints;
using memora_backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateSlimBuilder(args);

//Adding scalar 
builder.Services.AddOpenApi();

// DB Configuration
builder.Services.AddDbContext<BookmarkDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Database")));


builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.MapUserEndpoint();
app.MapAuthEndpoint();
app.Run();