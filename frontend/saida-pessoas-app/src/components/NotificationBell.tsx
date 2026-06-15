import React, { useCallback, useEffect, useRef, useState } from 'react';
import { notificacaoService, solicitacaoService } from '../services/api';
import type { Notificacao, SolicitacaoResponse } from '../types';
import DetalhesSolicitacaoModal from './DetalhesSolicitacaoModal';

const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const NotificationBell: React.FC = () => {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [detalhe, setDetalhe] = useState<SolicitacaoResponse | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const { data } = await notificacaoService.contarNaoLidas();
      setCount(data.count);
    } catch { /* silencioso */ }
  }, []);

  // Polling do contador (~30s) — mantém o cache de contexto quente.
  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, 30000);
    return () => clearInterval(t);
  }, [refreshCount]);

  // Fecha ao clicar fora.
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = async () => {
    const novo = !open;
    setOpen(novo);
    if (novo) {
      setLoading(true);
      try {
        const { data } = await notificacaoService.listar(20);
        setItems(data);
      } catch { /* silencioso */ } finally { setLoading(false); }
    }
  };

  const marcarLida = async (n: Notificacao) => {
    if (n.lida) return;
    try {
      await notificacaoService.marcarLida(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, lida: true } : x)));
      setCount((c) => Math.max(0, c - 1));
    } catch { /* silencioso */ }
  };

  // Clicar na notificação: marca como lida e abre os detalhes da solicitação relacionada.
  const abrirNotificacao = async (n: Notificacao) => {
    marcarLida(n);
    if (n.solicitacaoId) {
      setOpen(false);
      try {
        const { data } = await solicitacaoService.obterPorId(n.solicitacaoId);
        setDetalhe(data);
      } catch { /* silencioso */ }
    }
  };

  const marcarTodas = async () => {
    try {
      await notificacaoService.marcarTodasLidas();
      setItems((prev) => prev.map((x) => ({ ...x, lida: true })));
      setCount(0);
    } catch { /* silencioso */ }
  };

  return (
    <>
    <div className="position-relative" ref={ref}>
      <button
        type="button"
        className="btn border-0 p-1 position-relative"
        style={{ color: 'rgba(255,255,255,0.85)' }}
        onClick={toggle}
        title="Notificações"
        aria-label="Notificações"
      >
        <BellIcon />
        {count > 0 && (
          <span
            className="position-absolute badge rounded-pill bg-danger"
            style={{ top: 2, right: 0, fontSize: '0.6rem', transform: 'translate(35%, -25%)' }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="position-absolute end-0 mt-2 bg-white rounded shadow border"
          style={{ width: 340, maxWidth: '90vw', zIndex: 1060 }}
        >
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <span className="fw-semibold text-dark">Notificações</span>
            {count > 0 && (
              <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={marcarTodas}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center text-muted py-4 small">Carregando…</div>
            ) : items.length === 0 ? (
              <div className="text-center text-muted py-4 small">Nenhuma notificação.</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => abrirNotificacao(n)}
                  className={`d-block w-100 text-start border-0 border-bottom px-3 py-2 ${n.lida ? 'bg-white' : 'bg-light'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex gap-2">
                    {!n.lida && (
                      <span className="rounded-circle bg-primary mt-1" style={{ width: 8, height: 8, flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div className={`small text-dark ${n.lida ? '' : 'fw-medium'}`}>{n.mensagem}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {new Date(n.dataCriacao).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>

    <DetalhesSolicitacaoModal solicitacao={detalhe} onClose={() => setDetalhe(null)} />
    </>
  );
};

export default NotificationBell;
