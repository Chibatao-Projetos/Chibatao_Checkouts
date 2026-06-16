import React, { useState, useEffect } from 'react';

interface ReprovacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
}

const ReprovacaoModal: React.FC<ReprovacaoModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      setError('O motivo da reprovação é obrigatório.');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(motivo.trim());
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao reprovar solicitação.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4" style={{ zIndex: 2000 }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-lg font-bold shrink-0">
            ✕
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Reprovar Solicitação</h3>
            <p className="text-xs text-gray-500">Informe o motivo para registrar a reprovação.</p>
          </div>
        </div>

        <textarea
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            setError('');
          }}
          placeholder="Descreva o motivo da reprovação..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          autoFocus
        />

        {error && (
          <p className="text-red-600 text-xs mt-1.5 bg-red-50 px-2 py-1 rounded">{error}</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Reprovando…' : 'Confirmar Reprovação'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReprovacaoModal;
