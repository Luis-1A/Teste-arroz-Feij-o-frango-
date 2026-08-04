import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { testRunnerService, TestLogMessage } from '../services/testRunnerService';
import {
  ShieldAlert,
  Play,
  Square,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Activity,
  KeyRound,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

interface TestCase {
  id: number;
  nome: string;
  modulo: string;
}

const TEST_SUITE: TestCase[] = [
  { id: 1, nome: 'Simulação Contínua de Saídas de Balcão (PDV)', modulo: 'Vendas' },
  { id: 2, nome: 'Simulação Contínua de Entrada de Fornecedor', modulo: 'Almoxarifado' },
  { id: 3, nome: 'Simulação de Item Esgotado e Alerta Automático', modulo: 'Reposição' },
  { id: 4, nome: 'Procura de Clientes Fictícios sem Estoque', modulo: 'Demanda' },
  { id: 5, nome: 'Cadastro Dinâmico de Produtos de Teste', modulo: 'Estoque' },
  { id: 6, nome: 'Sincronização do Banco Firestore em Tempo Real', modulo: 'Sincronização' },
  { id: 7, nome: 'Gravação e Exclusão de Coleções Temporárias', modulo: 'Banco' },
  { id: 8, nome: 'Validação de Permissões Supremas (RBAC)', modulo: 'Segurança' }
];

export const SystemTestHub: React.FC = () => {
  const { user } = useAuth();
  const [isTestActive, setIsTestActive] = useState<boolean>(testRunnerService.isTestActive());
  const [logs, setLogs] = useState<TestLogMessage[]>(testRunnerService.getLogs());

  // Modal State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<'START' | 'STOP'>('START');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassText, setShowPassText] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = testRunnerService.subscribe((active, newLogs) => {
      setIsTestActive(active);
      setLogs([...newLogs]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (user?.cargo !== 'admin_supremo') {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Acesso Restrito</h3>
        <p className="text-xs text-slate-500 mt-1">
          O Modo de Teste do Sistema é de acesso restrito.
        </p>
      </div>
    );
  }

  const handleOpenStartModal = () => {
    setModalAction('START');
    setInputPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleOpenStopModal = () => {
    setModalAction('STOP');
    setInputPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleConfirmPassword = async () => {
    setPasswordError('');
    if (inputPassword !== '@Luisoo5') {
      setPasswordError('Senha de confirmação incorreta. Acesso negado.');
      return;
    }

    try {
      if (modalAction === 'START') {
        await testRunnerService.startTest();
        setShowPasswordModal(false);
      } else {
        await testRunnerService.stopTest(inputPassword);
        setShowPasswordModal(false);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao processar solicitação.');
    }
  };

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.time}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-2xl border border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exclusivo para o Administrador Supremo</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <Cpu className="w-7 h-7 text-indigo-400" />
              <span>Modo de Teste Completo e Contínuo</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl font-medium">
              Simulação ativa sem limite de tempo! O robô executa operações reais no banco de dados e atualiza todas as telas em tempo real até ser encerrado com a senha do Administrador.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!isTestActive ? (
              <button
                onClick={handleOpenStartModal}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Teste Contínuo</span>
              </button>
            ) : (
              <button
                onClick={handleOpenStopModal}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-2 active:scale-95 animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Encerrar Teste do Sistema</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Test Active Status Banner */}
      {isTestActive ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            <div>
              <p className="text-xs font-bold">TESTE EM EXECUÇÃO CONTÍNUA EM TEMPO REAL</p>
              <p className="text-[11px] text-amber-800">
                O acesso de gerentes e funcionários está bloqueado no sistema.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-200">
            <Zap className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Simulações Ativas</span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>O sistema está operando em Modo Normal (Acesso liberado para Gerentes e Funcionários).</span>
          </div>
        </div>
      )}

      {/* Simulator Terminal & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Log Output */}
        <div className="lg:col-span-2 bg-slate-950 text-slate-200 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col h-[420px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-slate-300">Terminal de Automação & Operações Fictícias</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyLogs}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono flex items-center space-x-1"
              >
                {copiedReport ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedReport ? 'Copiado!' : 'Copiar Log'}</span>
              </button>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md">
                {isTestActive ? 'LIVESTREAM' : 'PARADO'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pr-1 custom-scrollbar text-slate-300">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Clique em "Iniciar Teste Contínuo" para disparar os robôs simuladores...</p>
            ) : (
              logs.map(l => (
                <div key={l.id} className="flex items-start space-x-2 leading-relaxed">
                  <span className="text-slate-500 text-[10px] shrink-0 font-bold">[{l.time}]</span>
                  <span
                    className={
                      l.type === 'success'
                        ? 'text-emerald-400 font-semibold'
                        : l.type === 'error'
                        ? 'text-rose-400 font-bold'
                        : l.type === 'warn'
                        ? 'text-amber-300 font-semibold'
                        : l.type === 'action'
                        ? 'text-blue-300 font-medium'
                        : 'text-slate-300'
                    }
                  >
                    {l.text}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Test Cases Checklist */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 mb-3">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Suíte de Testes e Módulos Simulados</span>
            </h3>

            <div className="space-y-2">
              {TEST_SUITE.map(tc => (
                <div
                  key={tc.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    isTestActive ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px]">{tc.nome}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{tc.modulo}</span>
                  </div>
                  {isTestActive ? (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 font-medium">
            💡 <strong>Dica do Administrador:</strong> Enquanto o teste estiver em execução, abra outras abas do navegador (Estoque, Reposição, Relatórios) para visualizar o movimento automático das quantidades.
          </div>
        </div>
      </div>

      {/* Password Confirmation Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Confirmação de Senha Suprema</h3>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 font-medium">
                Digite a senha do Administrador Supremo para {modalAction === 'START' ? 'iniciar' : 'encerrar'} o modo de teste.
              </p>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Senha de Confirmação</label>
                <div className="relative">
                  <input
                    type={showPassText ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={e => setInputPassword(e.target.value)}
                    placeholder="Digite a senha..."
                    className="w-full px-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassText(!showPassText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPassword}
                  className={`flex-1 py-2.5 text-white rounded-xl font-bold shadow-md ${
                    modalAction === 'START'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {modalAction === 'START' ? 'Iniciar Teste' : 'Encerrar Teste'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
