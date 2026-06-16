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
}

export class ReprovarDto {
  motivo!: string;
}

export class RegistrarSaidaDto {
  nomeVigilante!: string;
}
