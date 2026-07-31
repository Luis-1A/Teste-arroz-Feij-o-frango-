import React, { useEffect, useState, useMemo } from 'react';
import { firestoreSync } from '../services/firestoreSync';
import { Product, Movement, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { TabType } from '../components/Sidebar';
import {
  Boxes,
  Folder,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Clock,
  Calendar,
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
  Building2,
  RefreshCw,
  TrendingDown,
  ShieldCheck,
  ChevronRight
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
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [copiedList, setCopiedList] = useState(false);

  // Live Date and Time
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubProds = firestoreSync.subscribeProducts((prods) => {
      setProducts(prods || []);
      setLastSyncTime(new Date().toLocaleTimeString());
      setLoading(false);
    });

    const unsubCats = firestoreSync.subscribeCategories((cats) => {
      setCategories(cats || []);
    });

    const unsubMovs = firestoreSync.subscribeMovements((movs) => {
      setMovements(movs || []);
      setLastSyncTime(new Date().toLocaleTimeString());
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
    const totalCategorias = categories.length;

    const estoqueBaixo = activeProducts.filter(
      (p) => p.estoque > 0 && p.estoque <= (p.estoque_minimo || 5)
    );
    const semEstoque = activeProducts.filter((p) => p.estoque === 0);
    const estoqueNegativo = activeProducts.filter((p) => p.estoque < 0);

    // Stock divergence: products with negative or unusual stock states
    const divergencias = activeProducts.filter(
      (p) => p.estoque < 0 || (p.estoque === 0 && (p.historico_alteracoes?.length || 0) > 0)
    );

    return {
      totalProdutos,
      totalCategorias,
      estoqueBaixoCount: estoqueBaixo.length,
      semEstoqueCount: semEstoque.length,
      estoqueNegativoCount: estoqueNegativo.length,
      divergenciasCount: divergencias.length,
      attentionList: [...estoqueNegativo, ...semEstoque, ...estoqueBaixo]
    };
  }, [products, categories]);

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
    const lines: string[] = ['📋 *LISTA DE REPOSIÇÃO DE ESTOQUE - BYTECAS*', ''];

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

    lines.push(`\nSincronizado em: ${new Date().toLocaleString()}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2500);
  };

  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = now.toLocaleTimeString('pt-BR');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
        <span className="text-xs font-semibold">Carregando dados da central...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Cabeçalho Central (Logo, Nome da Loja, Usuário, Cargo, Data, Hora) */}
      <div className="bg-[#111827] text-white p-6 rounded-3xl border border-[#1F2937] shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Logo + Store Name + User Info */}
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-[#0B1220] rounded-[14px] flex items-center justify-center text-blue-400 font-extrabold text-xl">
                <Building2 className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black tracking-tight text-white">Bosteca</h1>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                  Estoque
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center space-x-2">
                <span>Operador: <strong className="text-white">{user?.nome || 'Usuário'}</strong></span>
                <span>•</span>
                <span className="capitalize text-blue-400 font-semibold">{user?.cargo || 'Funcionário'}</span>
              </p>
            </div>
          </div>

          {/* Date & Time display */}
          <div className="flex items-center space-x-4 bg-[#0B1220] p-3.5 rounded-2xl border border-[#1F2937] shrink-0">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 border-r border-[#1F2937] pr-3">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm font-extrabold text-white font-mono">
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Resumo Rápido (Cartões em Tempo Real) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Produtos */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Produtos</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalProdutos}</p>
          <span className="text-[10px] text-slate-400 font-semibold">Cadastrados</span>
        </div>

        {/* Total Categorias */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categorias</span>
            <Folder className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalCategorias}</p>
          <span className="text-[10px] text-slate-400 font-semibold">Organizadas</span>
        </div>

        {/* Estoque Baixo */}
        <div
          onClick={() => onNavigate('low-stock')}
          className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Estoque Baixo</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.estoqueBaixoCount}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Próximos do mínimo</span>
        </div>

        {/* Sem Estoque */}
        <div
          onClick={() => onNavigate('low-stock')}
          className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Sem Estoque</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{stats.semEstoqueCount}</p>
          <span className="text-[10px] text-rose-500 font-semibold">Itens zerados</span>
        </div>

        {/* Divergências */}
        <div
          onClick={() => onNavigate('stock-divergences')}
          className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Divergências</span>
            <TrendingDown className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-800 mt-2">{stats.divergenciasCount}</p>
          <span className="text-[10px] text-purple-500 font-semibold">Verificar estoque</span>
        </div>

        {/* Sincronização */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Sincronia</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm font-extrabold text-slate-800 mt-3 font-mono">{lastSyncTime}</p>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Banco Online</span>
          </span>
        </div>
      </div>

      {/* 3. Grade de Atalhos Rápidos */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 mb-3 tracking-tight">Atalhos Principais</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Frente de Caixa */}
          <button
            onClick={() => onNavigate('sales')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Frente de Caixa</span>
              <span className="text-[10px] text-slate-400 font-medium">PDV / Balcão</span>
            </div>
          </button>

          {/* Estoque */}
          <button
            onClick={() => onNavigate('products')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Estoque</span>
              <span className="text-[10px] text-slate-400 font-medium">Pastas de produtos</span>
            </div>
          </button>

          {/* Entrada de Estoque */}
          <button
            onClick={() => onNavigate('entry')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Entrada de Estoque</span>
              <span className="text-[10px] text-slate-400 font-medium">Registrar compras</span>
            </div>
          </button>

          {/* Saída de Estoque */}
          <button
            onClick={() => onNavigate('sales', 'saida')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <PackageMinus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Saída de Estoque</span>
              <span className="text-[10px] text-slate-400 font-medium">Baixa rápida</span>
            </div>
          </button>

          {/* Trocas */}
          <button
            onClick={() => onNavigate('sales', 'troca')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Trocas & Devoluções</span>
              <span className="text-[10px] text-slate-400 font-medium">Substituição física</span>
            </div>
          </button>

          {/* Reposição */}
          <button
            onClick={() => onNavigate('restock-list')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Reposição</span>
              <span className="text-[10px] text-slate-400 font-medium">Lista para compra</span>
            </div>
          </button>

          {/* Demanda de Clientes */}
          <button
            onClick={() => onNavigate('customer-demand')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Veio e Não Tinha</span>
              <span className="text-[10px] text-slate-400 font-medium">Demanda de clientes</span>
            </div>
          </button>

          {/* Relatórios */}
          <button
            onClick={() => onNavigate('history')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Relatórios</span>
              <span className="text-[10px] text-slate-400 font-medium">Histórico completo</span>
            </div>
          </button>

          {/* Configurações (if allowed) */}
          {canPerform('edit_users') && (
            <button
              onClick={() => onNavigate('pos-customization')}
              className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left shadow-2xs transition group flex flex-col justify-between h-28"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:scale-105 transition">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-xs block">Configurações</span>
                <span className="text-[10px] text-slate-400 font-medium">Parâmetros do loja</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 4. Layout Inferior: Produtos que precisam de atenção + Lista de Reposição + Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Atenção + Lista de Reposição */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seção: Produtos que precisam de Atenção */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Produtos que Precisam de Atenção</h3>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                {stats.attentionList.length} itens
              </span>
            </div>

            {stats.attentionList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Excelente! Nenhum produto está com estoque baixo, zerado ou negativo.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {stats.attentionList.map((p) => {
                  const isNeg = p.estoque < 0;
                  const isZero = p.estoque === 0;

                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{p.nome}</p>
                        <p className="text-[10px] text-slate-400">Categoria: {p.categoria}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-extrabold px-2.5 py-0.5 rounded-md text-xs ${
                            isNeg
                              ? 'bg-rose-100 text-rose-800'
                              : isZero
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {isNeg
                            ? `Negativo (${p.estoque} un)`
                            : isZero
                            ? 'Sem estoque (0 un)'
                            : `Mínimo (${p.estoque} un)`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Painel: Lista de Reposição por Categoria com Botão 'Copiar Lista' */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Lista de Reposição Organizada</h3>
                <p className="text-[11px] text-slate-500 font-medium">Organizada automaticamente por categoria</p>
              </div>

              <button
                onClick={handleCopyRestockList}
                className="px-3.5 py-2 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-orange-500/20"
              >
                {copiedList ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedList ? 'Lista Copiada!' : 'Copiar Lista'}</span>
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {Object.keys(restockByCategory).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  Nenhum produto necessita de reposição no momento.
                </p>
              ) : (
                Object.entries(restockByCategory).map(([cat, items]: [string, Product[]]) => (
                  <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <h4 className="font-extrabold text-slate-900 mb-2 uppercase text-[10px] tracking-wider text-indigo-600 flex items-center space-x-1">
                      <Folder className="w-3.5 h-3.5" />
                      <span>{cat}</span>
                    </h4>
                    <div className="space-y-1">
                      {items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between py-1 border-b border-slate-200/40 last:border-0">
                          <span className="font-medium text-slate-800">{it.nome}</span>
                          <span className="font-bold text-rose-600">Atual: {it.estoque} un</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna 3: Atividades Recentes */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Atividades Recentes</h3>
              <button
                onClick={() => onNavigate('history')}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-1"
              >
                <span>Ver Tudo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {movements.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  Nenhuma atividade registrada ainda.
                </p>
              ) : (
                movements.slice(0, 10).map((m) => (
                  <div key={m.id} className="py-3 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.produto_nome}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          m.tipo === 'entrada'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {m.tipo === 'entrada' ? `+${m.quantidade}` : `-${m.quantidade}`} un
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Operador: <strong className="text-slate-600">{m.usuario_nome}</strong> •{' '}
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
