import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { SETORES_USUARIO, UNIDADES } from '../constants/opcoes';

const BG = '#073c60';

const LOGO_PATHS = [
  '/chibatao-logo.png',
  '/chibatao-logo.jpg',
  '/logo.png',
  '/logo.jpg',
  '/chibatao.png',
];

/* ── Mesmo fallback de logo usado no LoginPage ── */
const ChibataoLogo: React.FC = () => (
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

const LBL = 'form-label fw-semibold text-uppercase';
const lblStyle: React.CSSProperties = { fontSize: '0.72rem', letterSpacing: '0.06em', color: '#6b7280' };
const inputStyle: React.CSSProperties = { height: 48, borderRadius: 10 };

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '',
    matricula: '',
    email: '',
    setor: '',
    unidade: '',
    senha: '',
    confirmarSenha: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoIdx, setLogoIdx] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLogoError = () => {
    const next = logoIdx + 1;
    if (next < LOGO_PATHS.length) setLogoIdx(next);
    else setLogoFailed(true);
  };

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (form.senha !== form.confirmarSenha) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.registro({
        nome: form.nome,
        matricula: form.matricula,
        email: form.email,
        setor: form.setor,
        unidade: form.unidade,
        senha: form.senha,
      });
      setSuccess(data.message);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao realizar cadastro.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row g-0 h-100">

        {/* ── Coluna esquerda: Branding (mesma logo do Login) ── */}
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
        <div className="col-md-7 d-flex align-items-center justify-content-center bg-white overflow-auto">
          <div className="w-100 px-4 px-md-5 py-4" style={{ maxWidth: 480 }}>

            {/* Header mobile */}
            <div className="d-md-none text-center mb-4">
              <p className="fw-black mb-0" style={{ fontSize: '1.5rem', color: BG, letterSpacing: '0.15em' }}>NOVO CADASTRO</p>
              <p className="small text-muted mb-0">Aguarde a aprovação do administrador.</p>
            </div>

            <div className="d-none d-md-block mb-4">
              <h2 className="fw-bold mb-1">Criar conta</h2>
              <p className="text-muted small mb-0">Preencha seus dados para solicitar acesso.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className={LBL} style={lblStyle}>Nome completo <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  style={inputStyle}
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  autoFocus
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className={LBL} style={lblStyle}>Matrícula <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    style={inputStyle}
                    value={form.matricula}
                    onChange={(e) => set('matricula', e.target.value)}
                    placeholder="Ex: TI001"
                    required
                  />
                </div>
                <div className="col-6">
                  <label className={LBL} style={lblStyle}>Setor <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    style={inputStyle}
                    value={form.setor}
                    onChange={(e) => set('setor', e.target.value)}
                    required
                  >
                    <option value="">Selecione…</option>
                    {SETORES_USUARIO.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className={LBL} style={lblStyle}>Unidade <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  style={inputStyle}
                  value={form.unidade}
                  onChange={(e) => set('unidade', e.target.value)}
                  required
                >
                  <option value="">Selecione…</option>
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className={LBL} style={lblStyle}>E-mail <span className="text-danger">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  style={inputStyle}
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className={LBL} style={lblStyle}>Senha <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    style={inputStyle}
                    value={form.senha}
                    onChange={(e) => set('senha', e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="col-6">
                  <label className={LBL} style={lblStyle}>Confirmar Senha <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    style={inputStyle}
                    value={form.confirmarSenha}
                    onChange={(e) => set('confirmarSenha', e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small mb-3">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 py-2 mt-1 fw-semibold"
                style={{ backgroundColor: BG, borderColor: BG }}
              >
                {loading ? 'Cadastrando…' : 'Criar Conta'}
              </button>
            </form>

            <p className="text-center small text-muted mt-4">
              Já tem conta?{' '}
              <Link to="/login" className="fw-medium text-decoration-none" style={{ color: BG }}>
                Fazer login
              </Link>
            </p>
          </div>
        </div>

      </div>

      {/* Modal: cadastro realizado (fica sobre a própria tela de cadastro) */}
      {success && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1080 }}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4 p-md-5 text-center"
            style={{ maxWidth: 420, width: '100%' }}
          >
            <div style={{ fontSize: '2.75rem', lineHeight: 1 }}>✅</div>
            <h2 className="fw-bold mt-3 mb-3" style={{ color: BG }}>Cadastro Realizado!</h2>

            <div className="d-flex align-items-start gap-3 text-start bg-warning-subtle border border-warning-subtle rounded-3 px-3 py-3 mb-4">
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⏳</span>
              <div>
                <p className="fw-semibold small mb-1" style={{ color: '#92400e' }}>Aguarde a aprovação do acesso</p>
                <p className="small mb-0" style={{ color: '#92400e' }}>{success}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="btn w-100 py-2 fw-semibold text-white"
              style={{ backgroundColor: BG, borderColor: BG }}
            >
              Voltar para o Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUpPage;
