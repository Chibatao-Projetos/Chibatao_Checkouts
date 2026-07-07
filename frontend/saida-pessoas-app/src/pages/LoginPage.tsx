import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BG = '#073c60';

const LOGO_PATHS = [
  '/chibatao-logo.png',
  '/chibatao-logo.jpg',
  '/logo.png',
  '/logo.jpg',
  '/chibatao.png',
];

const ChibataoLogo = () => (
  <div className="text-center mb-4">
    <div className="d-inline-flex flex-column align-items-center">
      <div
        className="rounded-3 d-flex align-items-center justify-content-center mb-3"
        style={{ width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.25}
          strokeLinecap="round" strokeLinejoin="round" width={56} height={56}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          <path d="M7 17l3-3 2 2 5-5" strokeWidth={1.5} />
        </svg>
      </div>
      <p className="fw-black text-white mb-0" style={{ fontSize: '1.75rem', letterSpacing: '0.2em' }}>CHIBATÃO</p>
      <p className="fw-light text-white mb-2" style={{ fontSize: '0.9rem', letterSpacing: '0.3em', opacity: 0.65 }}>CHECK OUTS</p>
      <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>
        Conectando o Amazonas ao Mundo
      </p>
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [identificacao, setIdentificacao] = useState('');
  const [senha, setSenha]   = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [logoIdx, setLogoIdx]     = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLogoError = () => {
    const next = logoIdx + 1;
    if (next < LOGO_PATHS.length) setLogoIdx(next);
    else setLogoFailed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identificacao.trim(), senha);
      navigate('/inicio');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Credenciais inválidas.'
      );
    } finally { setLoading(false); }
  };

  // Erros de status de conta (pendente/aprovação/desativada) viram modal com OK.
  const isAprovacaoPendente = /aprova|pendente|desativ/i.test(error);

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row g-0 h-100">

        {/* ── Coluna esquerda: Branding ── */}
        <div
          className="col-md-5 d-none d-md-flex align-items-center justify-content-center"
          style={{ backgroundColor: BG }}
        >
          {logoFailed ? (
            <ChibataoLogo />
          ) : (
            <img
              src={LOGO_PATHS[logoIdx]}
              alt="Chibatão Check Outs"
              className="img-fluid"
              style={{ maxWidth: '80%', maxHeight: '60vh', objectFit: 'contain' }}
              onError={handleLogoError}
            />
          )}
        </div>

        {/* ── Coluna direita: Formulário ── */}
        <div className="col-md-7 d-flex align-items-center justify-content-center bg-white">
          <div className="w-100 px-4 px-md-5" style={{ maxWidth: 420 }}>

            {/* Logo mobile */}
            <div className="d-md-none text-center mb-4">
              <p className="fw-black mb-0" style={{ fontSize: '1.5rem', color: BG, letterSpacing: '0.15em' }}>CHIBATÃO</p>
              <p className="small text-muted mb-0">Sistema de Autorização de Saída</p>
            </div>

            <h2 className="fw-bold mb-1">Entrar</h2>
            <p className="text-muted small mb-4">Bem-vindo de volta. Acesse sua conta.</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', color: '#6b7280' }}>
                  E-mail ou Matrícula
                </label>
                <div className="position-relative">
                  <span className="position-absolute top-50 translate-middle-y text-muted" style={{ left: 14, pointerEvents: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: 42, height: 48, borderRadius: 10 }}
                    value={identificacao}
                    onChange={e => setIdentificacao(e.target.value)}
                    placeholder="ex: 123456 ou nome@empresa.com.br"
                    autoComplete="username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', color: '#6b7280' }}>
                  Senha de acesso
                </label>
                <div className="position-relative">
                  <span className="position-absolute top-50 translate-middle-y text-muted" style={{ left: 14, pointerEvents: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showSenha ? 'text' : 'password'}
                    className="form-control"
                    style={{ paddingLeft: 42, paddingRight: 44, height: 48, borderRadius: 10 }}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder=""
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(s => !s)}
                    className="position-absolute top-50 translate-middle-y p-0 border-0 bg-transparent text-muted"
                    style={{ right: 14, lineHeight: 0 }}
                    tabIndex={-1}
                    aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showSenha ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && !isAprovacaoPendente && (
                <div className="alert alert-danger py-2 small mb-3">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 py-2 mt-1"
                style={{ backgroundColor: BG, borderColor: BG }}
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <p className="text-center small text-muted mt-4">
              Não tem conta?{' '}
              <Link to="/signup" className="fw-medium text-decoration-none" style={{ color: BG }}>
                Criar conta
              </Link>
            </p>
          </div>
        </div>

      </div>

      {/* Modal: conta aguardando aprovação (fica até o usuário clicar em OK) */}
      {error && isAprovacaoPendente && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1080 }}
          onClick={() => setError('')}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4 text-center"
            style={{ maxWidth: 380, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.75rem', lineHeight: 1 }}>⏳</div>
            <h5 className="fw-bold mt-3 mb-2" style={{ color: BG }}>Aguardando aprovação</h5>
            <p className="text-muted small mb-4">{error}</p>
            <button
              type="button"
              className="btn w-100 py-2 text-white fw-semibold"
              style={{ backgroundColor: BG, borderColor: BG }}
              onClick={() => setError('')}
              autoFocus
            >
              OK, entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;