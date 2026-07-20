/** Setores de usuário disponíveis no cadastro e na administração. */
export const SETORES_USUARIO = ['TIC', 'DEPOTS'];

/** Unidades do sistema (mesma lista usada no destino das saídas a serviço). */
export const UNIDADES = ['ALFANDEGADO', 'ATR', 'TOMIASI', 'RETROPORTO', 'JF'];

/**
 * Unidades de destino que, mesmo em solicitações "À Serviço", continuam exigindo
 * validação do RH (todas as demais unidades dispensam o RH — só o Gestor aprova).
 */
export const UNIDADES_COM_RH_OBRIGATORIO = ['JF'];
