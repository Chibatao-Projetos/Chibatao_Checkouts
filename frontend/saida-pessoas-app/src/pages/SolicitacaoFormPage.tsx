import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { solicitacaoService } from '../services/api';
import type { TipoSaida } from '../types';
import { useAuth } from '../contexts/AuthContext';

const SolicitacaoFormPage: React.FC = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    nome: user?.nome ?? '',
    setor: user?.setor ?? '',
    tipoSaida: 'Particular' as TipoSaida,
    destino: '',
    unidadeDestino: '',
    setorDestino: '',
    previsaoRetorno: true,
    dataPrevistaRetorno: '',
    horarioPrevistodoRetorno: '',
    isExtraordinaria: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (key: string, value: unknown) =>
    setForm(p => ({ ...p, [key]: value }));

  const isParticular = form.tipoSaida === 'Particular';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isParticular && !form.destino.trim()) { setError('Informe o endereço/local de destino.'); return; }
    if (!isParticular && !form.unidadeDestino.trim() && !form.setorDestino.trim()) { setError('Informe a unidade ou setor de destino.'); return; }
    if (form.previsaoRetorno && !form.dataPrevistaRetorno) { setError('Informe a data prevista de retorno.'); return; }
    if (form.previsaoRetorno && !form.horarioPrevistodoRetorno) { setError('Informe o horário previsto de retorno.'); return; }

    setLoading(true);
    try {
      await solicitacaoService.criar({
        nome: form.nome,
        setor: form.setor,
        destino: isParticular ? form.destino : `${form.unidadeDestino} — ${form.setorDestino}`,
        unidadeDestino: !isParticular ? form.unidadeDestino : undefined,
        setorDestino:   !isParticular ? form.setorDestino   : undefined,
        tipoSaida: form.tipoSaida,
        previsaoRetorno: form.previsaoRetorno,
        dataPrevistaRetorno: form.previsaoRetorno ? form.dataPrevistaRetorno : undefined,
        horarioPrevistodoRetorno: form.previsaoRetorno ? form.horarioPrevistodoRetorno : undefined,
        isExtraordinaria: form.isExtraordinaria,
      });
      navigate('/solicitacoes/pessoas');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao criar solicitação.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-sm btn-link text-decoration-none px-0 mb-4"
      >
        ← Voltar
      </button>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>

                {/* ── Identificação ── */}
                <p className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.05em' }}>
                  Identificação
                </p>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Nome completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.nome}
                      onChange={e => set('nome', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Setor *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.setor}
                      onChange={e => set('setor', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* ── Tipo de Saída ── */}
                <p className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.05em' }}>
                  Tipo de Saída
                </p>
                <div className="mb-3">
                  <div className="btn-group w-100" role="group">
                    <input type="radio" className="btn-check" name="tipoSaida" id="particular"
                      checked={isParticular} onChange={() => set('tipoSaida', 'Particular')} />
                    <label className="btn btn-outline-primary" htmlFor="particular">Particular</label>

                    <input type="radio" className="btn-check" name="tipoSaida" id="aservico"
                      checked={!isParticular} onChange={() => set('tipoSaida', 'AServico')} />
                    <label className="btn btn-outline-primary" htmlFor="aservico">À Serviço</label>
                  </div>
                </div>

                {/* Condicional: Particular → Endereço */}
                {isParticular && (
                  <div className="mb-4">
                    <label className="form-label">Endereço / Local de destino *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.destino}
                      onChange={e => set('destino', e.target.value)}
                      placeholder="Ex: Rua das Flores, 123 — São Paulo/SP"
                      required
                    />
                  </div>
                )}

                {/* Condicional: À Serviço → Unidade + Setor */}
                {!isParticular && (
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Unidade de Destino *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.unidadeDestino}
                        onChange={e => set('unidadeDestino', e.target.value)}
                        placeholder="Ex: Filial Norte"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Setor de Destino *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.setorDestino}
                        onChange={e => set('setorDestino', e.target.value)}
                        placeholder="Ex: Compras"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* ── Previsão de Retorno ── */}
                <p className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.05em' }}>
                  Previsão de Retorno
                </p>
                <div className="mb-3">
                  <div className="btn-group w-100" role="group">
                    <input type="radio" className="btn-check" name="retorno" id="sim"
                      checked={form.previsaoRetorno} onChange={() => set('previsaoRetorno', true)} />
                    <label className="btn btn-outline-primary" htmlFor="sim">Sim</label>

                    <input type="radio" className="btn-check" name="retorno" id="nao"
                      checked={!form.previsaoRetorno} onChange={() => set('previsaoRetorno', false)} />
                    <label className="btn btn-outline-primary" htmlFor="nao">Não</label>
                  </div>
                </div>

                {form.previsaoRetorno && (
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Data Prevista de Retorno *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.dataPrevistaRetorno}
                        onChange={e => set('dataPrevistaRetorno', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Horário Previsto *</label>
                      <input
                        type="time"
                        className="form-control"
                        value={form.horarioPrevistodoRetorno}
                        onChange={e => set('horarioPrevistodoRetorno', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* ── Extraordinária ── */}
                <div className="alert alert-warning d-flex align-items-start gap-3 mb-4 py-3">
                  <div className="form-check mb-0 mt-0" style={{ paddingLeft: '1.5rem' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="extraordinaria"
                      checked={form.isExtraordinaria}
                      onChange={e => set('isExtraordinaria', e.target.checked)}
                      style={{ marginTop: '0.15rem' }}
                    />
                  </div>
                  <label htmlFor="extraordinaria" style={{ cursor: 'pointer', flex: 1 }}>
                    <span className="fw-semibold d-block">Solicitação Extraordinária</span>
                    <small className="text-muted">
                      Marque quando o gestor estiver ausente. A aprovação irá diretamente para o RH.
                    </small>
                  </label>
                </div>

                {error && <div className="alert alert-danger small py-2">{error}</div>}

                <div className="row g-2">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={() => navigate(-1)}
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100"
                    >
                      {loading ? 'Enviando…' : 'Enviar Solicitação'}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolicitacaoFormPage;