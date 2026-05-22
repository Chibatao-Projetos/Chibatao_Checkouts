import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { solicitacaoService } from '../services/api';
import type { ListParams } from '../services/api';
import type { SolicitacaoResponse } from '../types';
import DataTable from '../components/DataTable/DataTable';
import FilterPanel from '../components/DataTable/FilterPanel';
import ExportButton from '../components/DataTable/ExportButton';

type TabId = 'pendentes' | 'extraordinarias';

const EMPTY = {
  nome: '', status: '', tipoSaida: '', destino: '', dataInicio: '', dataFim: '',
};

const AcessosGestorPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab]       = useState<TabId>('pendentes');
  const [data, setData]     = useState<SolicitacaoResponse[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [sortBy, setSortBy] = useState('dataSolicitacao');
  const [sortDesc, setSortDesc] = useState(true);
  const [filters, setFilters] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const extra: Partial<ListParams> = useMemo(
    () => (tab === 'extraordinarias' ? { somenteExtraordinarias: true } : {}),
    [tab]
  );

  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    [filters]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListParams = { page, pageSize, sortBy, sortDesc, ...activeFilters, ...extra };
      const { data: r } = await solicitacaoService.listar(params);
      setData(r.data); setTotal(r.total);
    } catch { /* silently */ }
    finally { setLoading(false); }
  }, [page, pageSize, sortBy, sortDesc, activeFilters, extra]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (t: TabId) => { setTab(t); setPage(1); setFilters(EMPTY); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-end">
        <ExportButton data={data} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit">
        {([['pendentes', 'Aprovações Pendentes'], ['extraordinarias', '⚡ Extraordinárias']] as const).map(([id, label]) => (
          <button key={id} onClick={() => handleTabChange(id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <FilterPanel
        filters={filters}
        onChange={(k, v) => { setFilters((p) => ({ ...p, [k]: v })); setPage(1); }}
        onClear={() => { setFilters(EMPTY); setPage(1); }}
        showNome
        showDestino
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando…</div>
      ) : (
        <DataTable
          data={data} total={total} page={page} pageSize={pageSize}
          onPageChange={setPage}
          onSortChange={(sb, sd) => { setSortBy(sb); setSortDesc(sd); setPage(1); }}
          perfil="Gestor" onAction={fetchData} nomeVigilante={user?.nome}
        />
      )}
    </div>
  );
};

export default AcessosGestorPage;
