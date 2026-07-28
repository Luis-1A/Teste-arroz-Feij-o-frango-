import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { localStore } from '../services/localStore';
import { TopMovedProduct } from '../types';
import {
  TrendingUp,
  Award,
  Calendar,
  Layers,
  Zap,
  ArrowUpRight,
  Clock
} from 'lucide-react';

export const TopSelling: React.FC = () => {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('mes');
  const [items, setItems] = useState<TopMovedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubMovements = firestoreSync.subscribeMovements((movs) => {
      const now = new Date();
      const filteredMovs = (movs || []).filter((m) => {
        if (m.tipo !== 'saida') return false;
        const movDate = new Date(m.created_at);
        if (periodo === 'hoje') {
          return movDate.toDateString() === now.toDateString();
        } else if (periodo === 'semana') {
          const diffDays = (now.getTime() - movDate.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 7;
        } else if (periodo === 'mes') {
          return movDate.getMonth() === now.getMonth() && movDate.getFullYear() === now.getFullYear();
        }
        return true;
      });

      const counts: { [prodId: string]: { nome: string; total_saidas: number; total_unidades: number } } = {};
      filteredMovs.forEach((m) => {
        if (!counts[m.produto_id]) {
          counts[m.produto_id] = { nome: m.produto_nome, total_saidas: 0, total_unidades: 0 };
        }
        counts[m.produto_id].total_saidas += 1;
        counts[m.produto_id].total_unidades += m.quantidade || 1;
      });

      const prods = localStore.getProductsList();
      const prodMap = new Map(prods.map(p => [p.id, p]));

      const sorted: TopMovedProduct[] = Object.entries(counts)
        .map(([id, data], idx) => {
          const prod = prodMap.get(id);
          const totalQty = data.total_unidades;
          return {
            id,
            nome: data.nome,
            codigo: prod?.codigo || 'PROD',
            categoria: prod?.categoria || 'Acessórios',
            quantidade_movimentada: totalQty,
            estoque_atual: prod?.estoque ?? 0,
            velocidade_saida: (totalQty >= 10 ? 'Alta' : totalQty >= 4 ? 'Média' : 'Baixa') as 'Alta' | 'Média' | 'Baixa',
            ranking: idx + 1,
            ultima_saida: new Date().toISOString()
          };
        })
        .sort((a, b) => b.quantidade_movimentada - a.quantidade_movimentada);

      setItems(sorted);
      setLoading(false);
    });

    return () => unsubMovements();
  }, [periodo]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>Produtos Mais Vendidos • Giro de Estoque</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Análise de velocidade de saída física de mercadorias no período selecionado.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          {(['hoje', 'semana', 'mes', 'ano'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                periodo === p
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Esta Semana' : p === 'mes' ? 'Este Mês' : 'Este Ano'}
            </button>
          ))}
        </div>
      </div>

      {/* Podium Top 3 Highlights */}
      {!loading && items.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* #2 Silver */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden order-2 md:order-1">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100/80 text-slate-600 font-black text-xs flex items-center justify-center border border-slate-200/60">
              #2
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">2° Lugar em Saídas</p>
            <h3 className="font-bold text-slate-900 text-sm mt-1">{items[1].nome}</h3>
            <p className="text-xs text-slate-400 font-mono">Cód: {items[1].codigo}</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-500">Saídas no período:</span>
              <span className="text-xl font-black text-slate-900">{items[1].quantidade_movimentada} un</span>
            </div>
          </div>

          {/* #1 Gold */}
          <div className="bg-gradient-to-b from-blue-50/60 via-white to-white p-6 rounded-2xl border-2 border-blue-500 shadow-2xs relative overflow-hidden order-1 md:order-2">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              #1
            </div>
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-blue-100/80 text-blue-700 rounded-md text-[10px] font-bold mb-1 border border-blue-200/80">
              <Award className="w-3 h-3 text-blue-600" />
              <span>Campeão de Saídas</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mt-1">{items[0].nome}</h3>
            <p className="text-xs text-slate-400 font-mono">Cód: {items[0].codigo}</p>
            <div className="mt-4 pt-3 border-t border-blue-100/80 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-600">Total de saídas:</span>
              <span className="text-2xl font-black text-blue-600">{items[0].quantidade_movimentada} un</span>
            </div>
          </div>

          {/* #3 Bronze */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden order-3">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-100/80 text-amber-800 font-black text-xs flex items-center justify-center border border-amber-200/60">
              #3
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">3° Lugar em Saídas</p>
            <h3 className="font-bold text-slate-900 text-sm mt-1">{items[2].nome}</h3>
            <p className="text-xs text-slate-400 font-mono">Cód: {items[2].codigo}</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-500">Saídas no período:</span>
              <span className="text-xl font-black text-slate-900">{items[2].quantidade_movimentada} un</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 text-center w-16">Ranking</th>
                <th className="p-4">Produto & Código</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 text-center">Unidades Vendidas</th>
                <th className="p-4 text-center">Velocidade de Saída</th>
                <th className="p-4 text-center">Estoque Atual Restante</th>
                <th className="p-4 text-right">Última Saída</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Calculando índice de velocidade de saída do estoque...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma movimentação registrada no período selecionado.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Ranking Badge */}
                    <td className="p-4 text-center font-black text-sm text-slate-700">
                      #{item.ranking}
                    </td>

                    {/* Product Name */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.nome}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Cód: {item.codigo}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 font-medium text-slate-600">{item.categoria}</td>

                    {/* Quantity Moved */}
                    <td className="p-4 text-center font-extrabold text-blue-600 text-sm">
                      {item.quantidade_movimentada} un
                    </td>

                    {/* Velocity Badge */}
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center space-x-1 ${
                          item.velocidade_saida === 'Alta'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.velocidade_saida === 'Média'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>Velocidade {item.velocidade_saida}</span>
                      </span>
                    </td>

                    {/* Current Stock Left */}
                    <td className="p-4 text-center font-semibold text-slate-800">
                      {item.estoque_atual} un
                    </td>

                    {/* Last Exit Time */}
                    <td className="p-4 text-right text-slate-400 text-[11px]">
                      {item.ultima_saida
                        ? new Date(item.ultima_saida).toLocaleString('pt-BR')
                        : 'Sem registro'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
