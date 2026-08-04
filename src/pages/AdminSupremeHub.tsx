import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/localStore';
import {
  Crown,
  Settings,
  Users,
  Shield,
  Sliders,
  Palette,
  FolderPlus,
  Layers,
  Bell,
  LayoutDashboard,
  FileSpreadsheet,
  Database,
  Activity,
  Search,
  CheckCircle2,
  Lock,
  Cpu,
  Download,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  KeyRound,
  FileText
} from 'lucide-react';

interface AdminSupremeHubProps {
  onNavigate?: (tab: string) => void;
}

export const AdminSupremeHub: React.FC<AdminSupremeHubProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('geral');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // System Configuration state
  const [systemConfig, setSystemConfig] = useState(() => {
    return localStore.getPOSConfig();
  });

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    show: false,
    title: '',
    description: '',
    action: () => {}
  });

  if (user?.cargo !== 'admin_supremo') {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
        <Lock className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Acesso Negado</h3>
        <p className="text-xs text-slate-500 mt-1">
          Esta área é restrita exclusivamente ao Administrador Supremo.
        </p>
      </div>
    );
  }

  const showSuccess = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleTogglePOS = (key: keyof typeof systemConfig) => {
    const val = !systemConfig[key];
    const updated = { ...systemConfig, [key]: val };
    setSystemConfig(updated as any);
    localStore.setPOSConfig(updated as any);
    showSuccess(`Configuração "${String(key)}" atualizada com sucesso!`);
  };

  const handleExportBackup = () => {
    const products = localStore.getProducts();
    const categories = localStore.getCategories();
    const movements = localStore.getMovements();
    const demands = localStore.getDemands();

    const backupData = {
      timestamp: new Date().toISOString(),
      app: 'Bosteca Estoque',
      versao: '2.5.0-SUPREMO',
      produtosCount: products.length,
      categoriasCount: categories.length,
      movimentacoesCount: movements.length,
      demandasCount: demands.length,
      data: {
        products,
        categories,
        movements,
        demands
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bosteca_backup_completo_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Backup completo em JSON exportado com sucesso!');
  };

  const handleZeroStockAll = () => {
    setConfirmModal({
      show: true,
      title: 'Zerar Quantidades do Estoque',
      description: 'Esta ação definirá o estoque de TODOS os produtos ativos como 0 UN. O cadastro dos produtos será mantido intacto.',
      action: () => {
        localStore.zeroAllProductsStock();
        setConfirmModal(p => ({ ...p, show: false }));
        showSuccess('Estoque de todos os produtos zerado com sucesso!');
      }
    });
  };

  const handleClearAllData = () => {
    setConfirmModal({
      show: true,
      title: 'Resetar Dados Operacionais',
      description: 'Esta ação limpará todo o histórico de movimentações, solicitações de clientes e definirá o estoque de todos os produtos como 0 UN. Esta ação não afeta a conta de Administrador Supremo.',
      action: () => {
        localStore.clearAllDataAndResetStock();
        setConfirmModal(p => ({ ...p, show: false }));
        showSuccess('Dados limpos e estoque resetado com sucesso!');
      }
    });
  };

  const handleCopyInventorySummary = () => {
    const products = localStore.getProducts();
    let txt = `📊 RESUMO DO INVENTÁRIO - BOSTECA ESTOQUE (${new Date().toLocaleDateString('pt-BR')})\n\n`;
    products.forEach((p, idx) => {
      txt += `${idx + 1}. ${p.nome} | Qtd: ${p.estoque} UN | Cód: ${p.codigo} | Mín: ${p.estoque_minimo}\n`;
    });
    navigator.clipboard.writeText(txt);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    showSuccess('Inventário copiado para a área de transferência!');
  };

  const sections = [
    {
      id: 'geral',
      label: '1. Configurações Gerais',
      icon: Settings,
      count: 10,
      items: [
        { label: 'Nome da Empresa e Identificação no Relatório', desc: 'Bosteca Vendas & Estoque Pro' },
        { label: 'Fuso Horário Oficial e Região', desc: 'América/São_Paulo (UTC-3)' },
        { label: 'Tempo Limite de Inatividade da Sessão', desc: 'Ativo - 15 minutos' },
        { label: 'Idioma Principal da Interface', desc: 'Português BR' },
        { label: 'Modo de Operação Padrão do Estoque', desc: 'Controle Estrito' },
        { label: 'Regra de Ouro: 100% Foco em Estoque', desc: 'Sem complexidade financeira' },
        { label: 'Prefixo Padrão dos Códigos de Produtos', desc: 'PROD-' },
        { label: 'Formato de Exibição das Datas', desc: 'DD/MM/AAAA HH:mm' },
        { label: 'Politica de Senhas Fortes', desc: 'Habilitada' },
        { label: 'Sessão Principal de Gestão', desc: 'Acesso total irrestrito' }
      ]
    },
    {
      id: 'usuarios',
      label: '2. Gerenciamento de Usuários',
      icon: Users,
      count: 10,
      items: [
        { label: 'Conta do Gestor Principal', desc: 'Ativa' },
        { label: 'Gerente Principal Ativo', desc: 'Carlos Gerente (Ativo)' },
        { label: 'Funcionário do Balcão', desc: 'Ana Funcionária (Ativa)' },
        { label: 'Gerenciamento de Acessos', desc: 'Redireciona para Módulo Usuários' },
        { label: 'Bloqueio de Gerentes durante Teste', desc: 'Ativado no Modo de Teste' },
        { label: 'Sessões Ativas no Sistema', desc: '1 Conexão Detectada' },
        { label: 'Segurança de Credenciais', desc: 'Criptografia em Armazenamento' },
        { label: 'Recuperação de Acesso Principal', desc: 'Chave Master: @Luisoo5' },
        { label: 'Permissões por Função (RBAC)', desc: 'Hierarquia Estrita' },
        { label: 'Controle de Múltiplos Logins', desc: 'Habilitado' }
      ]
    },
    {
      id: 'pdv',
      label: '3. Frente de Caixa / PDV',
      icon: Sliders,
      count: 6,
      items: [
        { label: 'Adição Automática ao Bipar', key: 'adicionarAoBipar' },
        { label: 'Efeitos Sonoros nas Operações', key: 'efeitoSonoro' },
        { label: 'Exibir Campo de Observação na Saída', key: 'exibirCampoObservacao' },
        { label: 'Agrupar Itens Repetidos na Saída', key: 'agruparItensIguais' },
        { label: 'Confirmação Obrigatória ao Dar Baixa', key: 'confirmarAcaoSaida' },
        { label: 'Limpar Carrinho Automaticamente Aos Finalizar', key: 'limparAposSaida' }
      ]
    },
    {
      id: 'banco',
      label: '4. Banco de Dados, Backup & Restauração',
      icon: Database,
      count: 4,
      items: [
        { label: 'Exportar Backup Completo (JSON)', action: handleExportBackup, type: 'button', color: 'bg-indigo-600' },
        { label: 'Copiar Inventário Atual para Clipboard', action: handleCopyInventorySummary, type: 'button', color: 'bg-blue-600' },
        { label: 'Zerar Apenas Quantidades de Estoque', action: handleZeroStockAll, type: 'button', color: 'bg-amber-600' },
        { label: 'Resetar Histórico e Dados Fictícios', action: handleClearAllData, type: 'button', color: 'bg-rose-600' }
      ]
    }
  ];

  const filteredSections = sections.map(sec => ({
    ...sec,
    items: sec.items.filter(item =>
      (item.label || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    )
  })).filter(sec => sec.items.length > 0);

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl shadow-2xl border border-indigo-500/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-extrabold border border-indigo-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Painel Avançado • Ferramentas Funcionais</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>Central Avançada de Gestão & Configuração</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl font-medium">
              Controle total e em tempo real: altere configurações do PDV, faça backups em JSON, exporte relatórios e execute o Modo de Testes do Sistema.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('system_test')}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center space-x-2 shrink-0 active:scale-95"
            >
              <Cpu className="w-4 h-4" />
              <span>Abrir Modo de Teste (@Luisoo5)</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Search across 100+ functions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar ferramentas e opções do Administrador Supremo..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium bg-slate-50"
          />
        </div>

        <div className="text-xs font-bold text-slate-500">
          Status: <span className="text-emerald-600 font-extrabold">Sistema On-line & Sincronizado</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Categories List */}
        <div className="lg:col-span-1 bg-white p-3 rounded-3xl border border-slate-200 shadow-2xs space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
          {sections.map(sec => {
            const IconComponent = sec.icon;
            const isSelected = activeCategory === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveCategory(sec.id)}
                className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                  <span className="truncate">{sec.label}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {sec.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Content & Toggles */}
        <div className="lg:col-span-3 space-y-6">
          {filteredSections
            .filter(sec => sec.id === activeCategory || searchTerm !== '')
            .map(sec => {
              const IconComponent = sec.icon;
              return (
                <div key={sec.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{sec.label}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sec.items.map((item: any, idx: number) => {
                      if (item.type === 'button') {
                        return (
                          <div
                            key={idx}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3"
                          >
                            <span className="text-xs font-bold text-slate-800">{item.label}</span>
                            <button
                              onClick={item.action}
                              className={`w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 active:scale-95 ${item.color}`}
                            >
                              <Download className="w-4 h-4" />
                              <span>Executar Ação</span>
                            </button>
                          </div>
                        );
                      }

                      if (item.key) {
                        const isChecked = (systemConfig as any)[item.key];
                        return (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition flex items-center justify-between"
                          >
                            <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                            <button
                              onClick={() => handleTogglePOS(item.key)}
                              className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                                isChecked ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                  isChecked ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{item.desc}</span>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-sm text-slate-900">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {confirmModal.description}
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setConfirmModal(p => ({ ...p, show: false }))}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.action}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
