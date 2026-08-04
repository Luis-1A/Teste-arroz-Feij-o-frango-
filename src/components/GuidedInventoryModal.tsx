import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { firestoreSync } from '../services/firestoreSync';
import { Product, InventoryAuditItem } from '../types';
import {
  ClipboardCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface GuidedInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const GuidedInventoryModal: React.FC<GuidedInventoryModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [items, setItems] = useState<InventoryAuditItem[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allProducts = localStore.getProducts().filter(p => !p.lixeira && p.ativo);
      const filtered =
        selectedCategory === 'todas'
          ? allProducts
          : allProducts.filter(p => p.categoria === selectedCategory);

      const auditItems: InventoryAuditItem[] = filtered.map(p => ({
        produto_id: p.id,
        produto_nome: p.nome,
        codigo: p.codigo,
        estoque_sistema: p.estoque,
        estoque_fisico: p.estoque, // default to current system stock
        divergencia: 0,
        conferido: false
      }));

      setItems(auditItems);
      setIsFinished(false);
    }
  }, [isOpen, selectedCategory]);

  if (!isOpen) return null;

  const categories = localStore.getCategories();

  const handlePhysicalCountChange = (productId: string, val: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.produto_id === productId) {
          const fisico = Math.max(0, val);
          const div = fisico - item.estoque_sistema;
          return {
            ...item,
            estoque_fisico: fisico,
            divergencia: div,
            conferido: true
          };
        }
        return item;
      })
    );
  };

  const handleMarkConferido = (productId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.produto_id === productId) {
          return { ...item, conferido: !item.conferido };
        }
        return item;
      })
    );
  };

  const conferidosCount = items.filter(i => i.conferido).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((conferidosCount / totalCount) * 100) : 0;
  const totalDivergencies = items.filter(i => i.divergencia !== 0).length;

  const handleApplyAdjustments = () => {
    items.forEach(async (item) => {
      if (item.divergencia !== 0) {
        const product = localStore.getProducts().find(p => p.id === item.produto_id);
        if (product) {
          const diff = item.divergencia;
          const isEntrada = diff > 0;
          const absQty = Math.abs(diff);
          const newStock = product.estoque + diff;

          await firestoreSync.updateProductStock(
            product.id,
            newStock,
            { id: 'usr_1', nome: userName },
            isEntrada ? 'entrada' : 'saida',
            absQty,
            `Ajuste de inventário guiado (Divergência: ${diff > 0 ? '+' : ''}${diff})`
          );
        }
      }
    });

    localStore.addAuditLog({
      usuario: userName,
      acao: 'EDICAO',
      descricao: `Inventário guiado concluído para ${items.length} itens com ${totalDivergencies} divergências ajustadas.`
    });

    setIsFinished(true);
  };

  const visibleItems = items.filter(
    i =>
      (i.produto_nome || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
      (i.codigo || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-950/50">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Inventário Guiado de Estoque</h2>
              <p className="text-xs text-slate-400 font-medium">
                Conferência física de unidades e sincronização de saldo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isFinished ? (
          <div className="p-8 text-center space-y-6 my-auto">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto animate-bounce">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-black text-white">Inventário Concluído com Sucesso!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Todas as divergências foram recalculadas e os saldos dos produtos no estoque central foram atualizados.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 max-w-md mx-auto grid grid-cols-2 gap-4 text-xs font-bold text-slate-300">
              <div>
                <span className="text-[10px] uppercase text-slate-500 block font-extrabold">Total Conferido</span>
                <span className="text-lg font-black text-white">{totalCount} produtos</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block font-extrabold">Ajustes Realizados</span>
                <span className="text-lg font-black text-amber-400">{totalDivergencies} correções</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              Concluir e Voltar
            </button>
          </div>
        ) : (
          <>
            {/* Top Bar Controls */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
              {/* Category selector */}
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-extrabold text-slate-300">Categoria:</span>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-bold text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="todas">Todas as Categorias</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search filter */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Filtrar item na contagem..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Progress Summary */}
              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="font-bold text-slate-300">
                  Progresso: <strong className="text-amber-400">{conferidosCount}/{totalCount}</strong> ({progressPercentage}%)
                </span>
                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Audit Table List */}
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 bg-slate-950/60 sticky top-0 z-10">
                    <th className="p-3">Status</th>
                    <th className="p-3">Produto / Código</th>
                    <th className="p-3 text-center">Estoque Sistema</th>
                    <th className="p-3 text-center">Contagem Física</th>
                    <th className="p-3 text-center">Divergência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visibleItems.map(item => (
                    <tr
                      key={item.produto_id}
                      className={`hover:bg-slate-800/50 transition ${
                        item.conferido ? 'bg-slate-950/40' : ''
                      }`}
                    >
                      <td className="p-3">
                        <button
                          onClick={() => handleMarkConferido(item.produto_id)}
                          className={`p-1.5 rounded-lg font-extrabold text-[10px] flex items-center gap-1 transition ${
                            item.conferido
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{item.conferido ? 'Conferido' : 'Pendente'}</span>
                        </button>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-white">{item.produto_nome}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.codigo}</p>
                      </td>

                      <td className="p-3 text-center font-bold text-slate-300">
                        {item.estoque_sistema} un
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.estoque_fisico}
                          onChange={e =>
                            handlePhysicalCountChange(item.produto_id, parseInt(e.target.value) || 0)
                          }
                          className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-black text-white focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                            item.divergencia === 0
                              ? 'text-slate-500'
                              : item.divergencia > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.divergencia > 0 ? `+${item.divergencia}` : item.divergencia}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-bold">
                {totalDivergencies > 0 ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    {totalDivergencies} item(s) com divergência entre físico e sistema
                  </span>
                ) : (
                  <span className="text-emerald-400">Nenhuma divergência apurada até o momento.</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleApplyAdjustments}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-extrabold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <span>Concluir e Salvar Ajustes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
