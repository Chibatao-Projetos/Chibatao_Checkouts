import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';
import type { UsuarioResponse } from '../types';
import { SETORES_USUARIO, UNIDADES } from '../constants/opcoes';
import UsuarioStatusPill from '../components/ui/UsuarioStatusPill';

const PERFIS = ['Solicitante', 'Gestor', 'RH', 'Portaria', 'Admin'];

const CheckMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const XMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
);
const BackArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
);

const errMsg = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

type Msg = { type: 'success' | 'error'; text: string } | null;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
    <h6 className="text-blue-800 text-xs font-bold uppercase tracking-wider mb-4">{title}</h6>
    {children}
  </div>
);

const MsgLine: React.FC<{ msg: Msg }> = ({ msg }) =>
  msg ? (
    <p className={`text-xs mt-2 px-2 py-1 rounded inline-block ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {msg.text}
    </p>
  ) : null;

const AdminUsuarioDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const userId = Number(id);

  const [usuario, setUsuario] = useState<UsuarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [acaoLoading, setAcaoLoading] = useState(false);

  const [perfilValue, setPerfilValue] = useState('Solicitante');
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState<Msg>(null);

  const [setorValue, setSetorValue] = useState('');
  const [unidadeValue, setUnidadeValue] = useState('');
  const [setorLoading, setSetorLoading] = useState(false);
  const [setorMsg, setSetorMsg] = useState<Msg>(null);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaLoading, setSenhaLoading] = useState(false);
  const [senhaMsg, setSenhaMsg] = useState<Msg>(null);

  const [confirmAcao, setConfirmAcao] = useState<'bloquear' | 'excluir' | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const fetchUsuario = useCallback(async () => {
    try {
      const { data } = await adminService.obterUsuario(userId);
      setUsuario(data);
      setPerfilValue(data.perfil);
      setSetorValue(data.setor);
      setUnidadeValue(data.unidade ?? '');
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUsuario(); }, [fetchUsuario]);

  const isMe = usuario?.id === authUser?.userId;

  const handleAprovar = async () => {
    if (!usuario) return;
    setAcaoLoading(true);
    try {
      await adminService.aprovarUsuario(usuario.id);
      await fetchUsuario();
    } catch (err) {
      alert(errMsg(err, 'Erro ao aprovar.'));
    } finally {
      setAcaoLoading(false);
    }
  };

  const handleRejeitar = async () => {
    if (!usuario) return;
    if (!window.confirm('Deseja rejeitar este cadastro?')) return;
    setAcaoLoading(true);
    try {
      await adminService.rejeitarUsuario(usuario.id);
      await fetchUsuario();
    } catch {
      alert('Erro ao rejeitar.');
    } finally {
      setAcaoLoading(false);
    }
  };

  const handleSalvarPerfil = async () => {
    if (!usuario) return;
    setPerfilLoading(true);
    setPerfilMsg(null);
    try {
      await adminService.alterarPerfil(usuario.id, perfilValue);
      setPerfilMsg({ type: 'success', text: 'Perfil atualizado.' });
      await fetchUsuario();
    } catch (err) {
      setPerfilMsg({ type: 'error', text: errMsg(err, 'Erro ao salvar perfil.') });
    } finally {
      setPerfilLoading(false);
    }
  };

  const handleSalvarSetor = async () => {
    if (!usuario) return;
    if (!setorValue || !unidadeValue) {
      setSetorMsg({ type: 'error', text: 'Selecione setor e unidade.' });
      return;
    }
    setSetorLoading(true);
    setSetorMsg(null);
    try {
      await adminService.alterarSetor(usuario.id, setorValue, unidadeValue);
      setSetorMsg({ type: 'success', text: 'Setor e unidade atualizados.' });
      await fetchUsuario();
    } catch (err) {
      setSetorMsg({ type: 'error', text: errMsg(err, 'Erro ao salvar setor.') });
    } finally {
      setSetorLoading(false);
    }
  };

  const handleRedefinirSenha = async () => {
    if (!usuario) return;
    if (novaSenha.length < 6) { setSenhaMsg({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' }); return; }
    if (novaSenha !== confirmarSenha) { setSenhaMsg({ type: 'error', text: 'As senhas não conferem.' }); return; }
    setSenhaLoading(true);
    setSenhaMsg(null);
    try {
      await adminService.alterarSenha(usuario.id, novaSenha);
      setSenhaMsg({ type: 'success', text: 'Senha redefinida com sucesso.' });
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err) {
      setSenhaMsg({ type: 'error', text: errMsg(err, 'Erro ao redefinir senha.') });
    } finally {
      setSenhaLoading(false);
    }
  };

  const handleConfirmAcao = async () => {
    if (!usuario || !confirmAcao) return;
    setConfirmLoading(true);
    setConfirmError('');
    try {
      if (confirmAcao === 'bloquear') {
        await adminService.bloquearUsuario(usuario.id);
        setConfirmAcao(null);
        await fetchUsuario();
      } else {
        await adminService.excluirUsuario(usuario.id);
        navigate('/admin');
      }
    } catch (err) {
      setConfirmError(errMsg(err, `Erro ao ${confirmAcao} usuário.`));
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center text-gray-400">Carregando…</div>;
  }
  if (notFound || !usuario) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <p className="text-gray-500 mb-4">Usuário não encontrado.</p>
        <button onClick={() => navigate('/admin')} className="text-blue-600 hover:underline text-sm">← Voltar</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Cabeçalho: voltar + breadcrumb ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          <BackArrowIcon /> Voltar
        </button>
        <p className="text-xs text-gray-400">
          <Link to="/inicio" className="hover:underline">Início</Link>
          {' › '}
          <Link to="/admin" className="hover:underline">Administração</Link>
          {' › '}
          <span className="text-gray-600">{usuario.nome}</span>
        </p>
      </div>

      {/* ── Conta ── */}
      <Section title="Conta">
        <div className="flex flex-wrap justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Informações da conta</p>
            <div className="text-sm text-gray-700 space-y-1.5">
              <p><span className="text-gray-400">ID:</span> {usuario.id}</p>
              <p><span className="text-gray-400">Nome:</span> {usuario.nome}</p>
              <p><span className="text-gray-400">Matrícula:</span> {usuario.matricula}</p>
              <p><span className="text-gray-400">E-mail:</span> {usuario.email}</p>
              <p><span className="text-gray-400">Setor:</span> {usuario.setor} {usuario.unidade ? `· ${usuario.unidade}` : ''}</p>
              <div className="flex items-center gap-2 pt-1">
                {usuario.status !== 'Pendente' ? <CheckMark /> : <XMark />}
                <span>Aprovada</span>
              </div>
              <div className="flex items-center gap-2">
                {usuario.status === 'Ativo' ? <CheckMark /> : <XMark />}
                <span>Ativo</span>
              </div>
              <div className="pt-1"><UsuarioStatusPill status={usuario.status} /></div>
            </div>
          </div>

          <div className="min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
            <div className="flex gap-2">
              <select
                value={perfilValue}
                onChange={(e) => setPerfilValue(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button
                onClick={handleSalvarPerfil}
                disabled={perfilLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {perfilLoading ? 'Salvando…' : 'Alterar'}
              </button>
            </div>
            <MsgLine msg={perfilMsg} />
          </div>
        </div>
      </Section>

      {/* ── Setor e Unidade ── */}
      <Section title="Setor e Unidade">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
            <select
              value={setorValue}
              onChange={(e) => setSetorValue(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione…</option>
              {SETORES_USUARIO.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <select
              value={unidadeValue}
              onChange={(e) => setUnidadeValue(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione…</option>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button
            onClick={handleSalvarSetor}
            disabled={setorLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {setorLoading ? 'Salvando…' : 'Alterar'}
          </button>
        </div>
        <MsgLine msg={setorMsg} />
      </Section>

      {/* ── Segurança ── */}
      <Section title="Segurança">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mín. 6 caracteres"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleRedefinirSenha}
            disabled={senhaLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {senhaLoading ? 'Salvando…' : 'Redefinir senha'}
          </button>
        </div>
        <MsgLine msg={senhaMsg} />
      </Section>

      {/* ── Ações da conta ── */}
      <Section title="Ações da conta">
        <div className="flex flex-wrap gap-2">
          {usuario.status === 'Pendente' && (
            <>
              <button onClick={handleAprovar} disabled={acaoLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                Aprovar cadastro
              </button>
              <button onClick={handleRejeitar} disabled={acaoLoading}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-60">
                Rejeitar
              </button>
            </>
          )}
          {usuario.status === 'Ativo' && !isMe && (
            <button onClick={() => { setConfirmAcao('bloquear'); setConfirmError(''); }}
              className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-200">
              Bloquear usuário
            </button>
          )}
          {usuario.status === 'Inativo' && (
            <button onClick={handleAprovar} disabled={acaoLoading}
              className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 disabled:opacity-60">
              Reativar usuário
            </button>
          )}
          {!isMe && (
            <button onClick={() => { setConfirmAcao('excluir'); setConfirmError(''); }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
              Excluir usuário permanentemente
            </button>
          )}
        </div>
      </Section>

      {/* ── Confirmação (Bloquear / Excluir) ── */}
      {confirmAcao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {confirmAcao === 'excluir' ? 'Excluir Usuário' : 'Bloquear Usuário'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {confirmAcao === 'excluir'
                ? 'Esta ação é permanente e não pode ser desfeita.'
                : 'O usuário perderá o acesso ao sistema.'}
            </p>

            {confirmError && (
              <p className="text-red-600 text-xs mb-3 bg-red-50 px-2 py-1 rounded">{confirmError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAcao(null)}
                disabled={confirmLoading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAcao}
                disabled={confirmLoading}
                className={`flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
                  confirmAcao === 'excluir' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {confirmLoading ? 'Aguarde…' : confirmAcao === 'excluir' ? 'Excluir permanentemente' : 'Bloquear acesso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuarioDetalhePage;
