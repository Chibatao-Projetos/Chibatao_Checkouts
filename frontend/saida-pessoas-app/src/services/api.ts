import axios from 'axios';
import type {
  AuthUser,
  ColaboradorSimples,
  CriarSolicitacaoDto,
  DashboardStats,
  Notificacao,
  PagedResult,
  RegistroDto,
  SolicitacaoResponse,
  UsuarioResponse,
} from '../types';

// Mesmo formato de /usuarios/me e /admin/usuarios — reaproveitado para revalidar sessão.
export type MeResponse = UsuarioResponse;

// Via nginx (porta 80/443): usa caminho relativo /api, que o nginx proxia para o backend.
// Acesso direto ao servidor (qualquer outra porta): aponta direto para a porta 8003.
const isNginx = !window.location.port || window.location.port === '80' || window.location.port === '443';
const apiBase = isNginx ? '/api' : `http://${window.location.hostname}:5000/api`;
const api = axios.create({ baseURL: apiBase });

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth');
  if (raw) {
    const { token } = JSON.parse(raw) as AuthUser;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Não redireciona quando o 401 vem do próprio login/registro:
    // nesses casos a tela trata o erro (ex.: "aguardando aprovação").
    const url: string = err.config?.url ?? '';
    const isRotaAuth = url.includes('/auth/login') || url.includes('/auth/registro');
    if (err.response?.status === 401 && !isRotaAuth) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export interface ListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  setor?: string;
  tipoSaida?: string;
  dataInicio?: string;
  dataFim?: string;
  sortBy?: string;
  sortDesc?: boolean;
  incluirHistorico?: boolean;
  somenteExtraordinarias?: boolean;
  minhas?: boolean;
  nome?: string;
  destino?: string;
}

export const authService = {
  login: (identificacao: string, senha: string) =>
    api.post<AuthUser>('/auth/login', { identificacao, senha }),

  registro: (dto: RegistroDto) =>
    api.post<{ message: string }>('/auth/registro', dto),
};

export const solicitacaoService = {
  listar: (params: ListParams) =>
    api.get<PagedResult<SolicitacaoResponse>>('/solicitacoes', { params }),

  obterPorId: (id: number) =>
    api.get<SolicitacaoResponse>(`/solicitacoes/${id}`),

  criar: (dto: CriarSolicitacaoDto) =>
    api.post<SolicitacaoResponse>('/solicitacoes', dto),

  excluir: (id: number) =>
    api.delete<{ message: string }>(`/solicitacoes/${id}`),

  aprovarGestor: (id: number) =>
    api.put(`/solicitacoes/${id}/aprovar-gestor`),

  reprovarGestor: (id: number, motivo: string) =>
    api.put(`/solicitacoes/${id}/reprovar-gestor`, { motivo }),

  aprovarRH: (id: number) =>
    api.put(`/solicitacoes/${id}/aprovar-rh`),

  /** Exceção Máxima: gestor libera direto para a portaria (bypass do RH, com assunção de risco). */
  aprovarGestorExcecao: (id: number, motivo?: string) =>
    api.put(`/solicitacoes/${id}/aprovar-gestor-excecao`, { motivo }),

  /** Validação post-facto do RH sobre saída liberada por Exceção Máxima. */
  validarBypass: (id: number) =>
    api.put(`/solicitacoes/${id}/validar-bypass`),

  reprovarRH: (id: number, motivo: string) =>
    api.put(`/solicitacoes/${id}/reprovar-rh`, { motivo }),

  registrarSaida: (id: number, nomeVigilante: string) =>
    api.put(`/solicitacoes/${id}/registrar-saida`, { nomeVigilante }),

  registrarRetorno: (id: number) =>
    api.put(`/solicitacoes/${id}/registrar-retorno`),
};

export const dashboardService = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
};

export const notificacaoService = {
  listar: (limit = 20) =>
    api.get<Notificacao[]>('/notificacoes', { params: { limit } }),
  contarNaoLidas: () =>
    api.get<{ count: number }>('/notificacoes/nao-lidas'),
  marcarLida: (id: number) =>
    api.put(`/notificacoes/${id}/lida`),
  marcarTodasLidas: () =>
    api.put('/notificacoes/marcar-todas-lidas'),
};

export const usuariosService = {
  getMe: () => api.get<MeResponse>('/usuarios/me'),
  listarColaboradores: () =>
    api.get<ColaboradorSimples[]>('/usuarios/colaboradores'),
  alterarSenha: (senhaAtual: string, novaSenha: string) =>
    api.put('/usuarios/me/senha', { senhaAtual, novaSenha }),
};

export interface AdminListParams {
  status?: string;
  id?: string;
  nome?: string;
  busca?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export const adminService = {
  listarUsuarios: (params?: AdminListParams) =>
    api.get<UsuarioResponse[]>('/admin/usuarios', { params }),

  obterUsuario: (id: number) =>
    api.get<UsuarioResponse>(`/admin/usuarios/${id}`),

  aprovarUsuario: (id: number) =>
    api.put(`/admin/usuarios/${id}/aprovar`),

  rejeitarUsuario: (id: number) =>
    api.put(`/admin/usuarios/${id}/rejeitar`),

  alterarPerfil: (id: number, perfil: string) =>
    api.put(`/admin/usuarios/${id}/perfil`, { perfil }),

  alterarSetor: (id: number, setor: string, unidade: string) =>
    api.put(`/admin/usuarios/${id}/setor`, { setor, unidade }),

  alterarSenha: (id: number, novaSenha: string) =>
    api.put(`/admin/usuarios/${id}/senha`, { novaSenha }),

  bloquearUsuario: (id: number) =>
    api.put(`/admin/usuarios/${id}/bloquear`),

  excluirUsuario: (id: number) =>
    api.delete(`/admin/usuarios/${id}`),
};

export default api;
