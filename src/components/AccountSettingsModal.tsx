import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/localStore';
import { firestoreSync } from '../services/firestoreSync';
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!nome.trim()) {
      setMessage({ type: 'error', text: 'O nome não pode ficar em branco.' });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Por favor, insira um e-mail válido.' });
      return;
    }

    if (novaSenha) {
      if (novaSenha.length < 4) {
        setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 4 caracteres.' });
        return;
      }
      if (novaSenha !== confirmaSenha) {
        setMessage({ type: 'error', text: 'A confirmação de senha não confere com a nova senha.' });
        return;
      }
    }

    setIsSaving(true);

    try {
      // Update in firestoreSync
      await firestoreSync.updateUser(user.id, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        ...(novaSenha ? { senha: novaSenha } : {})
      });

      // Update in-memory user
      user.nome = nome.trim();
      user.email = email.trim().toLowerCase();
      localStorage.setItem('bytecas_logged_user', JSON.stringify(user));

      setMessage({ type: 'success', text: 'Dados da conta atualizados com sucesso!' });
      setNovaSenha('');
      setConfirmaSenha('');

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar dados.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (cargo: string) => {
    switch (cargo) {
      case 'gerente':
        return 'Gerente de Estoque';
      case 'admin_supremo':
      case 'funcionario':
      default:
        return 'Funcionário';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Minha Conta Privada</h3>
              <p className="text-[11px] text-slate-400">Configurações e credenciais de acesso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* USER AVATAR & CARGO */}
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center text-white font-black text-lg">
              {nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">{nome}</div>
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Cargo: {getRoleLabel(user.cargo)}</span>
              </div>
            </div>
          </div>

          {/* NOME */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Seu Nome de Exibição</label>
            <div className="relative">
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* EMAIL (ONLY ACCESSIBLE HERE) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>E-mail de Autenticação (Privado)</span>
              <span className="text-[10px] text-amber-400 font-normal">Visível somente por você</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* ALTERAR SENHA */}
          <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-3">
            <label className="text-xs font-extrabold text-slate-300 block">Alterar Senha de Acesso (Opcional)</label>
            
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nova senha (deixe vazio se não quiser alterar)"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                />
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {novaSenha && (
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Confirme a nova senha"
                    value={confirmaSenha}
                    onChange={(e) => setConfirmaSenha(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                </div>
              )}
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center space-x-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
