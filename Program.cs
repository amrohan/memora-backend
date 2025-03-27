using memora_backend.Data;
using memora_backend.Endpoints;
using memora_backend.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateSlimBuilder(args);


// DB Configuration
builder.Services.AddDbContext<BookmarkDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Database")));


builder.Services.AddScoped<IUserRepository, UserRepository>();

var app = builder.Build();


app.MapGet("/", () => "Home");

app.UseHttpsRedirection();
app.MapUserEndpoint();
app.Run();