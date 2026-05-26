import axios from 'axios';
import type {
  AuthUser,
  CriarSolicitacaoDto,
  DashboardStats,
  PagedResult,
  RegistroDto,
  SolicitacaoResponse,
  UsuarioResponse,
} from '../types';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

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
    if (err.response?.status === 401) {
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

  aprovarGestor: (id: number) =>
    api.put(`/solicitacoes/${id}/aprovar-gestor`),

  reprovarGestor: (id: number, motivo: string) =>
    api.put(`/solicitacoes/${id}/reprovar-gestor`, { motivo }),

  aprovarRH: (id: number) =>
    api.put(`/solicitacoes/${id}/aprovar-rh`),

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

export const usuariosService = {
  getMe: () => api.get('/usuarios/me'),
  alterarSenha: (senhaAtual: string, novaSenha: string) =>
    api.put('/usuarios/me/senha', { senhaAtual, novaSenha }),
};

export const adminService = {
  listarUsuarios: (status?: string) =>
    api.get<UsuarioResponse[]>('/admin/usuarios', { params: status ? { status } : {} }),

  aprovarUsuario: (id: number) =>
    api.put(`/admin/usuarios/${id}/aprovar`),

  rejeitarUsuario: (id: number) =>
    api.put(`/admin/usuarios/${id}/rejeitar`),

  alterarPerfil: (id: number, perfil: string) =>
    api.put(`/admin/usuarios/${id}/perfil`, { perfil }),

  alterarSenha: (id: number, novaSenha: string) =>
    api.put(`/admin/usuarios/${id}/senha`, { novaSenha }),

  bloquearUsuario: (id: number) =>
    api.put(`/admin/usuarios/${id}/bloquear`),

  excluirUsuario: (id: number) =>
    api.delete(`/admin/usuarios/${id}`),
};

export default api;
