import React, { useEffect, useState, useMemo } from 'react';
import { firestoreSync } from '../services/firestoreSync';
import { Product, Movement, Category } from '../types';
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
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: TabType, extraMode?: 'saida' | 'troca') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, canPerform } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedList, setCopiedList] = useState(false);
  const [showMoreShortcuts, setShowMoreShortcuts] = useState(false);

  // Clock
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

    return () => {
      unsubProds();
      unsubCats();
      unsubMovs();
    };
  }, []);

  // Compute Metrics Cards
  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => p.ativo !== false);
    const totalProdutos = activeProducts.length;

    const estoqueBaixo = activeProducts.filter(
      (p) => !p.nao_relevante && p.estoque > 0 && p.estoque <= (p.estoque_minimo || 5)
    );
    const semEstoque = activeProducts.filter((p) => p.estoque === 0);
    const estoqueNegativo = activeProducts.filter((p) => p.estoque < 0);

    const divergencias = activeProducts.filter(
      (p) => p.estoque < 0 || (p.estoque === 0 && (p.historico_alteracoes?.length || 0) > 0)
    );

    return {
      totalProdutos,
      estoqueBaixoCount: estoqueBaixo.length,
      semEstoqueCount: semEstoque.length,
      divergenciasCount: divergencias.length,
      attentionList: [...estoqueNegativo, ...semEstoque, ...estoqueBaixo]
    };
  }, [products]);

  // Compute Restock List grouped by category
  const restockByCategory = useMemo<Record<string, Product[]>>(() => {
    const active = products.filter((p) => p.ativo !== false && p.estoque <= (p.estoque_minimo || 5));
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

  const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Greeting name
  const greetingName = user?.nome ? user.nome.split(' ')[0] : 'Funcionário';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Carregando painel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Simplificado (Olá [Nome], Relógio discreto e Status Online) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] text-white p-5 rounded-2xl border border-[#1F2937]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Olá, {greetingName}</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Painel de Controle e Gestão do Estoque
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Indicador Discreto de Conexão Online */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[11px]">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>Online</span>
          </div>

          {/* Relógio Pequeno no Canto */}
          <div className="flex items-center space-x-1.5 text-slate-400 bg-[#0B1220] px-3 py-1 rounded-xl border border-[#1F2937] font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Indicadores Essenciais (Produtos, Estoque Baixo, Sem Estoque, Divergências) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Produtos */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Produtos</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{stats.totalProdutos}</p>
        </div>

        {/* Estoque Baixo */}
        <div
          onClick={() => onNavigate('low-stock')}
          className="bg-[#111827] p-4 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-400">Estoque Baixo</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1.5">{stats.estoqueBaixoCount}</p>
        </div>

        {/* Sem Estoque */}
        <div
          onClick={() => onNavigate('low-stock')}
          className="bg-[#111827] p-4 rounded-2xl border border-rose-500/20 hover:border-rose-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-400">Sem Estoque</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-1.5">{stats.semEstoqueCount}</p>
        </div>

        {/* Divergências */}
        <div
          onClick={() => onNavigate('stock-divergences')}
          className="bg-[#111827] p-4 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-purple-400">Divergências</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-1.5">{stats.divergenciasCount}</p>
        </div>
      </div>

      {/* 3. Atalhos Compactos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Atalhos Rápidos</h2>
          <button
            onClick={() => setShowMoreShortcuts(!showMoreShortcuts)}
            className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>{showMoreShortcuts ? 'Menos opções' : 'Mais opções'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreShortcuts ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Frente de Caixa */}
          <button
            onClick={() => onNavigate('sales')}
            className="p-3 bg-[#111827] hover:bg-[#1A2333] border border-[#1F2937] rounded-xl text-left transition flex items-center space-x-3"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-xs block truncate">Caixa / PDV</span>
            </div>
          </button>

          {/* Estoque */}
          <button
            onClick={() => onNavigate('products')}
            className="p-3 bg-[#111827] hover:bg-[#1A2333] border border-[#1F2937] rounded-xl text-left transition flex items-center space-x-3"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-xs block truncate">Estoque</span>
            </div>
          </button>

          {/* Entrada */}
          <button
            onClick={() => onNavigate('entry')}
            className="p-3 bg-[#111827] hover:bg-[#1A2333] border border-[#1F2937] rounded-xl text-left transition flex items-center space-x-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-xs block truncate">Entrada</span>
            </div>
          </button>

          {/* Saída */}
          <button
            onClick={() => onNavigate('sales', 'saida')}
            className="p-3 bg-[#111827] hover:bg-[#1A2333] border border-[#1F2937] rounded-xl text-left transition flex items-center space-x-3"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <PackageMinus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-xs block truncate">Saída</span>
            </div>
          </button>

          {/* Expanded Shortcuts */}
          {showMoreShortcuts && (
            <>
              {/* Trocas */}
              <button
                onClick={() => onNavigate('sales', 'troca')}
                className="p-3 bg-[#111827] hover:bg-[#1A2333] border border-[#1F2937] rounded-xl text-left transition flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block truncate">Trocas</span>
                </div>
              </button>

              {/* Reposição */}
              <button
                onClick={() => onNavigate('restock-list')}
                className="p-3 bg-[#111827] hover:bg-[#1A2333] border border-[#1F2937] rounded-xl text-left transition flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block truncate">Reposição</span>
                </div>
              </button>

              {/* Demanda */}
              <button
                onClick={() => onNavigate('customer-demand')}
                className="p-3 bg-[#111827] hover:bg-[#1A2333] border border-[#1F2937] rounded-xl text-left transition flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <UserX className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block truncate">Não Tinha</span>
                </div>
              </button>

              {/* Relatórios */}
              <button
                onClick={() => onNavigate('history')}
                className="p-3 bg-[#111827] hover:bg-[#1A2333] border border-[#1F2937] rounded-xl text-left transition flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <FileBarChart className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block truncate">Relatórios</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4. Alert Section: Se houver produtos em falta / atenção, mostrar; Se 0 itens, OMITIR COMPLETAMENTE */}
      {stats.attentionList.length > 0 && (
        <div className="bg-[#111827] p-4 rounded-2xl border border-rose-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-bold text-white">Alertas de Estoque</h2>
            </div>
            <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              {stats.attentionList.length} {stats.attentionList.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="divide-y divide-[#1F2937] max-h-48 overflow-y-auto">
            {stats.attentionList.map((p) => {
              const isNeg = p.estoque < 0;
              const isZero = p.estoque === 0;

              return (
                <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{p.nome}</p>
                    <p className="text-[10px] text-slate-400">{p.categoria}</p>
                  </div>

                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] shrink-0 ml-2 ${
                      isNeg
                        ? 'bg-rose-500/20 text-rose-300'
                        : isZero
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {isNeg
                      ? `${p.estoque} un (Negativo)`
                      : isZero
                      ? '0 un (Zerado)'
                      : `${p.estoque} un (Baixo)`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Lista de Reposição & Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lista de Reposição rápida */}
        <div className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-white">Lista de Reposição</h2>
            <button
              onClick={handleCopyRestockList}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
            >
              {copiedList ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedList ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto">
            {Object.keys(restockByCategory).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Nenhum produto necessita de reposição no momento.
              </p>
            ) : (
              Object.entries(restockByCategory).map(([cat, items]: [string, Product[]]) => (
                <div key={cat} className="p-2.5 bg-[#0B1220] rounded-xl border border-[#1F2937] text-xs">
                  <h3 className="font-bold text-blue-400 text-[11px] mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                    <Folder className="w-3 h-3" />
                    <span>{cat}</span>
                  </h3>
                  <div className="space-y-1">
                    {items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 truncate">{it.nome}</span>
                        <span className="font-semibold text-rose-400 shrink-0 ml-2">{it.estoque} un</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-white">Atividades Recentes</h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-[11px] text-blue-400 hover:underline flex items-center space-x-0.5"
            >
              <span>Ver tudo</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#1F2937] max-h-52 overflow-y-auto">
            {movements.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Nenhuma movimentação registrada.
              </p>
            ) : (
              movements.slice(0, 5).map((m) => (
                <div key={m.id} className="py-2 text-xs flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-slate-200 truncate">{m.produto_nome}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {m.usuario_nome} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      m.tipo === 'entrada'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {m.tipo === 'entrada' ? `+${m.quantidade}` : `-${m.quantidade}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
