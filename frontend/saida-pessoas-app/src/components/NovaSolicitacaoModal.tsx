import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { solicitacaoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { TipoSaida } from '../types';

const UNIDADES_SETORES: Record<string, string[]> = {
  ALFANDEGADO: [
    'DIRETORIA', 'COMERCIAL', 'AVERBAÇÃO', 'CONTROLADORIA', 'FATURAMENTO',
    'SGQ', 'FALTAS E AVARIAS', 'FROTA', 'PATIO', 'PIER', 'PCO', 'AMBIENTAL',
    'LOGISTICA', 'GATES', 'TI', 'ARMAZEM', 'ENTREPOSTO', 'MANUTENÇÃO DE PESADOS',
    'NAVEGAÇÃO', 'MAPA', 'RH', 'GRC', 'BOLSÃO', 'PORTARIA 3', 'PORTARIA 2',
    'SESMET', 'AMBULATÓRIO',
  ],
  ATR: [
    'RECEPÇÃO', 'GESTÃO', 'PCO', 'TERMINAL', 'BALANÇA', 'FROTA', 'GATE',
    'MANUTENÇÃO', 'SESMET', 'RH', 'FATURAMENTO', 'ARMAZÉM', 'DESEMBARQUE',
  ],
  TOMIASI: [
    'RECEPÇÃO', 'GERÊNCIA', 'REMOÇÃO', 'COMERCIAL', 'GATE', 'OFICINA DE AUTOS',
    'ABASTECIMENTO', 'TI INFORMÁTICA', 'RH BASE', 'SESMT/AMBULATÓRIO',
  ],
  RETROPORTO: [
    'PRESIDENCIA', 'DIRETORIA FINANCEIRA', 'AMBIENTAL', 'DOCUMENTAÇÃO PORTUÁRIA',
    'AREA FINANCEIRA', 'COBRANÇA', 'CONTAS A RECEBER/CAIXA', 'CONTABILIDADE',
    'CONTAS A PAGAR', 'CONTROLADORIA', 'FATURAMENTO', 'CONTABILIDADE RETROPORTO',
    'JURIDICO TRABALHISTA', 'RH', 'RECEPÇÃO PRESIDENCIAL', 'COMERCIAL', 'FISCAL',
    'TI RETROPORTO', 'SUPRIMENTOS - COMPRAS', 'ARMAZEM', 'JURIDICO CIVIL',
    'CSC/DAL', 'GRC', 'SESMET', 'AMBULATORIO', 'RECEPÇÃO RETROPORTO', 'TELEFONIA',
    'GESTÃO DE COMPETENCIA', 'COPA DIRETORIA', 'SUPORTE TOTVS/AUDITORIA',
  ],
};

const SectionHeader: React.FC<{ icon: string; title: string; withDivider?: boolean }> = ({
  icon, title, withDivider,
}) => (
  <>
    {withDivider && <hr className="my-4" />}
    <p
      className="text-uppercase text-muted small fw-semibold mb-3 d-flex align-items-center gap-2"
      style={{ letterSpacing: '0.05em' }}
    >
      <i className={`bi ${icon} fs-6`} />
      {title}
    </p>
  </>
);

interface Props {
  show: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const buildInitialState = (nome: string, setor: string) => ({
  nome,
  setor,
  tipoSaida: 'Particular' as TipoSaida,
  destino: '',
  unidadeDestino: '',
  setorDestino: '',
  motivo: '',
  previsaoRetorno: true,
  dataPrevistaRetorno: '',
  horarioPrevistodoRetorno: '',
  isExtraordinaria: false,
});

const NovaSolicitacaoModal: React.FC<Props> = ({ show, onClose, onCreated }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(() => buildInitialState(user?.nome ?? '', user?.setor ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setForm(buildInitialState(user?.nome ?? '', user?.setor ?? ''));
      setError('');
      setLoading(false);
    }
  }, [show, user?.nome, user?.setor]);

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));
  const isParticular = form.tipoSaida === 'Particular';

  const setoresDisponiveis = useMemo(
    () => (form.unidadeDestino ? UNIDADES_SETORES[form.unidadeDestino] ?? [] : []),
    [form.unidadeDestino],
  );

  const handleUnidadeChange = (unidade: string) => {
    setForm((p) => ({ ...p, unidadeDestino: unidade, setorDestino: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isParticular) {
      if (!form.unidadeDestino) { setError('Selecione a unidade de destino.'); return; }
      if (!form.setorDestino)   { setError('Selecione o setor de destino.');   return; }
      if (!form.motivo.trim())  { setError('Informe o motivo da saída.');       return; }
    }
    // Para saída a serviço, data e horário previstos são obrigatórios quando há retorno.
    // Para saída particular, ambos são opcionais.
    if (!isParticular && form.previsaoRetorno && !form.dataPrevistaRetorno) {
      setError('Informe a data prevista de retorno.');
      return;
    }
    if (!isParticular && form.previsaoRetorno && !form.horarioPrevistodoRetorno) {
      setError('Informe o horário previsto de retorno.');
      return;
    }

    const destinoServico = `${form.unidadeDestino} — ${form.setorDestino} — Motivo: ${form.motivo.trim()}`;

    setLoading(true);
    try {
      await solicitacaoService.criar({
        nome: form.nome,
        setor: form.setor,
        destino: isParticular ? form.destino.trim() : destinoServico,
        unidadeDestino: !isParticular ? form.unidadeDestino : undefined,
        setorDestino:   !isParticular ? form.setorDestino   : undefined,
        tipoSaida: form.tipoSaida,
        previsaoRetorno: form.previsaoRetorno,
        dataPrevistaRetorno: form.previsaoRetorno ? form.dataPrevistaRetorno : undefined,
        horarioPrevistodoRetorno: form.previsaoRetorno ? form.horarioPrevistodoRetorno : undefined,
        isExtraordinaria: form.isExtraordinaria,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao criar solicitação.',
      );
    } finally {
      setLoading(false);
    }
  };

  const FORM_ID = 'nova-solicitacao-form';

  return (
    <Modal
      show={show}
      onHide={loading ? undefined : onClose}
      centered
      scrollable
      size="lg"
      backdrop={loading ? 'static' : true}
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title className="fs-5 fw-semibold">Nova Solicitação de Saída</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <form id={FORM_ID} onSubmit={handleSubmit}>
          {/* ─── Informações da Saída ─── */}
          <SectionHeader icon="bi-box-arrow-up-right" title="Informações da Saída" />

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Nome completo *</label>
              <input
                type="text"
                className="form-control"
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Setor *</label>
              <input
                type="text"
                className="form-control"
                value={form.setor}
                onChange={(e) => set('setor', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Tipo de Saída *</label>
            <div className="btn-group w-100" role="group">
              <input
                type="radio" className="btn-check" name="tipoSaida" id="tipo-particular"
                checked={isParticular} onChange={() => set('tipoSaida', 'Particular')}
              />
              <label className="btn btn-outline-primary" htmlFor="tipo-particular">Particular</label>

              <input
                type="radio" className="btn-check" name="tipoSaida" id="tipo-aservico"
                checked={!isParticular} onChange={() => set('tipoSaida', 'AServico')}
              />
              <label className="btn btn-outline-primary" htmlFor="tipo-aservico">À Serviço</label>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Previsão de Retorno</label>
            <div className="btn-group w-100" role="group">
              <input
                type="radio" className="btn-check" name="retorno" id="retorno-sim"
                checked={form.previsaoRetorno} onChange={() => set('previsaoRetorno', true)}
              />
              <label className="btn btn-outline-primary" htmlFor="retorno-sim">Sim</label>

              <input
                type="radio" className="btn-check" name="retorno" id="retorno-nao"
                checked={!form.previsaoRetorno} onChange={() => set('previsaoRetorno', false)}
              />
              <label className="btn btn-outline-primary" htmlFor="retorno-nao">Não</label>
            </div>
          </div>

          {form.previsaoRetorno && (
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  Data prevista{!isParticular && ' *'}
                  {isParticular && <span className="text-muted fw-normal"> (opcional)</span>}
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={form.dataPrevistaRetorno}
                  onChange={(e) => set('dataPrevistaRetorno', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Horário previsto{!isParticular && ' *'}
                  {isParticular && <span className="text-muted fw-normal"> (opcional)</span>}
                </label>
                <input
                  type="time"
                  className="form-control"
                  value={form.horarioPrevistodoRetorno}
                  onChange={(e) => set('horarioPrevistodoRetorno', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="alert alert-warning d-flex align-items-start gap-3 mb-0 py-3">
            <div className="form-check mb-0" style={{ paddingLeft: '1.5rem' }}>
              <input
                type="checkbox"
                className="form-check-input"
                id="extraordinaria"
                checked={form.isExtraordinaria}
                onChange={(e) => set('isExtraordinaria', e.target.checked)}
                style={{ marginTop: '0.15rem' }}
              />
            </div>
            <label htmlFor="extraordinaria" style={{ cursor: 'pointer', flex: 1 }} className="mb-0">
              <span className="fw-semibold d-block">Solicitação Extraordinária</span>
              <small className="text-muted">
                Marque quando o gestor estiver ausente. A aprovação irá diretamente para o RH.
              </small>
            </label>
          </div>

          {/* ─── Detalhes do Destino ─── */}
          <SectionHeader icon="bi-geo-alt" title="Detalhes do Destino" withDivider />

          {isParticular ? (
            <div className="mb-2">
              <label className="form-label">
                Endereço / Local <span className="text-muted fw-normal">(opcional)</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={form.destino}
                onChange={(e) => set('destino', e.target.value)}
                placeholder="Ex: Rua das Flores, 123 — São Paulo/SP"
              />
            </div>
          ) : (
            <>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Unidade de Destino *</label>
                  <select
                    className="form-select"
                    value={form.unidadeDestino}
                    onChange={(e) => handleUnidadeChange(e.target.value)}
                    required
                  >
                    <option value="">Selecione…</option>
                    {Object.keys(UNIDADES_SETORES).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Setor de Destino *</label>
                  <select
                    className="form-select"
                    value={form.setorDestino}
                    onChange={(e) => set('setorDestino', e.target.value)}
                    disabled={!form.unidadeDestino}
                    required
                  >
                    <option value="">
                      {form.unidadeDestino ? 'Selecione…' : 'Escolha uma unidade primeiro'}
                    </option>
                    {setoresDisponiveis.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label">Motivo *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.motivo}
                  onChange={(e) => set('motivo', e.target.value)}
                  placeholder="Descreva a justificativa da saída a serviço…"
                  required
                />
              </div>
            </>
          )}

          {error && <div className="alert alert-danger small py-2 mt-3 mb-0">{error}</div>}
        </form>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
        <button type="submit" form={FORM_ID} className="btn btn-primary" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar Solicitação'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default NovaSolicitacaoModal;