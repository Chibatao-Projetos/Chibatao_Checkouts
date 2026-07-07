import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import type { SolicitacaoResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { solicitacaoService } from '../services/api';
import ReprovacaoModal from './ReprovacaoModal';
import ConfirmacaoAprovacaoModal from './ConfirmacaoAprovacaoModal';

const NAVY      = '#0F2744';
const BLUE      = '#2563EB';
const GREEN     = '#1D9E75';
const GREEN_DK  = '#16A34A';
const GREEN_LT  = '#F3FBF8';
const GREEN_BD  = '#C8EBDD';
const GREEN_TX  = '#0F7A5A';
const AMBER     = '#BA7517';
const AMBER_DK  = '#E8852C';
const RED       = '#C0392B';
const RED_LT    = '#FDECEA';
const INK       = '#1B2A45';
const MUTE      = '#9AA3B2';
const LINE      = '#EEF1F5';
const BORDER    = '#E6E9EF';

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('pt-BR') : '—';

/* ── Ícones (line-style, viewBox 24) ── */
const PATHS: Record<string, React.ReactNode> = {
  clipboard:  <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /></>,
  user:       <><circle cx="12" cy="7.5" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  building:   <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 16h6" /></>,
  arrow:      <path d="M4 12h15m-5-6 6 6-6 6" />,
  calendar:   <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  pin:        <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  box:        <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></>,
  chat:       <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />,
  clock:      <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></>,
  shield:     <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><circle cx="12" cy="9.5" r="2" /><path d="M8.5 15.5a3.5 3.5 0 0 1 7 0" /></>,
  check:      <path d="M20 6 9 17l-5-5" />,
  file:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></>,
  back:       <><path d="M9 10 4 15l5 5" /><path d="M20 4v7a4 4 0 0 1-4 4H5" /></>,
  x:          <path d="M18 6 6 18M6 6l12 12" />,
};

const Icon = ({ name, size = 19, color = BLUE, stroke = 1.7 }: {
  name: string; size?: number; color?: string; stroke?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {PATHS[name]}
  </svg>
);

const lblStyle: React.CSSProperties = { fontSize: 10.5, color: MUTE, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 };
const valStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: INK, margin: 0, wordBreak: 'break-word', lineHeight: 1.35 };

/* ── Célula de campo (com ícone) ── */
const Cell = ({ icon, label, value, span }: {
  icon: string; label: string; value?: string | null; span?: boolean;
}) => (
  <div style={{ background: '#fff', display: 'flex', gap: 12, padding: '15px 16px', alignItems: 'flex-start', ...(span ? { gridColumn: '1 / -1' } : {}) }}>
    <Icon name={icon} />
    <div style={{ minWidth: 0 }}>
      <p style={lblStyle}>{label}</p>
      <p style={valStyle}>{value || '—'}</p>
    </div>
  </div>
);

const Filler = () => <div style={{ background: '#fff' }} />;

/* ── Título de seção ── */
const SectionHeader = ({ icon, title, badgeBg, iconColor, titleColor, round }: {
  icon: string; title: string; badgeBg: string; iconColor: string; titleColor: string; round?: boolean;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ width: 30, height: 30, borderRadius: round ? '50%' : 8, background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={17} color={iconColor} stroke={2} />
    </div>
    <span style={{ fontSize: 14, fontWeight: 700, color: titleColor, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{title}</span>
  </div>
);

/* ── Item de aprovação ── */
const ApprovalItem = ({ icon, badgeBg, role, text, textColor, last }: {
  icon: string; badgeBg: string; role: string; text: string; textColor: string; last?: boolean;
}) => (
  <div style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: last ? 0 : 16 }}>
    {!last && <div style={{ position: 'absolute', left: 13, top: 30, bottom: 0, width: 2, background: GREEN_BD }} />}
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
      <Icon name={icon} size={15} color="#fff" stroke={2.4} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: INK, margin: '0 0 2px' }}>{role}</p>
      <p style={{ fontSize: 12.5, color: textColor, margin: 0, fontWeight: 500, wordBreak: 'break-word' }}>{text}</p>
    </div>
  </div>
);

