export class CriarSolicitacaoDto {
  nome!: string;
  setor!: string;
  destino!: string;
  unidadeDestino?: string;
  setorDestino?: string;
  tipoSaida!: string;
  previsaoRetorno!: boolean;
  dataPrevistaRetorno?: string;
  horarioPrevistodoRetorno?: string;
  isExtraordinaria!: boolean;
  dataSaida!: string;
  /** Saída por terceiros: Id do colaborador que efetivamente vai sair (opcional). */
  colaboradorId?: number;
}

export class ReprovarDto {
  motivo!: string;
}

export class AprovarExcecaoDto {
  /** Justificativa da assunção de risco (opcional, recomendada para auditoria). */
  motivo?: string;
}

export class RegistrarSaidaDto {
  nomeVigilante!: string;
}
