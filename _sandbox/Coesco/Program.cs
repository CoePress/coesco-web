using Coesco;
using Coesco.Services;
using Coesco.Utils.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text; // Add this for StringBuilder
using System.Threading.Tasks;
using Coesco.Models.Domain;
using Coesco.Models.Queries;
using Coesco.Utils.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<Database>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<SyncService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<Database>();
        dbContext.Database.EnsureCreated();

        string directoryPath = "C:\\Users\\jar\\Desktop\\sample";
        string csvFilePath = Path.Combine(directoryPath, "customers.csv"); // Replace with your CSV file name
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating database schema: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();