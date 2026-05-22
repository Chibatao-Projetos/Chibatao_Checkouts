namespace SaidaPessoas.API.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Matricula { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public string Setor { get; set; } = string.Empty;
    public PerfilUsuario Perfil { get; set; }
    public StatusUsuario Status { get; set; } = StatusUsuario.Pendente;
    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public ICollection<SolicitacaoSaida> Solicitacoes { get; set; } = new List<SolicitacaoSaida>();
}
