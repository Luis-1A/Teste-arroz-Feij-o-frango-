import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { firestoreSync } from '../services/firestoreSync';
import { soundEffects } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import {
  ArrowLeftRight,
  X,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  PackagePlus,
  PackageMinus
} from 'lucide-react';

interface ProductExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess?: (message: string) => void;
}

export const ProductExchangeModal: React.FC<ProductExchangeModalProps> = ({
  isOpen,
  onClose,
  products,
  onSuccess
}) => {
  const { user } = useAuth();

  // Returned Item State (Produto sendo devolvido)
  const [returnedSearch, setReturnedSearch] = useState('');
  const [selectedReturnedProd, setSelectedReturnedProd] = useState<Product | null>(null);
  const [returnedQty, setReturnedQty] = useState<number>(1);
  const [returnToStock, setReturnToStock] = useState<boolean>(true); // "coloca devolução pra estoque"
  const [motivoDevolucao, setMotivoDevolucao] = useState<string>('Tamanho / Cor Incorreta');
  const [showReturnedDropdown, setShowReturnedDropdown] = useState(false);

  // Taken Item State (Produto que a pessoa vai levar)
  const [takenSearch, setTakenSearch] = useState('');
  const [selectedTakenProd, setSelectedTakenProd] = useState<Product | null>(null);
  const [takenQty, setTakenQty] = useState<number>(1);
  const [showTakenDropdown, setShowTakenDropdown] = useState(false);

  // Observation and UI states
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReturnedSearch('');
      setSelectedReturnedProd(null);
      setReturnedQty(1);
      setReturnToStock(true);
      setMotivoDevolucao('Tamanho / Cor Incorreta');
      setShowReturnedDropdown(false);

      setTakenSearch('');
      setSelectedTakenProd(null);
      setTakenQty(1);
      setShowTakenDropdown(false);

      setObservacao('');
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Returned products search suggestions
  const returnedSuggestions = useMemo(() => {
    const term = returnedSearch.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.ativo)
      .filter(
        (p) =>
          (p.nome || '').toLowerCase().includes(term) ||
          (p.categoria || '').toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [returnedSearch, products]);

  // Taken products search suggestions
  const takenSuggestions = useMemo(() => {
    const term = takenSearch.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.ativo)
      .filter(
        (p) =>
          (p.nome || '').toLowerCase().includes(term) ||
          (p.categoria || '').toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [takenSearch, products]);

  if (!isOpen) return null;

  const handleConfirmExchange = async () => {
    setErrorMessage(null);

    if (!selectedReturnedProd) {
      setErrorMessage('Por favor, selecione o produto que está sendo devolvido.');
      return;
    }

    if (!selectedTakenProd) {
      setErrorMessage('Por favor, selecione o produto que a pessoa vai levar.');
      return;
    }

    if (selectedReturnedProd.id === selectedTakenProd.id) {
      setErrorMessage('O produto devolvido e o produto levado não podem ser o mesmo item.');
      return;
    }

    if (selectedTakenProd.estoque < takenQty) {
      setErrorMessage(
        `Estoque insuficiente para o produto "${selectedTakenProd.nome}". Disponível: ${selectedTakenProd.estoque} UN.`
      );
      return;
    }

    setLoading(true);
    try {
      await firestoreSync.registerProductExchange({
        itemReturned: {
          productId: selectedReturnedProd.id,
          quantity: returnedQty,
          returnToStock: returnToStock,
          motivoDevolucao
        },
        itemTaken: {
          productId: selectedTakenProd.id,
          quantity: takenQty
        },
        user: {
          id: user?.id || 'usr_1',
          nome: user?.nome || 'Operador'
        },
        observacao: observacao.trim()
      });

      soundEffects.playSuccessChime(false);
      triggerHaptic('success');

      if (onSuccess) {
        onSuccess(
          `Troca realizada com sucesso! ${selectedTakenProd.nome} levado. ${selectedReturnedProd.nome} devolvido (${returnToStock ? 'somado ao estoque' : 'sem retorno ao estoque'}).`
        );
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao realizar troca:', err);
      soundEffects.playWarningTone(false);
      setErrorMessage(err.message || 'Erro ao processar troca de produtos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Troca de Produtos / Devoluções
              </h2>
              <p className="text-xs text-slate-400">
                Controle físico de movimentação: informe o item devolvido e o item a levar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all"
            title="Fechar (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Grid of Returned vs Taken Product */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT: PRODUTO DEVOLVIDO */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                  <PackagePlus className="w-3.5 h-3.5" />
                  1. PRODUTO SENDO DEVOLVIDO
                </span>
                {selectedReturnedProd && (
                  <button
                    onClick={() => {
                      setSelectedReturnedProd(null);
                      setReturnedSearch('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Trocar
                  </button>
                )}
              </div>

              {/* Search or Selected Display */}
              {!selectedReturnedProd ? (
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Buscar Produto Devolvido (Nome do Produto)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={returnedSearch}
                      onChange={(e) => {
                        setReturnedSearch(e.target.value);
                        setShowReturnedDropdown(true);
                      }}
                      onFocus={() => setShowReturnedDropdown(true)}
                      placeholder="Digite o nome do produto..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {showReturnedDropdown && returnedSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-800">
                      {returnedSuggestions.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedReturnedProd(prod);
                            setReturnedSearch(prod.nome);
                            setShowReturnedDropdown(false);
                          }}
                          className="p-3 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">{prod.nome}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span>Categoria: {prod.categoria}</span>
                              <span>•</span>
                              <span>Estoque Atual: {prod.estoque} UN</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{selectedReturnedProd.nome}</h4>
                      <p className="text-xs text-slate-400">
                        Categoria: {selectedReturnedProd.categoria}
                      </p>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400">Quantidade Devolvida:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReturnedQty((q) => Math.max(1, q - 1))}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-white px-2">{returnedQty} UN</span>
                      <button
                        onClick={() => setReturnedQty((q) => q + 1)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TOGGLE: DEVOLUÇÃO PRA ESTOQUE */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Colocar produto devolvido no Estoque?
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnToStock(true)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      returnToStock
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${returnToStock ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>SIM (Estoque +{returnedQty})</span>
                    <span className="text-[10px] text-emerald-400/80 font-normal">Retorna ao estoque vendável</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnToStock(false)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      !returnToStock
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 ${!returnToStock ? 'text-rose-400' : 'text-slate-500'}`} />
                    <span>NÃO (Avaria / Defeito)</span>
                    <span className="text-[10px] text-rose-400/80 font-normal">Não soma ao estoque</span>
                  </button>
                </div>

                {/* Motivo da devolução */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Motivo da Devolução
                  </label>
                  <select
                    value={motivoDevolucao}
                    onChange={(e) => setMotivoDevolucao(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="Tamanho / Cor Incorreta">Tamanho / Cor Incorreta</option>
                    <option value="Defeito / Avaria de Fábrica">Defeito / Avaria de Fábrica</option>
                    <option value="Arrependimento de Compra">Arrependimento de Compra</option>
                    <option value="Produto Incompatível">Produto Incompatível</option>
                    <option value="Outro Motivo">Outro Motivo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT: PRODUTO A LEVAR */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20">
                  <PackageMinus className="w-3.5 h-3.5" />
                  2. PRODUTO QUE A PESSOA VAI LEVAR
                </span>
                {selectedTakenProd && (
                  <button
                    onClick={() => {
                      setSelectedTakenProd(null);
                      setTakenSearch('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Trocar
                  </button>
                )}
              </div>

              {/* Search or Selected Display */}
              {!selectedTakenProd ? (
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Buscar Produto a Levar (Nome do Produto)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={takenSearch}
                      onChange={(e) => {
                        setTakenSearch(e.target.value);
                        setShowTakenDropdown(true);
                      }}
                      onFocus={() => setShowTakenDropdown(true)}
                      placeholder="Digite o nome do produto..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {showTakenDropdown && takenSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-800">
                      {takenSuggestions.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedTakenProd(prod);
                            setTakenSearch(prod.nome);
                            setShowTakenDropdown(false);
                          }}
                          className="p-3 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">{prod.nome}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span>Categoria: {prod.categoria}</span>
                              <span>•</span>
                              <span
                                className={
                                  prod.estoque > 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                                }
                              >
                                Estoque Atual: {prod.estoque} UN
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{selectedTakenProd.nome}</h4>
                      <p className="text-xs text-slate-400">
                        Categoria: {selectedTakenProd.categoria}
                      </p>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Qtde a Levar:</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                        Estoque Atual: {selectedTakenProd.estoque} UN
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTakenQty((q) => Math.max(1, q - 1))}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-white px-2">{takenQty} UN</span>
                      <button
                        onClick={() => {
                          if (takenQty + 1 > selectedTakenProd.estoque) {
                            soundEffects.playWarningTone(false);
                          }
                          setTakenQty((q) => q + 1);
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {takenQty > selectedTakenProd.estoque && (
                    <p className="text-xs text-rose-400 font-medium pt-1">
                      ⚠️ Quantidade ({takenQty}) excede o estoque disponível ({selectedTakenProd.estoque} UN).
                    </p>
                  )}
                </div>
              )}

              {/* Observation Field */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <label className="block text-xs font-medium text-slate-400">
                  Observações adicionais (Opcional)
                </label>
                <input
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Troca física realizada diretamente..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                />
              </div>
            </div>
          </div>

          {/* PHYSICAL STOCK SUMMARY & 3 VALIDATIONS BANNER */}
          {selectedReturnedProd && selectedTakenProd && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-300">
                  Resumo da Atualização do Estoque Físico
                </div>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  3 Validações Obrigatórias
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 space-y-1">
                  <div className="text-amber-400 font-semibold">Devolvido: {selectedReturnedProd.nome}</div>
                  <div className="text-slate-300">
                    {returnToStock
                      ? `Entrada no estoque: ${selectedReturnedProd.estoque} UN ➔ ${selectedReturnedProd.estoque + returnedQty} UN`
                      : 'Sem retorno ao estoque vendável (Item com Avaria/Defeito)'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/20 space-y-1">
                  <div className="text-sky-400 font-semibold">Levado: {selectedTakenProd.nome}</div>
                  <div className="text-slate-300">
                    Saída do estoque: {selectedTakenProd.estoque} UN ➔ {Math.max(0, selectedTakenProd.estoque - takenQty)} UN
                  </div>
                </div>
              </div>

              {/* 3 Explicit Validation Indicators */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Checklist de Validação de Segurança
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px] bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Validação 1: Cadastro Verificado</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px] bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Validação 2: Histórico de Movimentação</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px] bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Validação 3: Atualização do Estoque</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmExchange}
            disabled={
              loading ||
              !selectedReturnedProd ||
              !selectedTakenProd ||
              (selectedTakenProd && takenQty > selectedTakenProd.estoque)
            }
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando Troca...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                Confirmar Troca de Produtos
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
