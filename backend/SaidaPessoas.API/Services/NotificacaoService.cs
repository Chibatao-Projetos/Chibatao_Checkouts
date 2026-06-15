using Microsoft.EntityFrameworkCore;
using SaidaPessoas.API.Data;
using SaidaPessoas.API.Models;

namespace SaidaPessoas.API.Services;

/// <summary>
/// Ponto único de criação de notificações internas.
/// Extensão futura (2ª etapa): enviar e-mail dentro de <see cref="Adicionar"/>
/// para avisos importantes / usuário offline.
/// </summary>
public class NotificacaoService
{
    private readonly AppDbContext _context;

    public NotificacaoService(AppDbContext context) => _context = context;

    private void Adicionar(int usuarioId, string mensagem, TipoNotificacao tipo, int? solicitacaoId)
    {
        _context.Notificacoes.Add(new Notificacao
        {
            UsuarioId = usuarioId,
            Mensagem = mensagem,
            Tipo = tipo,
            SolicitacaoId = solicitacaoId,
            DataCriacao = DateTime.UtcNow,
            Lida = false,
        });
        // TODO (etapa e-mail): disparar e-mail para o destinatário aqui.
    }

    private Task<List<int>> AdminIds() => _context.Usuarios
        .Where(u => u.Perfil == PerfilUsuario.Admin && u.Status == StatusUsuario.Ativo)
        .Select(u => u.Id).ToListAsync();

    private Task<List<int>> RhIds() => _context.Usuarios
        .Where(u => u.Perfil == PerfilUsuario.RH && u.Status == StatusUsuario.Ativo)
        .Select(u => u.Id).ToListAsync();

    // Correspondência de setor sem diferenciar maiúsculas/minúsculas.
    private Task<List<int>> GestoresDoSetor(string setor) => _context.Usuarios
        .Where(u => u.Perfil == PerfilUsuario.Gestor && u.Status == StatusUsuario.Ativo
                    && u.Setor.ToUpper() == setor.ToUpper())
        .Select(u => u.Id).ToListAsync();

    /// Nova solicitação → notifica gestores do setor (ou RH, se extraordinária) + todos os admins.
    public async Task NotificarNovaSolicitacao(SolicitacaoSaida s)
    {
        var dest = new HashSet<int>(await AdminIds());
        var aprovadores = s.IsExtraordinaria ? await RhIds() : await GestoresDoSetor(s.Setor);
        aprovadores.ForEach(id => dest.Add(id));
        dest.Remove(s.SolicitanteId); // não notifica quem criou

        var msg = $"Nova solicitação de {s.Nome} aguardando aprovação.";
        foreach (var id in dest)
            Adicionar(id, msg, TipoNotificacao.NovaSolicitacao, s.Id);

        await _context.SaveChangesAsync();
    }

    /// Gestor aprovou → notifica RH + admins (próxima fila) e o solicitante.
    public async Task NotificarAprovacaoGestor(SolicitacaoSaida s)
    {
        var dest = new HashSet<int>(await AdminIds());
        (await RhIds()).ForEach(id => dest.Add(id));
        dest.Remove(s.SolicitanteId);
        foreach (var id in dest)
            Adicionar(id, $"Solicitação de {s.Nome} aguardando aprovação do RH.", TipoNotificacao.NovaSolicitacao, s.Id);

        Adicionar(s.SolicitanteId, "Sua solicitação foi aprovada pelo gestor.", TipoNotificacao.AprovacaoGestor, s.Id);
        await _context.SaveChangesAsync();
    }

    /// RH aprovou → notifica o solicitante.
    public async Task NotificarAprovacaoRH(SolicitacaoSaida s)
    {
        Adicionar(s.SolicitanteId, "Sua solicitação foi aprovada pelo RH e liberada para a portaria.", TipoNotificacao.AprovacaoRH, s.Id);
        await _context.SaveChangesAsync();
    }

    /// Reprovação (gestor ou RH) → notifica o solicitante.
    public async Task NotificarReprovacao(SolicitacaoSaida s, string etapa, string motivo)
    {
        Adicionar(s.SolicitanteId, $"Sua solicitação foi reprovada pelo {etapa}. Motivo: {motivo}", TipoNotificacao.Reprovacao, s.Id);
        await _context.SaveChangesAsync();
    }
}
