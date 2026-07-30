import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { DashboardStats, TopMovedProduct, Product, Movement } from '../types';
import {
  Boxes,
  PackageCheck,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time Firestore Products and Movements
    const unsubProducts = firestoreSync.subscribeProducts((prods) => {
      setProducts(prods || []);
      setLoading(false);
    });

    const unsubMovements = firestoreSync.subscribeMovements((movs) => {
      setMovements(movs || []);
    });

    return () => {
      unsubProducts();
      unsubMovements();
    };
  }, []);

  // Compute top moved ranking dynamically from real-time movements and products
  const topMovedItems: TopMovedProduct[] = useMemo(() => {
    const now = new Date();
    const monthMovs = movements.filter((m) => {
      if (m.tipo !== 'saida') return false;
      const d = new Date(m.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const counts: { [id: string]: { nome: string; total: number } } = {};
    monthMovs.forEach((m) => {
      if (!counts[m.produto_id]) {
        counts[m.produto_id] = { nome: m.produto_nome, total: 0 };
      }
      counts[m.produto_id].total += (m.quantidade || 1);
    });

    const prodMap = new Map<string, Product>(products.map(p => [p.id, p]));

    return Object.entries(counts)
      .map(([id, data]) => {
        const prod = prodMap.get(id);
        return {
          id,
          nome: data.nome,
          codigo: prod?.codigo || 'PROD',
          categoria: prod?.categoria || 'Acessórios',
          quantidade_movimentada: data.total,
          estoque_atual: prod ? prod.estoque : 0
        };
      })
      .sort((a, b) => b.quantidade_movimentada - a.quantidade_movimentada)
      .slice(0, 5);
  }, [movements, products]);

  // Compute live stats directly from real-time products and movements
  const stats: DashboardStats = useMemo(() => {
    const activeProducts = products.filter(p => p.ativo !== false);
    const total_produtos = activeProducts.length;
    const total_unidades = activeProducts.reduce((acc, p) => acc + (Number(p.estoque) || 0), 0);
    const produtos_em_falta = activeProducts.filter(p => p.estoque <= 0).length;
    const produtos_proximos_minimo = activeProducts.filter(p => p.estoque > 0 && p.estoque <= (p.estoque_minimo || 5)).length;

    const alertas: DashboardStats['alertas'] = [];
    if (produtos_em_falta > 0) {
      alertas.push({
        id: 'alt_falta',
        tipo: 'critico',
        mensagem: `${produtos_em_falta} produto(s) com estoque zerado!`,
        data: new Date().toISOString()
      });
    }
    if (produtos_proximos_minimo > 0) {
      alertas.push({
        id: 'alt_minimo',
        tipo: 'atencao',
        mensagem: `${produtos_proximos_minimo} produto(s) próximo(s) do estoque mínimo!`,
        data: new Date().toISOString()
      });
    }

    return {
      total_produtos,
      total_unidades,
      produtos_em_falta,
      produtos_proximos_minimo,
      alertas,
      ultimas_movimentacoes: (movements || []).slice(0, 8) as any
    };
  }, [products, movements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-xs font-semibold">Carregando indicadores do estoque Bytecas...</span>
      </div>
    );
  }

  if (!stats) return null;

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#a5b4fc', '#818cf8'];

  // Compute real category breakdown from database products
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    const cat = p.categoria || 'Outros';
    categoryMap[cat] = (categoryMap[cat] || 0) + p.estoque;
  });

  const categoryChartData = Object.keys(categoryMap).map(key => ({
    name: key,
    count: categoryMap[key]
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 text-xs font-medium mb-2 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Bytecas Control Center • 100% Estoque</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Painel de Controle de Estoque</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Monitore movimentações físicas, alertas de reposição urgente e velocidade de giro de produtos em tempo real.
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open_guided_inventory'))}
              className="px-3.5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
            >
              <span>Inventário Guiado</span>
            </button>
            <button
              onClick={() => onNavigate('sales')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2"
            >
              <span>Painel de Saídas (POS)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('entry')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all"
            >
              + Nova Entrada
            </button>
          </div>
        </div>
      </div>

      {/* Top Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Produtos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Produtos Cadastrados</span>
            <div className="p-2.5 bg-blue-50/80 text-blue-600 rounded-xl border border-blue-100/80">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats.total_produtos}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-medium">itens ativos</span>
          </div>
        </div>

        {/* Card 2: Total Unidades em Estoque */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Unidades Físicas</span>
            <div className="p-2.5 bg-emerald-50/80 text-emerald-600 rounded-xl border border-emerald-100/80">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats.total_unidades}
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-medium">unidades no galpão</span>
          </div>
        </div>

        {/* Card 3: Produtos em Falta / Críticos */}
        <div
          onClick={() => onNavigate('low-stock')}
          className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 group-hover:underline">Em Falta / Mínimo</span>
            <div className="p-2.5 bg-rose-50/80 text-rose-600 rounded-xl border border-rose-100/80">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-rose-700 tracking-tight">
                {stats.produtos_em_falta}
              </span>
              <span className="text-[11px] text-rose-500 ml-1.5 font-medium">requerem reposição</span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Alertas de Nível Mínimo */}
        <div
          onClick={() => onNavigate('low-stock')}
          className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 group-hover:underline">Próximos do Mínimo</span>
            <div className="p-2.5 bg-amber-50/80 text-amber-600 rounded-xl border border-amber-100/80">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-amber-800 tracking-tight">
                {stats.produtos_proximos_minimo}
              </span>
              <span className="text-[11px] text-amber-600 ml-1.5 font-medium">atenção</span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (2 cols): Visual Charts & Recent Movements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Visual Distribution Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Distribuição do Estoque por Categoria</h3>
                <p className="text-[11px] text-slate-500 font-medium">Unidades disponíveis por departamento</p>
              </div>
            </div>
            <div className="h-56">
              {categoryChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Boxes className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-medium">Nenhum produto cadastrado para exibição do gráfico</p>
                  <button
                    onClick={() => onNavigate('products')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    + Cadastrar produtos
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#e2e8f0' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Movements Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Últimas Movimentações de Estoque</h3>
                <p className="text-[11px] text-slate-500 font-medium">Registro em tempo real de entradas e saídas</p>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
              >
                <span>Ver Histórico Completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {stats.ultimas_movimentacoes.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  Nenhuma movimentação de estoque registrada até o momento.
                </p>
              ) : (
                stats.ultimas_movimentacoes.map(mov => (
                  <div key={mov.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          mov.tipo === 'entrada'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}
                      >
                        {mov.tipo === 'entrada' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1">{mov.produto_nome}</p>
                        <p className="text-[10px] text-slate-400">
                          Cód: {mov.produto_codigo} • Por {mov.usuario_nome}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-xs ${
                          mov.tipo === 'entrada'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {mov.tipo === 'entrada' ? `+${mov.quantidade}` : `-${mov.quantidade}`} un
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col (1 col): Critical Alerts & Top Moved List */}
        <div className="space-y-6">
          {/* Critical Stock Alerts Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center space-x-2 mb-3">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Alertas de Reposição</h3>
            </div>

            {stats.alertas.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum alerta pendente.</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {stats.alertas.map(alt => (
                  <div
                    key={alt.id}
                    className={`p-3 rounded-xl border text-xs ${
                      alt.tipo === 'critico'
                        ? 'bg-rose-50/70 border-rose-200/80 text-rose-800 font-medium'
                        : 'bg-amber-50/70 border-amber-200/80 text-amber-800 font-medium'
                    }`}
                  >
                    <p className="font-medium">{alt.mensagem}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fast Moving Ranking Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Mais Movimentados</h3>
              <button
                onClick={() => onNavigate('top-selling')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Ranking Completo
              </button>
            </div>

            <div className="space-y-2.5">
              {topMovedItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Nenhuma saída registrada este mês.
                </p>
              ) : (
                topMovedItems.slice(0, 4).map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="w-5 h-5 rounded-full bg-blue-100/80 text-blue-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">{item.nome}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Estoque restante: {item.estoque_atual} un</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-blue-50/80 border border-blue-100/80 text-blue-700 font-bold text-[11px] rounded-md shrink-0">
                      {item.quantidade_movimentada} saídas
                    </span>
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
