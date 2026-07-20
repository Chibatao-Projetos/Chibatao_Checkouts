import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

export type ConfirmacaoVariant = 'aprovar' | 'excecao' | 'validarPostFacto' | 'registrarSaida' | 'registrarRetorno';

interface Props {
  show: boolean;
  /** Nome do usuário dono da solicitação — aparece na mensagem de confirmação. */
  nomeUsuario: string;
  variant?: ConfirmacaoVariant;
  loading?: boolean;
  onClose: () => void;
  /** No variant 'excecao', recebe o motivo/justificativa digitado (opcional). */
  onConfirm: (motivo?: string) => void | Promise<void>;
}

const TITULOS: Record<ConfirmacaoVariant, string> = {
  aprovar:          'Confirmar aprovação',
  excecao:          '⚠ Aprovação de Exceção Máxima',
  validarPostFacto: 'Validação post-facto (RH)',
  registrarSaida:   'Confirmar Registro de Saída',
  registrarRetorno: 'Confirmar Registro de Retorno',
};

const MENSAGENS: Record<ConfirmacaoVariant, string> = {
  aprovar:          'Tem certeza que deseja aprovar essa solicitação do usuário',
  excecao:          'Tem certeza que deseja aprovar essa solicitação do usuário',
  validarPostFacto: 'Tem certeza que deseja aprovar essa solicitação do usuário',
  registrarSaida:   'Tem certeza que deseja realizar a saída do colaborador',
  registrarRetorno: 'Tem certeza que deseja registrar o retorno do colaborador',
};

/**
 * Trava de confirmação transversal: toda aprovação passa por aqui.
 * Mobile-first: botões empilhados em tela pequena, lado a lado em ≥576px.
 */
const ConfirmacaoAprovacaoModal: React.FC<Props> = ({
  show, nomeUsuario, variant = 'aprovar', loading = false, onClose, onConfirm,
}) => {
  const [motivo, setMotivo] = useState('');
  useEffect(() => { if (show) setMotivo(''); }, [show]);

  const isExcecao = variant === 'excecao';

  return (
    <Modal
      show={show}
      onHide={loading ? undefined : onClose}
      centered
      backdrop="static"
    >
      <Modal.Header closeButton={!loading} className={isExcecao ? 'bg-warning-subtle' : undefined}>
        <Modal.Title className="fs-6 fw-semibold">{TITULOS[variant]}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-2" style={{ fontSize: '0.95rem' }}>
          {MENSAGENS[variant]}{' '}
          <strong>{nomeUsuario}</strong>?
        </p>

        {isExcecao && (
          <>
            <div className="alert alert-warning small py-2 mb-3">
              <strong>Assunção de risco:</strong> a etapa de aprovação do RH será{' '}
              <strong>pulada</strong> e a solicitação irá direto para a fila da Portaria.
              O RH será notificado para auditar e validar esta saída no dia seguinte
              (aprovação post-facto).
            </div>
            <label className="form-label small fw-semibold text-muted text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
              Justificativa <span className="fw-normal">(recomendada para auditoria)</span>
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: RH ausente; saída urgente a serviço…"
              disabled={loading}
            />
          </>
        )}

        {variant === 'validarPostFacto' && (
          <p className="text-muted small mb-0">
            Esta saída foi liberada por Exceção Máxima do gestor. Ao confirmar, você registra a
            validação post-facto do RH sobre ela.
          </p>
        )}
      </Modal.Body>

      <Modal.Footer className="d-grid gap-2 d-sm-flex justify-content-sm-end">
        <button
          type="button"
          className="btn btn-outline-secondary order-sm-1"
          onClick={onClose}
          disabled={loading}
        >
          Não
        </button>
        <button
          type="button"
          className={`btn order-sm-2 ${isExcecao ? 'btn-warning fw-semibold' : 'btn-success'}`}
          onClick={() => onConfirm(isExcecao ? motivo.trim() || undefined : undefined)}
          disabled={loading}
        >
          {loading ? 'Confirmando…' : 'Sim'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmacaoAprovacaoModal;
