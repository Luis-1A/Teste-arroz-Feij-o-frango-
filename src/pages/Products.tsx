import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import {
  Search,
  Plus,
  Filter,
  Camera,
  Edit2,
  Trash2,
  X,
  Boxes,
  Check,
  AlertCircle,
  MapPin,
  Tag,
  Barcode,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

export const Products: React.FC = () => {
  const { canPerform } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Scanner modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [estoque, setEstoque] = useState<number>(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(5);
  const [localizacao, setLocalizacao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal
  const [deleteProductCandidate, setDeleteProductCandidate] = useState<Product | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getProducts(searchTerm, selectedCategory),
        api.getCategories()
      ]);
      setProducts(prodRes);
      setCategories(catRes);
    } catch (err) {
      console.error('Erro ao carregar lista de estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedCategory]);

  const openAddModal = () => {
    setEditingProduct(null);
    setNome('');
    setCategoria(categories[0]?.nome || 'Capas e Películas');
    setMarca('');
    setCodigo(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
    setCodigoBarras('');
    setEstoque(10);
    setEstoqueMinimo(5);
    setLocalizacao('Prateleira A1');
    setObservacao('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setMarca(p.marca);
    setCodigo(p.codigo);
    setCodigoBarras(p.codigo_barras || '');
    setEstoque(p.estoque);
    setEstoqueMinimo(p.estoque_minimo);
    setLocalizacao(p.localizacao);
    setObservacao(p.observacao || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome || !categoria || !marca || !codigo || estoque === undefined || estoqueMinimo === undefined || !localizacao) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          nome,
          categoria,
          marca,
          codigo,
          codigo_barras: codigoBarras,
          estoque: Number(estoque),
          estoque_minimo: Number(estoqueMinimo),
          localizacao,
          observacao
        });
      } else {
        await api.createProduct({
          nome,
          categoria,
          marca,
          codigo,
          codigo_barras: codigoBarras,
          estoque: Number(estoque),
          estoque_minimo: Number(estoqueMinimo),
          localizacao,
          observacao
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar produto.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductCandidate) return;
    try {
      await api.deleteProduct(deleteProductCandidate.id);
      setDeleteProductCandidate(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto.');
    }
  };

  const handleScanSuccess = (product: Product) => {
    setSearchTerm(product.codigo_barras || product.codigo);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>Controle de Estoque Físico</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie itens, localizações no almoxarifado, níveis mínimos e códigos de barras.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            <span>Ler Barcode</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Search & Dynamic Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Dynamic Multi-Field Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, marca, código, barcode ou local..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white font-medium transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 text-slate-700 font-semibold w-full md:w-auto"
          >
            <option value="Todas">Todas as Categorias ({products.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Stock Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Produto & Marca</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Cód. Interno / Barcode</th>
                <th className="p-4 text-center">Estoque Atual</th>
                <th className="p-4">Localização</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic font-medium">
                    Carregando estoque Bytecas...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    Nenhum produto encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const isZero = p.estoque === 0;
                  const isLow = p.estoque > 0 && p.estoque <= p.estoque_minimo;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Name & Brand */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p.nome}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 font-medium">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>Marca: {p.marca}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100/80 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200/80">
                          {p.categoria}
                        </span>
                      </td>

                      {/* Codes */}
                      <td className="p-4 font-mono text-[11px]">
                        <div className="font-bold text-slate-800">{p.codigo}</div>
                        {p.codigo_barras && (
                          <div className="text-slate-400 text-[10px] flex items-center space-x-1 mt-0.5">
                            <Barcode className="w-3 h-3 text-slate-400" />
                            <span>{p.codigo_barras}</span>
                          </div>
                        )}
                      </td>

                      {/* Quantity & Status Badge */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-3 py-1 rounded-full font-bold text-xs ${
                              isZero
                                ? 'bg-rose-100/80 text-rose-800 border border-rose-200/80'
                                : isLow
                                ? 'bg-amber-100/80 text-amber-800 border border-amber-200/80'
                                : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/80'
                            }`}
                          >
                            {p.estoque} un
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 font-medium">
                            Mínimo: {p.estoque_minimo}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-semibold">{p.localizacao}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {canPerform('edit_products') && (
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 transition-colors"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canPerform('delete_products') && (
                            <button
                              onClick={() => setDeleteProductCandidate(p)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors"
                              title="Excluir Produto (Lógico)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onScanSuccess={handleScanSuccess}
      />

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {editingProduct ? 'Editar Produto do Estoque' : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex: Película iPhone 15 Pro Max 3D"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={e => setMarca(e.target.value)}
                    placeholder="Ex: GlassPro, ByteLink"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código Interno *
                  </label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    placeholder="Ex: PEL-IP15P-3D"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    value={codigoBarras}
                    onChange={e => setCodigoBarras(e.target.value)}
                    placeholder="Ex: 789123456789"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantidade em Estoque *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={estoque}
                    onChange={e => setEstoque(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantidade Mínima *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={estoqueMinimo}
                    onChange={e => setEstoqueMinimo(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Localização Física *
                  </label>
                  <input
                    type="text"
                    required
                    value={localizacao}
                    onChange={e => setLocalizacao(e.target.value)}
                    placeholder="Ex: Prateleira A1, Balcão B2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Observações</label>
                  <textarea
                    rows={2}
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                    placeholder="Anotações técnicas do produto..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Strict Zero Prices Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-700 flex items-center space-x-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Bytecas opera exclusivamente para controle de estoque físico. Nenhum preço é solicitado.</span>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProductCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm border border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Excluir Produto?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Você está prestes a realizar a exclusão lógica do produto{' '}
              <strong className="text-slate-800">{deleteProductCandidate.nome}</strong>. O histórico de movimentações será preservado.
            </p>
            <div className="mt-5 flex space-x-2">
              <button
                onClick={() => setDeleteProductCandidate(null)}
                className="flex-1 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
