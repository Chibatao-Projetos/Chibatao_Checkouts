using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SaidaPessoas.API.Data;
using SaidaPessoas.API.DTOs;
using SaidaPessoas.API.Models;

namespace SaidaPessoas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
            return Unauthorized(new { message = "Credenciais inválidas." });

        if (usuario.Status == StatusUsuario.Pendente)
            return Unauthorized(new { message = "Sua conta está pendente de aprovação pelo administrador." });

        if (usuario.Status == StatusUsuario.Inativo)
            return Unauthorized(new { message = "Sua conta foi desativada. Contate o administrador." });

        var token = GerarToken(usuario);

        return Ok(new LoginResponseDto(
            token,
            usuario.Nome,
            usuario.Perfil.ToString(),
            usuario.Id,
            usuario.Setor
        ));
    }

    [HttpPost("registro")]
    public async Task<IActionResult> Registro([FromBody] RegistroDto dto)
    {
        if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
            return Conflict(new { message = "E-mail já cadastrado." });

        if (await _context.Usuarios.AnyAsync(u => u.Matricula == dto.Matricula))
            return Conflict(new { message = "Matrícula já cadastrada." });

        var usuario = new Usuario
        {
            Nome = dto.Nome,
            Matricula = dto.Matricula,
            Email = dto.Email,
            Setor = dto.Setor,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
            Perfil = PerfilUsuario.Solicitante,
            Status = StatusUsuario.Pendente,
            DataCadastro = DateTime.UtcNow
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cadastro realizado com sucesso. Aguarde a aprovação do administrador para acessar o sistema." });
    }

    private string GerarToken(Usuario usuario)
    {
        var key = _config["Jwt:Key"] ?? "SaidaPessoas_SuperSecretKey_MinLength32Chars!!";
        var issuer = _config["Jwt:Issuer"] ?? "SaidaPessoasAPI";
        var audience = _config["Jwt:Audience"] ?? "SaidaPessoasClient";

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Perfil.ToString()),
            new Claim("Setor", usuario.Setor),
        };

        var secKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(secKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
