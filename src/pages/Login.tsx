import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, AlertCircle, CheckCircle2, UserPlus, UserCheck, Crown } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  
  // Tab Mode
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login State
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Register State
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regCargo, setRegCargo] = useState<'admin_supremo' | 'gerente' | 'funcionario'>('admin_supremo');

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !senha) {
      setErrorMsg('Por favor, informe e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(email, senha);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao efetuar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!regNome || !regEmail || !regSenha) {
      setErrorMsg('Por favor, preencha nome, e-mail e senha para se cadastrar.');
      return;
    }
    setLoading(true);
    try {
      await register(regNome, regEmail, regSenha, regCargo);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setSenha(userPass);
    setErrorMsg('');
    setLoading(true);
    try {
      await login(userEmail, userPass);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao efetuar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(`E-mail com instruções de redefinição de senha enviado para ${forgotEmail}.`);
    setTimeout(() => {
      setShowForgot(false);
      setForgotSuccess('');
      setForgotEmail('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/80 via-slate-50 to-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 mb-3">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bytecas Loja e Estoque</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sistema Integrado de Controle Físico de Estoque
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl mb-3 border border-slate-300/50">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              !isRegisterMode
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Entrar no Sistema</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              isRegisterMode
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cadastrar Pela 1ª Vez</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
          {!isRegisterMode ? (
            <>
              <h2 className="text-base font-bold text-slate-900 mb-0.5">Acesso ao Sistema</h2>
              <p className="text-xs text-slate-500 mb-6 font-medium">Informe seus dados para acessar o estoque.</p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-start space-x-2.5 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="luisfernandosantossilva1940@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all duration-150 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Senha</label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all duration-150 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs shadow-blue-500/25 transition-all duration-150 flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Autenticando...</span>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Login Switcher including Luis Fernando */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2.5">
                  Acesso Rápido Especial (1 Clique)
                </p>

                {/* Special Luis Fernando Login Banner */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('luisfernandosantossilva1940@gmail.com', '@Luisoo5')}
                  className="w-full mb-3 p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-2 border-amber-400/80 rounded-2xl hover:border-amber-500 transition-all text-left flex items-center justify-between group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      <Crown className="w-4 h-4 text-amber-100" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 group-hover:text-amber-700 transition-colors flex items-center space-x-1">
                        <span>Luis Fernando</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md font-bold">Especial</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        luisfernandosantossilva1940@gmail.com
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@bytecas.com', 'admin123')}
                    className="p-2 border border-slate-200/80 rounded-xl text-center hover:border-indigo-400 hover:bg-indigo-50/60 transition-all text-[11px] font-medium text-slate-700 bg-slate-50/40"
                  >
                    <div className="font-bold text-indigo-700">Supremo</div>
                    <div className="text-[9px] text-slate-400 font-medium">admin@</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('gerente@bytecas.com', 'gerente123')}
                    className="p-2 border border-slate-200/80 rounded-xl text-center hover:border-blue-400 hover:bg-blue-50/60 transition-all text-[11px] font-medium text-slate-700 bg-slate-50/40"
                  >
                    <div className="font-bold text-blue-700">Gerente</div>
                    <div className="text-[9px] text-slate-400 font-medium">gerente@</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('funcionario@bytecas.com', 'func123')}
                    className="p-2 border border-slate-200/80 rounded-xl text-center hover:border-emerald-400 hover:bg-emerald-50/60 transition-all text-[11px] font-medium text-slate-700 bg-slate-50/40"
                  >
                    <div className="font-bold text-emerald-700">Funcionário</div>
                    <div className="text-[9px] text-slate-400 font-medium">func@</div>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-base font-bold text-slate-900 mb-0.5">Criar Conta no Sistema</h2>
              <p className="text-xs text-slate-500 mb-5 font-medium">
                Cadastre seu acesso pela primeira vez para gerenciar o estoque.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-start space-x-2.5 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={regNome}
                    onChange={e => setRegNome(e.target.value)}
                    placeholder="Seu Nome Completo"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seu E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    required
                    value={regSenha}
                    onChange={e => setRegSenha(e.target.value)}
                    placeholder="Crie uma senha segura"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perfil / Cargo Solicitado
                  </label>
                  <select
                    value={regCargo}
                    onChange={e => setRegCargo(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 text-slate-800 font-semibold"
                  >
                    <option value="admin_supremo">Administrador Supremo (Acesso Total)</option>
                    <option value="gerente">Gerente de Estoque (Edição/Saídas)</option>
                    <option value="funcionario">Funcionário (Lançamentos/Consultas)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-xs shadow-xs shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Cadastrando...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Concluir Cadastro e Entrar</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Bytecas • Controle 100% de Estoque • Sem funções financeiras</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-800 font-bold mb-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <span>Recuperar Senha</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Informe seu e-mail para receber as instruções de recuperação.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-700 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="exemplo@bytecas.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                  >
                    Enviar Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
