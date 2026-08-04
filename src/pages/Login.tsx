import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, AlertCircle, CheckCircle2, UserPlus, UserCheck, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  
  // Tab Mode
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login State
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Register State
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regCargo, setRegCargo] = useState<'gerente' | 'funcionario'>('funcionario');

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
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 mb-3 border border-blue-400/30">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Facilitando Meu Trabalho</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Sistema Integrado de Controle Físico de Estoque
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-[#111827] p-1 rounded-2xl mb-3 border border-[#1F2937]">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              !isRegisterMode
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Entrar no Sistema</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              isRegisterMode
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar Pela 1ª Vez</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-[#111827] rounded-3xl p-6 md:p-8 shadow-xl border border-[#1F2937]">
          {!isRegisterMode ? (
            <>
              <h2 className="text-base font-bold text-white mb-0.5">Acesso ao Sistema</h2>
              <p className="text-xs text-slate-400 mb-6 font-medium">Informe seus dados para acessar o estoque.</p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-start space-x-2.5 text-rose-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Usuário ou e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Digite seu usuário ou e-mail..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-bold text-white bg-[#0B1220] border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-150 placeholder:text-slate-600 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">Senha</label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm font-bold text-white bg-[#0B1220] border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-150 placeholder:text-slate-600 placeholder:font-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-95 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
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
            </>
          ) : (
            <>
              <h2 className="text-base font-bold text-white mb-0.5">Criar Conta no Sistema</h2>
              <p className="text-xs text-slate-400 mb-5 font-medium">
                Cadastre seu acesso pela primeira vez para gerenciar o estoque.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-start space-x-2.5 text-rose-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={regNome}
                    onChange={e => setRegNome(e.target.value)}
                    placeholder="Seu Nome Completo"
                    className="w-full px-3.5 py-2.5 text-sm font-bold text-white bg-[#0B1220] border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-slate-600 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Seu E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full px-3.5 py-2.5 text-sm font-bold text-white bg-[#0B1220] border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-slate-600 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regSenha}
                      onChange={e => setRegSenha(e.target.value)}
                      placeholder="Crie uma senha segura"
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm font-bold text-white bg-[#0B1220] border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-slate-600 placeholder:font-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                      title={showRegPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Perfil / Cargo Solicitado
                  </label>
                  <select
                    value={regCargo}
                    onChange={e => setRegCargo(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm font-bold text-white bg-[#0B1220] border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  >
                    <option value="funcionario">Funcionário (Acesso padrão a vendas e consultas)</option>
                    <option value="gerente">Gerente de Estoque (Máximo 1 Gerente no sistema)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-95 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
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
        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Facilitando Meu Trabalho • Controle 100% de Estoque • Sem funções financeiras</span>
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
                  <label className="block text-xs font-bold text-slate-800 mb-1">Usuário ou e-mail</label>
                  <input
                    type="text"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Digite seu usuário ou e-mail registrado..."
                    className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 placeholder:font-normal"
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
