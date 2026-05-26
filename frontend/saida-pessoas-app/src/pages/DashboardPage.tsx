import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { solicitacaoService, dashboardService } from '../services/api';
import type { ListParams } from '../services/api';
import type { DashboardStats, PerfilUsuario, SolicitacaoResponse } from '../types';
import DataTable from '../components/DataTable/DataTable';
import FilterPanel from '../components/DataTable/FilterPanel';
import ExportButton from '../components/DataTable/ExportButton';

// ---- KPI definitions per role ----
interface KpiDef {
  label: string;
  value: (s: DashboardStats) => number;
  color: string;
}

const KPI_MAP: Record<PerfilUsuario, KpiDef[]> = {
  Admin: [
    { label: 'Usuários Pendentes', value: (s) => s.usuariosPendentes, color: 'border-amber-500' },
    { label: 'Solicitações Hoje', value: (s) => s.hoje, color: 'border-blue-500' },
    { label: 'Aguardando Aprovação', value: (s) => s.aguardandoGestor + s.aguardandoRH, color: 'border-yellow-500' },
    { label: 'Em Trânsito', value: (s) => s.emTransito, color: 'border-orange-500' },
  ],
  Gestor: [
    { label: 'Aguardando Minha Aprovação', value: (s) => s.aguardandoGestor, color: 'border-yellow-500' },
    { label: 'Em Trânsito', value: (s) => s.emTransito, color: 'border-orange-500' },
    { label: 'Extraordinárias', value: (s) => s.extraordinarias, color: 'border-amber-500' },
    { label: 'Reprovadas', value: (s) => s.reprovado, color: 'border-red-500' },
  ],
  RH: [
    { label: 'Aguardando RH', value: (s) => s.aguardandoRH, color: 'border-blue-500' },
    { label: 'Liberadas p/ Portaria', value: (s) => s.liberadoPortaria, color: 'border-green-500' },
    { label: 'Em Trânsito', value: (s) => s.emTransito, color: 'border-orange-500' },
    { label: 'Reprovadas', value: (s) => s.reprovado, color: 'border-red-500' },
  ],
  Portaria: [
    { label: 'Liberadas p/ Saída', value: (s) => s.liberadoPortaria, color: 'border-green-500' },
    { label: 'Em Trânsito', value: (s) => s.emTransito, color: 'border-orange-500' },
    { label: 'Solicitações Hoje', value: (s) => s.hoje, color: 'border-blue-500' },
    { label: 'Concluídas', value: (s) => s.concluido, color: 'border-gray-400' },
  ],
  Solicitante: [
    { label: 'Minhas Solicitações', value: (s) => s.total, color: 'border-blue-500' },
    { label: 'Pendentes', value: (s) => s.aguardandoGestor + s.aguardandoRH, color: 'border-yellow-500' },
    { label: 'Em Trânsito', value: (s) => s.emTransito, color: 'border-orange-500' },
    { label: 'Reprovadas', value: (s) => s.reprovado, color: 'border-red-500' },
  ],
};

// ---- Tab definitions per role ----
type TabId = 'main' | 'extraordinarias' | 'historico';

interface TabDef {
  id: TabId;
  label: string;
  extra: Partial<ListParams>;
}

const getTabConfig = (perfil: PerfilUsuario): TabDef[] => {
  if (perfil === 'Gestor')
    return [
      { id: 'main', label: 'Solicitações', extra: {} },
      { id: 'extraordinarias', label: '⚡ Extraordinárias', extra: { somenteExtraordinarias: true } },
    ];
  if (perfil === 'Portaria')
    return [
      { id: 'main', label: 'Pendentes', extra: {} },
      { id: 'historico', label: 'Histórico', extra: { incluirHistorico: true } },
    ];
  return [{ id: 'main', label: 'Solicitações', extra: {} }];
};

// ---- Role display ----
const ROLE_LABELS: Record<PerfilUsuario, string> = {
  Solicitante: 'Solicitante',
  Gestor: 'Gestor',
  RH: 'Recursos Humanos',
  Portaria: 'Portaria',
  Admin: 'Administrador',
};

const ROLE_BADGE: Record<PerfilUsuario, string> = {
  Solicitante: 'bg-green-100 text-green-800',
  Gestor: 'bg-blue-100 text-blue-800',
  RH: 'bg-purple-100 text-purple-800',
  Portaria: 'bg-orange-100 text-orange-800',
  Admin: 'bg-red-100 text-red-800',
};

interface Filters {
  status: string;
  setor: string;
  tipoSaida: string;
  dataInicio: string;
  dataFim: string;
}

const EMPTY_FILTERS: Filters = {
  status: '',
  setor: '',
  tipoSaida: '',
  dataInicio: '',
  dataFim: '',
};

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const perfil = user!.perfil as PerfilUsuario;
  const tabConfig = useMemo(() => getTabConfig(perfil), [perfil]);

  const [data, setData] = useState<SolicitacaoResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortBy, setSortBy] = useState('dataSolicitacao');
  const [sortDesc, setSortDesc] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeTab, setActiveTab] = useState<TabId>(tabConfig[0].id);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const currentTabDef = useMemo(
    () => tabConfig.find((t) => t.id === activeTab) ?? tabConfig[0],
    [activeTab, tabConfig]
  );
  const isHistorico = activeTab === 'historico';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListParams = {
        page,
        pageSize,
        sortBy,
        sortDesc,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
        ...currentTabDef.extra,
      };
      const { data: result } = await solicitacaoService.listar(params);
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortDesc, filters, currentTabDef]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await dashboardService.getStats();
      setStats(data);
    } catch {
      // stats são opcionais
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleAction = () => {
    fetchData();
    fetchStats();
  };

  const canCreate = perfil === 'Solicitante' || perfil === 'Gestor' || perfil === 'Admin';

  const kpis = KPI_MAP[perfil] ?? [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Sistema de Autorização de Saída</h1>
            <p className="text-xs text-gray-400 mt-0.5">Painel de Controle</p>
          </div>
          <div className="flex items-center gap-4">
            {perfil === 'Admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                ⚙ Gerenciar Usuários
                {stats && stats.usuariosPendentes > 0 && (
                  <span className="ml-1 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {stats.usuariosPendentes}
                  </span>
                )}
              </button>
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.nome}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[perfil]}`}>
                {ROLE_LABELS[perfil]}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-red-600 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className={`bg-white rounded-lg border-l-4 ${kpi.color} px-4 py-3 shadow-sm`}
              >
                <p className="text-2xl font-bold text-gray-800">{kpi.value(stats)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions + Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white shadow text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ExportButton data={data} />
            {canCreate && (
              <button
                onClick={() => navigate('/solicitacoes/pessoas', { state: { abrirNovaSolicitacao: true } })}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Nova Solicitação
              </button>
            )}
          </div>
        </div>

        {/* Filters — hidden for Portaria */}
        {perfil !== 'Portaria' && (
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            onClear={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
          />
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Carregando…
          </div>
        ) : (
          <DataTable
            data={data}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onSortChange={(sb, sd) => { setSortBy(sb); setSortDesc(sd); setPage(1); }}
            perfil={perfil}
            onAction={handleAction}
            nomeVigilante={user?.nome}
            isHistorico={isHistorico}
          />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
