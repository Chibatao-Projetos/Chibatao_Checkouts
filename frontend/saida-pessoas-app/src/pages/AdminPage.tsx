import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import type { AdminListParams } from '../services/api';
import type { UsuarioResponse } from '../types';
import UsuarioStatusPill from '../components/ui/UsuarioStatusPill';

/* Ícone "mais opções" (três pontos verticais) — abre a página de detalhes/aprovação. */
const KebabIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);
const EraserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4L13 5l6 6-9.3 9.3a1 1 0 0 1-1.4 0Z" />
    <path d="M22 21H7M5 11l6 6" />
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const EMPTY_FILTERS: AdminListParams = { id: '', nome: '', busca: '', status: '' };
const LBL = 'form-label text-uppercase fw-semibold text-muted mb-1';
const lblStyle: React.CSSProperties = { fontSize: '0.68rem', letterSpacing: '0.05em' };
const col = 'col-12 col-sm-6 col-md-4 col-lg-3';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading]   = useState(false);

  const [draftFilters, setDraftFilters] = useState<AdminListParams>(EMPTY_FILTERS);
  const [filters, setFilters]           = useState<AdminListParams>(EMPTY_FILTERS);

  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    [filters]
  );

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.listarUsuarios(activeFilters);
      setUsuarios(data);
    } catch {
      console.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const setDraft = (key: keyof AdminListParams, value: string) =>
    setDraftFilters((p) => ({ ...p, [key]: value }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h5 className="fw-bold text-gray-800 mb-4">Todos os Usuários</h5>

      {/* ── Filtros — mesmo padrão visual do FilterPanel usado nas demais telas ── */}
      <div className="card border-0 shadow-sm rounded-3 mb-3">
        <div className="card-body p-3 p-md-4">
          <form onSubmit={(e) => { e.preventDefault(); setFilters(draftFilters); }}>
            <div className="row g-3 align-items-end">

              <div className={col}>
                <label className={LBL} style={lblStyle}>ID</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={draftFilters.id}
                  onChange={(e) => setDraft('id', e.target.value)}
                  placeholder="ID"
                />
              </div>

              <div className={col}>
                <label className={LBL} style={lblStyle}>Nome</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={draftFilters.nome}
                  onChange={(e) => setDraft('nome', e.target.value)}
                  placeholder="Buscar nome…"
                />
              </div>

              <div className={col}>
                <label className={LBL} style={lblStyle}>E-mail / Matrícula</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={draftFilters.busca}
                  onChange={(e) => setDraft('busca', e.target.value)}
                  placeholder="E-mail ou matrícula…"
                />
              </div>

              <div className={col}>
                <label className={LBL} style={lblStyle}>Status</label>
                <select
                  className="form-select form-select-sm"
                  value={draftFilters.status}
                  onChange={(e) => setDraft('status', e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Bloqueado</option>
                </select>
              </div>

              {/* Ações — alinhadas à direita */}
              <div className="col-12 d-flex justify-content-end gap-2 mt-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 px-3"
                  onClick={() => { setDraftFilters(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); }}
                  disabled={loading}
                >
                  <EraserIcon /> Limpar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 px-3"
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm" role="status" /> Filtrando…</>
                    : <><SearchIcon /> Filtrar</>}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Carregando…</div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {['Ações', 'ID', 'Nome', 'Matrícula', 'E-mail', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border border-gray-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center border border-gray-200">
                    <button
                      onClick={() => navigate(`/admin/usuarios/${u.id}`)}
                      className="d-inline-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: 32, height: 32, background: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', cursor: 'pointer' }}
                      title="Ver detalhes"
                      aria-label="Ver detalhes"
                    >
                      <KebabIcon />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 border border-gray-200">{u.id}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-800 border border-gray-200">{u.nome}</td>
                  <td className="px-4 py-3 text-center text-gray-600 border border-gray-200">{u.matricula}</td>
                  <td className="px-4 py-3 text-center text-gray-600 border border-gray-200">{u.email}</td>
                  <td className="px-4 py-3 text-center border border-gray-200">
                    <UsuarioStatusPill status={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
