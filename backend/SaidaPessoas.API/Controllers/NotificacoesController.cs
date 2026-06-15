using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SaidaPessoas.API.Data;
using SaidaPessoas.API.DTOs;

namespace SaidaPessoas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificacoesController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificacoesController(AppDbContext context) => _context = context;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int limit = 20)
    {
        var userId = GetUserId();
        var lista = await _context.Notificacoes
            .Where(n => n.UsuarioId == userId)
            .OrderByDescending(n => n.DataCriacao)
            .Take(limit)
            .Select(n => new NotificacaoDto(
                n.Id, n.Mensagem, n.Tipo.ToString(), n.Lida, n.DataCriacao, n.SolicitacaoId))
            .ToListAsync();
        return Ok(lista);
    }

    [HttpGet("nao-lidas")]
    public async Task<IActionResult> ContarNaoLidas()
    {
        var userId = GetUserId();
        var count = await _context.Notificacoes.CountAsync(n => n.UsuarioId == userId && !n.Lida);
        return Ok(new { count });
    }

    [HttpPut("{id}/lida")]
    public async Task<IActionResult> MarcarLida(int id)
    {
        var userId = GetUserId();
        var n = await _context.Notificacoes.FirstOrDefaultAsync(x => x.Id == id && x.UsuarioId == userId);
        if (n == null) return NotFound();
        n.Lida = true;
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("marcar-todas-lidas")]
    public async Task<IActionResult> MarcarTodasLidas()
    {
        var userId = GetUserId();
        var naoLidas = await _context.Notificacoes
            .Where(n => n.UsuarioId == userId && !n.Lida)
            .ToListAsync();
        foreach (var n in naoLidas) n.Lida = true;
        await _context.SaveChangesAsync();
        return Ok(new { atualizadas = naoLidas.Count });
    }
}
