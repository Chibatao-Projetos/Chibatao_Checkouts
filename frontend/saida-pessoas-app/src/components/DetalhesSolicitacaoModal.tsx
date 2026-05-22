import React from 'react';
import { Offcanvas, Badge } from 'react-bootstrap';
import type { SolicitacaoResponse, StatusSolicitacao } from '../types';

const STATUS_LABELS: Record<StatusSolicitacao, string> = {
  AguardandoGestor: 'Aguardando Gestor',
  AguardandoRH:     'Aguardando RH',
  LiberadoPortaria: 'Liberado — Portaria',
  EmTransito:       'Em Trânsito',
  Concluido:        'Concluído',
  Reprovado:        'Reprovado',
};

const statusBg = (s: StatusSolicitacao): string =>
  ({ AguardandoGestor: 'warning', AguardandoRH: 'primary', LiberadoPortaria: 'success',
     EmTransito: 'warning', Concluido: 'secondary', Reprovado: 'danger' }[s]);

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('pt-BR') : '—';
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';

/* ── Row de informação ── */
const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="d-flex gap-2 mb-1">
      <span className="text-muted small" style={{ minWidth: 140 }}>{label}</span>
      <span className="small fw-medium">{value}</span>
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
        style={{ width: 32, height: 32, backgroundColor: bgColor, flexShrink: 0, fontSize: '0.85rem' }}
      >
        {icon}
      </div>
      {!isLast && (
        <div style={{ width: 2, flexGrow: 1, backgroundColor: '#dee2e6', marginTop: 4, marginBottom: 4 }} />
      )}
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

/* ── Componente principal ── */
interface Props { solicitacao: SolicitacaoResponse | null; onClose: () => void; }

const DetalhesSolicitacaoModal: React.FC<Props> = ({ solicitacao: s, onClose }) => {
  const reprovadoPorGestor = s?.status === 'Reprovado' && !!s?.dataAprovacaoGestor && !s?.dataAprovacaoRH;
  const reprovadoPorRH     = s?.status === 'Reprovado' && !!s?.dataAprovacaoRH;

  return (
    <Offcanvas show={!!s} onHide={onClose} placement="end" style={{ width: 480 }}>
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title className="d-flex align-items-center gap-2 flex-wrap fs-6">
          Solicitação #{s?.id}
          {s && (
            <Badge
              bg={statusBg(s.status)}
              text={['AguardandoGestor', 'EmTransito'].includes(s.status) ? 'dark' : undefined}
            >
              {STATUS_LABELS[s.status]}
            </Badge>
          )}
          {s?.isExtraordinaria && <Badge bg="warning" text="dark">⚡ Extraordinária</Badge>}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {s && (
          <>
            {/* Dados da solicitação */}
            <div className="bg-light rounded-3 p-3 mb-4">
              <p className="text-uppercase text-muted small fw-semibold mb-2" style={{ letterSpacing: '0.05em' }}>
                Dados da Solicitação
              </p>
              <InfoRow label="Solicitante" value={s.nome} />
              <InfoRow label="Setor" value={s.setor} />
              <InfoRow label="Tipo" value={s.tipoSaida === 'AServico' ? 'À Serviço' : 'Particular'} />
              {s.tipoSaida === 'Particular' && <InfoRow label="Destino" value={s.destino} />}
              {s.tipoSaida === 'AServico' && (
                <>
                  <InfoRow label="Unidade de Destino" value={s.unidadeDestino} />
                  <InfoRow label="Setor de Destino" value={s.setorDestino} />
                </>
              )}
              <InfoRow
                label="Previsão de Retorno"
                value={
                  s.previsaoRetorno
                    ? `Sim — ${fmtDate(s.dataPrevistaRetorno)} ${s.horarioPrevistodoRetorno ?? ''}`
                    : 'Não'
                }
              />
            </div>

            {/* Timeline */}
            <p className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.05em' }}>
              Histórico do Fluxo
            </p>

            {/* 1. Criação */}
            <Step icon="📝" bgColor="#0d6efd" title="Solicitação Criada" date={s.dataSolicitacao}>
              <small className="text-muted">Por <strong>{s.nomeSolicitante}</strong></small>
            </Step>

            {/* 2. Gestor */}
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
                {reprovadoPorGestor && s.motivoReprovacao && (
                  <div className="alert alert-danger py-2 px-3 mt-1 small mb-0">
                    <strong>Motivo:</strong> {s.motivoReprovacao}
                  </div>
                )}
              </Step>
            ) : null}

            {/* 3. RH */}
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
                {reprovadoPorRH && s.motivoReprovacao && (
                  <div className="alert alert-danger py-2 px-3 mt-1 small mb-0">
                    <strong>Motivo:</strong> {s.motivoReprovacao}
                  </div>
                )}
              </Step>
            ) : null}

            {/* 4. Saída */}
            {s.horaSaida && (
              <Step icon="🚪" bgColor="#fd7e14" title="Saída Registrada" date={s.horaSaida}>
                <small className="text-muted">Vigilante: <strong>{s.nomeVigilante ?? '—'}</strong></small>
              </Step>
            )}

            {/* 5. Retorno / Conclusão */}
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
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default DetalhesSolicitacaoModal;