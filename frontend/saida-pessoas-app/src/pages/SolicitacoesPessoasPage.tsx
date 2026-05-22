import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { solicitacaoService } from '../services/api';
import type { ListParams } from '../services/api';
import type { PerfilUsuario, SolicitacaoResponse } from '../types';
import DataTable from '../components/DataTable/DataTable';
import FilterPanel from '../components/DataTable/FilterPanel';
import ExportButton from '../components/DataTable/ExportButton';

const EMPTY = { nome: '', status: '', setor: '', tipoSaida: '', destino: '', dataInicio: '', dataFim: '' };

const SolicitacoesPessoasPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const perfil = user!.perfil as PerfilUsuario;
  const canCreate = ['Solicitante', 'Gestor', 'Admin'].includes(perfil);

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
      const params: ListParams = { page, pageSize, sortBy, sortDesc, minhas: true, ...activeFilters };
      const { data: r } = await solicitacaoService.listar(params);
      setData(r.data);
      setTotal(r.total);
    } catch { /* silently handled */ }
    finally { setLoading(false); }
  }, [page, pageSize, sortBy, sortDesc, activeFilters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3">
          <ExportButton data={data} />
          {canCreate && (
            <button
              onClick={() => navigate('/nova-solicitacao')}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Nova Solicitação
            </button>
          )}
        </div>
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
          perfil={perfil} onAction={fetchData}
        />
      )}
    </div>
  );
};

export default SolicitacoesPessoasPage;