/* ── Passo da timeline ── */
const TLStep = ({ icon, bg, title, date, sub, subStrong, last }: {
  icon: string; bg: string; title: string; date?: string | null; sub?: string; subStrong?: string; last?: boolean;
}) => (
  <div style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: last ? 0 : 20 }}>
    {!last && <div style={{ position: 'absolute', left: 15, top: 34, bottom: 0, width: 2, background: BORDER }} />}
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
      <Icon name={icon} size={16} color="#fff" stroke={2.1} />
    </div>
    <div style={{ paddingTop: 2, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{title}</span>
        {date && <span style={{ fontSize: 11.5, color: MUTE }}>{fmt(date)}</span>}
      </div>
      {(sub || subStrong) && (
        <p style={{ fontSize: 12, color: '#6B7588', margin: '3px 0 0' }}>
          {sub}{subStrong && <strong style={{ color: '#3A4658', fontWeight: 600 }}>{subStrong}</strong>}
        </p>
      )}
    </div>
  </div>
);

/* ── Badge de status ── */
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  AguardandoGestor: { bg: '#FEF3C7', color: '#92400E', label: 'Aguardando Gestor'  },
  AguardandoRH:     { bg: '#DBEAFE', color: '#1E40AF', label: 'Aguardando RH'      },
  LiberadoPortaria: { bg: '#D1FAE5', color: '#065F46', label: 'Liberado Portaria'  },
  EmTransito:       { bg: '#FED7AA', color: '#92400E', label: 'Em Trânsito'        },
  Concluido:        { bg: '#D1D5DB', color: '#374151', label: 'Concluído'          },
  Reprovado:        { bg: RED_LT,    color: RED,       label: 'Reprovado'          },
};

const StatusPill = ({ status }: { status: string }) => {
  const s = STATUS_STYLE[status] ?? { bg: '#e9ecef', color: '#495057', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.02em' }}>
      {s.label}
    </span>
  );
};

/* ═══════════════════════════════════════ */

interface Props {
  solicitacao: SolicitacaoResponse | null;
  onClose: () => void;
  onActionDone?: () => void;
}

