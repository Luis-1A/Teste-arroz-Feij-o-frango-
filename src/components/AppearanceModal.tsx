import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { StoreAppearance } from '../types';
import { TabType } from './Sidebar';
import { Palette, Building2, Sliders, CheckCircle2, X, Layout, Sparkles } from 'lucide-react';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  const [appearance, setAppearance] = useState<StoreAppearance>(localStore.getStoreAppearance());
  const [initialScreen, setInitialScreen] = useState<TabType>(
    (localStorage.getItem('bytecas_user_start_screen') as TabType) || 'dashboard'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAppearance(localStore.getStoreAppearance());
      setInitialScreen((localStorage.getItem('bytecas_user_start_screen') as TabType) || 'dashboard');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const themes: { id: StoreAppearance['cor_tema']; label: string; classBg: string }[] = [
    { id: 'blue', label: 'Azul Royal', classBg: 'bg-blue-600' },
    { id: 'emerald', label: 'Esmeralda', classBg: 'bg-emerald-600' },
    { id: 'indigo', label: 'Índigo', classBg: 'bg-indigo-600' },
    { id: 'amber', label: 'Âmbar Dourado', classBg: 'bg-amber-600' },
    { id: 'violet', label: 'Violeta', classBg: 'bg-violet-600' },
    { id: 'slate', label: 'Grafite Escuro', classBg: 'bg-slate-700' }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStore.setStoreAppearance(appearance);
    localStorage.setItem('bytecas_user_start_screen', initialScreen);

    localStore.addAuditLog({
      usuario: userName,
      acao: 'CONFIG',
      descricao: `Aparência da loja atualizada: Tema ${appearance.cor_tema}, Nome "${appearance.nome_loja}".`
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-950/50">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Personalização de Aparência do Sistema</h2>
              <p className="text-xs text-slate-400 font-medium">
                Cores de destaque, marca da loja e preferência de tela inicial
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {savedSuccess && (
            <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}

          {/* Store Name Input */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
              Nome da Loja / Sistema
            </label>
            <input
              type="text"
              required
              value={appearance.nome_loja}
              onChange={e => setAppearance({ ...appearance, nome_loja: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
            />
          </div>

          {/* Color theme selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Paleta de Cores de Destaque
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {themes.map(t => {
                const isSelected = appearance.cor_tema === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAppearance({ ...appearance, cor_tema: t.id })}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-3 transition ${
                      isSelected
                        ? 'bg-slate-950 border-orange-500 ring-2 ring-orange-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full ${t.classBg} shrink-0`} />
                    <span className="text-xs font-bold text-white truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Screen after Login (#28) */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Página Inicial Padrão Pós-Login
            </label>
            <select
              value={initialScreen}
              onChange={e => setInitialScreen(e.target.value as TabType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold focus:outline-none"
            >
              <option value="dashboard">Dashboard Inicial</option>
              <option value="products">Estoque Central de Produtos</option>
              <option value="entry">Entrada de Estoque</option>
              <option value="sales">Frente de Caixa / Saídas</option>
              <option value="restock-list">Lista de Reposição</option>
              <option value="history">Relatórios e Auditoria</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg transition"
          >
            Salvar Alterações de Aparência
          </button>
        </form>

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
