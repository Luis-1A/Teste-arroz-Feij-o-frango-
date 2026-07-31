import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import {
  PackagePlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Camera,
  ArrowDownLeft,
  Calendar,
  User as UserIcon,
  MapPin,
  Tag
} from 'lucide-react';

export const StockEntry: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantidadeRecebida, setQuantidadeRecebida] = useState<number>(10);
  const [observacao, setObservacao] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const unsub = firestoreSync.subscribeProducts((prods) => {
      setProducts(prods || []);
      if (selectedProduct) {
        const updated = (prods || []).find(p => p.id === selectedProduct.id);
        if (updated) setSelectedProduct(updated);
      }
    });
    return () => unsub();
  }, [selectedProduct?.id]);

  const filteredProducts = products.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedProduct) {
      setErrorMsg('Selecione um produto para adicionar a entrada de estoque.');
      return;
    }

    if (!quantidadeRecebida || quantidadeRecebida <= 0) {
      setErrorMsg('Informe uma quantidade válida maior que zero.');
      return;
    }

    setLoading(true);
    try {
      const updatedProduct = await api.addStockEntry(selectedProduct.id, quantidadeRecebida, observacao);
      setSuccessMsg(
        `Entrada confirmada! Adicionadas +${quantidadeRecebida} un ao produto "${updatedProduct.nome}". Novo estoque total: ${updatedProduct.estoque} un.`
      );
      setSelectedProduct(updatedProduct);
      setQuantidadeRecebida(10);
      setObservacao('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar entrada.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (prod: Product) => {
    setSelectedProduct(prod);
    setSearchTerm(prod.nome);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <PackagePlus className="w-6 h-6 text-emerald-400" />
          <span>Atualizar Estoque • Registrar Entrada</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Adicione reposições de mercadorias. A quantidade informada será somada ao estoque existente.
        </p>
      </div>

      {/* Main Entry Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Product Search & Selection (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                1. Pesquisar Produto para Entrada
              </label>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-1.5 bg-[#0B1220] hover:bg-[#1F2937] text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-[#1F2937]"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Escanear Barcode</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Digite o nome, código interno ou código de barras..."
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-[#0B1220] text-white placeholder-slate-400 font-medium transition-all"
              />
            </div>

            {/* Results Grid */}
            <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map(p => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setErrorMsg('');
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md'
                        : 'bg-[#0B1220] hover:bg-[#1F2937]/50 border-[#1F2937] text-slate-200'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white">{p.nome}</p>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1 font-medium">
                        <span>Cód: <strong className="text-slate-300">{p.codigo}</strong></span>
                        <span>•</span>
                        <span>Categoria: <strong className="text-slate-300">{p.categoria}</strong></span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{p.localizacao}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 bg-[#1F2937] text-emerald-400 rounded-lg font-bold border border-[#374151]">
                        Atual: {p.estoque} un
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Form Entry Details (1 col) */}
        <div>
          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] shadow-xl space-y-4 sticky top-20">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              2. Quantidade Recebida
            </h3>

            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl flex items-start space-x-2 text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {selectedProduct ? (
              <div className="p-3.5 bg-[#0B1220] border border-[#1F2937] rounded-xl text-xs space-y-1">
                <p className="font-bold text-white">{selectedProduct.nome}</p>
                <p className="text-[11px] text-slate-400 font-medium">Cód: {selectedProduct.codigo}</p>
                <div className="pt-2 border-t border-[#1F2937] flex justify-between font-medium text-slate-300">
                  <span>Estoque Atual Físico:</span>
                  <span className="font-extrabold text-blue-400">{selectedProduct.estoque} un</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#0B1220] border border-dashed border-[#1F2937] rounded-xl text-center text-xs text-slate-400 font-medium">
                Selecione um produto na lista ao lado para habilitar a entrada.
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Quantidade Adicionada *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  disabled={!selectedProduct}
                  value={quantidadeRecebida}
                  onChange={e => setQuantidadeRecebida(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-base font-bold border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white bg-[#0B1220] transition-all"
                />
                {selectedProduct && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    Projeção do novo estoque: {selectedProduct.estoque + (quantidadeRecebida || 0)} un
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Observações / N° do Pedido
                </label>
                <textarea
                  rows={2}
                  disabled={!selectedProduct}
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Ex: Recebimento fornecedor Nota de Remessa 1042..."
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-[#0B1220] rounded-xl border border-[#1F2937] text-[11px] space-y-1 text-slate-400 font-medium">
                <div className="flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Responsável: <strong>{user?.nome}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Data/Hora: {new Date().toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedProduct || loading}
                className="w-full py-3 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{loading ? 'Confirmando...' : 'Confirmar Entrada de Estoque'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};
