import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { Product } from '../types';
import {
  AlertOctagon,
  PackagePlus,
  ArrowUpRight,
  RefreshCw,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface LowStockProps {
  onNavigateToEntry: () => void;
}

export const LowStock: React.FC<LowStockProps> = ({ onNavigateToEntry }) => {
  const [items, setItems] = useState<(Product & { prioridade: string; ultima_venda: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);

  const isLowStock = (p: Product) => {
    if (p.ativo === false) return false;
    if (p.nao_relevante) {
      return p.estoque <= 0;
    }
    return p.estoque <= (p.estoque_minimo || 5);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const prods = await api.getProducts();
      const outOfStockItems = (prods || [])
        .filter(isLowStock)
        .map((p) => {
          const isZero = p.estoque === 0;
          return {
            ...p,
            prioridade: isZero ? 'URGENTE (CRÍTICO)' : 'ALERTA (BAIXO)',
            ultima_venda: p.updated_at ? new Date(p.updated_at).toLocaleString('pt-BR') : 'Sem registro'
          };
        });
      setItems(outOfStockItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsub = firestoreSync.subscribeProducts((prods) => {
      const outOfStockItems = (prods || [])
        .filter(isLowStock)
        .map((p) => {
          const isZero = p.estoque === 0;
          return {
            ...p,
            prioridade: isZero ? 'URGENTE (CRÍTICO)' : 'ALERTA (BAIXO)',
            ultima_venda: p.updated_at ? new Date(p.updated_at).toLocaleString('pt-BR') : 'Sem registro'
          };
        });
      setItems(outOfStockItems);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteProduct(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <AlertOctagon className="w-6 h-6 text-rose-600" />
            <span>Produtos em Falta e Nível Mínimo</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento automático de itens com estoque igual ou abaixo do nível mínimo de segurança.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Monitoramento</span>
        </button>
      </div>

      {/* Cards & Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-xs font-medium">
          Carregando lista de faltas do estoque...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-emerald-50/80 border border-emerald-200/80 p-8 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">Estoque Normalizado!</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
            Não há nenhum produto abaixo da quantidade mínima cadastrada neste momento.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Prioridade & Status</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Categoria & Local</th>
                  <th className="p-4 text-center">Estoque Atual vs Mínimo</th>
                  <th className="p-4">Última Saída</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map(p => {
                  const isZero = p.estoque === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Priority Tag */}
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-[11px] border ${
                            isZero
                              ? 'bg-rose-100/80 text-rose-800 border-rose-300/80'
                              : 'bg-amber-100/80 text-amber-800 border-amber-300/80'
                          }`}
                        >
                          {p.prioridade}
                        </span>
                      </td>

                      {/* Product details */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{p.nome}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Cód: {p.codigo} • Marca: {p.marca}
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="p-4">
                        <div className="text-slate-700 font-semibold">{p.categoria}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5 font-medium">
                          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{p.localizacao}</span>
                        </div>
                      </td>

                      {/* Current vs Min Qty */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-3 py-1 rounded-full font-extrabold text-xs border ${
                              isZero ? 'text-rose-700 bg-rose-50/80 border-rose-200/80' : 'text-amber-700 bg-amber-50/80 border-amber-200/80'
                            }`}
                          >
                            {p.estoque} un
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 font-medium">
                            Mínimo necessário: {p.estoque_minimo} un
                          </span>
                        </div>
                      </td>

                      {/* Last Sale / Exit */}
                      <td className="p-4 text-slate-500 text-[11px] font-medium">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {p.ultima_venda && p.ultima_venda.includes('T')
                              ? new Date(p.ultima_venda).toLocaleString('pt-BR')
                              : (p.ultima_venda || 'Sem registro')}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={onNavigateToEntry}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Repor Estoque</span>
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Excluir Produto?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tem certeza que deseja excluir o produto{' '}
              <span className="font-bold text-slate-800">"{deleteCandidate.nome}"</span>?
            </p>
            <div className="flex space-x-2 mt-5">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
