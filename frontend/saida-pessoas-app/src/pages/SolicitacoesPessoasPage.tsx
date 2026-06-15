import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { solicitacaoService } from '../services/api';
import type { ListParams } from '../services/api';
import type { PerfilUsuario, SolicitacaoResponse } from '../types';
import DataTable from '../components/DataTable/DataTable';
import FilterPanel from '../components/DataTable/FilterPanel';
import NovaSolicitacaoModal from '../components/NovaSolicitacaoModal';

const EMPTY = { nome: '', status: '', setor: '', tipoSaida: '', destino: '', dataInicio: '', dataFim: '' };

const SolicitacoesPessoasPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const perfil = user!.perfil as PerfilUsuario;
  const canCreate = ['Solicitante', 'Gestor', 'Admin'].includes(perfil);

  const [data, setData]     = useState<SolicitacaoResponse[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [sortBy, setSortBy] = useState('dataSolicitacao');
  const [sortDesc, setSortDesc] = useState(true);
  const [draftFilters, setDraftFilters] = useState(EMPTY);
  const [filters, setFilters] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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

  // Open modal automatically if redirected with state flag (e.g. from InicioPage quick link)
  useEffect(() => {
    const state = location.state as { abrirNovaSolicitacao?: boolean } | null;
    if (canCreate && state?.abrirNovaSolicitacao) {
      setShowModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, canCreate, navigate]);

  return (
    <div className="p-6 space-y-4">
      {canCreate && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Nova Solicitação
          </button>
        </div>
      )}

      <FilterPanel
        filters={draftFilters}
        onChange={(k, v) => setDraftFilters((p) => ({ ...p, [k]: v }))}
        onApply={() => { setFilters(draftFilters); setPage(1); }}
        onClear={() => { setDraftFilters(EMPTY); setFilters(EMPTY); setPage(1); }}
        loading={loading}
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
          permiteExcluir
          title="Minhas Solicitações"
        />
      )}

      <NovaSolicitacaoModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => { setPage(1); fetchData(); }}
      />
    </div>
  );
};

export default SolicitacoesPessoasPage;