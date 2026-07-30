import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { firestoreSync } from '../services/firestoreSync';
import { Product } from '../types';
import { Trash2, RotateCcw, X, AlertOctagon, Boxes, RefreshCw } from 'lucide-react';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  const [trashedProducts, setTrashedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTrashedProducts(localStore.getProducts().filter(p => p.lixeira));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (id: string) => {
    await firestoreSync.restoreProductFromRecycleBin(id, userName);
    setTrashedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handlePurge = async (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir permanentemente este produto? Esta ação não poderá ser desfeita.')) {
      await firestoreSync.purgeProductFromRecycleBin(id, userName);
      setTrashedProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Lixeira Inteligente de Produtos</h2>
              <p className="text-xs text-slate-400 font-medium">
                Mercadorias excluídas salvas temporariamente antes da remoção definitiva
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {trashedProducts.length > 0 ? (
            <div className="space-y-3">
              {trashedProducts.map(p => (
                <div
                  key={p.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-white text-xs truncate">{p.nome}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      SKU: {p.codigo} • Categoria: {p.categoria} • Estoque: {p.estoque} un
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Excluído por: {p.alterado_por || 'Sistema'} em{' '}
                      {p.lixeira_data ? new Date(p.lixeira_data).toLocaleDateString('pt-BR') : 'Data recente'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleRestore(p.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                      title="Restaurar produto para o estoque central"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>

                    <button
                      onClick={() => handlePurge(p.id)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                      title="Excluir permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purgar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Boxes className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">A Lixeira está vazia.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quando você excluir produtos do estoque central, eles aparecerão aqui para permitir restauração rápida.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
