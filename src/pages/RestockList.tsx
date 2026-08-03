import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Product, CustomerDemand } from '../types';
import {
  ClipboardList,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
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
  X
} from 'lucide-react';

interface RestockItem extends Product {
  sugerido_compra: number;
  nivel_urgencia: 'CRITICO' | 'ALERTA';
}

interface SnapshotData {
  generatedAtDate: string;
  generatedAtTime: string;
  generatedByUser: string;
  categoriesAnalyzed: number;
  productsAnalyzed: number;
  timeSpentMs: number;
  items: RestockItem[];
  allProducts: Product[];
  categories: string[];
  customerDemands: CustomerDemand[];
}

interface RestockListProps {
  onNavigateToProducts?: () => void;
  onNavigateToEntry?: () => void;
  onNavigateToCustomerDemand?: () => void;
}

// 11 intentional analysis steps for database processing
const ANALYSIS_STEPS = [
  'Iniciando análise...',
  'Lendo banco de dados...',
  'Verificando categorias...',
  'Conferindo estoque...',
  'Analisando produtos sem estoque...',
  'Analisando estoque negativo...',
  'Verificando produtos com estoque baixo...',
  'Verificando produtos procurados por clientes...',
  'Organizando categorias...',
  'Gerando lista...',
  'Finalizando...'
];

