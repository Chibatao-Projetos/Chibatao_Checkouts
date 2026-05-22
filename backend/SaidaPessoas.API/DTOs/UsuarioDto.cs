namespace SaidaPessoas.API.DTOs;

public record RegistroDto(
    string Nome,
    string Matricula,
    string Email,
    string Setor,
    string Senha
);

public record UsuarioResponseDto(
    int Id,
    string Nome,
    string Matricula,
    string Email,
    string Setor,
    string Perfil,
    string Status,
    DateTime DataCadastro
);

public record AlterarPerfilDto(string Perfil);

public record AlterarSenhaAdminDto(string NovaSenha);

public record AlterarSenhaPropriaDto(string SenhaAtual, string NovaSenha);
