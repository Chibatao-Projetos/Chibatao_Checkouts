namespace SaidaPessoas.API.DTOs;

public record NotificacaoDto(
    int Id,
    string Mensagem,
    string Tipo,
    bool Lida,
    DateTime DataCriacao,
    int? SolicitacaoId
);
