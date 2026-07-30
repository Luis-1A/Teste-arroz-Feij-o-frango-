import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { DraftMovement } from '../types';
import { FileEdit, Trash2, X, ArrowRight, Clock, PackagePlus } from 'lucide-react';

interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onApplyDraft?: (draft: DraftMovement) => void;
}

export const DraftsModal: React.FC<DraftsModalProps> = ({
  isOpen,
  onClose,
  userName,
  onApplyDraft
}) => {
  const [drafts, setDrafts] = useState<DraftMovement[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDrafts(localStore.getDraftMovements());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteDraft = (id: string) => {
    localStore.deleteDraftMovement(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleResumeDraft = (draft: DraftMovement) => {
    if (onApplyDraft) {
      onApplyDraft(draft);
    }
    handleDeleteDraft(draft.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Central de Rascunhos Pendentes</h2>
              <p className="text-xs text-slate-400 font-medium">
                Movimentações de estoque salvas para continuação posterior
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {drafts.length > 0 ? (
            <div className="space-y-3">
              {drafts.map(d => (
                <div
                  key={d.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md text-[9px] font-black uppercase">
                        {d.tipo}
                      </span>
                      <p className="font-extrabold text-white text-xs truncate">{d.produto_nome}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Quantidade: <strong className="text-white">{d.quantidade} un</strong> • Salvo por: {d.usuario_nome}
                    </p>
                    {d.observacao && <p className="text-[11px] text-slate-500 italic">"{d.observacao}"</p>}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleResumeDraft(d)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5"
                    >
                      <span>Retomar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteDraft(d.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
                      title="Descartar rascunho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <FileEdit className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">Nenhum rascunho pendente no momento.</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Você pode salvar rascunhos de entradas ou saídas na tela de Entrada de Estoque.
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
