import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import type { SolicitacaoResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { solicitacaoService } from '../services/api';
import StatusBadge from './ui/StatusBadge';
import ReprovacaoModal from './ReprovacaoModal';

const BG = 'rgb(15, 68, 106)';

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('pt-BR') : '—';

/* ── Campo (label em caixa alta + valor) ── */
const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="mb-3">
      <div className="text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>{label}</div>
      <div className="fw-medium" style={{ wordBreak: 'break-word' }}>{value}</div>
    </div>
  ) : null;

/* ── Passo da timeline ── */
interface StepProps {
  icon: string;
  bgColor: string;
  title: string;
  date?: string | null;
  isLast?: boolean;
  children?: React.ReactNode;
}
const Step: React.FC<StepProps> = ({ icon, bgColor, title, date, isLast, children }) => (
  <div className="d-flex gap-3">
    <div className="d-flex flex-column align-items-center">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
        style={{ width: 30, height: 30, backgroundColor: bgColor, flexShrink: 0, fontSize: '0.8rem' }}
      >
        {icon}
      </div>
      {!isLast && <div style={{ width: 2, flexGrow: 1, backgroundColor: '#dee2e6', marginTop: 4, marginBottom: 4 }} />}
    </div>
    <div className={isLast ? '' : 'pb-3'} style={{ minWidth: 0 }}>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
        <span className="fw-semibold small">{title}</span>
        {date && <small className="text-muted">{fmt(date)}</small>}
      </div>
      {children}
    </div>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h6 className="text-uppercase text-secondary fw-semibold mb-3" style={{ letterSpacing: '0.05em' }}>{children}</h6>
);

interface Props {
  solicitacao: SolicitacaoResponse | null;
  onClose: () => void;
  /** Chamado após aprovar/reprovar (ex.: recarregar a lista). */
  onActionDone?: () => void;
}

