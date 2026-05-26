import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';
import type { UsuarioResponse } from '../types';

type TabId = 'pendentes' | 'todos';

const PERFIS = ['Solicitante', 'Gestor', 'RH', 'Portaria', 'Admin'];

const STATUS_BADGE: Record<string, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  Ativo:    'bg-green-100 text-green-800',
  Inativo:  'bg-red-100 text-red-700',
};

interface EditModal {
  type: 'perfil' | 'senha';
  userId: number;
  currentPerfil?: string;
}

interface ConfirmModal {
  type: 'bloquear' | 'excluir';
  usuario: UsuarioResponse;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();

  const [tab, setTab]           = useState<TabId>('pendentes');
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading]   = useState(false);

  // Modal de edição (perfil / senha)
  const [editModal, setEditModal]     = useState<EditModal | null>(null);
  const [editValue, setEditValue]     = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Modal de confirmação (bloquear / excluir)
  const [confirmModal, setConfirmModal]       = useState<ConfirmModal | null>(null);
  const [confirmLoading, setConfirmLoading]   = useState(false);
  const [confirmError, setConfirmError]       = useState('');

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = tab === 'pendentes' ? 'Pendente' : undefined;
      const { data } = await adminService.listarUsuarios(statusFilter);
      setUsuarios(data);
    } catch {
      console.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  /* ── Handlers existentes ── */
  const handleAprovar = async (id: number) => {
    try {
      await adminService.aprovarUsuario(id);
      fetchUsuarios();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao aprovar.'
      );
    }
  };

  const handleRejeitar = async (id: number) => {
    if (!window.confirm('Deseja rejeitar este cadastro?')) return;
    try {
      await adminService.rejeitarUsuario(id);
      fetchUsuarios();
    } catch {
      alert('Erro ao rejeitar.');
    }
  };

  /* ── Confirm modal (bloquear / excluir) ── */
  const openConfirmModal = (type: 'bloquear' | 'excluir', usuario: UsuarioResponse) => {
    setConfirmModal({ type, usuario });
    setConfirmError('');
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setConfirmLoading(true);
    setConfirmError('');
    try {
      if (confirmModal.type === 'bloquear') {
        await adminService.bloquearUsuario(confirmModal.usuario.id);
      } else {
        await adminService.excluirUsuario(confirmModal.usuario.id);
      }
      setConfirmModal(null);
      fetchUsuarios();
    } catch (err: unknown) {
      setConfirmError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          `Erro ao ${confirmModal.type} usuário.`
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  /* ── Edit modal (perfil / senha) ── */
  const openEditModal = (type: 'perfil' | 'senha', userId: number, currentPerfil?: string) => {
    setEditModal({ type, userId, currentPerfil });
    setEditValue(type === 'perfil' ? (currentPerfil ?? 'Solicitante') : '');
    setConfirmarSenha('');
    setEditError('');
  };

  const handleEditConfirm = async () => {
    if (!editModal) return;
    setEditError('');

    if (editModal.type === 'senha') {
      if (editValue.length < 6) { setEditError('A senha deve ter no mínimo 6 caracteres.'); return; }
      if (editValue !== confirmarSenha) { setEditError('As senhas não conferem.'); return; }
    }

    setEditLoading(true);
    try {
      if (editModal.type === 'perfil') {
        await adminService.alterarPerfil(editModal.userId, editValue);
      } else {
        await adminService.alterarSenha(editModal.userId, editValue);
      }
      setEditModal(null);
      fetchUsuarios();
    } catch (err: unknown) {
      setEditError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao salvar.'
      );
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
        {(['pendentes', 'todos'] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'pendentes' ? '⏳ Pendentes de Aprovação' : '👥 Todos os Usuários'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Carregando…</div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          {tab === 'pendentes' ? 'Nenhum cadastro pendente de aprovação.' : 'Nenhum usuário encontrado.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nome', 'Matrícula', 'E-mail', 'Setor', 'Perfil', 'Status', 'Cadastrado em', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => {
                const isMe = u.id === user?.userId;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.nome}
                      {isMe && <span className="ml-2 text-xs text-gray-400">(você)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.matricula}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.setor}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {u.perfil}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[u.status] ?? ''}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(u.dataCadastro).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {/* Pendente */}
                        {u.status === 'Pendente' && (
                          <>
                            <button onClick={() => handleAprovar(u.id)}
                              className="px-2.5 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                              Aprovar
                            </button>
                            <button onClick={() => handleRejeitar(u.id)}
                              className="px-2.5 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200">
                              Rejeitar
                            </button>
                          </>
                        )}

                        {/* Ativo → pode bloquear */}
                        {u.status === 'Ativo' && !isMe && (
                          <button onClick={() => openConfirmModal('bloquear', u)}
                            className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200">
                            Bloquear
                          </button>
                        )}

                        {/* Inativo → pode reativar */}
                        {u.status === 'Inativo' && (
                          <button onClick={() => handleAprovar(u.id)}
                            className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200">
                            Reativar
                          </button>
                        )}

                        {/* Sempre disponíveis (exceto em si mesmo para ações destrutivas) */}
                        <button onClick={() => openEditModal('perfil', u.id, u.perfil)}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200">
                          Perfil
                        </button>
                        <button onClick={() => openEditModal('senha', u.id)}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200">
                          Senha
                        </button>

                        {/* Excluir — nunca aparece para o próprio admin */}
                        {!isMe && (
                          <button onClick={() => openConfirmModal('excluir', u)}
                            className="px-2.5 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal de Confirmação (Bloquear / Excluir) ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                confirmModal.type === 'excluir'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {confirmModal.type === 'excluir' ? '🗑' : '🔒'}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  {confirmModal.type === 'excluir' ? 'Excluir Usuário' : 'Bloquear Usuário'}
                </h3>
                <p className="text-xs text-gray-500">
                  {confirmModal.type === 'excluir'
                    ? 'Esta ação é permanente e não pode ser desfeita.'
                    : 'O usuário perderá o acesso ao sistema.'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 text-sm">
              <p className="font-medium text-gray-800">{confirmModal.usuario.nome}</p>
              <p className="text-gray-500 text-xs">{confirmModal.usuario.email} · {confirmModal.usuario.matricula}</p>
            </div>

            {confirmError && (
              <p className="text-red-600 text-xs mb-3 bg-red-50 px-2 py-1 rounded">{confirmError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={confirmLoading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className={`flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
                  confirmModal.type === 'excluir'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {confirmLoading
                  ? 'Aguarde…'
                  : confirmModal.type === 'excluir'
                    ? 'Excluir permanentemente'
                    : 'Bloquear acesso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Edição (Perfil / Senha) ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editModal.type === 'perfil' ? 'Alterar Perfil' : 'Redefinir Senha'}
            </h3>

            {editModal.type === 'perfil' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Novo Perfil</label>
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {editError && (
              <p className="text-red-600 text-xs mt-2 bg-red-50 px-2 py-1 rounded">{editError}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditModal(null)}
                disabled={editLoading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditConfirm}
                disabled={editLoading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {editLoading ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;