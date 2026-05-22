using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SaidaPessoas.API.Data;
using SaidaPessoas.API.DTOs;
using SaidaPessoas.API.Models;

namespace SaidaPessoas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context) => _context = context;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)!.Value;
    private string GetUserSetor() => User.FindFirst("Setor")!.Value;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var role = GetUserRole();
        var userId = GetUserId();
        var userSetor = GetUserSetor();

        var query = _context.Solicitacoes.AsQueryable();

        query = role switch
        {
            "Solicitante" => query.Where(s => s.SolicitanteId == userId),
            "Gestor" => query.Where(s => s.Setor == userSetor),
            _ => query
        };

        var today = DateTime.UtcNow.Date;

        var stats = new DashboardStatsDto(
            Total: await query.CountAsync(),
            AguardandoGestor: await query.CountAsync(s => s.Status == StatusSolicitacao.AguardandoGestor),
            AguardandoRH: await query.CountAsync(s => s.Status == StatusSolicitacao.AguardandoRH),
            LiberadoPortaria: await query.CountAsync(s => s.Status == StatusSolicitacao.LiberadoPortaria),
            EmTransito: await query.CountAsync(s => s.Status == StatusSolicitacao.EmTransito),
            Concluido: await query.CountAsync(s => s.Status == StatusSolicitacao.Concluido),
            Reprovado: await query.CountAsync(s => s.Status == StatusSolicitacao.Reprovado),
            Extraordinarias: await query.CountAsync(s => s.IsExtraordinaria),
            Hoje: await query.CountAsync(s => s.DataSolicitacao >= today),
            UsuariosPendentes: role == "Admin"
                ? await _context.Usuarios.CountAsync(u => u.Status == StatusUsuario.Pendente)
                : 0
        );

        return Ok(stats);
    }
}
