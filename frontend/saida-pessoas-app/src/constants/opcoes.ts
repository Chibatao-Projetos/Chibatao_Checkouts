/** Setores de usuário disponíveis no cadastro e na administração. */
export const SETORES_USUARIO = ['TIC', 'DEPOTS'] as const;

/** Unidades do sistema e seus setores internos (usado no destino de saídas a serviço). */
export const UNIDADES_SETORES: Record<string, string[]> = {
  ALFANDEGADO: [
    'DIRETORIA', 'COMERCIAL', 'AVERBAÇÃO', 'CONTROLADORIA', 'FATURAMENTO',
    'SGQ', 'FALTAS E AVARIAS', 'FROTA', 'PATIO', 'PIER', 'PCO', 'AMBIENTAL',
    'LOGISTICA', 'GATES', 'TI', 'ARMAZEM', 'ENTREPOSTO', 'MANUTENÇÃO DE PESADOS',
    'NAVEGAÇÃO', 'MAPA', 'RH', 'GRC', 'BOLSÃO', 'PORTARIA 3', 'PORTARIA 2',
    'SESMT', 'AMBULATÓRIO',
    'PORTARIA 1', 'PORTARIA 4', 'PORTARIA 5', 'PORTARIA 6', 'PORTARIA RIO NEGRO',
    'SCANNER', 'SUPRIMENTOS',
  ],
  ATR: [
    'RECEPÇÃO', 'GESTÃO', 'PCO', 'TERMINAL', 'BALANÇA', 'FROTA', 'GATE',
    'MANUTENÇÃO', 'SESMT', 'RH', 'FATURAMENTO', 'ARMAZÉM', 'DESEMBARQUE',
    'PÁTIO CAJUÍ', 'PÁTIO 1', 'PÁTIO MARAPATÁ',
  ],
  TOMIASI: [
    'RECEPÇÃO', 'GERÊNCIA', 'REMOÇÃO', 'COMERCIAL', 'GATE', 'OFICINA DE AUTOS',
    'ABASTECIMENTO', 'TI INFORMÁTICA', 'RH BASE', 'SESMT/AMBULATÓRIO',
    'PÁTIO OGT', 'PÁTIO DELIMA',
  ],
  RETROPORTO: [
    'PRESIDENCIA', 'DIRETORIA FINANCEIRA', 'AMBIENTAL', 'DOCUMENTAÇÃO PORTUÁRIA',
    'AREA FINANCEIRA', 'COBRANÇA', 'CONTAS A RECEBER/CAIXA', 'CONTABILIDADE',
    'CONTAS A PAGAR', 'CONTROLADORIA', 'FATURAMENTO', 'CONTABILIDADE RETROPORTO',
    'JURIDICO TRABALHISTA', 'RH', 'RECEPÇÃO PRESIDENCIAL', 'COMERCIAL', 'FISCAL',
    'TI RETROPORTO', 'SUPRIMENTOS - COMPRAS', 'ARMAZEM', 'JURIDICO CIVIL',
    'CSC/DAL', 'GRC', 'SESMT', 'AMBULATORIO', 'RECEPÇÃO RETROPORTO', 'TELEFONIA',
    'GESTÃO DE COMPETENCIA', 'COPA DIRETORIA', 'SUPORTE TOTVS/AUDITORIA',
  ],
  // TODO: preencher os setores internos da unidade JF.
  JF: [],
};

/** Nomes das unidades do sistema (chaves de UNIDADES_SETORES). */
export const UNIDADES = Object.keys(UNIDADES_SETORES);

/**
 * Unidades de destino que, mesmo em solicitações "À Serviço", continuam exigindo
 * validação do RH (todas as demais unidades dispensam o RH — só o Gestor aprova).
 * Mantida em espelho com backend-node/src/common/opcoes.ts.
 */
export const UNIDADES_COM_RH_OBRIGATORIO = ['JF'];
