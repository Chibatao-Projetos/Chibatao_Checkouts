using Microsoft.EntityFrameworkCore;
using SaidaPessoas.API.Models;

namespace SaidaPessoas.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<SolicitacaoSaida> Solicitacoes { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Notificacao> Notificacoes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SolicitacaoSaida>()
            .HasOne(s => s.Solicitante)
            .WithMany(u => u.Solicitacoes)
            .HasForeignKey(s => s.SolicitanteId)
            .OnDelete(DeleteBehavior.Restrict);

        // Aprovadores (opcionais, sem coleção inversa)
        modelBuilder.Entity<SolicitacaoSaida>()
            .HasOne(s => s.GestorAprovador)
            .WithMany()
            .HasForeignKey(s => s.GestorAprovadorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SolicitacaoSaida>()
            .HasOne(s => s.RHAprovador)
            .WithMany()
            .HasForeignKey(s => s.RHAprovadorId)
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

        modelBuilder.Entity<Notificacao>()
            .Property(n => n.Tipo)
            .HasConversion<string>();

        modelBuilder.Entity<Notificacao>()
            .HasOne(n => n.Usuario)
            .WithMany()
            .HasForeignKey(n => n.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notificacao>()
            .HasIndex(n => new { n.UsuarioId, n.Lida });
    }
}
