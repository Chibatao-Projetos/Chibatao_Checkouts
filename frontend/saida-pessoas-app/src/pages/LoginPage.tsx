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
                <label className="form-label">Login</label>
                <input
                  type="text"
                  className="form-control"
                  value={identificacao}
                  onChange={e => setIdentificacao(e.target.value)}
                  placeholder="Digite seu e-mail ou matrícula"
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  className="form-control"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="alert alert-danger py-2 small">{error}</div>
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

            <details className="mt-4">
              <summary className="small text-muted" style={{ cursor: 'pointer' }}>
                Credenciais de demonstração
              </summary>
              <div className="bg-light rounded p-3 mt-2 small text-muted">
                <div><strong>Admin:</strong> admin@empresa.com / admin123</div>
                <div><strong>Solicitante:</strong> solicitante@empresa.com / 123456</div>
                <div><strong>Gestor:</strong> gestor@empresa.com / 123456</div>
                <div><strong>RH:</strong> rh@empresa.com / 123456</div>
                <div><strong>Portaria:</strong> portaria@empresa.com / 123456</div>
              </div>
            </details>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;