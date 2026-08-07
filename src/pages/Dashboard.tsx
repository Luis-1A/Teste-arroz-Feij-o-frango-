import React, { useEffect, useState, useMemo } from 'react';
import { firestoreSync } from '../services/firestoreSync';
import { Product, Movement, Category, StockDivergenceRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { TabType } from '../components/Sidebar';
import {
  Boxes,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ShoppingCart,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  ClipboardList,
  UserX,
  FileBarChart,
  Sliders,
  Copy,
  Check,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  Folder,
  AlertCircle,
  GripVertical,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Zap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: TabType, extraMode?: 'saida' | 'troca') => void;
}

const DEFAULT_CARD_ORDER = [
  'card_header',
  'card_stats',
  'card_shortcuts',
  'card_alerts',
  'card_restock',
  'card_activities'
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, canPerform } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [divergences, setDivergences] = useState<StockDivergenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedList, setCopiedList] = useState(false);
  const [showMoreShortcuts, setShowMoreShortcuts] = useState(false);

  // Drag & Drop Layout State
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_ORDER);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);

  // Clock
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load User Layout
  useEffect(() => {
    if (user?.id) {
      firestoreSync.loadDashboardLayout(user.id).then(savedLayout => {
        if (savedLayout && savedLayout.length > 0) {
          // Ensure all cards are present
          const unique = Array.from(new Set([...savedLayout, ...DEFAULT_CARD_ORDER]));
          setCardOrder(unique);
        }
      });
    }
  }, [user?.id]);

  // Subscriptions to Firestore (Real-Time across all clients)
  useEffect(() => {
    const unsubProds = firestoreSync.subscribeProducts((prods) => {
      setProducts(prods || []);
      setLoading(false);
    });

    const unsubCats = firestoreSync.subscribeCategories((cats) => {
      setCategories(cats || []);
    });

    const unsubMovs = firestoreSync.subscribeMovements((movs) => {
      setMovements(movs || []);
    });

    const unsubDivs = firestoreSync.subscribeDivergences((divs) => {
      setDivergences(divs || []);
    });

    return () => {
      unsubProds();
      unsubCats();
      unsubMovs();
      unsubDivs();
    };
  }, []);

  /**
   * REVISÃO COMPLETA DO CONTADOR DE DIVERGÊNCIAS
   * Recalcula diretamente das divergências abertas no banco e produtos com estoque negativo.
   */
  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => p.ativo !== false);
    const totalProdutos = activeProducts.length;

    const estoqueBaixo = activeProducts.filter(
      (p) => !p.nao_relevante && p.estoque > 0 && p.estoque < (p.estoque_minimo || 5)
    );
    const semEstoque = activeProducts.filter((p) => p.estoque <= 0);
    const estoqueNegativo = activeProducts.filter((p) => p.estoque < 0);

    // Contagem precisa das divergências abertas no banco + estoque negativo ativo
    const openDivergencesSet = new Set<string>();

    divergences.forEach(d => {
      if (d.status === 'Aberta') {
        openDivergencesSet.add(d.produto_id);
      }
    });

    // Adiciona produtos com estoque negativo caso ainda não estejam no set
    estoqueNegativo.forEach(p => {
      openDivergencesSet.add(p.id);
    });

    const divergenciasCount = openDivergencesSet.size;

    return {
      totalProdutos,
      estoqueBaixoCount: estoqueBaixo.length,
      semEstoqueCount: semEstoque.length,
      divergenciasCount,
      attentionList: [...estoqueNegativo, ...semEstoque.filter(p => p.estoque === 0), ...estoqueBaixo]
    };
  }, [products, divergences]);

  // Compute Restock List grouped by category
  const restockByCategory = useMemo<Record<string, Product[]>>(() => {
    const active = products.filter((p) => p.ativo !== false && p.estoque < (p.estoque_minimo || 5));
    const map: Record<string, Product[]> = {};

    active.forEach((p) => {
      const cat = p.categoria || 'Geral';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });

    return map;
  }, [products]);

  const handleCopyRestockList = () => {
    const lines: string[] = ['📋 *LISTA DE REPOSIÇÃO DE ESTOQUE*', ''];

    let totalItems = 0;
    Object.entries(restockByCategory).forEach(([cat, prods]: [string, Product[]]) => {
      lines.push(`📂 *${cat.toUpperCase()}*`);
      prods.forEach((p) => {
        totalItems++;
        const nec = Math.max(1, (p.estoque_minimo || 5) * 2 - p.estoque);
        lines.push(`• ${p.nome} (Atual: ${p.estoque} un | Sugerido: ${nec} un)`);
      });
      lines.push('');
    });

    if (totalItems === 0) {
      lines.push('✅ Todos os produtos possuem estoque suficiente!');
    }

    lines.push(`\nSincronizado em: ${new Date().toLocaleString('pt-BR')}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2500);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCardId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === overId) return;

    const fromIndex = cardOrder.indexOf(draggedCardId);
    const toIndex = cardOrder.indexOf(overId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newOrder = [...cardOrder];
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, draggedCardId);
      setCardOrder(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    if (user?.id) {
      firestoreSync.saveDashboardLayout(user.id, cardOrder);
    }
  };

  const handleResetLayout = () => {
    setCardOrder(DEFAULT_CARD_ORDER);
    if (user?.id) {
      firestoreSync.saveDashboardLayout(user.id, DEFAULT_CARD_ORDER);
    }
  };

  const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const greetingName = user?.nome ? user.nome.split(' ')[0] : 'Funcionário';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs font-bold">Carregando indicadores em tempo real...</span>
      </div>
    );
  }

  // Card Content Renderer
  const renderCardContent = (cardId: string) => {
    switch (cardId) {
      case 'card_header':
        return (
          <div className="bg-[#111827] text-white p-6 rounded-3xl border border-[#1F2937] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Sistema Ativo & Sincronizado</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Olá, {greetingName}! 👋
              </h1>
              <p className="text-xs text-slate-400">
                Acompanhe e gerencie o estoque da loja em tempo real.
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center space-x-2 bg-[#0B1220] px-4 py-2 rounded-2xl border border-[#1F2937]">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-sm font-bold text-white">{formattedTime}</span>
              </div>

              <button
                onClick={() => setIsCustomizeMode(!isCustomizeMode)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                  isCustomizeMode
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-[#0B1220] text-slate-300 border-[#1F2937] hover:bg-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>{isCustomizeMode ? 'Concluir Organização' : 'Organizar Cartões'}</span>
              </button>

              {isCustomizeMode && (
                <button
                  onClick={handleResetLayout}
                  title="Restaurar Ordem Padrão"
                  className="p-2 bg-[#0B1220] hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-[#1F2937] transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );

      case 'card_stats':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Produtos */}
            <div
              onClick={() => onNavigate('products')}
              className="bg-[#111827] p-5 rounded-3xl border border-[#1F2937] hover:border-indigo-500/50 transition cursor-pointer group space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Produtos</span>
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{stats.totalProdutos}</span>
                <span className="text-[10px] text-slate-500 font-medium">Cadastrados</span>
              </div>
            </div>

            {/* Estoque Baixo */}
            <div
              onClick={() => onNavigate('low-stock')}
              className="bg-[#111827] p-5 rounded-3xl border border-amber-500/30 hover:border-amber-500 transition cursor-pointer group space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Estoque Baixo</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-400">{stats.estoqueBaixoCount}</span>
                <span className="text-[10px] text-amber-500 font-medium">Abaixo do Mínimo</span>
              </div>
            </div>

            {/* Sem Estoque */}
            <div
              onClick={() => onNavigate('low-stock')}
              className="bg-[#111827] p-5 rounded-3xl border border-rose-500/30 hover:border-rose-500 transition cursor-pointer group space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Sem Estoque</span>
                <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertOctagon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-400">{stats.semEstoqueCount}</span>
                <span className="text-[10px] text-rose-500 font-medium">Zerados</span>
              </div>
            </div>

            {/* Divergências (RECALCULADO REVISADO) */}
            <div
              onClick={() => onNavigate('stock-divergences')}
              className="bg-[#111827] p-5 rounded-3xl border border-purple-500/30 hover:border-purple-500 transition cursor-pointer group space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Divergências</span>
                <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-purple-400">{stats.divergenciasCount}</span>
                <span className="text-[10px] text-purple-500 font-medium">Negativo / Pendente</span>
              </div>
            </div>
          </div>
        );

      case 'card_shortcuts':
        return (
          <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Atalhos Rápidos de Operação</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigate('sales', 'saida')}
                className="p-4 bg-[#161F32] hover:bg-slate-800 border border-[#1F2937] rounded-2xl text-left transition space-y-2 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PackageMinus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs">Registrar Saída</div>
                  <div className="text-[10px] text-slate-400">Dar baixa no estoque</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('entry')}
                className="p-4 bg-[#161F32] hover:bg-slate-800 border border-[#1F2937] rounded-2xl text-left transition space-y-2 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs">Nova Entrada</div>
                  <div className="text-[10px] text-slate-400">Reposição de produtos</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('sales', 'troca')}
                className="p-4 bg-[#161F32] hover:bg-slate-800 border border-[#1F2937] rounded-2xl text-left transition space-y-2 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs">Troca / Devolução</div>
                  <div className="text-[10px] text-slate-400">Substituir produto</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('restock-list')}
                className="p-4 bg-[#161F32] hover:bg-slate-800 border border-[#1F2937] rounded-2xl text-left transition space-y-2 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-xs">Motor de Reposição</div>
                  <div className="text-[10px] text-slate-400">Gerar lista inteligente</div>
                </div>
              </button>
            </div>
          </div>
        );

      case 'card_alerts':
        return (
          <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Alertas de Estoque Crítico ({stats.attentionList.length})</span>
              </h2>
              <button
                onClick={() => onNavigate('low-stock')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Ver Todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.attentionList.length === 0 ? (
              <div className="p-6 bg-[#0B1220] rounded-2xl border border-[#1F2937] text-center space-y-1 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-white">Nenhum produto em estado crítico!</p>
                <p className="text-[11px]">Todos os itens estão com nível de estoque adequado.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {stats.attentionList.slice(0, 5).map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#161F32] rounded-2xl border border-[#1F2937] flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-xs">{p.nome}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.categoria} • Mínimo: {p.estoque_minimo || 5} un
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-xl border ${
                          p.estoque <= 0
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {p.estoque <= 0 ? 'ZERADO' : `${p.estoque} un`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'card_restock':
        return (
          <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-indigo-400" />
                <span>Resumo para Reposição por Categoria</span>
              </h2>

              <button
                onClick={handleCopyRestockList}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
              >
                {copiedList ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedList ? 'Copiado!' : 'Copiar Resumo'}</span>
              </button>
            </div>

            {Object.keys(restockByCategory).length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum produto necessitando de reposição imediata.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {Object.entries(restockByCategory).map(([cat, prods]: [string, Product[]]) => (
                  <div key={cat} className="p-3 bg-[#161F32] rounded-2xl border border-[#1F2937] space-y-1.5">
                    <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5">
                      <span className="font-extrabold text-xs text-indigo-300 uppercase">{cat}</span>
                      <span className="text-[10px] font-bold text-slate-400">{prods.length} itens</span>
                    </div>

                    <div className="space-y-1">
                      {prods.slice(0, 3).map(p => (
                        <div key={p.id} className="text-xs flex items-center justify-between text-slate-300">
                          <span className="truncate max-w-[150px]">• {p.nome}</span>
                          <span className="font-mono text-[10px] text-amber-400">{p.estoque} un</span>
                        </div>
                      ))}
                      {prods.length > 3 && (
                        <div className="text-[10px] text-slate-400 italic">+{prods.length - 3} outros produtos</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'card_activities':
        return (
          <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Últimas Movimentações no Sistema</span>
              </h2>

              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Ver Histórico Completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {movements.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma movimentação registrada recentemente.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-[#1F2937]">
                {movements.slice(0, 6).map(m => (
                  <div key={m.id} className="pt-2 text-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white">{m.produto_nome}</div>
                      <div className="text-[10px] text-slate-400">
                        {m.tipo.toUpperCase()} • Por {m.usuario_nome || 'Sistema'}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span
                        className={
                          m.tipo === 'saida'
                            ? 'text-rose-400 font-bold'
                            : m.tipo === 'entrada'
                            ? 'text-emerald-400 font-bold'
                            : 'text-blue-400 font-bold'
                        }
                      >
                        {m.tipo === 'saida' ? '-' : '+'}{m.quantidade} un
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Draggable Grid of Cards */}
      <div className="space-y-6">
        {cardOrder.map(cardId => (
          <div
            key={cardId}
            draggable={isCustomizeMode}
            onDragStart={e => handleDragStart(e, cardId)}
            onDragOver={e => handleDragOver(e, cardId)}
            onDragEnd={handleDragEnd}
            className={`relative transition-all duration-200 ${
              isCustomizeMode ? 'cursor-grab active:cursor-grabbing ring-2 ring-indigo-500/50 rounded-3xl p-1 bg-indigo-950/20' : ''
            }`}
          >
            {isCustomizeMode && (
              <div className="absolute top-3 right-3 z-10 bg-indigo-600 text-white p-1.5 rounded-xl flex items-center space-x-1 text-[10px] font-extrabold shadow-lg">
                <GripVertical className="w-4 h-4" />
                <span>Arraste para Reordenar</span>
              </div>
            )}
            {renderCardContent(cardId)}
          </div>
        ))}
      </div>
    </div>
  );
};
