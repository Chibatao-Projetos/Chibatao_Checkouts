import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/api';
import type { DashboardStats, PerfilUsuario } from '../types';

interface KpiDef { label: string; value: (s: DashboardStats) => number; border: string; }

const KPI_MAP: Record<PerfilUsuario, KpiDef[]> = {
  Admin: [
    { label: 'Usuários Pendentes',    value: (s) => s.usuariosPendentes,           border: 'border-amber-500' },
    { label: 'Solicitações Hoje',     value: (s) => s.hoje,                         border: 'border-blue-500'  },
    { label: 'Aguardando Aprovação',  value: (s) => s.aguardandoGestor + s.aguardandoRH, border: 'border-yellow-500' },
    { label: 'Em Trânsito',           value: (s) => s.emTransito,                   border: 'border-orange-500'},
  ],
  Gestor: [
    { label: 'Aguardando Minha Aprovação', value: (s) => s.aguardandoGestor, border: 'border-yellow-500' },
    { label: 'Em Trânsito (Setor)',        value: (s) => s.emTransito,       border: 'border-orange-500' },
    { label: 'Extraordinárias',            value: (s) => s.extraordinarias,  border: 'border-amber-500'  },
    { label: 'Reprovadas',                 value: (s) => s.reprovado,        border: 'border-red-500'    },
  ],
  RH: [
    { label: 'Aguardando RH',         value: (s) => s.aguardandoRH,        border: 'border-blue-500'  },
    { label: 'Liberadas p/ Portaria', value: (s) => s.liberadoPortaria,    border: 'border-green-500' },
    { label: 'Em Trânsito',           value: (s) => s.emTransito,          border: 'border-orange-500'},
    { label: 'Reprovadas',            value: (s) => s.reprovado,           border: 'border-red-500'   },
  ],
  Portaria: [
    { label: 'Liberadas p/ Saída', value: (s) => s.liberadoPortaria, border: 'border-green-500' },
    { label: 'Em Trânsito',        value: (s) => s.emTransito,       border: 'border-orange-500'},
    { label: 'Solicitações Hoje',  value: (s) => s.hoje,             border: 'border-blue-500'  },
    { label: 'Concluídas',         value: (s) => s.concluido,        border: 'border-gray-400'  },
  ],
  Solicitante: [
    { label: 'Minhas Solicitações', value: (s) => s.total,                         border: 'border-blue-500'  },
    { label: 'Pendentes',           value: (s) => s.aguardandoGestor + s.aguardandoRH, border: 'border-yellow-500' },
    { label: 'Em Trânsito',         value: (s) => s.emTransito,                    border: 'border-orange-500'},
    { label: 'Reprovadas',          value: (s) => s.reprovado,                     border: 'border-red-500'   },
  ],
};

const InicioPage: React.FC = () => {
  const { user } = useAuth();
  const perfil = user!.perfil as PerfilUsuario;
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    dashboardService.getStats().then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const kpis = useMemo(() => KPI_MAP[perfil] ?? [], [perfil]);

  return (
    <div className="p-6 space-y-6">

      {/* KPI Cards */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`bg-white rounded-xl border-l-4 ${kpi.border} px-5 py-4 shadow-sm`}
            >
              <p className="text-3xl font-bold text-gray-800">{kpi.value(stats)}</p>
              <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border-l-4 border-gray-200 px-5 py-4 shadow-sm animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-28" />
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Acesso Rápido
        </h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/solicitacoes/pessoas"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
            Minhas Solicitações
          </a>
          {['Solicitante', 'Gestor', 'Admin'].includes(perfil) && (
            <a href="/nova-solicitacao"
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
              + Nova Solicitação
            </a>
          )}
          {perfil === 'Gestor' && (
            <a href="/acessos/gestor"
              className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium">
              Aprovações Pendentes
            </a>
          )}
          {perfil === 'RH' && (
            <a href="/acessos/rh"
              className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium">
              Aprovações RH
            </a>
          )}
          {perfil === 'Portaria' && (
            <a href="/acessos/portaria"
              className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium">
              Controle de Portaria
            </a>
          )}
          {perfil === 'Admin' && (
            <a href="/admin"
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium">
              Gerenciar Usuários
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default InicioPage;
