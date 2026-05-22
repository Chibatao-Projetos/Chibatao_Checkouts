using SaidaPessoas.API.Models;

namespace SaidaPessoas.API.DTOs;

public record CriarSolicitacaoDto(
    string Nome,
    string Setor,
    string Destino,
    string? UnidadeDestino,
    string? SetorDestino,
    TipoSaida TipoSaida,
    bool PrevisaoRetorno,
    DateTime? DataPrevistaRetorno,
    string? HorarioPrevistodoRetorno,
    bool IsExtraordinaria
);

public record RegistrarSaidaDto(string NomeVigilante);

public record ReprovarDto(string Motivo);

public record SolicitacaoResponseDto(
    int Id,
    string Nome,
    string Setor,
    string Destino,
    string? UnidadeDestino,
    string? SetorDestino,
    string TipoSaida,
    bool PrevisaoRetorno,
    DateTime? DataPrevistaRetorno,
    string? HorarioPrevistodoRetorno,
    bool IsExtraordinaria,
    DateTime DataSolicitacao,
    string Status,
    string? MotivoReprovacao,
    string? NomeVigilante,
    DateTime? HoraSaida,
    DateTime? HoraRetorno,
    string NomeSolicitante,
    DateTime? DataAprovacaoGestor,
    DateTime? DataAprovacaoRH
);

public record LoginDto(string Email, string Senha);

public record LoginResponseDto(string Token, string Nome, string Perfil, int UserId, string Setor);

public record PagedResultDto<T>(IEnumerable<T> Data, int Total, int Page, int PageSize);
