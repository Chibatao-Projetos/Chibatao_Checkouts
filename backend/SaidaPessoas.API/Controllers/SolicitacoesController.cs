using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using SaidaPessoas.API.Data;
using SaidaPessoas.API.DTOs;
using SaidaPessoas.API.Models;

namespace SaidaPessoas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SolicitacoesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly SaidaPessoas.API.Services.NotificacaoService _notificacao;

    public SolicitacoesController(AppDbContext context, SaidaPessoas.API.Services.NotificacaoService notificacao)
    {
        _context = context;
        _notificacao = notificacao;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)!.Value;
    private string GetUserSetor() => User.FindFirst("Setor")!.Value;

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] string? setor = null,
        [FromQuery] string? tipoSaida = null,
        [FromQuery] DateTime? dataInicio = null,
        [FromQuery] DateTime? dataFim = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDesc = false,
        [FromQuery] bool incluirHistorico = false,
        [FromQuery] bool somenteExtraordinarias = false,
        [FromQuery] bool minhas = false,
        [FromQuery] string? nome = null,
        [FromQuery] string? destino = null)
    {
        var role = GetUserRole();
        var userId = GetUserId();
        var userSetor = GetUserSetor();

        var query = _context.Solicitacoes
            .Include(s => s.Solicitante)
            .Include(s => s.GestorAprovador)
            .Include(s => s.RHAprovador)
            .AsQueryable();

        // minhas=true → mostra apenas as próprias solicitações, independente do perfil
        if (minhas)
        {
            query = query.Where(s => s.SolicitanteId == userId);
        }
        else
        // Escopo por perfil
        query = role switch
        {
            "Solicitante" => query.Where(s => s.SolicitanteId == userId),
            "Gestor" => query.Where(s => s.Setor.ToUpper() == userSetor.ToUpper()),
            "Portaria" => incluirHistorico
                ? query.Where(s => s.Status == StatusSolicitacao.Concluido)
                : query.Where(s =>
                    s.Status == StatusSolicitacao.LiberadoPortaria ||
                    s.Status == StatusSolicitacao.EmTransito),
            _ => query // Admin e RH veem tudo
        };

        // Filtro de extraordinárias (Gestor)

        if (somenteExtraordinarias)
            query = query.Where(s => s.IsExtraordinaria);

        // Filtros dinâmicos
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<StatusSolicitacao>(status, out var statusEnum))
            query = query.Where(s => s.Status == statusEnum);

        if (!string.IsNullOrEmpty(setor))
            query = query.Where(s => s.Setor.Contains(setor));

        if (!string.IsNullOrEmpty(tipoSaida) && Enum.TryParse<TipoSaida>(tipoSaida, out var tipoEnum))
            query = query.Where(s => s.TipoSaida == tipoEnum);

        if (dataInicio.HasValue)
            query = query.Where(s => s.DataSolicitacao >= dataInicio.Value);

        if (dataFim.HasValue)
            query = query.Where(s => s.DataSolicitacao <= dataFim.Value);

        if (!string.IsNullOrEmpty(nome))
            query = query.Where(s => s.Nome.Contains(nome));

        if (!string.IsNullOrEmpty(destino))
            query = query.Where(s =>
                s.Destino.Contains(destino) ||
                (s.UnidadeDestino != null && s.UnidadeDestino.Contains(destino)) ||
                (s.SetorDestino != null && s.SetorDestino.Contains(destino)));

        // Ordenação
        query = sortBy switch
        {
            "nome" => sortDesc ? query.OrderByDescending(s => s.Nome) : query.OrderBy(s => s.Nome),
            "setor" => sortDesc ? query.OrderByDescending(s => s.Setor) : query.OrderBy(s => s.Setor),
            "status" => sortDesc ? query.OrderByDescending(s => s.Status) : query.OrderBy(s => s.Status),
            _ => sortDesc
                ? query.OrderByDescending(s => s.DataSolicitacao)
                : query.OrderBy(s => s.DataSolicitacao)
        };

        var total = await query.CountAsync();
        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return Ok(new PagedResultDto<SolicitacaoResponseDto>(data, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var s = await _context.Solicitacoes
            .Include(x => x.Solicitante)
            .Include(x => x.GestorAprovador)
            .Include(x => x.RHAprovador)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (s == null) return NotFound();
        return Ok(MapToDto(s));
    }

    // RH não pode criar — apenas Solicitante e Gestor
    [HttpPost]
    [Authorize(Roles = "Solicitante,Gestor,Admin")]
    public async Task<IActionResult> Criar([FromBody] CriarSolicitacaoDto dto)
    {
        // Solicitação extraordinária pula a etapa do Gestor
        var initialStatus = dto.IsExtraordinaria
            ? StatusSolicitacao.AguardandoRH
            : StatusSolicitacao.AguardandoGestor;

        var solicitacao = new SolicitacaoSaida
        {
            Nome = dto.Nome,
            Setor = dto.Setor,
            Destino = dto.Destino,
            UnidadeDestino = dto.UnidadeDestino,
            SetorDestino = dto.SetorDestino,
            TipoSaida = dto.TipoSaida,
            PrevisaoRetorno = dto.PrevisaoRetorno,
            DataPrevistaRetorno = dto.DataPrevistaRetorno,
            HorarioPrevistodoRetorno = dto.HorarioPrevistodoRetorno,
            IsExtraordinaria = dto.IsExtraordinaria,
            DataSaida = dto.DataSaida,
            DataSolicitacao = DateTime.UtcNow,
            Status = initialStatus,
            SolicitanteId = GetUserId()
        };

        _context.Solicitacoes.Add(solicitacao);
        await _context.SaveChangesAsync();

        await _notificacao.NotificarNovaSolicitacao(solicitacao);

        var created = await _context.Solicitacoes
            .Include(s => s.Solicitante)
            .FirstAsync(s => s.Id == solicitacao.Id);

        return CreatedAtAction(nameof(ObterPorId), new { id = solicitacao.Id }, MapToDto(created));
    }

    // Solicitante (dono) ou Admin pode excluir, somente enquanto pendente e sem nenhuma aprovação.
    [HttpDelete("{id}")]
    [Authorize(Roles = "Solicitante,Gestor,Admin")]
    public async Task<IActionResult> ExcluirSolicitacao(int id)
    {
        var s = await _context.Solicitacoes.FindAsync(id);
        if (s == null) return NotFound();

        var role = GetUserRole();
        if (role != "Admin" && s.SolicitanteId != GetUserId())
            return Forbid();

        var pendenteSemAprovacao =
            (s.Status == StatusSolicitacao.AguardandoGestor || s.Status == StatusSolicitacao.AguardandoRH)
            && s.GestorAprovadorId == null
            && s.RHAprovadorId == null;

        if (!pendenteSemAprovacao)
            return BadRequest(new { message = "Só é possível excluir solicitações que ainda não foram aprovadas." });

        _context.Solicitacoes.Remove(s);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Solicitação excluída com sucesso." });
    }

    [HttpPut("{id}/aprovar-gestor")]
    [Authorize(Roles = "Gestor,Admin")]
    public async Task<IActionResult> AprovarGestor(int id)
    {
        var s = await _context.Solicitacoes.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status != StatusSolicitacao.AguardandoGestor)
            return BadRequest(new { message = "Solicitação não está aguardando aprovação do Gestor." });

        s.Status = StatusSolicitacao.AguardandoRH;
        s.GestorAprovadorId = GetUserId();
        s.DataAprovacaoGestor = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _notificacao.NotificarAprovacaoGestor(s);
        return Ok(new { message = "Aprovado pelo Gestor." });
    }

    [HttpPut("{id}/reprovar-gestor")]
    [Authorize(Roles = "Gestor,Admin")]
    public async Task<IActionResult> ReprovarGestor(int id, [FromBody] ReprovarDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Motivo))
            return BadRequest(new { message = "O motivo da reprovação é obrigatório." });

        var s = await _context.Solicitacoes.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status != StatusSolicitacao.AguardandoGestor)
            return BadRequest(new { message = "Solicitação não está aguardando aprovação do Gestor." });

        s.Status = StatusSolicitacao.Reprovado;
        s.MotivoReprovacao = dto.Motivo;
        s.GestorAprovadorId = GetUserId();
        s.DataAprovacaoGestor = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _notificacao.NotificarReprovacao(s, "gestor", dto.Motivo);
        return Ok(new { message = "Solicitação reprovada pelo Gestor." });
    }

    [HttpPut("{id}/aprovar-rh")]
    [Authorize(Roles = "RH,Admin")]
    public async Task<IActionResult> AprovarRH(int id)
    {
        var s = await _context.Solicitacoes.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status != StatusSolicitacao.AguardandoRH)
            return BadRequest(new { message = "Solicitação não está aguardando aprovação do RH." });

        s.Status = StatusSolicitacao.LiberadoPortaria;
        s.RHAprovadorId = GetUserId();
        s.DataAprovacaoRH = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _notificacao.NotificarAprovacaoRH(s);
        return Ok(new { message = "Aprovado pelo RH." });
    }

    [HttpPut("{id}/reprovar-rh")]
    [Authorize(Roles = "RH,Admin")]
    public async Task<IActionResult> ReprovarRH(int id, [FromBody] ReprovarDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Motivo))
            return BadRequest(new { message = "O motivo da reprovação é obrigatório." });

        var s = await _context.Solicitacoes.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status != StatusSolicitacao.AguardandoRH)
            return BadRequest(new { message = "Solicitação não está aguardando aprovação do RH." });

        s.Status = StatusSolicitacao.Reprovado;
        s.MotivoReprovacao = dto.Motivo;
        s.RHAprovadorId = GetUserId();
        s.DataAprovacaoRH = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _notificacao.NotificarReprovacao(s, "RH", dto.Motivo);
        return Ok(new { message = "Solicitação reprovada pelo RH." });
    }

    [HttpPut("{id}/registrar-saida")]
    [Authorize(Roles = "Portaria,Admin")]
    public async Task<IActionResult> RegistrarSaida(int id, [FromBody] RegistrarSaidaDto dto)
    {
        var s = await _context.Solicitacoes.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status != StatusSolicitacao.LiberadoPortaria)
            return BadRequest(new { message = "Solicitação não está liberada para saída." });

        s.NomeVigilante = dto.NomeVigilante;
        s.HoraSaida = DateTime.UtcNow;
        s.Status = s.PrevisaoRetorno
            ? StatusSolicitacao.EmTransito
            : StatusSolicitacao.Concluido;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Saída registrada.", status = s.Status.ToString() });
    }

    [HttpPut("{id}/registrar-retorno")]
    [Authorize(Roles = "Portaria,Admin")]
    public async Task<IActionResult> RegistrarRetorno(int id)
    {
        var s = await _context.Solicitacoes.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status != StatusSolicitacao.EmTransito)
            return BadRequest(new { message = "Solicitação não está em trânsito." });

        s.HoraRetorno = DateTime.UtcNow;
        s.Status = StatusSolicitacao.Concluido;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Retorno registrado." });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string format = "csv",
        [FromQuery] string? status = null,
        [FromQuery] string? setor = null,
        [FromQuery] DateTime? dataInicio = null,
        [FromQuery] DateTime? dataFim = null)
    {
        var query = _context.Solicitacoes
            .Include(s => s.Solicitante)
            .Include(s => s.GestorAprovador)
            .Include(s => s.RHAprovador)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<StatusSolicitacao>(status, out var statusEnum))
            query = query.Where(s => s.Status == statusEnum);
        if (!string.IsNullOrEmpty(setor))
            query = query.Where(s => s.Setor.Contains(setor));
        if (dataInicio.HasValue) query = query.Where(s => s.DataSolicitacao >= dataInicio.Value);
        if (dataFim.HasValue) query = query.Where(s => s.DataSolicitacao <= dataFim.Value);

        var data = await query.Select(s => MapToDto(s)).ToListAsync();

        if (format.ToLower() == "json")
            return Ok(data);

        var sb = new StringBuilder();
        sb.AppendLine("Id,Nome,Setor,Destino,UnidadeDestino,SetorDestino,TipoSaida,PrevisaoRetorno,DataPrevistaRetorno,HorarioPrevisto,IsExtraordinaria,DataSolicitacao,Status,MotivoReprovacao,NomeVigilante,HoraSaida,HoraRetorno");
        foreach (var item in data)
        {
            sb.AppendLine(
                $"{item.Id},\"{item.Nome}\",\"{item.Setor}\",\"{item.Destino}\"," +
                $"\"{item.UnidadeDestino}\",\"{item.SetorDestino}\"," +
                $"{item.TipoSaida},{item.PrevisaoRetorno}," +
                $"{item.DataPrevistaRetorno:yyyy-MM-dd},{item.HorarioPrevistodoRetorno}," +
                $"{item.IsExtraordinaria}," +
                $"{item.DataSolicitacao:yyyy-MM-dd HH:mm},{item.Status}," +
                $"\"{item.MotivoReprovacao}\",\"{item.NomeVigilante}\"," +
                $"{item.HoraSaida:yyyy-MM-dd HH:mm},{item.HoraRetorno:yyyy-MM-dd HH:mm}"
            );
        }

        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", "solicitacoes.csv");
    }

    private static SolicitacaoResponseDto MapToDto(SolicitacaoSaida s) => new(
        s.Id,
        s.Nome,
        s.Setor,
        s.Destino,
        s.UnidadeDestino,
        s.SetorDestino,
        s.TipoSaida.ToString(),
        s.PrevisaoRetorno,
        s.DataPrevistaRetorno,
        s.HorarioPrevistodoRetorno,
        s.IsExtraordinaria,
        s.DataSaida,
        s.DataSolicitacao,
        s.Status.ToString(),
        s.MotivoReprovacao,
        s.NomeVigilante,
        s.HoraSaida,
        s.HoraRetorno,
        s.Solicitante?.Nome ?? string.Empty,
        s.DataAprovacaoGestor,
        s.GestorAprovador?.Nome,
        s.DataAprovacaoRH,
        s.RHAprovador?.Nome
    );
}
