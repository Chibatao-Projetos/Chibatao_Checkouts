using SaidaPessoas.API.Models;

namespace SaidaPessoas.API.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        if (context.Usuarios.Any()) return;

        var usuarios = new[]
        {
            new Usuario
            {
                Nome = "Admin Sistema",
                Matricula = "ADMIN001",
                Email = "admin@empresa.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Setor = "TI",
                Perfil = PerfilUsuario.Admin,
                Status = StatusUsuario.Ativo,
                DataCadastro = DateTime.UtcNow
            },
            new Usuario
            {
                Nome = "João Silva",
                Matricula = "TI001",
                Email = "solicitante@empresa.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Setor = "TI",
                Perfil = PerfilUsuario.Solicitante,
                Status = StatusUsuario.Ativo,
                DataCadastro = DateTime.UtcNow
            },
            new Usuario
            {
                Nome = "Maria Gestora",
                Matricula = "TI002",
                Email = "gestor@empresa.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Setor = "TI",
                Perfil = PerfilUsuario.Gestor,
                Status = StatusUsuario.Ativo,
                DataCadastro = DateTime.UtcNow
            },
            new Usuario
            {
                Nome = "Carlos RH",
                Matricula = "RH001",
                Email = "rh@empresa.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Setor = "RH",
                Perfil = PerfilUsuario.RH,
                Status = StatusUsuario.Ativo,
                DataCadastro = DateTime.UtcNow
            },
            new Usuario
            {
                Nome = "Pedro Portaria",
                Matricula = "SEG001",
                Email = "portaria@empresa.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Setor = "Segurança",
                Perfil = PerfilUsuario.Portaria,
                Status = StatusUsuario.Ativo,
                DataCadastro = DateTime.UtcNow
            },
        };

        context.Usuarios.AddRange(usuarios);
        context.SaveChanges();
    }
}
