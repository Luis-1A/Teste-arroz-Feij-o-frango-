import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { useAuth } from '../context/AuthContext';
import { Product, CustomerDemand } from '../types';
import { smartMatch } from '../utils/searchUtils';
import {
  analyzeSmartRestock,
  RestockAnalysisResult,
  SmartRestockItem
} from '../services/smartRestockEngine';
import {
  ClipboardList,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
  PackageX,
  PackageCheck,
  Search,
  Filter,
  PlusCircle,
  ArrowRight,
  UserX,
  TrendingUp,
  Layers,
  FileText,
  Sparkles,
  Clock,
  User as UserIcon,
  Zap,
  CheckCircle2,
  FolderTree,
  Boxes,
  RotateCcw,
  Image as ImageIcon,
  Download,
  Share2,
  ShoppingBag,
  Eye,
  X,
  Star,
  BarChart3,
  TrendingDown,
  Activity,
  Calendar,
  Info,
  ChevronRight
} from 'lucide-react';

interface RestockListProps {
  onNavigateToProducts?: () => void;
  onNavigateToEntry?: () => void;
  onNavigateToCustomerDemand?: () => void;
}

// Intentional telemetry analysis steps
const ANALYSIS_STEPS = [
  'Iniciando verificação de estoque...',
  'Lendo posições de estoque e mínimos configurados...',
  'Verificando produtos zerados e abaixo do mínimo...',
  'Cruzando procuras de clientes sem atendimento...',
  'Classificando produtos por urgência real...',
  'Organizando itens por categoria...',
  'Lista de Reposição Concluída!'
];

