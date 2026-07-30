import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { firestoreSync } from '../services/firestoreSync';
import { Product, Movement } from '../types';
import {
  History,
  X,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  User,
  Calendar,
  Box,
  MapPin,
  Tag
} from 'lucide-react';

interface ProductHistoryModalProps {
  productId: string | null;
  onClose: () => void;
}

export const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({ productId, onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    const unsubProds = firestoreSync.subscribeProducts((prods) => {
      setProducts(prods || []);
    });
    const unsubMovs = firestoreSync.subscribeMovements((movs) => {
      setMovements(movs || []);
    });
    return () => {
      unsubProds();
      unsubMovs();
    };
  }, []);

  if (!productId) return null;

  const product = products.find(p => p.id === productId);

  if (!product) return null;

  const productMovements = movements
    .filter(m => m.produto_id === productId || m.produto_codigo === product.codigo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{product.nome}</h2>
              <p className="text-xs text-slate-400 font-mono">
                SKU: <span className="text-orange-400">{product.codigo}</span> • Categoria: {product.categoria}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Overview Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Estoque Atual</span>
            <span className="text-base font-black text-white">{product.estoque} un</span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Estoque Mínimo</span>
            <span className="text-base font-black text-amber-400">{product.estoque_minimo} un</span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Localização</span>
            <span className="text-xs font-bold text-slate-200 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {product.localizacao || 'Não informada'}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Etiquetas</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {product.etiquetas && product.etiquetas.length > 0 ? (
                product.etiquetas.map((t, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[9px] font-extrabold rounded-md">
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500">Sem etiquetas</span>
              )}
            </div>
          </div>
        </div>

        {/* Timeline List Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Histórico Cronológico de Movimentações ({productMovements.length})</span>
          </h3>

          {productMovements.length > 0 ? (
            <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
              {productMovements.map((m, idx) => {
                const isEntrada = m.tipo === 'entrada';
                return (
                  <div key={m.id || idx} className="relative group">
                    {/* Circle icon marker */}
                    <div
                      className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${
                        isEntrada
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : 'bg-rose-950 border-rose-500 text-rose-400'
                      }`}
                    >
                      {isEntrada ? <PackagePlus className="w-3 h-3" /> : <PackageMinus className="w-3 h-3" />}
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl hover:border-slate-700 transition space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isEntrada
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isEntrada ? 'Entrada (+)' : 'Saída (-)'}
                          </span>
                          <span className="text-sm font-black text-white">
                            {isEntrada ? `+${m.quantidade}` : `-${m.quantidade}`} unidades
                          </span>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(m.created_at || m.data_movimentacao || Date.now()).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          Responsável: <strong className="text-slate-200">{m.usuario_nome || 'Sistema'}</strong>
                        </span>
                        {m.observacao && (
                          <span className="text-[11px] italic text-slate-400 max-w-xs truncate">
                            "{m.observacao}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-950/40 rounded-3xl border border-slate-800 space-y-3">
              <Box className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">Nenhuma movimentação registrada para este produto.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                À medida que entradas, saídas ou trocas forem realizadas, elas aparecerão listadas em tempo real neste histórico.
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
