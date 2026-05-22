using Microsoft.EntityFrameworkCore;
using SaidaPessoas.API.Models;

namespace SaidaPessoas.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<SolicitacaoSaida> Solicitacoes { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SolicitacaoSaida>()
            .HasOne(s => s.Solicitante)
            .WithMany(u => u.Solicitacoes)
            .HasForeignKey(s => s.SolicitanteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SolicitacaoSaida>()
            .Property(s => s.Status)
            .HasConversion<string>();

        modelBuilder.Entity<SolicitacaoSaida>()
            .Property(s => s.TipoSaida)
            .HasConversion<string>();

        modelBuilder.Entity<Usuario>()
            .Property(u => u.Perfil)
            .HasConversion<string>();

        modelBuilder.Entity<Usuario>()
            .Property(u => u.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Matricula)
            .IsUnique();
    }
}