export const RestockList: React.FC<RestockListProps> = ({
  onNavigateToProducts,
  onNavigateToEntry,
  onNavigateToCustomerDemand
}) => {
  const { user } = useAuth();

  // Active view tab inside restock list: 'lista' | 'estatisticas'
  const [activeTab, setActiveTab] = useState<'lista' | 'estatisticas'>('lista');

  // Snapshot State (null initially = list not yet generated)
  const [snapshot, setSnapshot] = useState<RestockAnalysisResult | null>(null);

  // Analysis / Processing State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Search & Filter State inside generated snapshot
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedUrgency, setSelectedUrgency] = useState<'Todas' | 'CRITICO' | 'ALERTA'>('Todas');

  // Telemetry Detail Modal
  const [selectedTelemetryItem, setSelectedTelemetryItem] = useState<SmartRestockItem | null>(null);

  // Copy Notifications & Modal
  const [copied, setCopied] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedCopyCategory, setSelectedCopyCategory] = useState<string>('');

  // Image Generation Modal & State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Real-time synchronization for active snapshot
  useEffect(() => {
    const unsubProds = firestoreSync.subscribeProducts((allProducts) => {
      if (!allProducts) return;
      setSnapshot(prev => {
        if (!prev) return prev;
        const allMovements = api.getMovements ? [] : [];
        return analyzeSmartRestock(
          allProducts,
          prev.allProducts ? [] : [],
          prev.customerDemands,
          [],
          prev.generatedByUser
        );
      });
    });

    const unsubDemands = firestoreSync.subscribeDemands((allDemands) => {
      if (!allDemands) return;
      setSnapshot(prev => {
        if (!prev) return prev;
        return analyzeSmartRestock(
          prev.allProducts,
          [],
          allDemands,
          [],
          prev.generatedByUser
        );
      });
    });

    return () => {
      unsubProds();
      unsubDemands();
    };
  }, []);

  /**
   * Triggers explicit multi-criteria step-by-step database analysis with intentional 4.5-5.5s duration.
   */
  const handleGenerateList = async () => {
    setIsAnalyzing(true);
    setCurrentStepIndex(0);
    setProgressPercent(2);
    const startTime = performance.now();

    // Intentional processing step duration (~450ms per step * 11 steps = ~4.95 seconds total)
    const stepDuration = 450;

    // Run asynchronous database fetch in background
    const fetchPromise = Promise.all([
      api.getProducts(),
      api.getMovements(),
      api.getCustomerDemands(),
      api.getDivergences()
    ]);

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setCurrentStepIndex(i);
      const targetPercent = Math.round(((i + 1) / ANALYSIS_STEPS.length) * 100);
      setProgressPercent(targetPercent);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }

    try {
      const [allProducts, allMovements, allDemands, allDivergences] = await fetchPromise;

      const analysisResult = analyzeSmartRestock(
        allProducts || [],
        allMovements || [],
        allDemands || [],
        allDivergences || [],
        user?.nome || 'Administrador'
      );

      setSnapshot(analysisResult);
    } catch (err) {
      console.error('Erro ao analisar banco de dados para reposição:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter snapshot items based on search, category and urgency
  const filteredRestockItems = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.items.filter(item => {
      const matchesSearch = !searchTerm.trim() || smartMatch(item.nome, searchTerm);
      const matchesCategory = selectedCategory === 'Todas' || item.categoria === selectedCategory;
      const matchesUrgency = selectedUrgency === 'Todas' || item.nivel_urgencia === selectedUrgency;
      return matchesSearch && matchesCategory && matchesUrgency;
    });
  }, [snapshot, searchTerm, selectedCategory, selectedUrgency]);

  // Group restock items by Category
  const groupedRestockItems = useMemo(() => {
    if (!snapshot) return {};
    const groups: { [catName: string]: SmartRestockItem[] } = {};

    for (const item of filteredRestockItems) {
      const cat = item.categoria || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    const sortedCatEntries = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));

    const sortedGroups: { [catName: string]: SmartRestockItem[] } = {};
    sortedCatEntries.forEach(([cat, items]) => {
      sortedGroups[cat] = items;
    });

    return sortedGroups;
  }, [filteredRestockItems, snapshot]);

  /**
   * Generates clean formatted text list
   */
  const generateCleanTextList = (
    filterMode: 'all' | 'outOfStock' | 'lowStock' | 'category',
    targetCatName?: string
  ) => {
    if (!snapshot) return '';
    let itemsToInclude = snapshot.items;

    if (filterMode === 'outOfStock') {
      itemsToInclude = snapshot.items.filter(p => p.estoque <= 0);
    } else if (filterMode === 'lowStock') {
      itemsToInclude = snapshot.items.filter(p => p.estoque > 0 && p.estoque < p.estoque_minimo);
    } else if (filterMode === 'category' && targetCatName) {
      itemsToInclude = snapshot.items.filter(p => (p.categoria || 'Outros') === targetCatName);
    }

    if (itemsToInclude.length === 0 && snapshot.customerDemands.length === 0) {
      return 'Nenhum produto encontrado para este filtro.';
    }

    const groups: { [catName: string]: SmartRestockItem[] } = {};
    for (const item of itemsToInclude) {
      const cat = (item.categoria || 'OUTROS').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    const lines: string[] = [];
    lines.push('📋 *LISTA DE REPOSIÇÃO DE ESTOQUE*');
    lines.push(`📅 Análise de: ${snapshot.generatedAtDate} às ${snapshot.generatedAtTime}`);
    lines.push(`👤 Gerado por: ${snapshot.generatedByUser}`);
    lines.push(`📦 Produtos analisados: ${snapshot.productsAnalyzed}`);
    lines.push('─────────────────────────────\n');

    Object.entries(groups).forEach(([catName, items]) => {
      lines.push(`📂 *${catName}*`);
      items.forEach(item => {
        const statusStr = item.estoque <= 0 ? '❌ ZERADO' : `⚠️ Atual: ${item.estoque} un`;
        lines.push(`  • ${item.nome} (${statusStr} | Mínimo: ${item.estoque_minimo || 5} un) [Status: ${item.nivel_urgencia}]`);
      });
      lines.push('');
    });

    if (snapshot.customerDemands.length > 0) {
      lines.push('🛒 *PRODUTOS PROCURADOS POR CLIENTES ("Não tinha em estoque")*');
      snapshot.customerDemands.forEach(d => {
        lines.push(`  • ${d.produto_nome} (${d.quantidade_solicitacoes}x procurado)`);
      });
      lines.push('');
    }

    lines.push('─────────────────────────────');
    lines.push('Sincronizado pelo sistema de gestão de estoque.');
    return lines.join('\n');
  };

  const handleCopyCleanList = () => {
    const text = generateCleanTextList('all');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setCopyNotification('Lista formatada limpa copiada com sucesso!');
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setCopyNotification(null), 4000);
    });
  };

  const handleCopyOption = (
    mode: 'all' | 'outOfStock' | 'lowStock' | 'category',
    catName?: string
  ) => {
    const text = generateCleanTextList(mode, catName);
    navigator.clipboard.writeText(text).then(() => {
      setIsCopyModalOpen(false);
      setCopyNotification('Conteúdo copiado com sucesso!');
      setTimeout(() => setCopyNotification(null), 4000);
    });
  };

  /**
   * Poster image generation
   */
  const handleGenerateImage = async () => {
    if (!snapshot) return;
    setIsGeneratingImage(true);

    try {
      const canvasWidth = 900;
      const headerHeight = 200;
      const itemRowHeight = 36;
      const categoriesHeight = snapshot.categories.length * 50 + snapshot.items.length * itemRowHeight;
      const totalCanvasHeight = Math.max(700, headerHeight + categoriesHeight + 100);

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth * scale;
      canvas.height = totalCanvasHeight * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsGeneratingImage(false);
        return;
      }

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvasWidth, totalCanvasHeight);

      // Header Banner
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, 160);

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvasWidth, 6);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('FACILITANDO MEU TRABALHO', 40, 52);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('MOTOR INTELIGENTE DE REPOSIÇÃO • ANÁLISE COMPLETA DO ESTOQUE', 40, 72);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px sans-serif';
      ctx.fillText(`📅 Data: ${snapshot.generatedAtDate} ${snapshot.generatedAtTime}  |  👤 Gerado por: ${snapshot.generatedByUser}`, 40, 115);

      let currentY = 180;
      Object.entries(groupedRestockItems).forEach(([catName, items]: [string, SmartRestockItem[]]) => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(40, currentY, canvasWidth - 80, 32);
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`📦 ${catName.toUpperCase()}`, 50, currentY + 22);
        currentY += 40;

        items.forEach((item, idx) => {
          ctx.fillStyle = idx % 2 === 0 ? '#0f172a' : '#182238';
          ctx.fillRect(40, currentY, canvasWidth - 80, itemRowHeight);

          ctx.fillStyle = item.nivel_urgencia === 'CRITICO' ? '#f87171' : '#fbbf24';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`[${item.nivel_urgencia}] ${item.nome}`, 55, currentY + 22);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`Atual: ${item.estoque} un  |  Mínimo: ${item.estoque_minimo || 5} un`, canvasWidth - 55, currentY + 22);
          ctx.textAlign = 'left';

          currentY += itemRowHeight;
        });
        currentY += 15;
      });

      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedImageUrl(dataUrl);
      setIsImageModalOpen(true);

      const link = document.createElement('a');
      link.download = `Lista_Inteligente_Reposicao_${snapshot.generatedAtDate.replace(/\//g, '-')}.png`;
      link.href = dataUrl;
      link.click();

      setCopyNotification('Imagem da lista inteligente baixada com sucesso!');
      setTimeout(() => setCopyNotification(null), 4000);
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copySingleItemName = (itemName: string) => {
    navigator.clipboard.writeText(itemName).then(() => {
      setCopyNotification(`Nome "${itemName}" copiado!`);
      setTimeout(() => setCopyNotification(null), 3000);
    });
  };

  // -------------------------------------------------------------
  // STATE 1: ANALYSIS IN PROGRESS (Tela de Processamento 4-6s)
  // -------------------------------------------------------------
  if (isAnalyzing) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-[#0F172A] text-white rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
        <div className="relative flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center"></div>
          <Sparkles className="w-12 h-12 text-indigo-400 absolute animate-pulse" />
        </div>

        <div className="text-center space-y-2 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <BrainCircuitIcon />
            <span>Motor Inteligente de Reposição</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">
            Analisando Banco de Dados do Estoque...
          </h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Coletando velocidade de vendas, procuras por clientes, divergências, estoque negativo e tempo sem reposição para calcular a pontuação inteligente.
          </p>
        </div>

        {/* Progress Bar & Current Step */}
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400">
            <span className="text-indigo-400 font-mono animate-pulse">
              Etapa {currentStepIndex + 1} de {ANALYSIS_STEPS.length}
            </span>
            <span className="font-mono text-white">{progressPercent}%</span>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-slate-300 font-medium py-1.5 px-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>{ANALYSIS_STEPS[currentStepIndex]}</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: LIST NOT YET GENERATED (Empty / Trigger Screen)
  // -------------------------------------------------------------
  if (!snapshot) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Header */}
        <div className="bg-[#111827] text-white p-6 rounded-3xl border border-[#1F2937] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h1 className="text-2xl font-black tracking-tight text-white">
                Motor Inteligente de Reposição
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Nova arquitetura de decisão baseada em 15+ fatores de telemetria, velocidade de venda, demanda de clientes e pontuação dinâmica.
            </p>
          </div>

          <button
            onClick={handleGenerateList}
            className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl transition flex items-center justify-center space-x-2.5 group cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-indigo-200 group-hover:rotate-12 transition-transform" />
            <span>GERAR LISTA INTELIGENTE</span>
          </button>
        </div>

        {/* Informational Cards explaining the Intelligent Decision Engine */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-white text-sm">Coleta Total de Dados</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Percorre todo o banco coletando velocidade de vendas, tempo sem reposição, zerados, histórico negativo e procuras de clientes.
            </p>
          </div>

          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-white text-sm">Pontuação de Prioridade</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calcula um score dinâmico para cada produto. Itens acima do mínimo mas vendendo super rápido sobem para prioridade máxima!
            </p>
          </div>

          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-white text-sm">Organização por Categoria</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organiza os produtos do maior para o menor score, agrupando por categorias e gerando estatísticas de aprendizado do estoque.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: GENERATED SNAPSHOT DISPLAY (Intelligent List & Insights)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {copyNotification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{copyNotification}</span>
        </div>
      )}

      {/* Main Header & Actions */}
      <div className="bg-[#111827] text-white p-6 rounded-3xl border border-[#1F2937] space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                Motor de Reposição v2.0
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {snapshot.timeSpentMs}ms de processamento
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Lista Inteligente de Reposição
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Análise de {snapshot.generatedAtDate} às {snapshot.generatedAtTime} por {snapshot.generatedByUser}
            </p>
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateList}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Reanalisar</span>
            </button>

            <button
              onClick={handleCopyCleanList}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Lista</span>
            </button>

            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{isGeneratingImage ? 'Gerando...' : 'Gerar Imagem'}</span>
            </button>
          </div>
        </div>

        {/* Metrics Summary Strip (2 Cards as requested) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1F2937]">
          <div className="bg-[#0B1220] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Itens para Reposição</span>
              <span className="text-2xl font-black text-white">{snapshot.items.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0B1220] p-4 rounded-2xl border border-rose-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Estoque Crítico</span>
              <span className="text-2xl font-black text-rose-400">
                {snapshot.items.filter(i => i.nivel_urgencia === 'CRITICO').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1F2937] pt-2">
          <button
            onClick={() => setActiveTab('lista')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'lista'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Lista de Reposição ({snapshot.items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('estatisticas')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'estatisticas'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Aprendizado & Estatísticas do Sistema</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LISTA DE REPOSIÇÃO */}
      {activeTab === 'lista' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0B1220] border border-[#1F2937] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-[#0B1220] border border-[#1F2937] text-xs font-medium text-slate-300 rounded-xl focus:outline-none"
              >
                <option value="Todas">Todas as Categorias</option>
                {snapshot.categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Urgency Filter */}
              <select
                value={selectedUrgency}
                onChange={e => setSelectedUrgency(e.target.value as any)}
                className="px-3 py-2 bg-[#0B1220] border border-[#1F2937] text-xs font-medium text-slate-300 rounded-xl focus:outline-none"
              >
                <option value="Todas">Todas as Urgências</option>
                <option value="CRITICO">🚨 Apenas Crítico</option>
                <option value="ALERTA">⚠️ Apenas Alerta</option>
              </select>
            </div>
          </div>

          {/* Grouped Category Items */}
          {Object.keys(groupedRestockItems).length === 0 ? (
            <div className="bg-[#111827] p-8 rounded-3xl border border-[#1F2937] text-center space-y-3 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white text-base">Nenhum produto necessita de reposição para estes filtros!</h3>
              <p className="text-xs text-slate-400">Seu estoque está saudável com base nos parâmetros configurados.</p>
            </div>
          ) : (
            Object.entries(groupedRestockItems).map(([catName, items]: [string, SmartRestockItem[]]) => (
              <div key={catName} className="bg-[#111827] rounded-3xl border border-[#1F2937] overflow-hidden shadow-lg">
                {/* Category Group Header */}
                <div className="bg-[#161F32] p-4 border-b border-[#1F2937] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderTree className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-black text-white text-sm uppercase tracking-wider">
                      {catName}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-[#0B1220] px-2.5 py-1 rounded-full border border-[#1F2937]">
                    {items.length} {items.length === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>

                {/* Category Items List */}
                <div className="divide-y divide-[#1F2937]">
                  {items.map(item => {
                    const isZero = item.estoque <= 0;
                    return (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-[#1A2333]/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Left Info */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-white text-sm hover:text-indigo-300 transition cursor-pointer" onClick={() => copySingleItemName(item.nome)}>
                              {item.nome}
                            </h4>

                            {/* Urgency Badge */}
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                                item.nivel_urgencia === 'CRITICO'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {item.nivel_urgencia}
                            </span>
                          </div>

                          {/* Decision Reasons Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            {item.motivos.map((motivo, idx) => (
                              <span
                                key={idx}
                                className="bg-[#0B1220] text-slate-300 border border-[#1F2937] text-[10px] font-medium px-2 py-0.5 rounded-md"
                              >
                                {motivo}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right Numbers & Action */}
                        <div className="flex items-center space-x-4 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-medium block">Estoque Atual</span>
                            <span className={`font-mono text-sm font-bold ${isZero ? 'text-rose-400' : 'text-amber-400'}`}>
                              {item.estoque} un
                            </span>
                          </div>

                          <div className="text-right bg-[#0B1220] px-3 py-1.5 rounded-xl border border-[#1F2937]">
                            <span className="text-[10px] text-slate-400 font-medium block">Estoque Mínimo</span>
                            <span className="font-mono text-sm font-bold text-slate-300">
                              {item.estoque_minimo || 5} un
                            </span>
                          </div>

                          {/* Detail Telemetry Modal Button */}
                          <button
                            onClick={() => setSelectedTelemetryItem(item)}
                            title="Ver detalhes de telemetria do produto"
                            className="p-2 bg-[#0B1220] hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-[#1F2937] transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: APRENDIZADO & ESTATÍSTICAS DO SISTEMA */}
      {activeTab === 'estatisticas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Produtos Mais Vendidos */}
            <div className="bg-[#111827] p-5 rounded-3xl border border-[#1F2937] space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <h3 className="font-extrabold text-white text-sm">Mais Vendidos (Maior Giro)</h3>
              </div>
              <div className="divide-y divide-[#1F2937]">
                {snapshot.stats.produtosMaisVendidos.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Nenhuma venda registrada ainda.</p>
                ) : (
                  snapshot.stats.produtosMaisVendidos.map((p, i) => (
                    <div key={p.id} className="py-2 text-xs flex items-center justify-between">
                      <span className="text-slate-300 font-medium truncate">{i + 1}. {p.nome}</span>
                      <span className="font-mono font-bold text-emerald-400 shrink-0">{p.quantidade} un</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Produtos Parados */}
            <div className="bg-[#111827] p-5 rounded-3xl border border-[#1F2937] space-y-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <TrendingDown className="w-4 h-4" />
                <h3 className="font-extrabold text-white text-sm">Menos Vendidos (Baixo Giro)</h3>
              </div>
              <div className="divide-y divide-[#1F2937]">
                {snapshot.stats.produtosMenosVendidos.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Nenhum registro.</p>
                ) : (
                  snapshot.stats.produtosMenosVendidos.map((p, i) => (
                    <div key={p.id} className="py-2 text-xs flex items-center justify-between">
                      <span className="text-slate-300 font-medium truncate">{i + 1}. {p.nome}</span>
                      <span className="font-mono font-bold text-rose-400 shrink-0">{p.quantidade} un</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Categorias Mais Movimentadas */}
            <div className="bg-[#111827] p-5 rounded-3xl border border-[#1F2937] space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Layers className="w-4 h-4" />
                <h3 className="font-extrabold text-white text-sm">Categorias Mais Ativas</h3>
              </div>
              <div className="divide-y divide-[#1F2937]">
                {snapshot.stats.categoriasMaisMovimentadas.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Sem movimentação suficiente.</p>
                ) : (
                  snapshot.stats.categoriasMaisMovimentadas.map((c, i) => (
                    <div key={c.categoria} className="py-2 text-xs flex items-center justify-between">
                      <span className="text-slate-300 font-medium truncate">{i + 1}. {c.categoria}</span>
                      <span className="font-mono font-bold text-indigo-400 shrink-0">{c.totalVendas} un</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 4. Produtos que Vivem Zerando */}
            <div className="bg-[#111827] p-5 rounded-3xl border border-[#1F2937] space-y-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertOctagon className="w-4 h-4" />
                <h3 className="font-extrabold text-white text-sm">Frequência de Estoque Zerado</h3>
              </div>
              <div className="divide-y divide-[#1F2937]">
                {snapshot.stats.produtosFrequentesZerados.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Nenhum produto zerado frequentemente.</p>
                ) : (
                  snapshot.stats.produtosFrequentesZerados.map((p, i) => (
                    <div key={p.id} className="py-2 text-xs flex items-center justify-between">
                      <span className="text-slate-300 font-medium truncate">{i + 1}. {p.nome}</span>
                      <span className="font-mono font-bold text-amber-400 shrink-0">{p.vezesZerou}x zerado</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. Mais Procurados por Clientes */}
            <div className="bg-[#111827] p-5 rounded-3xl border border-[#1F2937] space-y-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <UserX className="w-4 h-4" />
                <h3 className="font-extrabold text-white text-sm">Mais Procurados Sem Estoque</h3>
              </div>
              <div className="divide-y divide-[#1F2937]">
                {snapshot.stats.produtosMaisProcurados.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Sem procuras não atendidas.</p>
                ) : (
                  snapshot.stats.produtosMaisProcurados.map((p, i) => (
                    <div key={p.id} className="py-2 text-xs flex items-center justify-between">
                      <span className="text-slate-300 font-medium truncate">{i + 1}. {p.nome}</span>
                      <span className="font-mono font-bold text-cyan-400 shrink-0">{p.procuras}x procurado</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 6. Tempo Médio Giro e Reposição */}
            <div className="bg-[#111827] p-5 rounded-3xl border border-[#1F2937] space-y-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <Clock className="w-4 h-4" />
                <h3 className="font-extrabold text-white text-sm">Métricas de Tempo</h3>
              </div>
              <div className="space-y-3 pt-1">
                <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#1F2937]">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tempo Médio até Esgotar</span>
                  <span className="text-lg font-black text-purple-300">~{snapshot.stats.tempoMedioEsgotarDias} dias</span>
                </div>

                <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#1F2937]">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Intervalo Médio Entre Reposições</span>
                  <span className="text-lg font-black text-indigo-300">~{snapshot.stats.tempoMedioEntreReposicoesDias} dias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Telemetry Detail Modal */}
      {selectedTelemetryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#111827] text-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#1F2937] flex flex-col">
            <div className="p-5 bg-[#161F32] border-b border-[#1F2937] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Telemetria de Análise</span>
                <h3 className="font-bold text-base text-white">{selectedTelemetryItem.nome}</h3>
              </div>
              <button
                onClick={() => setSelectedTelemetryItem(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              <div className="flex items-center justify-between bg-[#0B1220] p-3 rounded-2xl border border-[#1F2937]">
                <span className="text-slate-400 font-medium">Nível de Urgência</span>
                <span className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-full uppercase border ${
                  selectedTelemetryItem.nivel_urgencia === 'CRITICO'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {selectedTelemetryItem.nivel_urgencia}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-300">Motivos da Decisão:</h4>
                <div className="space-y-1">
                  {selectedTelemetryItem.motivos.map((m, idx) => (
                    <div key={idx} className="p-2 bg-[#0B1220] rounded-xl border border-[#1F2937] text-slate-200 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-slate-300">
                <div className="bg-[#0B1220] p-2.5 rounded-xl border border-[#1F2937]">
                  <span className="text-[10px] text-slate-500 block">Estoque Atual</span>
                  <span className="font-bold text-white">{selectedTelemetryItem.telemetry.estoqueAtual} un</span>
                </div>
                <div className="bg-[#0B1220] p-2.5 rounded-xl border border-[#1F2937]">
                  <span className="text-[10px] text-slate-500 block">Estoque Mínimo</span>
                  <span className="font-bold text-white">{selectedTelemetryItem.telemetry.estoqueMinimo} un</span>
                </div>
                <div className="bg-[#0B1220] p-2.5 rounded-xl border border-[#1F2937]">
                  <span className="text-[10px] text-slate-500 block">Vendas / Dia</span>
                  <span className="font-bold text-emerald-400">{selectedTelemetryItem.telemetry.vendasPorDia} un/dia</span>
                </div>
                <div className="bg-[#0B1220] p-2.5 rounded-xl border border-[#1F2937]">
                  <span className="text-[10px] text-slate-500 block">Sem Reposição Há</span>
                  <span className="font-bold text-amber-400">{selectedTelemetryItem.telemetry.diasSemReposicao} dias</span>
                </div>
                <div className="bg-[#0B1220] p-2.5 rounded-xl border border-[#1F2937]">
                  <span className="text-[10px] text-slate-500 block">Procuras Clientes</span>
                  <span className="font-bold text-cyan-400">{selectedTelemetryItem.telemetry.procurasClienteCount}x</span>
                </div>
                <div className="bg-[#0B1220] p-2.5 rounded-xl border border-[#1F2937]">
                  <span className="text-[10px] text-slate-500 block">Vezes Zerou</span>
                  <span className="font-bold text-rose-400">{selectedTelemetryItem.telemetry.vezesZerou}x</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#161F32] border-t border-[#1F2937] flex justify-end">
              <button
                onClick={() => setSelectedTelemetryItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Image Preview Modal */}
      {isImageModalOpen && generatedImageUrl && snapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base">Imagem da Lista Inteligente Gerada</h3>
                  <p className="text-[11px] text-slate-400">
                    Formato para impressão ou envio via WhatsApp.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-950/50">
              <img
                src={generatedImageUrl}
                alt="Lista de Reposição Facilitando Meu Trabalho"
                className="rounded-2xl border border-slate-800 shadow-2xl max-w-full h-auto object-contain"
              />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>O arquivo PNG foi baixado no seu navegador.</span>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={generatedImageUrl}
                  download={`Lista_Inteligente_Reposicao_${snapshot.generatedAtDate.replace(/\//g, '-')}.png`}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition shadow-md inline-flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Imagem</span>
                </a>

                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon Component
function BrainCircuitIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a3 3 0 1 0-6 0" />
    </svg>
  );
}
