import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { Announcement } from '../types';
import { Megaphone, Plus, Trash2, X, AlertTriangle, Info, Bell, CheckCircle2 } from 'lucide-react';

interface AnnouncementsBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  isSupremeAdmin: boolean;
}

export const AnnouncementsBoardModal: React.FC<AnnouncementsBoardModalProps> = ({
  isOpen,
  onClose,
  userName,
  isSupremeAdmin
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [prioridade, setPrioridade] = useState<'urgente' | 'importante' | 'normal'>('normal');

  useEffect(() => {
    if (isOpen) {
      setAnnouncements(localStore.getAnnouncements());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) return;

    const newAnn = localStore.addAnnouncement({
      titulo,
      conteudo,
      prioridade,
      autor_nome: userName,
      ativo: true
    });

    setAnnouncements(prev => [newAnn, ...prev]);
    setTitulo('');
    setConteudo('');
    setIsAdding(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    localStore.deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-950/50">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Mural de Avisos da Loja</h2>
              <p className="text-xs text-slate-400 font-medium">
                Comunicados oficiais da loja para a equipe
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {isSupremeAdmin && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Novo Comunicado Oficial</span>
            </button>
          )}

          {isAdding && (
            <form onSubmit={handleAddAnnouncement} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wide">Novo Comunicado</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Título do Aviso</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Reunião de alinhamento ou Diretriz de recebimento..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={e => setPrioridade(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="normal">Normal (Informativo)</option>
                  <option value="importante">Importante (Destaque)</option>
                  <option value="urgente">Urgente (Aviso Vermelho)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Conteúdo</label>
                <textarea
                  required
                  rows={3}
                  value={conteudo}
                  onChange={e => setConteudo(e.target.value)}
                  placeholder="Escreva a mensagem que aparecerá no mural da equipe..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-md transition"
              >
                Publicar Comunicado
              </button>
            </form>
          )}

          {/* List of Announcements */}
          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.map(ann => {
                const isUrgente = ann.prioridade === 'urgente';
                const isImportante = ann.prioridade === 'importante';

                return (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-2xl border transition space-y-2 relative ${
                      isUrgente
                        ? 'bg-rose-950/40 border-rose-500/50'
                        : isImportante
                        ? 'bg-amber-950/40 border-amber-500/50'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            isUrgente
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isImportante
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {ann.prioridade}
                        </span>
                        <h3 className="font-extrabold text-white text-xs">{ann.titulo}</h3>
                      </div>

                      {isSupremeAdmin && (
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Remover comunicado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{ann.conteudo}</p>

                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 flex justify-between font-mono">
                      <span>Autor: {ann.autor_nome}</span>
                      <span>{new Date(ann.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-bold text-xs">Nenhum aviso publicado no momento.</p>
              </div>
            )}
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
