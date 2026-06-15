import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Modal } from 'react-bootstrap';
import type { SolicitacaoResponse, PerfilUsuario } from '../../types';
import { solicitacaoService } from '../../services/api';
import ReprovacaoModal from '../ReprovacaoModal';
import DetalhesSolicitacaoModal from '../DetalhesSolicitacaoModal';
import StatusBadge from '../ui/StatusBadge';
import ExportButton from './ExportButton';

/* ── Ícones de ação ──────────────────────────────────────────── */
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

/* ── Props ───────────────────────────────────────────────────── */
interface DataTableProps {
  data: SolicitacaoResponse[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortDesc: boolean) => void;
  perfil: PerfilUsuario;
  onAction: () => void;
  nomeVigilante?: string;
  isHistorico?: boolean;
  permiteExcluir?: boolean;
  title?: string;
}

const podeExcluir = (s: SolicitacaoResponse): boolean =>
  (s.status === 'AguardandoGestor' || s.status === 'AguardandoRH') &&
  !s.dataAprovacaoGestor && !s.dataAprovacaoRH;

const DataTable: React.FC<DataTableProps> = ({
  data, total, page, pageSize,
  onPageChange, onSortChange,
  perfil, onAction, nomeVigilante,
  isHistorico = false,
  permiteExcluir = false,
  title = 'Registros',
}) => {
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [loadingId, setLoadingId]       = useState<number | null>(null);
  const [reprovacaoModal, setReprovacaoModal] = useState<{ id: number; tipo: 'gestor' | 'rh' } | null>(null);
  const [detalhes, setDetalhes]         = useState<SolicitacaoResponse | null>(null);
  const [excluirAlvo, setExcluirAlvo]   = useState<SolicitacaoResponse | null>(null);
  const [excluindo, setExcluindo]       = useState(false);

  const handleAction = async (action: () => Promise<unknown>, id: number) => {
    setLoadingId(id);
    try {
      await action();
      onAction();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro.');
    } finally { setLoadingId(null); }
  };

  const handleExcluir = async () => {
    if (!excluirAlvo) return;
    setExcluindo(true);
    try {
      await solicitacaoService.excluir(excluirAlvo.id);
      setExcluirAlvo(null);
      onAction();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao excluir.');
    } finally { setExcluindo(false); }
  };

  const portariaColumns: ColumnDef<SolicitacaoResponse>[] = [
    { accessorKey: 'nomeVigilante', header: 'Vigilante',    cell: ({ getValue }) => getValue<string | undefined>() ?? '—' },
    { accessorKey: 'horaSaida',     header: 'Hora Saída',   cell: ({ getValue }) => { const v = getValue<string | undefined>(); return v ? new Date(v).toLocaleString('pt-BR') : '—'; } },
    { accessorKey: 'horaRetorno',   header: 'Hora Retorno', cell: ({ getValue }) => { const v = getValue<string | undefined>(); return v ? new Date(v).toLocaleString('pt-BR') : '—'; } },
  ];

  const columns = useMemo<ColumnDef<SolicitacaoResponse>[]>(() => [
    /* ── Detalhes ── */
    {
      id: 'detalhes', header: '', size: 48,
      cell: ({ row }) => (
        <button
          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center p-1 lh-1"
          onClick={() => setDetalhes(row.original)}
          title="Ver detalhes"
          aria-label="Ver detalhes"
        >
          <EyeIcon />
        </button>
      ),
    },
    { accessorKey: 'id',   header: 'ID',   size: 55 },
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'setor', header: 'Setor' },
    {
      accessorKey: 'destino',
      header: 'Destino',
      cell: ({ row }) => {
        const { destino, unidadeDestino, setorDestino, tipoSaida } = row.original;
        return tipoSaida === 'AServico'
          ? <span>{[unidadeDestino, setorDestino].filter(Boolean).join(' · ') || destino}</span>
          : <span>{destino}</span>;
      },
    },
    {
      accessorKey: 'tipoSaida',
      header: 'Tipo',
      cell: ({ getValue }) => getValue<string>() === 'AServico' ? 'À Serviço' : 'Particular',
    },
    {
      accessorKey: 'isExtraordinaria',
      header: 'Ext.',
      cell: ({ getValue }) => getValue<boolean>()
        ? <span className="badge text-bg-warning">⚡</span>
        : <span className="text-muted">—</span>,
    },
    {
      accessorKey: 'previsaoRetorno',
      header: 'Retorno?',
      cell: ({ row }) => {
        const { previsaoRetorno, dataPrevistaRetorno } = row.original;
        if (!previsaoRetorno) return <span className="text-muted">Não</span>;
        return (
          <span>
            Sim
            {dataPrevistaRetorno && (
              <small className="d-block text-muted">
                {new Date(dataPrevistaRetorno).toLocaleString('pt-BR')}
              </small>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'dataSaida',
      header: 'Data/Hora Saída',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>();
        return v ? new Date(v).toLocaleString('pt-BR') : '—';
      },
    },
    {
      accessorKey: 'dataSolicitacao',
      header: 'Solicitado em',
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString('pt-BR'),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const { status, motivoReprovacao } = row.original;
        return (
          <div>
            <StatusBadge status={status} />
            {status === 'Reprovado' && motivoReprovacao && (
              <small
                className="d-block text-danger mt-1 text-truncate"
                style={{ maxWidth: 150 }}
                title={motivoReprovacao}
              >
                {motivoReprovacao}
              </small>
            )}
          </div>
        );
      },
    },
    ...(perfil === 'Portaria' ? portariaColumns : []),
    {
      id: 'acoes', header: 'Ações',
      cell: ({ row }) => {
        const s = row.original;
        const busy = loadingId === s.id;
        if (isHistorico) return <span className="text-muted small">—</span>;
        return (
          <div className="d-flex gap-1 flex-wrap">
            {perfil === 'Gestor' && s.status === 'AguardandoGestor' && (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleAction(() => solicitacaoService.aprovarGestor(s.id), s.id)}
                  disabled={busy}
                >{busy ? '…' : 'Aprovar'}</button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setReprovacaoModal({ id: s.id, tipo: 'gestor' })}
                  disabled={busy}
                >Reprovar</button>
              </>
            )}
            {perfil === 'RH' && s.status === 'AguardandoRH' && (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleAction(() => solicitacaoService.aprovarRH(s.id), s.id)}
                  disabled={busy}
                >{busy ? '…' : 'Validar'}</button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setReprovacaoModal({ id: s.id, tipo: 'rh' })}
                  disabled={busy}
                >Reprovar</button>
              </>
            )}
            {perfil === 'Portaria' && s.status === 'LiberadoPortaria' && (
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleAction(() => solicitacaoService.registrarSaida(s.id, nomeVigilante ?? 'Vigilante'), s.id)}
                disabled={busy}
              >{busy ? '…' : 'Reg. Saída'}</button>
            )}
            {perfil === 'Portaria' && s.status === 'EmTransito' && (
              <button
                className="btn btn-sm btn-warning"
                onClick={() => handleAction(() => solicitacaoService.registrarRetorno(s.id), s.id)}
                disabled={busy}
              >{busy ? '…' : 'Reg. Retorno'}</button>
            )}
            {permiteExcluir && podeExcluir(s) && (
              <button
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center p-1 lh-1"
                onClick={() => setExcluirAlvo(s)}
                disabled={busy}
                title="Excluir"
                aria-label="Excluir solicitação"
              ><TrashIcon /></button>
            )}
          </div>
        );
      },
    },
  ], [perfil, loadingId, nomeVigilante, isHistorico, permiteExcluir]);

  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: updater => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      if (next.length > 0) onSortChange(next[0].id, next[0].desc);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 py-3 rounded-top-3">
          <h6 className="text-uppercase fw-semibold text-secondary mb-0" style={{ letterSpacing: '0.05em' }}>
            {title}
          </h6>
          <ExportButton data={data} />
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-striped align-middle mb-0">
            <thead className="table-light">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="text-uppercase text-secondary fw-semibold"
                        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', fontSize: '0.72rem', letterSpacing: '0.04em' }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-muted ms-1" style={{ opacity: sorted ? 1 : 0.35 }}>
                            {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center text-muted py-5">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{ whiteSpace: 'nowrap' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="card-footer d-flex justify-content-between align-items-center bg-white border-top py-2">
          <small className="text-muted">
            Total: <strong className="text-dark">{total}</strong> registros
          </small>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item${page <= 1 ? ' disabled' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(page - 1)}>‹</button>
              </li>
              <li className="page-item disabled">
                <span className="page-link">{page} / {totalPages || 1}</span>
              </li>
              <li className={`page-item${page >= totalPages ? ' disabled' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(page + 1)}>›</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Modais */}
      <ReprovacaoModal
        isOpen={!!reprovacaoModal}
        onClose={() => setReprovacaoModal(null)}
        onConfirm={async motivo => {
          if (!reprovacaoModal) return;
          if (reprovacaoModal.tipo === 'gestor')
            await solicitacaoService.reprovarGestor(reprovacaoModal.id, motivo);
          else
            await solicitacaoService.reprovarRH(reprovacaoModal.id, motivo);
          setReprovacaoModal(null);
          onAction();
        }}
      />
      <DetalhesSolicitacaoModal solicitacao={detalhes} onClose={() => setDetalhes(null)} />

      {/* Confirmação de exclusão (somente pendentes) */}
      <Modal show={!!excluirAlvo} onHide={excluindo ? undefined : () => setExcluirAlvo(null)} centered>
        <Modal.Header closeButton={!excluindo}>
          <Modal.Title className="fs-5">Excluir solicitação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-1">Tem certeza que deseja excluir esta solicitação?</p>
          {excluirAlvo && (
            <p className="text-muted small mb-0">
              #{excluirAlvo.id} — {excluirAlvo.nome} · {excluirAlvo.destino || 'Saída'}
            </p>
          )}
          <p className="text-danger small mt-2 mb-0">Esta ação não pode ser desfeita.</p>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-outline-secondary" onClick={() => setExcluirAlvo(null)} disabled={excluindo}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={handleExcluir} disabled={excluindo}>
            {excluindo ? 'Excluindo…' : 'Excluir'}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DataTable;