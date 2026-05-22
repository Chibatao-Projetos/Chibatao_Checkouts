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
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsuariosController(AppDbContext context) => _context = context;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var usuario = await _context.Usuarios.FindAsync(GetUserId());
        if (usuario == null) return NotFound();

        return Ok(new UsuarioResponseDto(
            usuario.Id, usuario.Nome, usuario.Matricula, usuario.Email,
            usuario.Setor, usuario.Perfil.ToString(), usuario.Status.ToString(),
            usuario.DataCadastro
        ));
    }

    [HttpPut("me/senha")]
    public async Task<IActionResult> AlterarMinhaSenha([FromBody] AlterarSenhaPropriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NovaSenha) || dto.NovaSenha.Length < 6)
            return BadRequest(new { message = "A nova senha deve ter no mínimo 6 caracteres." });

        var usuario = await _context.Usuarios.FindAsync(GetUserId());
        if (usuario == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.SenhaAtual, usuario.SenhaHash))
            return BadRequest(new { message = "Senha atual incorreta." });

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Senha alterada com sucesso." });
    }
}
