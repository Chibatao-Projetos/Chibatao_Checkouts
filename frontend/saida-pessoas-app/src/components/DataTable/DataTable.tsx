import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { SolicitacaoResponse, PerfilUsuario, StatusSolicitacao } from '../../types';
import { solicitacaoService } from '../../services/api';
import ReprovacaoModal from '../ReprovacaoModal';
import DetalhesSolicitacaoModal from '../DetalhesSolicitacaoModal';

/* ── Status labels + Bootstrap badge classes ─────────────────── */
const STATUS_LABELS: Record<StatusSolicitacao, string> = {
  AguardandoGestor: 'Ag. Gestor',
  AguardandoRH:     'Ag. RH',
  LiberadoPortaria: 'Lib. Portaria',
  EmTransito:       'Em Trânsito',
  Concluido:        'Concluído',
  Reprovado:        'Reprovado',
};

const statusBadge = (status: StatusSolicitacao) => {
  const map: Record<StatusSolicitacao, { cls: string; style?: React.CSSProperties }> = {
    AguardandoGestor: { cls: 'badge text-bg-warning' },
    AguardandoRH:     { cls: 'badge text-bg-primary' },
    LiberadoPortaria: { cls: 'badge text-bg-success' },
    EmTransito:       { cls: 'badge', style: { backgroundColor: '#fd7e14', color: '#fff' } },
    Concluido:        { cls: 'badge text-bg-secondary' },
    Reprovado:        { cls: 'badge text-bg-danger' },
  };
  return map[status];
};

/* ── Eye icon ────────────────────────────────────────────────── */
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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
}

const DataTable: React.FC<DataTableProps> = ({
  data, total, page, pageSize,
  onPageChange, onSortChange,
  perfil, onAction, nomeVigilante,
  isHistorico = false,
}) => {
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [loadingId, setLoadingId]       = useState<number | null>(null);
  const [reprovacaoModal, setReprovacaoModal] = useState<{ id: number; tipo: 'gestor' | 'rh' } | null>(null);
  const [detalhes, setDetalhes]         = useState<SolicitacaoResponse | null>(null);

  const handleAction = async (action: () => Promise<unknown>, id: number) => {
    setLoadingId(id);
    try {
      await action();
      onAction();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro.');
    } finally { setLoadingId(null); }
  };

  const portariaColumns: ColumnDef<SolicitacaoResponse>[] = [
    { accessorKey: 'nomeVigilante', header: 'Vigilante',    cell: ({ getValue }) => getValue<string | undefined>() ?? '—' },
    { accessorKey: 'horaSaida',     header: 'Hora Saída',   cell: ({ getValue }) => { const v = getValue<string | undefined>(); return v ? new Date(v).toLocaleString('pt-BR') : '—'; } },
    { accessorKey: 'horaRetorno',   header: 'Hora Retorno', cell: ({ getValue }) => { const v = getValue<string | undefined>(); return v ? new Date(v).toLocaleString('pt-BR') : '—'; } },
  ];

  const columns = useMemo<ColumnDef<SolicitacaoResponse>[]>(() => [
    /* ── Detalhes (ícone olho) ── */
    {
      id: 'detalhes', header: '', size: 44,
      cell: ({ row }) => (
        <button
          className="btn btn-sm btn-outline-secondary p-1 lh-1"
          onClick={() => setDetalhes(row.original)}
          title="Ver detalhes"
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
        const { previsaoRetorno, dataPrevistaRetorno, horarioPrevistodoRetorno } = row.original;
        if (!previsaoRetorno) return <span className="text-muted">Não</span>;
        return (
          <span>
            Sim
            {dataPrevistaRetorno && (
              <small className="d-block text-muted">
                {new Date(dataPrevistaRetorno).toLocaleDateString('pt-BR')}
                {horarioPrevistodoRetorno && ` ${horarioPrevistodoRetorno}`}
              </small>
            )}
          </span>
        );
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
        const b = statusBadge(status);
        return (
          <div>
            <span className={b.cls} style={b.style}>{STATUS_LABELS[status]}</span>
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
          </div>
        );
      },
    },
  ], [perfil, loadingId, nomeVigilante, isHistorico]);

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
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? ' ↑'
                        : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                    </th>
                  ))}
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
    </>
  );
};

export default DataTable;