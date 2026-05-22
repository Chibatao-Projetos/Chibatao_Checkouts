namespace SaidaPessoas.API.DTOs;

public record DashboardStatsDto(
    int Total,
    int AguardandoGestor,
    int AguardandoRH,
    int LiberadoPortaria,
    int EmTransito,
    int Concluido,
    int Reprovado,
    int Extraordinarias,
    int Hoje,
    int UsuariosPendentes
);
