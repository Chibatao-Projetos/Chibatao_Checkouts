import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { solicitacaoService } from '../services/api';
import type { ListParams } from '../services/api';
import type { SolicitacaoResponse } from '../types';
import DataTable from '../components/DataTable/DataTable';
import FilterPanel from '../components/DataTable/FilterPanel';
import ExportButton from '../components/DataTable/ExportButton';

const EMPTY = {
  nome: '', status: '', setor: '', tipoSaida: '', destino: '', dataInicio: '', dataFim: '',
};

const AcessosRHPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData]     = useState<SolicitacaoResponse[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [sortBy, setSortBy] = useState('dataSolicitacao');
  const [sortDesc, setSortDesc] = useState(true);
  const [filters, setFilters] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    [filters]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListParams = { page, pageSize, sortBy, sortDesc, ...activeFilters };
      const { data: r } = await solicitacaoService.listar(params);
      setData(r.data); setTotal(r.total);
    } catch { /* silently */ }
    finally { setLoading(false); }
  }, [page, pageSize, sortBy, sortDesc, activeFilters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-end">
        <ExportButton data={data} />
      </div>

      <FilterPanel
        filters={filters}
        onChange={(k, v) => { setFilters((p) => ({ ...p, [k]: v })); setPage(1); }}
        onClear={() => { setFilters(EMPTY); setPage(1); }}
        showNome
        showSetor
        showDestino
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando…</div>
      ) : (
        <DataTable
          data={data} total={total} page={page} pageSize={pageSize}
          onPageChange={setPage}
          onSortChange={(sb, sd) => { setSortBy(sb); setSortDesc(sd); setPage(1); }}
          perfil="RH" onAction={fetchData} nomeVigilante={user?.nome}
        />
      )}
    </div>
  );
};

export default AcessosRHPage;