export const RestockList: React.FC<RestockListProps> = ({
  onNavigateToProducts,
  onNavigateToEntry,
  onNavigateToCustomerDemand
}) => {
  const { user } = useAuth();

  // Snapshot State (null initially = list not yet generated)
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);

  // Analysis / Processing State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Search & Filter State inside generated snapshot
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Copy Notifications & Modal
  const [copied, setCopied] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedCopyCategory, setSelectedCopyCategory] = useState<string>('');

  // Image Generation Modal & State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  /**
   * Triggers explicit step-by-step analysis of database with intentional 4-6 second duration.
   */
  const handleGenerateList = async () => {
    setIsAnalyzing(true);
    setCurrentStepIndex(0);
    setProgressPercent(2);
    const startTime = performance.now();

    // Intentional processing time: 450ms per step * 11 steps = 4950ms (~5.0 seconds total)
    const stepDuration = 450;

    // Run asynchronous fetch parallelly while animating the progress sequence
    const fetchPromise = Promise.all([
      api.getProducts(),
      api.getCategories(),
      api.getCustomerDemands()
    ]);

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setCurrentStepIndex(i);
      const targetPercent = Math.round(((i + 1) / ANALYSIS_STEPS.length) * 100);
      setProgressPercent(targetPercent);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }

    try {
      const [allProducts, allCategories, allDemands] = await fetchPromise;

      const endTime = performance.now();
      const timeSpent = Math.round(endTime - startTime);

      const categoryNames = Array.from(
        new Set((allCategories || []).map(c => c.nome.trim()).filter(Boolean))
      );

      // Filter items needing restock mathematically (estoque <= estoque_minimo)
      const restockItems: RestockItem[] = (allProducts || [])
        .filter(p => p.ativo !== false && p.estoque <= (p.estoque_minimo || 5))
        .map(p => {
          const minRequired = p.estoque_minimo || 5;
          const sugerido = Math.max(1, minRequired * 2 - p.estoque);
          const nivel =
            p.estoque <= 0 || p.estoque <= Math.floor(minRequired / 2)
              ? 'CRITICO'
              : 'ALERTA';
          return {
            ...p,
            sugerido_compra: sugerido,
            nivel_urgencia: nivel
          };
        });

      // Filter customer demands ("Cliente veio comprar e não tinha")
      const demandsList = (allDemands || [])
        .filter(d => d.status !== 'resolvido')
        .sort((a, b) => b.quantidade_solicitacoes - a.quantidade_solicitacoes);

      const now = new Date();
      const generatedAtDate = now.toLocaleDateString('pt-BR');
      const generatedAtTime = now.toLocaleTimeString('pt-BR');
      const generatedByUser = user?.nome || 'Administrador';

      setSnapshot({
        generatedAtDate,
        generatedAtTime,
        generatedByUser,
        categoriesAnalyzed: categoryNames.length,
        productsAnalyzed: (allProducts || []).length,
        timeSpentMs: timeSpent,
        items: restockItems,
        allProducts: allProducts || [],
        categories: categoryNames,
        customerDemands: demandsList
      });
    } catch (err) {
      console.error('Erro ao analisar banco de dados:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter snapshot items based on search term & selected category
  const filteredRestockItems = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.items.filter(item => {
      const matchesSearch =
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todas' || item.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [snapshot, searchTerm, selectedCategory]);

  // Group restock items strictly by Category and sort inside alphabetically
  const groupedRestockItems = useMemo(() => {
    const groups: { [catName: string]: RestockItem[] } = {};

    const sortedItems = [...filteredRestockItems].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR')
    );

    for (const item of sortedItems) {
      const cat = item.categoria || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    const sortedGroups: { [catName: string]: RestockItem[] } = {};
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .forEach(cat => {
        sortedGroups[cat] = groups[cat];
      });

    return sortedGroups;
  }, [filteredRestockItems]);

  const totalUnidadesComprar = useMemo(() => {
    if (!snapshot) return 0;
    return snapshot.items.reduce((acc, item) => acc + item.sugerido_compra, 0);
  }, [snapshot]);

  /**
   * Generates clean formatted text list with optional Customer Demands section
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
      itemsToInclude = snapshot.items.filter(
        p => p.estoque > 0 && p.estoque <= p.estoque_minimo
      );
    } else if (filterMode === 'category' && targetCatName) {
      itemsToInclude = snapshot.items.filter(
        p => (p.categoria || 'Outros') === targetCatName
      );
    }

    if (itemsToInclude.length === 0 && snapshot.customerDemands.length === 0) {
      return 'Nenhum produto encontrado para este filtro.';
    }

    const groups: { [catName: string]: RestockItem[] } = {};
    for (const item of itemsToInclude) {
      const cat = (item.categoria || 'OUTROS').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    const sortedCategories = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );

    const categoryBlocks: string[] = [];

    for (const catName of sortedCategories) {
      const sortedProds = groups[catName].sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR')
      );
      const prodLines = sortedProds.map(p => `• ${p.nome}`).join('\n');
      categoryBlocks.push(`${catName}\n\n${prodLines}`);
    }

    let resultText = categoryBlocks.join('\n\n');

    // Append "Produtos Procurados por Clientes" section
    if (snapshot.customerDemands.length > 0 && filterMode === 'all') {
      let demandText = `\n\nPRODUTOS PROCURADOS POR CLIENTES ("Cliente veio e não tinha")\n\n`;
      demandText += snapshot.customerDemands
        .map(d => `• ${d.produto_nome} (${d.quantidade_solicitacoes}x procurado)`)
        .join('\n');
      resultText += demandText;
    }

    return resultText;
  };

  /**
   * Generates a detailed technical report with quantities for suppliers
   */
  const generateDetailedReportText = () => {
    if (!snapshot) return '';

    let text = `📋 LISTA DETALHADA DE REPOSIÇÃO - BYTECAS\n`;
    text += `Geração: ${snapshot.generatedAtDate} às ${snapshot.generatedAtTime}\n`;
    text += `Gerado por: ${snapshot.generatedByUser}\n`;
    text += `--------------------------------------------------\n\n`;

    const groups: { [catName: string]: RestockItem[] } = {};
    for (const item of snapshot.items) {
      const cat = (item.categoria || 'Outros').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    const sortedCats = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );

    for (const catName of sortedCats) {
      text += `📦 ${catName}\n`;
      const sortedProds = groups[catName].sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR')
      );
      sortedProds.forEach(item => {
        text += `• ${item.nome} [CÓD: ${item.codigo}]\n`;
        text += `  Estoque Atual: ${item.estoque} un | Sugestão Compra: ${item.sugerido_compra} un\n`;
      });
      text += `\n`;
    }

    if (snapshot.customerDemands.length > 0) {
      text += `--------------------------------------------------\n`;
      text += `🛒 PRODUTOS PROCURADOS POR CLIENTES ("Cliente veio e não tinha")\n\n`;
      snapshot.customerDemands.forEach(d => {
        text += `• ${d.produto_nome} - Solicitado ${d.quantidade_solicitacoes}x por clientes\n`;
      });
      text += `\n`;
    }

    text += `--------------------------------------------------\n`;
    text += `Total de Itens: ${snapshot.items.length} | Total Unidades: ${totalUnidadesComprar} un`;
    return text;
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
    mode: 'all' | 'outOfStock' | 'lowStock' | 'category' | 'detailed',
    catName?: string
  ) => {
    let text = '';
    let successMsg = '';

    if (mode === 'detailed') {
      text = generateDetailedReportText();
      successMsg = 'Lista técnica detalhada copiada com sucesso!';
    } else {
      text = generateCleanTextList(mode, catName);
      if (mode === 'all') successMsg = 'Toda a lista copiada no formato limpo!';
      else if (mode === 'outOfStock') successMsg = 'Produtos sem estoque copiados!';
      else if (mode === 'lowStock') successMsg = 'Produtos com estoque baixo copiados!';
      else if (mode === 'category') successMsg = `Categoria "${catName}" copiada!`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setIsCopyModalOpen(false);
      setCopyNotification(successMsg);
      setTimeout(() => setCopyNotification(null), 4000);
    });
  };

  /**
   * Generates a professional poster image of the list using HTML5 Canvas
   */
  const handleGenerateImage = async () => {
    if (!snapshot) return;
    setIsGeneratingImage(true);

    try {
      // Group products by category
      const categoryMap: { [catName: string]: RestockItem[] } = {};
      const sortedItems = [...snapshot.items].sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR')
      );
      for (const item of sortedItems) {
        const cat = item.categoria || 'Outros';
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(item);
      }
      const sortedCategories = Object.keys(categoryMap).sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      );

      const demands = snapshot.customerDemands || [];

      // Dimensions calculation
      const canvasWidth = 900;
      const headerHeight = 200;
      const categoryHeaderHeight = 44;
      const itemRowHeight = 32;
      const categoryPaddingBottom = 18;

      let categoriesHeight = 0;
      sortedCategories.forEach(cat => {
        categoriesHeight +=
          categoryHeaderHeight +
          categoryMap[cat].length * itemRowHeight +
          categoryPaddingBottom;
      });

      let demandsHeight = 0;
      if (demands.length > 0) {
        demandsHeight = 50 + demands.length * itemRowHeight + 20;
      }

      const footerHeight = 60;
      const totalCanvasHeight = Math.max(
        650,
        headerHeight + categoriesHeight + demandsHeight + footerHeight + 40
      );

      // Retina scaling for super crisp typography
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
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, canvasWidth, totalCanvasHeight);

      // Top Decorative Banner Gradient
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      grad.addColorStop(0, '#1e1b4b'); // indigo-950
      grad.addColorStop(0.5, '#0f172a'); // slate-900
      grad.addColorStop(1, '#1e293b'); // slate-800
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, 160);

      // Top accent bar
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvasWidth, 6);

      // Store Logo & Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('BYTECAS', 40, 52);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(
        'LOJA DE ACESSÓRIOS & ELETRÔNICOS • LISTA DE REPOSIÇÃO DE ESTOQUE',
        40,
        72
      );

      // Metadata Card Container
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(40, 90, canvasWidth - 80, 55, 10);
      else ctx.rect(40, 90, canvasWidth - 80, 55);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px sans-serif';
      ctx.fillText(`📅 Data: ${snapshot.generatedAtDate}`, 55, 122);
      ctx.fillText(`⏰ Hora: ${snapshot.generatedAtTime}`, 230, 122);
      ctx.fillText(`👤 Gerado por: ${snapshot.generatedByUser}`, 420, 122);

      // Badge Count
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(canvasWidth - 230, 102, 170, 30, 6);
      else ctx.rect(canvasWidth - 230, 102, 170, 30);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${snapshot.items.length} ITENS PARA REPOSIÇÃO`,
        canvasWidth - 145,
        121
      );
      ctx.textAlign = 'left';

      let currentY = 175;

      // Render Categories
      for (const catName of sortedCategories) {
        const catItems = categoryMap[catName];

        // Category Header Box
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(40, currentY, canvasWidth - 80, 36, 8);
        else ctx.rect(40, currentY, canvasWidth - 80, 36);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`📦 ${catName.toUpperCase()}`, 55, currentY + 23);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${catItems.length} ${catItems.length === 1 ? 'produto' : 'produtos'}`,
          canvasWidth - 55,
          currentY + 23
        );
        ctx.textAlign = 'left';

        currentY += 42;

        // Products List
        for (let i = 0; i < catItems.length; i++) {
          const item = catItems[i];

          ctx.fillStyle = i % 2 === 0 ? '#0f172a' : '#182238';
          ctx.fillRect(40, currentY, canvasWidth - 80, itemRowHeight);

          // Bullet & Product Name
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('•', 55, currentY + 20);

          ctx.fillStyle = '#f8fafc';
          ctx.font = '13px sans-serif';
          ctx.fillText(item.nome, 70, currentY + 20);

          // Current Stock & Sugerido
          const isZero = item.estoque <= 0;
          ctx.fillStyle = isZero ? '#f87171' : '#fbbf24';
          ctx.font = 'bold 12px sans-serif';
          const stockLabel = isZero ? 'Estoque: 0 un (Acabou)' : `Estoque: ${item.estoque} un`;

          ctx.textAlign = 'right';
          ctx.fillText(stockLabel, canvasWidth - 170, currentY + 20);

          ctx.fillStyle = '#60a5fa';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Comprar: +${item.sugerido_compra} un`, canvasWidth - 55, currentY + 20);
          ctx.textAlign = 'left';

          currentY += itemRowHeight;
        }

        currentY += categoryPaddingBottom;
      }

      // SECTION: PRODUTOS PROCURADOS POR CLIENTES ("Cliente veio e não tinha")
      if (demands.length > 0) {
        currentY += 10;

        ctx.fillStyle = '#450a0a';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(40, currentY, canvasWidth - 80, 38, 8);
        else ctx.rect(40, currentY, canvasWidth - 80, 38);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fb7185';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(
          '🛒 PRODUTOS PROCURADOS POR CLIENTES ("Cliente veio comprar e não tinha")',
          55,
          currentY + 24
        );

        ctx.fillStyle = '#fda4af';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${demands.length} ${demands.length === 1 ? 'item procurado' : 'itens procurados'}`,
          canvasWidth - 55,
          currentY + 24
        );
        ctx.textAlign = 'left';

        currentY += 44;

        demands.forEach((d, idx) => {
          ctx.fillStyle = idx % 2 === 0 ? '#1f1322' : '#2d1830';
          ctx.fillRect(40, currentY, canvasWidth - 80, itemRowHeight);

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('•', 55, currentY + 20);

          ctx.fillStyle = '#fff1f2';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(d.produto_nome, 70, currentY + 20);

          ctx.fillStyle = '#fb7185';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(
            `${d.quantidade_solicitacoes}x procurado por clientes`,
            canvasWidth - 55,
            currentY + 20
          );
          ctx.textAlign = 'left';

          currentY += itemRowHeight;
        });

        currentY += 15;
      }

      // Footer
      ctx.fillStyle = '#334155';
      ctx.fillRect(40, totalCanvasHeight - 40, canvasWidth - 80, 1);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'SISTEMA BYTECAS • LISTA DE REPOSIÇÃO DE ESTOQUE • GERADO SOB DEMANDA',
        canvasWidth / 2,
        totalCanvasHeight - 20
      );

      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedImageUrl(dataUrl);
      setIsImageModalOpen(true);

      // Auto download link
      const link = document.createElement('a');
      link.download = `Lista_Reposicao_Bytecas_${snapshot.generatedAtDate.replace(/\//g, '-')}.png`;
      link.href = dataUrl;
      link.click();

      setCopyNotification('Imagem da lista gerada e baixada com sucesso!');
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
      <div className="min-h-[500px] flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin flex items-center justify-center"></div>
          <Sparkles className="w-10 h-10 text-blue-400 absolute animate-pulse" />
        </div>

        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            Analisando Banco de Dados do Estoque...
          </h3>
          <p className="text-xs text-blue-300 font-medium">
            Realizando varredura completa de produtos, categorias e prospecções de clientes.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <span className="text-blue-400">{ANALYSIS_STEPS[currentStepIndex]}</span>
            <span className="text-slate-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* List of Analysis Steps */}
        <div className="w-full max-w-md bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px] shadow-inner">
          {ANALYSIS_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step}
                className={`flex items-center space-x-2 transition-all ${
                  isDone
                    ? 'text-emerald-400 font-semibold'
                    : isCurrent
                    ? 'text-blue-300 font-bold animate-pulse'
                    : 'text-slate-600'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                ) : isCurrent ? (
                  <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin text-blue-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-800 shrink-0"></div>
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: INITIAL EMPTY STATE (Lista ainda não gerada)
  // -------------------------------------------------------------
  if (!snapshot) {
    return (
      <div className="space-y-6 pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center space-x-2">
              <ClipboardList className="w-6 h-6 text-blue-500" />
              <span>Lista de Reposição</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Geração pontual sob demanda para uma fotografia precisa do estoque.
            </p>
          </div>
        </div>

        {/* Central Card with Generate Action */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-2xl max-w-2xl mx-auto my-8">
          <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20 shadow-inner">
            <ClipboardList className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-extrabold uppercase tracking-wider rounded-full border border-blue-500/20">
              Análise sob demanda
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight">
              A lista ainda não foi gerada
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Clique no botão grande abaixo para iniciar a análise completa do banco de dados e montar a lista de reposição do seu estoque.
            </p>
          </div>

          <button
            onClick={handleGenerateList}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-extrabold rounded-2xl shadow-2xl shadow-blue-950/80 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center space-x-3 mx-auto border border-blue-400/40 cursor-pointer"
          >
            <Sparkles className="w-6 h-6 text-blue-200 animate-pulse" />
            <span>Gerar Lista de Reposição</span>
          </button>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-4">
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Análise completa do banco de dados</span>
            </span>
            <span className="flex items-center space-x-1">
              <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
              <span>Inclui produtos procurados por clientes</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: GENERATED SNAPSHOT VIEW (Fotografia do Estoque)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner & Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fotografia do Estoque Gerada</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Lista de Reposição de Estoque</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Esta lista é estática e representa a situação do estoque no momento exato em que foi gerada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Action 1: Copiar Lista */}
            <button
              onClick={handleCopyCleanList}
              disabled={snapshot.items.length === 0 && snapshot.customerDemands.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-2 ${
                copied
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Lista Copiada!' : 'Copiar Lista'}</span>
            </button>

            {/* Action 2: Gerar Imagem da Lista */}
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || (snapshot.items.length === 0 && snapshot.customerDemands.length === 0)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-2 active:scale-95 disabled:opacity-50"
              title="Gera uma imagem formatada em PNG para compartilhamento no WhatsApp"
            >
              {isGeneratingImage ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
              ) : (
                <ImageIcon className="w-4 h-4 text-emerald-200" />
              )}
              <span>{isGeneratingImage ? 'Gerando Imagem...' : 'Gerar Imagem da Lista'}</span>
            </button>

            {/* Copy Options Menu Trigger */}
            <button
              onClick={() => setIsCopyModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              title="Opções avançadas de cópia de texto"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Opções</span>
            </button>

            {/* Re-generate New List Button */}
            <button
              onClick={handleGenerateList}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 active:scale-95"
              title="Inicia nova análise completa do banco de dados"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              <span>Gerar Nova Lista</span>
            </button>
          </div>
        </div>

        {/* Top Header Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs pt-1">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Data</span>
              <span className="font-bold text-white">{snapshot.generatedAtDate}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Hora</span>
              <span className="font-bold text-white">{snapshot.generatedAtTime}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Gerado por</span>
              <span className="font-bold text-white truncate">{snapshot.generatedByUser}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
            <FolderTree className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Categorias</span>
              <span className="font-bold text-white">{snapshot.categoriesAnalyzed} analisadas</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Produtos</span>
              <span className="font-bold text-white">{snapshot.productsAnalyzed} analisados</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Tempo Gasto</span>
              <span className="font-bold text-white">
                {(snapshot.timeSpentMs / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Success Alert Notification */}
      {copyNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">{copyNotification}</p>
              <p className="text-[11px] text-emerald-700">
                O conteúdo já está na sua área de transferência para envio.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCopyNotification(null)}
            className="text-emerald-700 text-xs font-semibold hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Itens em Reposição</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {snapshot.items.length}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
              de {snapshot.productsAnalyzed} cadastrados
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Unidades Sugeridas</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalUnidadesComprar}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-medium">unidades no total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Procura por Clientes</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {snapshot.customerDemands.length}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
              itens solicitados
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar na fotografia por nome, código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Todas">Todas as Categorias</option>
            {snapshot.categories.map((cat, idx) => (
              <option key={`${cat}-${idx}`} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DEDICATED SECTION: PRODUTOS PROCURADOS POR CLIENTES ("Cliente veio comprar e não tinha") */}
      {snapshot.customerDemands.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white p-6 rounded-3xl border border-rose-500/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/30 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-500/20 text-rose-300 rounded-2xl border border-rose-500/40 shadow-inner">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-rose-500/30 text-rose-200 text-[10px] font-extrabold uppercase tracking-wider rounded-full border border-rose-400/30">
                  Procura em Balcão
                </span>
                <h3 className="text-base font-extrabold text-white tracking-tight mt-1">
                  Produtos Procurados por Clientes
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Itens registrados na função "Cliente veio comprar e não tinha". Relevante para novos pedidos de compra.
                </p>
              </div>
            </div>

            {onNavigateToCustomerDemand && (
              <button
                onClick={onNavigateToCustomerDemand}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5 shrink-0"
              >
                <span>Ver Gerenciador</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {snapshot.customerDemands.map(item => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 flex items-center justify-between text-xs space-x-2"
              >
                <div className="truncate">
                  <span className="font-bold text-white block truncate">
                    {item.produto_nome}
                  </span>
                  <span className="text-[10px] text-rose-200/80 block">
                    {item.cadastrado ? 'Produto Cadastrado' : 'Não Cadastrado'}
                  </span>
                </div>

                <span className="px-2.5 py-1 bg-rose-500/30 text-rose-200 border border-rose-400/40 font-black text-xs rounded-xl flex items-center space-x-1 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-300" />
                  <span>{item.quantidade_solicitacoes}x procurado</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Restock List View */}
      {filteredRestockItems.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center py-12">
          <PackageCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900">
            {searchTerm || selectedCategory !== 'Todas'
              ? 'Nenhum item encontrado com os filtros aplicados'
              : 'Nenhum produto precisando de reposição no momento!'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Nesta fotografia do estoque, todos os produtos analisados estavam com quantidade normalizada.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category Blocks Display */}
          {Object.entries(groupedRestockItems).map(
            ([catName, items]: [string, RestockItem[]]) => {
              const sortedItems = [...items].sort((a, b) =>
                a.nome.localeCompare(b.nome, 'pt-BR')
              );

              return (
                <div
                  key={catName}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
                >
                  {/* Category Header as specified: 📦 CATEGORIA */}
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-lg">📦</span>
                      <h3 className="font-extrabold text-sm tracking-wider uppercase text-blue-300">
                        {catName}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded-full font-mono font-bold border border-blue-500/30">
                        {sortedItems.length}{' '}
                        {sortedItems.length === 1 ? 'produto' : 'produtos'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyOption('category', catName)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition border border-white/20 flex items-center space-x-1.5"
                      title={`Copiar lista limpa da categoria ${catName}`}
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-300" />
                      <span>Copiar Categoria</span>
                    </button>
                  </div>

                  {/* Bullet List Display of Products */}
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                    <ul className="space-y-1.5 text-xs font-medium text-slate-800">
                      {sortedItems.map(p => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between group hover:bg-white p-1.5 rounded-lg transition"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span className="font-semibold">{p.nome}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                p.estoque === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.estoque === 0
                                ? 'Acabou (0 un)'
                                : `${p.estoque} un`}
                            </span>
                            <button
                              onClick={() => copySingleItemName(p.nome)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition opacity-80 group-hover:opacity-100"
                              title="Copiar nome do produto"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technical Details Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Produto & Código</th>
                          <th className="py-2.5 px-4">Marca & Local</th>
                          <th className="py-2.5 px-4 text-center">Estoque Atual</th>
                          <th className="py-2.5 px-4 text-center">Mínimo</th>
                          <th className="py-2.5 px-4 text-center">Sugerido Compra</th>
                          <th className="py-2.5 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sortedItems.map(item => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900">{item.nome}</p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                CÓD: {item.codigo}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <p className="font-semibold text-slate-800">{item.marca}</p>
                              <p className="text-[10px] text-slate-400">{item.localizacao}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block font-extrabold px-2.5 py-0.5 rounded-lg text-xs ${
                                  item.estoque === 0
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {item.estoque} un
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-600">
                              {item.estoque_minimo} un
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-lg text-xs">
                                +{item.sugerido_compra} un
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {onNavigateToEntry && (
                                <button
                                  onClick={onNavigateToEntry}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 shadow-xs ml-auto"
                                >
                                  <span>Entrada</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Copy Options Modal */}
      {isCopyModalOpen && snapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Copy className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Opções de Cópia da Lista</h3>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Escolha como deseja copiar a fotografia da lista de reposição para envio:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleCopyOption('all')}
                  className="w-full p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700">
                      📋 Toda a Lista (Padrão Limpo)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Organizada por categorias e com a seção de produtos procurados por clientes.
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                </button>

                <button
                  onClick={() => handleCopyOption('outOfStock')}
                  className="w-full p-3.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-200/80 rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-rose-900">
                      🚫 Apenas Produtos Sem Estoque (Acabou - 0 un)
                    </div>
                    <div className="text-[11px] text-rose-700/80 mt-0.5">
                      Copia apenas os produtos que estavam com estoque zerado na fotografia.
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-rose-500 shrink-0" />
                </button>

                <button
                  onClick={() => handleCopyOption('lowStock')}
                  className="w-full p-3.5 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/80 rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-amber-900">
                      ⚠️ Apenas Produtos com Estoque Baixo
                    </div>
                    <div className="text-[11px] text-amber-700/80 mt-0.5">
                      Copia produtos que estavam abaixo do estoque mínimo na fotografia.
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-amber-500 shrink-0" />
                </button>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="font-bold text-slate-900">📂 Copiar Apenas Uma Categoria</div>
                  <div className="flex space-x-2">
                    <select
                      value={selectedCopyCategory}
                      onChange={e => setSelectedCopyCategory(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {snapshot.categories.map((c, idx) => (
                        <option key={`${c}-${idx}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={!selectedCopyCategory}
                      onClick={() => handleCopyOption('category', selectedCopyCategory)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyOption('detailed')}
                  className="w-full p-3.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200/80 rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-indigo-900">
                      📊 Relatório Técnico Detalhado
                    </div>
                    <div className="text-[11px] text-indigo-700/80 mt-0.5">
                      Inclui códigos de produto, estoque atual e sugestões de quantidade de compra.
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-indigo-500 shrink-0" />
                </button>
              </div>
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
                  <h3 className="font-bold text-base">Imagem da Lista Gerada</h3>
                  <p className="text-[11px] text-slate-400">
                    Formato profissional para envio via WhatsApp ou impressão.
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
                alt="Lista de Reposição Bytecas"
                className="rounded-2xl border border-slate-800 shadow-2xl max-w-full h-auto object-contain"
              />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>O arquivo PNG foi baixado automaticamente no seu navegador.</span>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={generatedImageUrl}
                  download={`Lista_Reposicao_Bytecas_${snapshot.generatedAtDate.replace(/\//g, '-')}.png`}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition shadow-md inline-flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Imagem Novamente</span>
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
