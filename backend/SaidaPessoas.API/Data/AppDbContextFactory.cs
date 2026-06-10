using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SaidaPessoas.API.Data;

/// <summary>
/// Usado apenas em tempo de design pelas ferramentas do EF Core
/// (dotnet ef migrations / database update). Cria o DbContext diretamente,
/// sem executar o Program.cs (evita rodar Migrate()/Seed() ao gerar migrations).
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(config.GetConnectionString("DefaultConnection"))
            .Options;

        return new AppDbContext(options);
    }
}
