namespace SaidaPessoas.API.Models;

public class Notificacao
{
    public int Id { get; set; }

    // Destinatário
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public string Mensagem { get; set; } = string.Empty;
    public TipoNotificacao Tipo { get; set; }
    public bool Lida { get; set; }
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    // Solicitação relacionada (opcional)
    public int? SolicitacaoId { get; set; }
}
