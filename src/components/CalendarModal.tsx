import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { CalendarEvent } from '../types';
import { Calendar as CalendarIcon, Plus, Trash2, X, Clock, Box, ClipboardCheck, Tag } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<'chegada_mercadoria' | 'inventario' | 'lembrete' | 'outro'>('chegada_mercadoria');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      setEvents(localStore.getCalendarEvents());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const newEvt = localStore.addCalendarEvent({
      titulo,
      descricao,
      tipo,
      data,
      usuario_nome: userName
    });

    setEvents(prev => [newEvt, ...prev]);
    setTitulo('');
    setDescricao('');
    setIsAdding(false);
  };

  const handleDeleteEvent = (id: string) => {
    localStore.deleteCalendarEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Calendário Interno da Loja</h2>
              <p className="text-xs text-slate-400 font-medium">
                Registro de chegadas de mercadorias, inventários e lembretes
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
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Novo Evento de Estoque</span>
            </button>
          )}

          {isAdding && (
            <form onSubmit={handleAddEvent} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wide">Novo Compromisso</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Título do Evento</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Chegada Carga de Carregadores ou Contagem Setor B..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Tipo de Evento</label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="chegada_mercadoria">Chegada de Mercadoria</option>
                    <option value="inventario">Inventário / Auditoria</option>
                    <option value="lembrete">Lembrete Interno</option>
                    <option value="outro">Outro Evento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={e => setData(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Descrição Detalhada</label>
                <textarea
                  rows={2}
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Observações complementares..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition"
              >
                Salvar Compromisso
              </button>
            </form>
          )}

          {/* Event List */}
          <div className="space-y-3">
            {events.length > 0 ? (
              events.map(evt => (
                <div key={evt.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md text-[9px] font-black uppercase">
                        {evt.tipo.replace('_', ' ')}
                      </span>
                      <h3 className="font-extrabold text-white text-xs">{evt.titulo}</h3>
                    </div>

                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Excluir evento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {evt.descricao && <p className="text-xs text-slate-300">{evt.descricao}</p>}

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 flex justify-between font-mono">
                    <span className="text-amber-400 font-bold">Data: {evt.data}</span>
                    <span>Agendado por: {evt.usuario_nome}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-bold text-xs">Nenhum compromisso agendado no calendário.</p>
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
