namespace SaidaPessoas.API.Models;

public class SolicitacaoSaida
{
    public int Id { get; set; }

    // --- Preenchidos pelo Solicitante ---
    public string Nome { get; set; } = string.Empty;
    public string Setor { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public string? UnidadeDestino { get; set; }
    public string? SetorDestino { get; set; }
    public TipoSaida TipoSaida { get; set; }
    public bool PrevisaoRetorno { get; set; }
    public DateTime? DataPrevistaRetorno { get; set; }
    public string? HorarioPrevistodoRetorno { get; set; }
    public bool IsExtraordinaria { get; set; }

    // Data planejada da saída (escolhida pelo solicitante: hoje ou outro dia)
    public DateTime DataSaida { get; set; } = DateTime.UtcNow;

    // --- Automáticos / Controle de Sistema ---
    public DateTime DataSolicitacao { get; set; } = DateTime.UtcNow;
    public StatusSolicitacao Status { get; set; } = StatusSolicitacao.AguardandoGestor;
    public string? MotivoReprovacao { get; set; }

    // --- Exclusivos da Portaria ---
    public string? NomeVigilante { get; set; }
    public DateTime? HoraSaida { get; set; }
    public DateTime? HoraRetorno { get; set; }

    // --- Rastreabilidade das aprovações ---
    public int SolicitanteId { get; set; }
    public Usuario Solicitante { get; set; } = null!;

    public int? GestorAprovadorId { get; set; }
    public Usuario? GestorAprovador { get; set; }
    public DateTime? DataAprovacaoGestor { get; set; }

    public int? RHAprovadorId { get; set; }
    public Usuario? RHAprovador { get; set; }
    public DateTime? DataAprovacaoRH { get; set; }
}