const DetalhesSolicitacaoModal: React.FC<Props> = ({ solicitacao: s, onClose, onActionDone }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reprovando, setReprovando] = useState(false);

  const reprovadoPorGestor = s?.status === 'Reprovado' && !!s?.dataAprovacaoGestor && !s?.dataAprovacaoRH;
  const reprovadoPorRH     = s?.status === 'Reprovado' && !!s?.dataAprovacaoRH;

  const perfil = user?.perfil;
  const podeGestor = !!s && (perfil === 'Gestor' || perfil === 'Admin') && s.status === 'AguardandoGestor';
  const podeRH     = !!s && (perfil === 'RH' || perfil === 'Admin') && s.status === 'AguardandoRH';
  const podeAprovar = podeGestor || podeRH;

  const aprovar = async () => {
    if (!s) return;
    setLoading(true);
    try {
      if (s.status === 'AguardandoGestor') await solicitacaoService.aprovarGestor(s.id);
      else if (s.status === 'AguardandoRH') await solicitacaoService.aprovarRH(s.id);
      onActionDone?.();
      onClose();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao aprovar.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarReprovacao = async (motivo: string) => {
    if (!s) return;
    if (s.status === 'AguardandoGestor') await solicitacaoService.reprovarGestor(s.id, motivo);
    else if (s.status === 'AguardandoRH') await solicitacaoService.reprovarRH(s.id, motivo);
    setReprovando(false);
    onActionDone?.();
    onClose();
  };

  const destinoResumo = s
    ? (s.tipoSaida === 'AServico'
        ? [s.unidadeDestino, s.setorDestino].filter(Boolean).join(' · ') || s.destino
        : s.destino)
    : '';

  return (
    <>
    <Modal show={!!s} onHide={onClose} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-5 d-flex align-items-center gap-2 flex-wrap">
          Detalhes da Solicitação
          <span className="text-muted fw-normal">#{s?.id}</span>
          {s && <StatusBadge status={s.status} />}
          {s?.isExtraordinaria && <span className="badge text-bg-warning">⚡ Extraordinária</span>}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ backgroundColor: '#f7f9fc' }}>
        {s && (
          <div className="row g-3">
            {/* ── Coluna principal ── */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body">
                  <SectionTitle>Dados da Solicitação</SectionTitle>
                  <div className="row">
                    <div className="col-sm-6"><InfoRow label="Solicitante" value={s.nome} /></div>
                    <div className="col-sm-6"><InfoRow label="Setor" value={s.setor} /></div>
                    <div className="col-sm-6"><InfoRow label="Tipo de saída" value={s.tipoSaida === 'AServico' ? 'À Serviço' : 'Particular'} /></div>
                    <div className="col-sm-6"><InfoRow label="Data e hora da saída" value={fmt(s.dataSaida)} /></div>
                    {s.tipoSaida === 'Particular' && (
                      <div className="col-12"><InfoRow label="Destino" value={s.destino} /></div>
                    )}
                    {s.tipoSaida === 'AServico' && (
                      <>
                        <div className="col-sm-6"><InfoRow label="Unidade de Destino" value={s.unidadeDestino} /></div>
                        <div className="col-sm-6"><InfoRow label="Setor de Destino" value={s.setorDestino} /></div>
                      </>
                    )}
                    <div className="col-12">
                      <InfoRow
                        label="Previsão de Retorno"
                        value={s.previsaoRetorno ? `Sim — ${fmt(s.dataPrevistaRetorno)}` : 'Não'}
                      />
                    </div>
                    {s.nomeVigilante && <div className="col-sm-6"><InfoRow label="Vigilante (saída)" value={s.nomeVigilante} /></div>}
                    {s.horaSaida && <div className="col-sm-6"><InfoRow label="Hora da saída" value={fmt(s.horaSaida)} /></div>}
                    {s.horaRetorno && <div className="col-sm-6"><InfoRow label="Hora do retorno" value={fmt(s.horaRetorno)} /></div>}
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <SectionTitle>Aprovações</SectionTitle>

                  <div className="mb-3">
                    <div className="text-muted small">Gestor(a)</div>
                    {s.isExtraordinaria ? (
                      <span className="small fw-medium text-warning">⚡ Dispensado (extraordinária)</span>
                    ) : reprovadoPorGestor ? (
                      <span className="small fw-medium text-danger">Reprovado por {s.nomeAprovadorGestor ?? '—'} · {fmt(s.dataAprovacaoGestor)}</span>
                    ) : s.dataAprovacaoGestor ? (
                      <span className="small fw-medium text-success">Aprovado por {s.nomeAprovadorGestor ?? '—'} · {fmt(s.dataAprovacaoGestor)}</span>
                    ) : (
                      <span className="badge text-bg-warning">Pendente</span>
                    )}
                  </div>

                  <div>
                    <div className="text-muted small">RH</div>
                    {reprovadoPorRH ? (
                      <span className="small fw-medium text-danger">Reprovado por {s.nomeAprovadorRH ?? '—'} · {fmt(s.dataAprovacaoRH)}</span>
                    ) : s.dataAprovacaoRH ? (
                      <span className="small fw-medium text-success">Aprovado por {s.nomeAprovadorRH ?? '—'} · {fmt(s.dataAprovacaoRH)}</span>
                    ) : (
                      <span className="badge text-bg-warning">Pendente</span>
                    )}
                  </div>

                  {s.status === 'Reprovado' && s.motivoReprovacao && (
                    <div className="alert alert-danger py-2 px-3 mt-3 small mb-0">
                      <strong>Motivo da reprovação:</strong> {s.motivoReprovacao}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Coluna lateral: Resumo + Histórico ── */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-header text-white fw-semibold" style={{ backgroundColor: BG }}>
                  Resumo
                </div>
                <div className="card-body">
                  <InfoRow label="Solicitante" value={s.nomeSolicitante} />
                  <InfoRow label="Data da saída" value={fmt(s.dataSaida)} />
                  <InfoRow label="Destino" value={destinoResumo} />
                  <div className="mb-0">
                    <div className="text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>Status</div>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <SectionTitle>Histórico do Fluxo</SectionTitle>

                  <Step icon="📝" bgColor="#0d6efd" title="Solicitação Criada" date={s.dataSolicitacao}>
                    <small className="text-muted">Por <strong>{s.nomeSolicitante}</strong></small>
                  </Step>

                  {s.isExtraordinaria ? (
                    <Step icon="⚡" bgColor="#ffc107" title="Gestor — Pulado (Extraordinária)">
                      <small className="text-muted">Aprovação do gestor dispensada.</small>
                    </Step>
                  ) : s.status === 'AguardandoGestor' ? (
                    <Step icon="⏳" bgColor="#ffc107" title="Aguardando Gestor">
                      <small className="text-muted">Pendente de aprovação.</small>
                    </Step>
                  ) : (s.dataAprovacaoGestor || reprovadoPorGestor) ? (
                    <Step
                      icon={reprovadoPorGestor ? '✕' : '✓'}
                      bgColor={reprovadoPorGestor ? '#dc3545' : '#198754'}
                      title={reprovadoPorGestor ? 'Reprovado pelo Gestor' : 'Aprovado pelo Gestor'}
                      date={s.dataAprovacaoGestor}
                    >
                      {s.nomeAprovadorGestor && <small className="text-muted d-block">Por <strong>{s.nomeAprovadorGestor}</strong></small>}
                    </Step>
                  ) : null}

                  {s.status === 'AguardandoRH' ? (
                    <Step icon="⏳" bgColor="#0d6efd" title="Aguardando RH">
                      <small className="text-muted">Pendente de validação.</small>
                    </Step>
                  ) : (s.dataAprovacaoRH || reprovadoPorRH) ? (
                    <Step
                      icon={reprovadoPorRH ? '✕' : '✓'}
                      bgColor={reprovadoPorRH ? '#dc3545' : '#198754'}
                      title={reprovadoPorRH ? 'Reprovado pelo RH' : 'Aprovado pelo RH'}
                      date={s.dataAprovacaoRH}
                    >
                      {s.nomeAprovadorRH && <small className="text-muted d-block">Por <strong>{s.nomeAprovadorRH}</strong></small>}
                    </Step>
                  ) : null}

                  {s.horaSaida && (
                    <Step icon="🚪" bgColor="#fd7e14" title="Saída Registrada" date={s.horaSaida}>
                      <small className="text-muted">Vigilante: <strong>{s.nomeVigilante ?? '—'}</strong></small>
                    </Step>
                  )}

                  {s.horaRetorno && (
                    <Step icon="✓" bgColor="#6c757d" title="Retorno Registrado" date={s.horaRetorno} isLast>
                      <small className="text-muted">Solicitação concluída.</small>
                    </Step>
                  )}
                  {s.status === 'Concluido' && !s.horaRetorno && s.horaSaida && (
                    <Step icon="✓" bgColor="#6c757d" title="Concluído" isLast>
                      <small className="text-muted">Saída sem previsão de retorno.</small>
                    </Step>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {podeAprovar && (
          <>
            <button className="btn btn-outline-danger" onClick={() => setReprovando(true)} disabled={loading}>
              Reprovar
            </button>
            <button className="btn btn-success" onClick={aprovar} disabled={loading}>
              {loading ? 'Aprovando…' : 'Aprovar'}
            </button>
          </>
        )}
        <button className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Fechar</button>
      </Modal.Footer>
    </Modal>

    <ReprovacaoModal
      isOpen={reprovando}
      onClose={() => setReprovando(false)}
      onConfirm={confirmarReprovacao}
    />
    </>
  );
};

export default DetalhesSolicitacaoModal;
