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
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context) => _context = context;

    private int GetAdminId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("usuarios")]
    public async Task<IActionResult> ListarUsuarios([FromQuery] string? status = null)
    {
        var query = _context.Usuarios.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<StatusUsuario>(status, out var statusEnum))
            query = query.Where(u => u.Status == statusEnum);

        var usuarios = await query
            .OrderBy(u => u.Status)
            .ThenBy(u => u.Nome)
            .Select(u => new UsuarioResponseDto(
                u.Id, u.Nome, u.Matricula, u.Email, u.Setor,
                u.Perfil.ToString(), u.Status.ToString(), u.DataCadastro))
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPut("usuarios/{id}/aprovar")]
    public async Task<IActionResult> AprovarUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();

        usuario.Status = StatusUsuario.Ativo;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Usuário aprovado e liberado para acesso." });
    }

    [HttpPut("usuarios/{id}/rejeitar")]
    public async Task<IActionResult> RejeitarUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();

        usuario.Status = StatusUsuario.Inativo;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Usuário rejeitado." });
    }

    [HttpPut("usuarios/{id}/bloquear")]
    public async Task<IActionResult> BloquearUsuario(int id)
    {
        if (id == GetAdminId())
            return BadRequest(new { message = "Você não pode bloquear sua própria conta." });

        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();
        if (usuario.Status == StatusUsuario.Inativo)
            return BadRequest(new { message = "Usuário já está bloqueado." });

        usuario.Status = StatusUsuario.Inativo;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Usuário bloqueado com sucesso." });
    }

    [HttpDelete("usuarios/{id}")]
    public async Task<IActionResult> ExcluirUsuario(int id)
    {
        if (id == GetAdminId())
            return BadRequest(new { message = "Você não pode excluir sua própria conta." });

        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();

        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Usuário excluído permanentemente." });
    }

    [HttpPut("usuarios/{id}/perfil")]
    public async Task<IActionResult> AlterarPerfil(int id, [FromBody] AlterarPerfilDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();

        if (!Enum.TryParse<PerfilUsuario>(dto.Perfil, out var perfil))
            return BadRequest(new { message = "Perfil inválido." });

        usuario.Perfil = perfil;
        await _context.SaveChangesAsync();
        return Ok(new { message = $"Perfil alterado para {dto.Perfil}." });
    }

    [HttpPut("usuarios/{id}/senha")]
    public async Task<IActionResult> AlterarSenha(int id, [FromBody] AlterarSenhaAdminDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NovaSenha) || dto.NovaSenha.Length < 6)
            return BadRequest(new { message = "A senha deve ter no mínimo 6 caracteres." });

        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Senha alterada com sucesso." });
    }
}
