import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  User as UserIcon
} from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cargo, setCargo] = useState<UserRole>('funcionario');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete modal
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setNome('');
    setEmail('');
    setSenha('');
    setCargo('funcionario');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setNome(u.nome);
    setEmail(u.email);
    setSenha('');
    setCargo(u.cargo);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!nome || !email || (!editingUser && !senha)) {
      setFormError('Preencha os campos obrigatórios.');
      return;
    }

    if (cargo === 'gerente') {
      const existingGerente = users.find(u => u.cargo === 'gerente' && u.id !== editingUser?.id);
      if (existingGerente) {
        setFormError(`⚠️ O sistema permite apenas 1 Gerente ativo. Já existe o gerente "${existingGerente.nome}". Para definir um novo gerente, altere o cargo do atual primeiro.`);
        return;
      }
    }

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, { nome, email, cargo, senha: senha || undefined });
        setSuccessMsg(`Usuário "${nome}" atualizado com sucesso!`);
      } else {
        await api.createUser({ nome, email, senha, cargo });
        setSuccessMsg(`Usuário "${nome}" cadastrado com sucesso!`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar usuário.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteCandidate) return;
    try {
      const targetId = deleteCandidate.id;
      setUsers(prev => prev.filter(u => u.id !== targetId));
      await api.deleteUser(targetId);
      setDeleteCandidate(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover usuário.');
      loadData();
    }
  };

  const getRoleBadge = (c: UserRole) => {
    switch (c) {
      case 'admin_supremo':
        return { label: 'Administrador Supremo', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ShieldAlert };
      case 'gerente':
        return { label: 'Gerente', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck };
      case 'funcionario':
      default:
        return { label: 'Funcionário', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: UserCheck };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Gestão de Usuários e Níveis de Permissão</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Área restrita ao Administrador Supremo para controle de acessos da equipe Bytecas.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center space-x-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Usuário</th>
                <th className="p-4">Cargo / Permissão</th>
                <th className="p-4">Data do Cadastro</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic font-medium">
                    Carregando equipe de usuários...
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const roleBadge = getRoleBadge(u.cargo);
                  const Icon = roleBadge.icon;
                  const isSupremo = u.cargo === 'admin_supremo';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/80 font-bold text-xs flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.nome}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border inline-flex items-center space-x-1.5 ${roleBadge.bg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors"
                            title="Editar Cargo/Permissão"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!isSupremo && (
                            <button
                              onClick={() => setDeleteCandidate(u)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors"
                              title="Remover Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {editingUser ? 'Editar Permissões do Usuário' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Roberto Silva"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="roberto@bytecas.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Nova Senha (Deixe em branco para manter a atual)' : 'Senha de Acesso *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cargo / Nível de Permissão *
                </label>
                <select
                  value={cargo}
                  onChange={e => setCargo(e.target.value as UserRole)}
                  disabled={editingUser?.cargo === 'admin_supremo'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="funcionario">Funcionário (Estoque, Entradas, Saídas, Consultas)</option>
                  <option value="gerente">Gerente (Gestão completa de estoque e relatórios)</option>
                  {editingUser?.cargo === 'admin_supremo' && (
                    <option value="admin_supremo">Administrador Supremo (Permissão Total)</option>
                  )}
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm border border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Remover Usuário?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Confirma a remoção do usuário <strong className="text-slate-800">{deleteCandidate.nome}</strong>?
              A conta deixará de ter acesso ao sistema Bytecas.
            </p>
            <div className="mt-5 flex space-x-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
