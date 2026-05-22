import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usuariosService } from '../services/api';

const PERFIL_LABEL: Record<string, string> = {
  Solicitante: 'Solicitante', Gestor: 'Gestor', RH: 'Recursos Humanos',
  Portaria: 'Portaria', Admin: 'Administrador',
};

const PerfilPage: React.FC = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.novaSenha.length < 6) { setError('A nova senha deve ter no mínimo 6 caracteres.'); return; }
    if (form.novaSenha !== form.confirmar) { setError('As senhas não conferem.'); return; }
    setLoading(true);
    try {
      await usuariosService.alterarSenha(form.senhaAtual, form.novaSenha);
      setSuccess('Senha alterada com sucesso!');
      setForm({ senhaAtual: '', novaSenha: '', confirmar: '' });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao alterar senha.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="container-fluid p-4">
      <div className="row justify-content-center g-4">

        {/* ── Dados Cadastrais ── */}
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <p className="text-uppercase text-muted small fw-semibold mb-3"
                style={{ letterSpacing: '0.05em' }}>
                Dados Cadastrais
              </p>
              {[
                { label: 'Nome completo',    value: user?.nome },
                { label: 'Setor',            value: user?.setor },
                { label: 'Perfil de acesso', value: PERFIL_LABEL[user?.perfil ?? ''] ?? user?.perfil },
              ].map(({ label, value }) => (
                <div key={label}
                  className="d-flex gap-3 py-2 border-bottom"
                  style={{ borderColor: '#f0f0f0' }}>
                  <span className="text-muted small" style={{ minWidth: 140 }}>{label}</span>
                  <span className="small fw-medium">{value ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Alterar Senha ── */}
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <p className="text-uppercase text-muted small fw-semibold mb-3"
                style={{ letterSpacing: '0.05em' }}>
                Alterar Senha
              </p>
              <form onSubmit={handleSubmit}>
                {[
                  { label: 'Senha atual',          key: 'senhaAtual',  placeholder: 'Sua senha atual' },
                  { label: 'Nova senha',            key: 'novaSenha',   placeholder: 'Mín. 6 caracteres' },
                  { label: 'Confirmar nova senha',  key: 'confirmar',   placeholder: 'Repita a nova senha' },
                ].map(({ label, key, placeholder }) => (
                  <div className="mb-3" key={key}>
                    <label className="form-label">{label}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      required
                    />
                  </div>
                ))}

                {error   && <div className="alert alert-danger   py-2 small">{error}</div>}
                {success && <div className="alert alert-success  py-2 small">{success}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100"
                >
                  {loading ? 'Salvando…' : 'Alterar Senha'}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerfilPage;