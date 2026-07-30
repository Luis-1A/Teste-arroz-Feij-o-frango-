import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { StoreGoal } from '../types';
import { Goal, Plus, CheckCircle2, Circle, Trash2, X, Target, Award } from 'lucide-react';

interface StoreGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const StoreGoalsModal: React.FC<StoreGoalsModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  const [goals, setGoals] = useState<StoreGoal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [metaValor, setMetaValor] = useState(10);
  const [unidade, setUnidade] = useState('itens');

  useEffect(() => {
    if (isOpen) {
      setGoals(localStore.getStoreGoals());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const newGoal = localStore.addStoreGoal({
      titulo,
      descricao,
      meta_valor: metaValor,
      atual_valor: 0,
      unidade,
      concluida: false
    });

    setGoals(prev => [newGoal, ...prev]);
    setTitulo('');
    setDescricao('');
    setIsAdding(false);
  };

  const handleToggleGoal = (id: string) => {
    const updated = localStore.toggleStoreGoal(id);
    setGoals(prev => prev.map(g => (g.id === id ? updated : g)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-950/50">
              <Goal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Metas de Organização do Estoque</h2>
              <p className="text-xs text-slate-400 font-medium">
                Objetivos internos para manter a qualidade e acurácia do estoque
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Meta Organizacional</span>
            </button>
          )}

          {isAdding && (
            <form onSubmit={handleAddGoal} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">Nova Meta</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Título da Meta</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Reduzir produtos sem estoque a zero..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Valor Alvo</label>
                  <input
                    type="number"
                    min="1"
                    value={metaValor}
                    onChange={e => setMetaValor(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Unidade</label>
                  <input
                    type="text"
                    value={unidade}
                    onChange={e => setUnidade(e.target.value)}
                    placeholder="Ex: %, auditorias, produtos"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Explicação do objetivo..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition"
              >
                Salvar Meta
              </button>
            </form>
          )}

          {/* Goal List */}
          <div className="space-y-3">
            {goals.map(g => (
              <div
                key={g.id}
                className={`p-4 rounded-2xl border transition space-y-3 ${
                  g.concluida ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleGoal(g.id)}
                      className={`p-1.5 rounded-lg transition ${
                        g.concluida ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {g.concluida ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div>
                      <h3 className={`font-extrabold text-xs ${g.concluida ? 'line-through text-slate-400' : 'text-white'}`}>
                        {g.titulo}
                      </h3>
                      {g.descricao && <p className="text-[11px] text-slate-400">{g.descricao}</p>}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0">
                    {g.concluida ? `${g.meta_valor}/${g.meta_valor}` : `${g.atual_valor}/${g.meta_valor}`} {g.unidade}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: g.concluida ? '100%' : `${Math.min(100, (g.atual_valor / g.meta_valor) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
