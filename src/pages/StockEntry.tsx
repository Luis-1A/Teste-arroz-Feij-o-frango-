import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
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
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const list = await api.getProducts();
      setProducts(list);
    } catch (err) {
      console.error(err);
    }
  };

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
      loadProducts();
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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <PackagePlus className="w-6 h-6 text-emerald-600" />
          <span>Atualizar Estoque • Registrar Entrada</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Adicione reposições de mercadorias. A quantidade informada será somada ao estoque existente.
        </p>
      </div>

      {/* Main Entry Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Product Search & Selection (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                1. Pesquisar Produto para Entrada
              </label>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200/60"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
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
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 focus:bg-white font-medium transition-all"
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
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.nome}</p>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1 font-medium">
                        <span>Cód: {p.codigo}</span>
                        <span>•</span>
                        <span>Categoria: {p.categoria}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{p.localizacao}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 bg-slate-100/80 text-slate-800 rounded-lg font-bold border border-slate-200/80">
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 sticky top-20">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              2. Quantidade Recebida
            </h3>

            {successMsg && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl flex items-start space-x-2 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {selectedProduct ? (
              <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900">{selectedProduct.nome}</p>
                <p className="text-[11px] text-slate-400 font-medium">Cód: {selectedProduct.codigo}</p>
                <div className="pt-2 border-t border-slate-200/80 flex justify-between font-medium text-slate-700">
                  <span>Estoque Atual Físico:</span>
                  <span className="font-extrabold text-blue-600">{selectedProduct.estoque} un</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50/60 border border-dashed border-slate-200/80 rounded-xl text-center text-xs text-slate-400 font-medium">
                Selecione um produto na lista ao lado para habilitar a entrada.
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantidade Adicionada *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  disabled={!selectedProduct}
                  value={quantidadeRecebida}
                  onChange={e => setQuantidadeRecebida(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-base font-bold border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                />
                {selectedProduct && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Projeção do novo estoque: {selectedProduct.estoque + (quantidadeRecebida || 0)} un
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações / N° do Pedido
                </label>
                <textarea
                  rows={2}
                  disabled={!selectedProduct}
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Ex: Recebimento fornecedor Nota de Remessa 1042..."
                  className="w-full px-3 py-2 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-[11px] space-y-1 text-slate-500 font-medium">
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
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
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
