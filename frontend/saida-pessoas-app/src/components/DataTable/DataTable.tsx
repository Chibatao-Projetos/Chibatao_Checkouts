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
import ConfirmacaoAprovacaoModal, { type ConfirmacaoVariant } from '../ConfirmacaoAprovacaoModal';
import StatusBadge from '../ui/StatusBadge';
import ExportButton from './ExportButton';

/* ── Flag destacada de Exceção Máxima (bypass do RH) ─────────── */
export const ExcecaoBadge = ({ pendente }: { pendente: boolean }) => (
  <span
    className="badge d-inline-flex align-items-center gap-1"
    style={{ background: '#B45309', color: '#fff', fontSize: '0.68rem', letterSpacing: '0.05em', border: '1px solid #92400E' }}
    title={pendente ? 'Liberada por Exceção Máxima do gestor — auditoria do RH pendente' : 'Liberada por Exceção Máxima do gestor — validada pelo RH (post-facto)'}
  >
    ⚠ EXCEÇÃO{pendente ? '' : ' ✓'}
  </span>
);

/* ── Ícones de ação (mesmo traçado dos SVGs fornecidos) ──────── */
const iconProps = {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
};
const InfoIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);
const TrashIcon = () => (
  <svg {...iconProps}>
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const CheckIcon = () => (
  <svg {...iconProps}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const XIcon = () => (
  <svg {...iconProps}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
const WarningIcon = () => (
  <svg {...iconProps}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg {...iconProps}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg {...iconProps}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);

/* ── Botão de ação circular (padrão visual único para toda a coluna Ações) ── */
const IconBtn: React.FC<{
  icon: React.ReactNode; bg: string; color: string; border: string; title: string;
  onClick: () => void; disabled?: boolean;
}> = ({ icon, bg, color, border, title, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className="d-inline-flex align-items-center justify-content-center rounded-circle"
    style={{
      width: 34, height: 34, flexShrink: 0,
      background: bg, color, border: `1px solid ${border}`,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
    }}
  >
    {icon}
  </button>
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
  const [reprovacaoModal, setReprovacaoModal] = useState<{ id: number; tipo: 'gestor' | 'rh' } | null>(null);
  const [detalhes, setDetalhes]         = useState<SolicitacaoResponse | null>(null);
  const [excluirAlvo, setExcluirAlvo]   = useState<SolicitacaoResponse | null>(null);
  const [excluindo, setExcluindo]       = useState(false);
  const [confirmacao, setConfirmacao]   = useState<{ s: SolicitacaoResponse; variant: ConfirmacaoVariant } | null>(null);
  const [confirmando, setConfirmando]   = useState(false);

  /* Trava de confirmação: executa a ação escolhida após o "Sim". */
  const handleConfirmar = async (motivo?: string) => {
    if (!confirmacao) return;
    const { s, variant } = confirmacao;
    setConfirmando(true);
    try {
      if (variant === 'aprovar' && perfil === 'Gestor') await solicitacaoService.aprovarGestor(s.id);
      else if (variant === 'aprovar')                   await solicitacaoService.aprovarRH(s.id);
      else if (variant === 'excecao')                   await solicitacaoService.aprovarGestorExcecao(s.id, motivo);
      else if (variant === 'validarPostFacto')           await solicitacaoService.validarBypass(s.id);
      else if (variant === 'registrarSaida')             await solicitacaoService.registrarSaida(s.id, nomeVigilante ?? 'Vigilante');
      else if (variant === 'registrarRetorno')           await solicitacaoService.registrarRetorno(s.id);
      setConfirmacao(null);
      onAction();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao processar.');
    } finally { setConfirmando(false); }
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

  /* Ações por linha — ícones circulares, compartilhado entre a tabela (desktop) e os cards (mobile). */
  const renderAcoes = (s: SolicitacaoResponse) => {
    const auditoriaPendente = s.isBypassRH && !s.dataAprovacaoRH;
    return (
      <div className="d-flex gap-2 flex-nowrap justify-content-center">
        <IconBtn
          icon={<InfoIcon />} bg="#EFF6FF" color="#2563EB" border="#DBEAFE"
          title="Ver detalhes" onClick={() => setDetalhes(s)}
        />

        {!isHistorico && perfil === 'Gestor' && s.status === 'AguardandoGestor' && (
          <>
            <IconBtn
              icon={<CheckIcon />} bg="#ECFDF5" color="#16A34A" border="#BBF7D0"
              title="Aceitar" onClick={() => setConfirmacao({ s, variant: 'aprovar' })}
            />
            <IconBtn
              icon={<XIcon />} bg="#FEF2F2" color="#DC2626" border="#FECACA"
              title="Reprovar" onClick={() => setReprovacaoModal({ id: s.id, tipo: 'gestor' })}
            />
          </>
        )}

        {!isHistorico && perfil === 'Gestor' && s.status === 'AguardandoRH' && s.tipoSaida === 'Particular' && !s.isExtraordinaria && (
          <IconBtn
            icon={<WarningIcon />} bg="#FFFBEB" color="#B45309" border="#FDE68A"
            title="Exceção Máxima — RH ausente, libera direto para a Portaria"
            onClick={() => setConfirmacao({ s, variant: 'excecao' })}
          />
        )}

        {!isHistorico && perfil === 'RH' && s.status === 'AguardandoRH' && (
          <>
            <IconBtn
              icon={<CheckIcon />} bg="#ECFDF5" color="#16A34A" border="#BBF7D0"
              title="Aceitar" onClick={() => setConfirmacao({ s, variant: 'aprovar' })}
            />
            <IconBtn
              icon={<XIcon />} bg="#FEF2F2" color="#DC2626" border="#FECACA"
              title="Reprovar" onClick={() => setReprovacaoModal({ id: s.id, tipo: 'rh' })}
            />
          </>
        )}

        {!isHistorico && perfil === 'RH' && auditoriaPendente && s.status !== 'AguardandoRH' && (
          <IconBtn
            icon={<CheckIcon />} bg="#FFFBEB" color="#B45309" border="#FDE68A"
            title="Validar Post-Facto (auditoria da Exceção Máxima)"
            onClick={() => setConfirmacao({ s, variant: 'validarPostFacto' })}
          />
        )}

        {!isHistorico && perfil === 'Portaria' && s.status === 'LiberadoPortaria' && (
          <IconBtn
            icon={<ArrowRightIcon />} bg="#ECFDF5" color="#16A34A" border="#BBF7D0"
            title="Registrar Saída"
            onClick={() => setConfirmacao({ s, variant: 'registrarSaida' })}
          />
        )}
        {!isHistorico && perfil === 'Portaria' && s.status === 'EmTransito' && (
          <IconBtn
            icon={<ArrowLeftIcon />} bg="#FFFBEB" color="#B45309" border="#FDE68A"
            title="Registrar Retorno"
            onClick={() => setConfirmacao({ s, variant: 'registrarRetorno' })}
          />
        )}

        {!isHistorico && permiteExcluir && podeExcluir(s) && (
          <IconBtn
            icon={<TrashIcon />} bg="#F1F5F9" color="#64748B" border="#E2E8F0"
            title="Excluir" onClick={() => setExcluirAlvo(s)}
          />
        )}
      </div>
    );
  };

  /* Ordem na Portaria: horários primeiro, Vigilante penúltima e Status por último. */
  const portariaColumns: ColumnDef<SolicitacaoResponse>[] = [
    { accessorKey: 'horaSaida',     header: 'Hora Saída',   cell: ({ getValue }) => { const v = getValue<string | undefined>(); return v ? new Date(v).toLocaleString('pt-BR') : '—'; } },
    { accessorKey: 'horaRetorno',   header: 'Hora Retorno', cell: ({ getValue }) => { const v = getValue<string | undefined>(); return v ? new Date(v).toLocaleString('pt-BR') : '—'; } },
    { accessorKey: 'nomeVigilante', header: 'Vigilante',    cell: ({ getValue }) => getValue<string | undefined>() ?? '—' },
  ];

  const statusColumn: ColumnDef<SolicitacaoResponse> = {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { status, isBypassRH, dataAprovacaoRH, isExtraordinaria } = row.original;
      return (
        <div className="d-flex flex-column gap-1 align-items-center">
          <div className="d-flex gap-1 align-items-center justify-content-center flex-wrap">
            <StatusBadge status={status} />
            {isExtraordinaria && <span className="badge text-bg-warning" title="Solicitação Extraordinária">⚡</span>}
          </div>
          {isBypassRH && <ExcecaoBadge pendente={!dataAprovacaoRH} />}
        </div>
      );
    },
  };

  const columns = useMemo<ColumnDef<SolicitacaoResponse>[]>(() => [
    /* ── Ações (primeira coluna) ── */
    {
      id: 'acoes', header: 'Ações',
      cell: ({ row }) => renderAcoes(row.original),
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
      accessorKey: 'previsaoRetorno',
      header: 'Retorno',
      cell: ({ getValue }) => getValue<boolean>()
        ? <span>Sim</span>
        : <span className="text-muted">Não</span>,
    },
    /* Na Portaria: horários + Vigilante (penúltima) antes do Status (última). */
    ...(perfil === 'Portaria' ? [...portariaColumns, statusColumn] : [statusColumn]),
  ], [perfil, nomeVigilante, isHistorico, permiteExcluir]);

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
        {/* ── Cards (mobile-first, < md) — inclui o card de liberação da Portaria ── */}
        <div className="d-md-none p-2 d-flex flex-column gap-2" style={{ background: '#f7f9fc' }}>
          {data.length === 0 ? (
            <p className="text-center text-muted py-5 mb-0">Nenhuma solicitação encontrada.</p>
          ) : data.map((s) => {
            const destino = s.tipoSaida === 'AServico'
              ? [s.unidadeDestino, s.setorDestino].filter(Boolean).join(' · ') || s.destino
              : s.destino;
            return (
              <div
                key={s.id}
                className="card shadow-sm"
                style={s.isBypassRH ? { border: '2px solid #B45309' } : undefined}
              >
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-1 flex-wrap">
                    <span className="fw-semibold">#{s.id} — {s.nome}</span>
                    <div className="d-flex gap-1 flex-wrap justify-content-end">
                      {s.isBypassRH && <ExcecaoBadge pendente={!s.dataAprovacaoRH} />}
                      {s.isExtraordinaria && <span className="badge text-bg-warning">⚡</span>}
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                  <p className="small text-muted mb-2">
                    {s.setor} · {s.tipoSaida === 'AServico' ? 'À Serviço' : 'Particular'}
                    {destino ? <> · {destino}</> : null}
                  </p>
                  {renderAcoes(s)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="table-responsive d-none d-md-block">
          <table className="table table-hover table-striped align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead className="table-light">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="text-uppercase text-secondary fw-semibold text-center"
                        style={{
                          cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                          fontSize: '0.72rem', letterSpacing: '0.04em',
                          borderRight: '1px solid #dee2e6', borderBottom: '2px solid #dee2e6',
                        }}
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
                      <td key={cell.id} className="text-center" style={{ whiteSpace: 'nowrap', borderRight: '1px solid #e9ecef' }}>
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
      <DetalhesSolicitacaoModal solicitacao={detalhes} onClose={() => setDetalhes(null)} onActionDone={onAction} />

      {/* Trava de confirmação transversal (aprovações, exceção máxima e post-facto) */}
      <ConfirmacaoAprovacaoModal
        show={!!confirmacao}
        nomeUsuario={confirmacao?.s.nome ?? ''}
        variant={confirmacao?.variant}
        loading={confirmando}
        onClose={() => setConfirmacao(null)}
        onConfirm={handleConfirmar}
      />

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