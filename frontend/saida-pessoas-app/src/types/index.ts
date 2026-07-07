export type StatusSolicitacao =
  | 'AguardandoGestor'
  | 'AguardandoRH'
  | 'LiberadoPortaria'
  | 'EmTransito'
  | 'Concluido'
  | 'Reprovado';

export type TipoSaida = 'Particular' | 'AServico';

export type PerfilUsuario = 'Solicitante' | 'Gestor' | 'RH' | 'Portaria' | 'Admin';

export type StatusUsuario = 'Pendente' | 'Ativo' | 'Inativo';

export interface SolicitacaoResponse {
  id: number;
  nome: string;
  setor: string;
  destino: string;
  unidadeDestino?: string;
  setorDestino?: string;
  tipoSaida: TipoSaida;
  previsaoRetorno: boolean;
  dataPrevistaRetorno?: string;
  horarioPrevistodoRetorno?: string;
  isExtraordinaria: boolean;
  dataSaida: string;
  dataSolicitacao: string;
  status: StatusSolicitacao;
  motivoReprovacao?: string;
  nomeVigilante?: string;
  horaSaida?: string;
  horaRetorno?: string;
  nomeSolicitante: string;
  colaboradorId?: number;
  nomeColaborador?: string;
  isBypassRH: boolean;
  bypassMotivo?: string;
  dataAprovacaoGestor?: string;
  nomeAprovadorGestor?: string;
  dataAprovacaoRH?: string;
  nomeAprovadorRH?: string;
}

export interface ColaboradorSimples {
  id: number;
  nome: string;
  setor: string;
  matricula: string;
}

export interface CriarSolicitacaoDto {
  nome: string;
  setor: string;
  destino: string;
  unidadeDestino?: string;
  setorDestino?: string;
  tipoSaida: TipoSaida;
  previsaoRetorno: boolean;
  dataPrevistaRetorno?: string;
  horarioPrevistodoRetorno?: string;
  isExtraordinaria: boolean;
  dataSaida: string;
  colaboradorId?: number;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthUser {
  token: string;
  nome: string;
  perfil: PerfilUsuario;
  userId: number;
  setor: string;
}

export interface DashboardStats {
  total: number;
  aguardandoGestor: number;
  aguardandoRH: number;
  liberadoPortaria: number;
  emTransito: number;
  concluido: number;
  reprovado: number;
  extraordinarias: number;
  hoje: number;
  usuariosPendentes: number;
}

export interface UsuarioResponse {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  setor: string;
  unidade?: string;
  perfil: string;
  status: StatusUsuario;
  dataCadastro: string;
}

export interface RegistroDto {
  nome: string;
  matricula: string;
  email: string;
  setor: string;
  unidade: string;
  senha: string;
}

export interface Notificacao {
  id: number;
  mensagem: string;
  tipo: string;
  lida: boolean;
  dataCriacao: string;
  solicitacaoId?: number;
}