const DetalhesSolicitacaoModal: React.FC<Props> = ({ solicitacao: s, onClose, onActionDone }) => {
  const { user } = useAuth();
  const [loading, setLoading]       = useState(false);
  const [reprovando, setReprovando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const reprovadoPorGestor = s?.status === 'Reprovado' && !!s?.dataAprovacaoGestor && !s?.dataAprovacaoRH;
  const reprovadoPorRH     = s?.status === 'Reprovado' && !!s?.dataAprovacaoRH;

  const perfil      = user?.perfil;
  const podeGestor  = !!s && (perfil === 'Gestor' || perfil === 'Admin') && s.status === 'AguardandoGestor';
  const podeRH      = !!s && (perfil === 'RH'     || perfil === 'Admin') && s.status === 'AguardandoRH';
  const podeAprovar = podeGestor || podeRH;

  const aprovar = async () => {
    if (!s) return;
    setLoading(true);
    try {
      if (s.status === 'AguardandoGestor') await solicitacaoService.aprovarGestor(s.id);
      else if (s.status === 'AguardandoRH') await solicitacaoService.aprovarRH(s.id);
      setConfirmando(false);
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

  const motivo = s?.tipoSaida === 'AServico' && s?.destino?.includes('Motivo:')
    ? s.destino.split('Motivo:')[1]?.trim()
    : undefined;

  const destinoResumo = s
    ? s.tipoSaida === 'AServico'
      ? [s.unidadeDestino, s.setorDestino].filter(Boolean).join(' · ') || s.destino
      : s.destino
    : '';

  /* ── Estado das aprovações ── */
  const renderAprovacoes = () => {
    if (!s) return null;
    type Item = { icon: string; badgeBg: string; role: string; text: string; textColor: string };
    const items: Item[] = [];

    // Gestor
    if (s.isExtraordinaria) {
      items.push({ icon: 'arrow', badgeBg: AMBER, role: 'Gestor(a)', text: 'Dispensado (extraordinária)', textColor: AMBER });
    } else if (reprovadoPorGestor) {
      items.push({ icon: 'x', badgeBg: RED, role: 'Gestor(a)', text: `Reprovado por ${s.nomeAprovadorGestor ?? '—'} · ${fmt(s.dataAprovacaoGestor)}`, textColor: RED });
    } else if (s.dataAprovacaoGestor) {
      items.push({ icon: 'check', badgeBg: GREEN_DK, role: 'Gestor(a)', text: `Aprovado por ${s.nomeAprovadorGestor ?? '—'} · ${fmt(s.dataAprovacaoGestor)}`, textColor: GREEN_TX });
    } else {
      items.push({ icon: 'clock', badgeBg: '#D6A21A', role: 'Gestor(a)', text: 'Pendente de aprovação', textColor: '#92400E' });
    }

    // RH — só aparece se já passou do gestor ou foi reprovado pelo RH
    if (s.isBypassRH) {
      if (s.dataAprovacaoRH) {
        items.push({ icon: 'check', badgeBg: GREEN_DK, role: 'RH (post-facto)', text: `Validado por ${s.nomeAprovadorRH ?? '—'} · ${fmt(s.dataAprovacaoRH)}`, textColor: GREEN_TX });
      } else {
        items.push({ icon: 'arrow', badgeBg: '#B45309', role: 'RH', text: 'Pulado por Exceção Máxima do gestor — auditoria post-facto pendente', textColor: '#92400E' });
      }
    } else if (reprovadoPorRH) {
      items.push({ icon: 'x', badgeBg: RED, role: 'RH', text: `Reprovado por ${s.nomeAprovadorRH ?? '—'} · ${fmt(s.dataAprovacaoRH)}`, textColor: RED });
    } else if (s.dataAprovacaoRH) {
      items.push({ icon: 'check', badgeBg: GREEN_DK, role: 'RH', text: `Aprovado por ${s.nomeAprovadorRH ?? '—'} · ${fmt(s.dataAprovacaoRH)}`, textColor: GREEN_TX });
    } else if (!reprovadoPorGestor) {
      items.push({ icon: 'clock', badgeBg: '#D6A21A', role: 'RH', text: 'Pendente de validação', textColor: '#92400E' });
    }

    return items.map((it, i) => (
      <ApprovalItem key={it.role} {...it} last={i === items.length - 1} />
    ));
  };

  return (
    <>
      <Modal show={!!s} onHide={onClose} size="xl" centered contentClassName="border-0 p-0 overflow-hidden rounded-3">
        <div style={{ background: '#fff', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

          {/* ── Cabeçalho ── */}
          <div style={{ background: NAVY, padding: '1.15rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                Detalhes da Solicitação #{s?.id}
              </span>
              {s && <StatusPill status={s.status} />}
              {s?.isExtraordinaria && (
                <span style={{ background: 'rgba(239,159,39,0.18)', color: '#F2B14E', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
                  ⚡ Extraordinária
                </span>
              )}
              {s?.isBypassRH && (
                <span style={{ background: '#B45309', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.04em' }}>
                  ⚠ EXCEÇÃO{s.dataAprovacaoRH ? ' ✓' : ''}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              aria-label="Fechar"
            >
              <Icon name="x" size={16} color="#fff" stroke={2} />
            </button>
          </div>

          {/* ── Corpo ── */}
          {s && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden', flex: 1, minHeight: 0, background: '#fff' }}>

              {/* Coluna principal */}
              <div style={{ padding: '1.6rem 1.75rem', borderRight: `1px solid ${BORDER}`, overflowY: 'auto' }}>

                {/* Dados */}
                <SectionHeader icon="clipboard" title="Dados da solicitação" badgeBg="#E5EEFB" iconColor={BLUE} titleColor={INK} />

                {/* Grupo 1 — linhas hairline via gap */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                  <Cell icon="user"     label={s.colaboradorId ? 'Colaborador (quem sai)' : 'Solicitante'} value={s.nome} />
                  <Cell icon="building" label="Setor"                value={s.setor} />
                  {s.colaboradorId && (
                    <Cell icon="user" label="Registrado por" value={s.nomeSolicitante} span />
                  )}
                  <Cell icon="arrow"    label="Tipo de saída"        value={s.tipoSaida === 'AServico' ? 'À Serviço' : 'Particular'} />
                  <Cell icon="calendar" label="Data/Hora da solicitação" value={fmt(s.dataSaida)} />
                  {s.tipoSaida === 'AServico' ? (
                    <>
                      <Cell icon="pin" label="Unidade de destino" value={s.unidadeDestino} />
                      <Cell icon="box" label="Setor de destino"   value={s.setorDestino} />
                    </>
                  ) : (
                    <Cell icon="pin" label="Destino" value={s.destino} span />
                  )}
                </div>

                {/* Motivo da saída — destacado */}
                {motivo && (
                  <div style={{ background: '#EDF4FC', border: '1px solid #D5E6F7', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                    <Icon name="chat" />
                    <div style={{ minWidth: 0 }}>
                      <p style={lblStyle}>Motivo da saída</p>
                      <p style={valStyle}>{motivo}</p>
                    </div>
                  </div>
                )}

                {/* Grupo 2 — retorno / registros */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: LINE, border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden' }}>
                  <Cell icon="clock"  label="Previsão de retorno" value={s.previsaoRetorno ? `Sim — ${fmt(s.dataPrevistaRetorno)}` : 'Não'} />
                  {s.horaSaida   ? <Cell icon="clock"  label="Hora da saída"   value={fmt(s.horaSaida)} />   : <Filler />}
                  {(s.nomeVigilante || s.horaRetorno) && (
                    <>
                      {s.nomeVigilante ? <Cell icon="shield" label="Vigilante (saída)" value={s.nomeVigilante} /> : <Filler />}
                      {s.horaRetorno   ? <Cell icon="clock"  label="Hora do retorno"   value={fmt(s.horaRetorno)} /> : <Filler />}
                    </>
                  )}
                </div>

                {/* Aprovações */}
                <div style={{ marginTop: 24 }}>
                  <SectionHeader icon="check" title="Aprovações" badgeBg={GREEN_DK} iconColor="#fff" titleColor={GREEN} round />
                  <div style={{ border: `1px solid ${GREEN_BD}`, background: GREEN_LT, borderRadius: 12, padding: '18px 20px' }}>
                    {renderAprovacoes()}
                    {s.isBypassRH && s.bypassMotivo && (
                      <div style={{ background: '#FEF3C7', border: '1px solid #B45309', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginTop: 14 }}>
                        <strong>Justificativa da exceção (assunção de risco):</strong> {s.bypassMotivo}
                      </div>
                    )}
                    {s.status === 'Reprovado' && s.motivoReprovacao && (
                      <div style={{ background: RED_LT, border: `1px solid ${RED}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: RED, marginTop: 14 }}>
                        <strong>Motivo da reprovação:</strong> {s.motivoReprovacao}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna lateral */}
              <div style={{ padding: '1.6rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>

                {/* Resumo */}
                <div style={{ background: NAVY, borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                    <Icon name="clipboard" size={18} color="#fff" stroke={1.9} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Resumo</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Solicitante',    value: s.nomeSolicitante },
                      { label: 'Data/Hora da solicitação', value: fmt(s.dataSaida) },
                      { label: 'Destino',        value: destinoResumo },
                      ...(motivo ? [{ label: 'Motivo da saída', value: motivo }] : []),
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</p>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', margin: 0, wordBreak: 'break-word' }}>{value}</p>
                      </div>
                    ))}
                    <div>
                      <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Status</p>
                      <StatusPill status={s.status} />
                    </div>
                  </div>
                </div>

                {/* Histórico */}
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                    <Icon name="clock" size={18} color="#6B7588" stroke={1.9} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: INK, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Histórico do fluxo</span>
                  </div>

                  <TLStep icon="file" bg="#2D6CDF" title="Solicitação Criada" date={s.dataSolicitacao} sub="Por " subStrong={s.nomeSolicitante} />

                  {s.isExtraordinaria ? (
                    <TLStep icon="arrow" bg={AMBER} title="Gestor — pulado" sub="Aprovação dispensada" />
                  ) : s.status === 'AguardandoGestor' ? (
                    <TLStep icon="clock" bg="#D6A21A" title="Aguardando Gestor" sub="Pendente de aprovação" />
                  ) : (s.dataAprovacaoGestor || reprovadoPorGestor) ? (
                    <TLStep
                      icon={reprovadoPorGestor ? 'x' : 'check'}
                      bg={reprovadoPorGestor ? RED : GREEN_DK}
                      title={reprovadoPorGestor ? 'Reprovado pelo Gestor' : 'Aprovado pelo Gestor'}
                      date={s.dataAprovacaoGestor}
                      sub={s.nomeAprovadorGestor ? 'Por ' : undefined}
                      subStrong={s.nomeAprovadorGestor}
                    />
                  ) : null}

                  {s.isBypassRH ? (
                    <>
                      <TLStep icon="arrow" bg="#B45309" title="RH pulado — Exceção Máxima" sub="Liberado com assunção de risco do gestor" date={s.dataAprovacaoGestor} />
                      {s.dataAprovacaoRH ? (
                        <TLStep icon="check" bg={GREEN_DK} title="Validado pelo RH (post-facto)" date={s.dataAprovacaoRH} sub={s.nomeAprovadorRH ? 'Por ' : undefined} subStrong={s.nomeAprovadorRH} />
                      ) : (
                        <TLStep icon="clock" bg="#D6A21A" title="Auditoria do RH pendente" sub="Validação post-facto" />
                      )}
                    </>
                  ) : s.status === 'AguardandoRH' ? (
                    <TLStep icon="clock" bg="#2D6CDF" title="Aguardando RH" sub="Pendente de validação" />
                  ) : (s.dataAprovacaoRH || reprovadoPorRH) ? (
                    <TLStep
                      icon={reprovadoPorRH ? 'x' : 'check'}
                      bg={reprovadoPorRH ? RED : GREEN_DK}
                      title={reprovadoPorRH ? 'Reprovado pelo RH' : 'Aprovado pelo RH'}
                      date={s.dataAprovacaoRH}
                      sub={s.nomeAprovadorRH ? 'Por ' : undefined}
                      subStrong={s.nomeAprovadorRH}
                    />
                  ) : null}

                  {s.horaSaida && (
                    <TLStep icon="box" bg={AMBER_DK} title="Saída Registrada" date={s.horaSaida} sub="Vigilante: " subStrong={s.nomeVigilante ?? '—'} />
                  )}

                  {s.horaRetorno ? (
                    <TLStep icon="back" bg="#6B7280" title="Retorno Registrado" date={s.horaRetorno} sub="Solicitação concluída." last />
                  ) : s.status === 'Concluido' && s.horaSaida ? (
                    <TLStep icon="back" bg="#6B7280" title="Concluído" sub="Saída sem previsão de retorno." last />
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* ── Rodapé ── */}
          <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0, background: '#fff' }}>
            {podeAprovar && (
              <>
                <button
                  onClick={() => setReprovando(true)}
                  disabled={loading}
                  style={{ background: '#fff', color: RED, border: `1px solid ${RED}`, padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Reprovar
                </button>
                <button
                  onClick={() => setConfirmando(true)}
                  disabled={loading}
                  style={{ background: GREEN, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Aprovando…' : 'Aprovar'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              disabled={loading}
              style={{ background: '#fff', color: '#374151', border: `1px solid ${BORDER}`, padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      <ReprovacaoModal
        isOpen={reprovando}
        onClose={() => setReprovando(false)}
        onConfirm={confirmarReprovacao}
      />

      {/* Trava de confirmação transversal */}
      <ConfirmacaoAprovacaoModal
        show={confirmando}
        nomeUsuario={s?.nome ?? ''}
        loading={loading}
        onClose={() => setConfirmando(false)}
        onConfirm={aprovar}
      />
    </>
  );
};

export default DetalhesSolicitacaoModal;
