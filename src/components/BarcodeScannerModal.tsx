import React, { useState } from 'react';
import { Camera, X, ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanSuccess: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScanSuccess
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const code = manualCode.trim();
    if (!code) return;

    const found = products.find(
      p => (p.codigo_barras && p.codigo_barras === code) || (p.codigo || '').toLowerCase() === code.toLowerCase()
    );

    if (found) {
      onScanSuccess(found);
      setManualCode('');
      onClose();
    } else {
      setErrorMsg(`Nenhum produto encontrado com o código/barcode "${code}".`);
    }
  };

  const handleSimulateScan = (product: Product) => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onScanSuccess(product);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-base">Leitor de Código de Barras</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Camera Viewfinder Box */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden h-48 flex flex-col items-center justify-center border border-slate-800">
            {/* Animated Laser Scan Line */}
            <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_#3b82f6] animate-pulse top-1/2 -translate-y-1/2" />
            <ScanLine className="w-12 h-12 text-blue-400/80 mb-2 animate-bounce" />
            <p className="text-xs text-slate-300 text-center px-6">
              Aproxime a câmera do código de barras do produto
            </p>
            <div className="mt-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-[11px] text-blue-300 font-medium">
              Câmera Ativa • Facilitando Meu Trabalho Scan
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Barcode Presets for Easy Testing */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Leitura Rápida Simulação (Toque para Testar):
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1 text-left">
              {products.slice(0, 6).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSimulateScan(p)}
                  disabled={scanning}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50/50 transition-all text-xs group"
                >
                  <p className="font-medium text-slate-800 truncate group-hover:text-blue-600">{p.nome}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.codigo_barras || p.codigo}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Barcode Input */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Digitar Código de Barras / Cód Interno
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Ex: 789123456001 ou PEL-IP13-3D"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
