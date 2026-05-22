namespace SaidaPessoas.API.Models;

public enum StatusSolicitacao
{
    AguardandoGestor = 1,
    AguardandoRH = 2,
    LiberadoPortaria = 3,
    EmTransito = 4,
    Concluido = 5,
    Reprovado = 6
}

public enum TipoSaida
{
    Particular = 1,
    AServico = 2
}

public enum PerfilUsuario
{
    Solicitante = 1,
    Gestor = 2,
    RH = 3,
    Portaria = 4,
    Admin = 5
}

public enum StatusUsuario
{
    Pendente = 1,
    Ativo = 2,
    Inativo = 3
}
