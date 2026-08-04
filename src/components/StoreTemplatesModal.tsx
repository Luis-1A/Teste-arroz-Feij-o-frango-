import React, { useState } from 'react';
import { localStore } from '../services/localStore';
import { firestoreSync } from '../services/firestoreSync';
import { StoreTemplate } from '../types';
import { Layers, CheckCircle2, Sparkles, X, ArrowRight, Building } from 'lucide-react';

interface StoreTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const StoreTemplatesModal: React.FC<StoreTemplatesModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);

  if (!isOpen) return null;

  const templates: StoreTemplate[] = [
    {
      id: 'template_eletronicos',
      nome: 'Assistência Técnica & Acessórios',
      descricao: 'Categorias e etiquetas prontas para peças de celulares, cabos, placas e periféricos.',
      categorias: ['Smartphones & Peças', 'Cabos & Adaptadores', 'Baterias & Carregadores', 'Periféricos & Acessórios', 'Componentes Internos'],
      etiquetas_sugeridas: ['Reposição urgente', 'Garantia 90 dias', 'Original', 'Compatível Premium'],
      estoque_minimo_padrao: 5
    },
    {
      id: 'template_informatica',
      nome: 'Informática & Hardware',
      descricao: 'Estrutura focada em lojas de computadores, monitores, peças de reposição e redes.',
      categorias: ['Processadores & Placas', 'Memórias & Armazenamento', 'Monitores & Telas', 'Redes & Conectividade', 'Fontes & Gabinetes'],
      etiquetas_sugeridas: ['Mais vendido', 'Sob encomenda', 'Item de vitrine', 'Promoção interna'],
      estoque_minimo_padrao: 3
    },
    {
      id: 'template_conveniencia',
      nome: 'Conveniência & Utilidades',
      descricao: 'Gabarito preparado para minimercados, papelaria e utilidades da loja.',
      categorias: ['Bebidas & Alimentos', 'Higiene & Limpeza', 'Papelaria & Escritório', 'Embalagens & Descartáveis', 'Diversos'],
      etiquetas_sugeridas: ['Giro rápido', 'Verificar validade', 'Reposição diária', 'Oferta especial'],
      estoque_minimo_padrao: 10
    }
  ];

  const handleApplyTemplate = (template: StoreTemplate) => {
    // Add categories via firestoreSync
    template.categorias.forEach(catName => {
      firestoreSync.createCategory(catName);
    });

    localStore.addAuditLog({
      usuario: userName,
      acao: 'CONFIG',
      descricao: `Modelo de loja "${template.nome}" aplicado com ${template.categorias.length} categorias predefinidas.`
    });

    setAppliedTemplate(template.nome);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Sistema de Modelos e Gabaritos de Loja</h2>
              <p className="text-xs text-slate-400 font-medium">
                Carregue modelos de categorias e configurações prontas para novas unidades
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {appliedTemplate && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center space-x-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-extrabold text-white">Modelo "{appliedTemplate}" aplicado com sucesso!</p>
                <p className="text-[11px] text-slate-300">
                  As novas categorias já foram salvas e estão disponíveis no seu cadastro de produtos.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                className="p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-xs">{tpl.nome}</h3>
                      <p className="text-[11px] text-slate-400">{tpl.descricao}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>Carregar Modelo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Categorias incluídas neste modelo:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.categorias.map((c, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold">
                        {c}
                      </span>
                    ))}
                  </div>
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
