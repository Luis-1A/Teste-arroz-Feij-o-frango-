import React, { useState } from 'react';
import { localStore } from '../services/localStore';
import { firestoreSync } from '../services/firestoreSync';
import { Product, Category } from '../types';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileText,
  Layers,
  Boxes,
  Sparkles,
  PackageCheck
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importCount, setImportCount] = useState<number>(0);

  if (!isOpen) return null;

  // --- EXPORT HELPERS ---
  const handleExportProductsCSV = () => {
    const products = localStore.getProducts();
    const headers = ['id', 'nome', 'codigo', 'categoria', 'marca', 'estoque', 'estoque_minimo', 'localizacao', 'ativo'];
    const rows = products.map(p => [
      p.id,
      `"${(p.nome || '').replace(/"/g, '""')}"`,
      p.codigo || '',
      `"${p.categoria || ''}"`,
      `"${p.marca || ''}"`,
      p.estoque ?? 0,
      p.estoque_minimo ?? 0,
      `"${p.localizacao || ''}"`,
      p.ativo ?? true
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, 'produtos_bosteca_estoque.csv', 'text/csv;charset=utf-8;');
  };

  const handleExportProductsJSON = () => {
    const products = localStore.getProducts();
    const jsonStr = JSON.stringify(products, null, 2);
    downloadFile(jsonStr, 'produtos_bosteca_estoque.json', 'application/json');
  };

  const handleExportCategoriesJSON = () => {
    const categories = localStore.getCategories();
    const jsonStr = JSON.stringify(categories, null, 2);
    downloadFile(jsonStr, 'categorias_bosteca_estoque.json', 'application/json');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- IMPORT HELPERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            let added = 0;
            for (const item of data) {
              if (item.nome && item.codigo) {
                await firestoreSync.createProduct({
                  nome: item.nome,
                  codigo: item.codigo,
                  categoria: item.categoria || 'Geral',
                  marca: item.marca || 'Genérica',
                  estoque: parseInt(item.estoque) || 0,
                  estoque_minimo: parseInt(item.estoque_minimo) || 5,
                  localizacao: item.localizacao || 'Depósito Central',
                  observacao: item.observacao || 'Importado via arquivo JSON',
                  alterado_por: userName
                });
                added++;
              }
            }
            setImportCount(added);
            setImportStatus(`Sucesso! ${added} produtos importados do JSON.`);
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          let added = 0;
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length >= 3 && cols[1] && cols[2]) {
              await firestoreSync.createProduct({
                nome: cols[1],
                codigo: cols[2],
                categoria: cols[3] || 'Geral',
                marca: cols[4] || 'Genérica',
                estoque: parseInt(cols[5]) || 0,
                estoque_minimo: parseInt(cols[6]) || 5,
                localizacao: cols[7] || 'Depósito Central',
                alterado_por: userName
              });
              added++;
            }
          }
          setImportCount(added);
          setImportStatus(`Sucesso! ${added} produtos importados do CSV.`);
        } else {
          setImportStatus('Formato de arquivo não suportado. Use CSV ou JSON.');
        }
      } catch (err) {
        setImportStatus('Erro ao ler o arquivo. Verifique a estrutura e formato.');
      }
    };
    reader.readAsText(file);
  };

  const handleSeedList = async () => {
    try {
      const added = await firestoreSync.seedTestProductsList(userName);
      setImportCount(added);
      setImportStatus(`Sucesso! ${added} produtos da Lista de Teste (Garrafas, Fones, Suportes, Carregadores, etc.) foram cadastrados/atualizados.`);
    } catch (err) {
      setImportStatus('Erro ao cadastrar lista de teste. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Importação e Exportação de Dados</h2>
              <p className="text-xs text-slate-400 font-medium">
                Compatibilidade completa com CSV e JSON para produtos e categorias
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar Dados</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar de Arquivo</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Baixe cópias de segurança ou relatórios tabulares de todas as mercadorias e categorias cadastradas no seu estoque.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition">
                  <div className="flex items-center space-x-3 text-orange-400">
                    <Boxes className="w-5 h-5" />
                    <span className="font-extrabold text-white text-sm">Produtos (CSV / Excel)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Exporta nome, código SKU, categoria, saldo em estoque e localização em planilha compatível com Excel.
                  </p>
                  <button
                    onClick={handleExportProductsCSV}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar CSV</span>
                  </button>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition">
                  <div className="flex items-center space-x-3 text-indigo-400">
                    <FileCode className="w-5 h-5" />
                    <span className="font-extrabold text-white text-sm">Produtos (JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Exporta o objeto de produtos completo para migração entre sistemas ou backup bruto.
                  </p>
                  <button
                    onClick={handleExportProductsJSON}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar JSON</span>
                  </button>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition sm:col-span-2">
                  <div className="flex items-center space-x-3 text-emerald-400">
                    <Layers className="w-5 h-5" />
                    <span className="font-extrabold text-white text-sm">Categorias (JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Baixe a lista das suas categorias de produtos para carregar em outras lojas ou filiais.
                  </p>
                  <button
                    onClick={handleExportCategoriesJSON}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Categorias JSON</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Seed Card */}
              <div className="p-5 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-indigo-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="font-extrabold text-white text-sm">Cadastrar Lista de Teste (24 Itens)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Garrafas, Fones, Carregadores, etc.
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Cadastre instantaneamente a lista de teste de mercadorias no estoque (Garrafas Térmicas, Headphone Bluetooth Preto, Suportes, Cabos, Carregadores, Smartwatch, Capinhas, UNO e Acessórios).
                </p>
                <button
                  onClick={handleSeedList}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-950/50 transition flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Cadastrar Lista de Teste Agora</span>
                </button>
              </div>

              <div className="relative flex items-center my-2">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="shrink-0 mx-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ou Importar via Arquivo</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Selecione um arquivo <strong>.CSV</strong> ou <strong>.JSON</strong> do seu dispositivo para adicionar produtos em lote automaticamente.
              </p>

              <div className="p-8 bg-slate-950 border-2 border-dashed border-slate-800 hover:border-blue-500 rounded-3xl text-center space-y-4 transition">
                <Upload className="w-10 h-10 text-blue-400 mx-auto animate-pulse" />
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer font-extrabold text-white text-sm hover:underline">
                    Clique aqui para selecionar um arquivo
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">Formatos aceitos: CSV, JSON</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv, .json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {importStatus && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start space-x-3 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-white">{importStatus}</p>
                    {importCount > 0 && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Os produtos já estão disponíveis no seu estoque central.
                      </p>
                    )}
                  </div>
                </div>
              )}
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
