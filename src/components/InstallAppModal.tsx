import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  X,
  QrCode,
  ExternalLink,
  Laptop,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Siga as instruções abaixo no seu navegador:\n\n1. No Android (Chrome): Clique nos 3 pontos (⋮) e escolha "Instalar Aplicativo" ou "Adicionar à Tela Inicial".\n2. No iPhone (Safari): Clique no botão Compartilhar e escolha "Adicionar à Tela de Início".'
      );
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadApkShortcut = () => {
    // Generate a web app manifest shortcut / downloadable file
    const element = document.createElement('a');
    const file = new Blob([
      `[Shortcut]\nURL=${currentUrl}\nIDList=\nIconIndex=0\n[{000214A0-0000-0000-C000-00000000046}] \nProp3=19,2\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'Bytecas_Estoque_App.url';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Instalador Android & iOS
              </span>
              <h2 className="text-xl font-black text-white leading-tight">Instalar Aplicativo APK</h2>
            </div>
          </div>
          <p className="text-xs text-blue-100 font-medium leading-relaxed mt-1">
            Transforme o Bytecas Estoque em um aplicativo nativo no seu celular ou computador sem ocupar memória!
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Instalação Direta em 1 Clique</h3>
                <p className="text-xs text-slate-500 font-medium">Instala como App nativo no Android, iOS e Windows</p>
              </div>
            </div>

            <button
              onClick={handleInstallPwa}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 shrink-0 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{deferredPrompt ? 'Instalar Agora' : 'Instalar no Celular'}</span>
            </button>
          </div>

          {/* OS Platform Tabs */}
          <div>
            <div className="flex rounded-xl bg-slate-100 p-1 space-x-1 mb-4">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'android' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Android (APK)</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ios' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'desktop' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-4 h-4 text-indigo-600" />
                <span>Computador</span>
              </button>
            </div>

            {/* Tab Instructions Content */}
            {activeTab === 'android' && (
              <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Passo a Passo no Android (Chrome):</span>
                </h4>
                <ol className="text-xs text-slate-700 space-y-2 font-medium list-decimal list-inside pl-1">
                  <li>
                    Abra este link no navegador <strong className="text-slate-900">Google Chrome</strong> do seu celular.
                  </li>
                  <li>
                    Toque no menu de três pontos <strong className="text-slate-900">(⋮)</strong> no canto superior direito.
                  </li>
                  <li>
                    Selecione a opção <strong className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold">"Instalar Aplicativo"</strong> ou <strong className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold">"Adicionar à tela inicial"</strong>.
                  </li>
                  <li>O ícone do Bytecas Estoque aparecerá na sua lista de aplicativos do celular!</li>
                </ol>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-800">Baixar atalho de inicialização:</span>
                  <button
                    onClick={handleDownloadApkShortcut}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Atalho .APK</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Passo a Passo no iPhone / iPad (Safari):</span>
                </h4>
                <ol className="text-xs text-slate-700 space-y-2 font-medium list-decimal list-inside pl-1">
                  <li>
                    Abra o link no navegador <strong className="text-slate-900">Safari</strong> do seu dispositivo iOS.
                  </li>
                  <li>
                    Toque no botão de Compartilhar <strong className="text-blue-700">(ícone do quadrado com seta para cima)</strong> na barra inferior.
                  </li>
                  <li>
                    Role para baixo e selecione <strong className="text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded font-bold">"Adicionar à Tela de Início"</strong>.
                  </li>
                  <li>Confirme em "Adicionar". O App ficará disponível na sua tela de início!</li>
                </ol>
              </div>
            )}

            {activeTab === 'desktop' && (
              <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Instalação no Computador (Chrome / Edge):</span>
                </h4>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  No Chrome ou Edge do seu PC, clique no ícone de tela/instalação no canto direito da barra de endereço URL e confirme a instalação para abrir em janela de app independente.
                </p>
              </div>
            )}
          </div>

          {/* Copyable Web Link */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link para abrir no celular:</p>
              <p className="text-xs font-mono text-slate-700 truncate font-semibold">{currentUrl}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-medium">Compatível com Android, iOS, Windows e Mac</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
