import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreSync } from '../services/firestoreSync';
import { POSConfig } from '../types';
import { DEFAULT_POS_CONFIG } from '../config/posDefault';
import {
  Palette,
  Layout,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Eye,
  Tv,
  Layers,
  Smartphone,
  Info,
  Save,
  Keyboard,
  Plus,
  Trash2,
  ShieldAlert,
  Search,
  ShoppingCart,
  Boxes,
  Maximize2
} from 'lucide-react';

export const POSCustomization: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<POSConfig>(DEFAULT_POS_CONFIG);
  const [activeTab, setActiveTab] = useState<'layout' | 'appearance' | 'badges' | 'actions' | 'preview'>('layout');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = firestoreSync.subscribeConfig((updated) => {
      setConfig(updated);
    });
    return unsubscribe;
  }, []);

  if (user?.cargo !== 'admin_supremo') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-xs border border-slate-200/80 max-w-xl mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-xs text-slate-500 mt-2">
          Você não possui autorização para alterar a estrutura visual e os parâmetros da Frente de Caixa.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await firestoreSync.updatePOSConfig(config, user.email);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefault = async () => {
    if (window.confirm('Deseja restaurar todas as configurações visuais da Frente de Caixa para o padrão oficial?')) {
      setConfig(DEFAULT_POS_CONFIG);
      await firestoreSync.updatePOSConfig(DEFAULT_POS_CONFIG, user.email);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Border radius utility class map based on config
  const getRadiusClass = (radius: POSConfig['borderRadius']) => {
    switch (radius) {
      case 'sharp': return 'rounded-none';
      case 'soft': return 'rounded-lg';
      case 'rounded': return 'rounded-2xl'; // default 16px
      case 'pill': return 'rounded-3xl';
      default: return 'rounded-2xl';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Sliders className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold tracking-tight">Personalização da Frente de Caixa</h1>
                <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Exclusivo Supremo
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">
                Configure a disposição dos painéis, ordem dos elementos, tamanho de botões, cores e comportamento.
                As alterações são salvas centralmente e aplicadas em tempo real para todos os computadores e celulares da loja.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleResetDefault}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition flex items-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Aplicando...' : 'Aplicar para Toda a Loja'}</span>
            </button>
          </div>
        </div>

        {/* Decorative ambient blur */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs font-medium animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Alterações aplicadas com sucesso!</strong> O novo layout da Frente de Caixa foi sincronizado para todos os dispositivos conectados na loja.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'layout'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Painéis & Disposição</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'appearance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Tema, Cores & Fontes</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'badges'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Informações do Produto</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'actions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Atalhos & Botões Rpidos</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'preview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Prévia Interativa em Tempo Real</span>
        </button>
      </div>

      {/* TAB 1: LAYOUT & PANELS */}
      {activeTab === 'layout' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel Visibility Toggles */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Exibição de Painéis & Componentes</h3>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">Barra Superior de Status (~80px)</p>
                  <p className="text-[11px] text-slate-500">Exibe dados do usuário, hora e indicador de banco de dados</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showHeader}
                  onChange={(e) => setConfig({ ...config, showHeader: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Barra Lateral de Navegação</p>
                  <p className="text-[11px] text-slate-500">Permite escolher se o menu de navegação fica visível na caixa</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showSidebar}
                  onChange={(e) => setConfig({ ...config, showSidebar: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Campo Gigante de Pesquisa</p>
                  <p className="text-[11px] text-slate-500">Campo principal no topo da área central para busca instantânea</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showSearch}
                  onChange={(e) => setConfig({ ...config, showSearch: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Cartões de Atalho de Produtos</p>
                  <p className="text-[11px] text-slate-500">Mais movimentados, favoritos e recentes</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showShortcutCards}
                  onChange={(e) => setConfig({ ...config, showShortcutCards: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Lista Central de Selecionados</p>
                  <p className="text-[11px] text-slate-500">Grade principal contendo os produtos adicionados à movimentação</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showSelectedList}
                  onChange={(e) => setConfig({ ...config, showSelectedList: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Painel Lateral de Resumo da Movimentação</p>
                  <p className="text-[11px] text-slate-500">Painel lateral com totais de itens e botão Registrar Saída</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showRightPanel}
                  onChange={(e) => setConfig({ ...config, showRightPanel: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Rodapé com Guia de Atalhos do Teclado</p>
                  <p className="text-[11px] text-slate-500">Atalhos F2, F4, F5, F8 e ESC visíveis na parte inferior</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showFooter}
                  onChange={(e) => setConfig({ ...config, showFooter: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Positional & Dimension Adjustments */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Dimensões & Posição de Elementos</h3>
            </div>

            {/* Sidebar Position & Style */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Posição e Estilo da Barra Lateral</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 mb-1 block">Lado:</span>
                  <select
                    value={config.sidebarPosition}
                    onChange={(e) => setConfig({ ...config, sidebarPosition: e.target.value as 'left' | 'right' })}
                    className="w-full text-xs font-medium bg-[#0B1220] text-white border border-[#1F2937] rounded-xl p-2.5"
                  >
                    <option value="left" className="bg-[#0B1220] text-white">Esquerda (Padrão)</option>
                    <option value="right" className="bg-[#0B1220] text-white">Direita</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 mb-1 block">Comportamento:</span>
                  <select
                    value={config.sidebarStyle}
                    onChange={(e) => setConfig({ ...config, sidebarStyle: e.target.value as 'collapsible' | 'fixed' })}
                    className="w-full text-xs font-medium bg-[#0B1220] text-white border border-[#1F2937] rounded-xl p-2.5"
                  >
                    <option value="collapsible" className="bg-[#0B1220] text-white">Recolhível (Recomendado)</option>
                    <option value="fixed" className="bg-[#0B1220] text-white">Fixa Sempre Visível</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Panel Width & Height */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Largura do Painel Lateral de Resumo</label>
              <div className="grid grid-cols-3 gap-2">
                {[300, 360, 400].map((width) => (
                  <button
                    key={width}
                    onClick={() => setConfig({ ...config, rightPanelWidth: width })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      config.rightPanelWidth === width
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-[#0B1220] text-slate-300 border-[#1F2937] hover:bg-[#1F2937]'
                    }`}
                  >
                    {width}px {width === 360 ? '(Padrão)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Shortcut Cards Tab Default & Count */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Aba Padrão e Quantidade de Cartões</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 mb-1 block">Aba Inicial dos Cartões:</span>
                  <select
                    value={config.shortcutTabDefault}
                    onChange={(e) => setConfig({ ...config, shortcutTabDefault: e.target.value as any })}
                    className="w-full text-xs font-medium bg-[#0B1220] text-white border border-[#1F2937] rounded-xl p-2.5"
                  >
                    <option value="movimentados" className="bg-[#0B1220] text-white">Mais Movimentados</option>
                    <option value="favoritos" className="bg-[#0B1220] text-white">Favoritos</option>
                    <option value="recentes" className="bg-[#0B1220] text-white">Mais Recentes</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 mb-1 block">Cartões Exibidos:</span>
                  <select
                    value={config.shortcutCardCount}
                    onChange={(e) => setConfig({ ...config, shortcutCardCount: Number(e.target.value) })}
                    className="w-full text-xs font-medium bg-[#0B1220] text-white border border-[#1F2937] rounded-xl p-2.5"
                  >
                    <option value={3} className="bg-[#0B1220] text-white">3 Cartões</option>
                    <option value={6} className="bg-[#0B1220] text-white">6 Cartões (Padrão)</option>
                    <option value={9} className="bg-[#0B1220] text-white">9 Cartões</option>
                    <option value={12} className="bg-[#0B1220] text-white">12 Cartões</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPEARANCE, THEME, COLORS & FONTS */}
      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme & Primary Accent Colors */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Palette className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Tema Geral & Cores do Sistema</h3>
            </div>

            {/* Light/Dark Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Tema Visual</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConfig({ ...config, theme: 'light' })}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition ${
                    config.theme === 'light'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>Modo Claro (Recomendado)</span>
                </button>

                <button
                  onClick={() => setConfig({ ...config, theme: 'dark' })}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition ${
                    config.theme === 'dark'
                      ? 'bg-slate-900 border-slate-900 text-white ring-2 ring-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>Modo Escuro (Dark)</span>
                </button>
              </div>
            </div>

            {/* Primary Accent Color Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Cor Principal de Destaque</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { hex: '#1e40af', label: 'Azul Corporativo' },
                  { hex: '#4f46e5', label: 'Índigo Moderno' },
                  { hex: '#059669', label: 'Esmeralda' },
                  { hex: '#0f172a', label: 'Grafite Nobre' },
                  { hex: '#7c3aed', label: 'Violeta' },
                  { hex: '#d97706', label: 'Âmbar Dourado' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setConfig({ ...config, primaryColor: color.hex })}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2 text-xs font-bold transition ${
                      config.primaryColor === color.hex
                        ? 'border-slate-800 ring-2 ring-slate-400'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: color.hex }} />
                    <span className="truncate text-slate-700">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius (Cantos dos elementos) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Formato dos Cantos (Arredondamento)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'sharp', label: 'Retos (Sem curvas)' },
                  { value: 'soft', label: 'Suaves (rounded-lg)' },
                  { value: 'rounded', label: 'Arredondados 16px (Padrão)' },
                  { value: 'pill', label: 'Pill Curvos (rounded-3xl)' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setConfig({ ...config, borderRadius: item.value as any })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      config.borderRadius === item.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Typography & Button Sizes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Tamanho de Fontes & Botões</h3>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Tamanho da Tipografia (Texto)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'compact', label: 'Compacto' },
                  { value: 'standard', label: 'Padrão (14px)' },
                  { value: 'enlarged', label: 'Ampliado (16px)' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setConfig({ ...config, fontSize: item.value as any })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                      config.fontSize === item.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Button Size */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Tamanho dos Botões de Ação</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'compact', label: 'Pequenos' },
                  { value: 'standard', label: 'Médios (Padrão)' },
                  { value: 'large', label: 'Grandes' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setConfig({ ...config, buttonSize: item.value as any })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                      config.buttonSize === item.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT BADGES & INFORMATION */}
      {activeTab === 'badges' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Boxes className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Informações Visíveis em Cada Produto</h3>
              <p className="text-xs text-slate-500">Escolha quais detalhes aparecem na busca e na lista de produtos selecionados.</p>
            </div>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs font-bold text-slate-800">Foto / Miniatura do Produto</p>
                <p className="text-[11px] text-slate-500">Exibe ícone gráfico ou foto do item na lista</p>
              </div>
              <input
                type="checkbox"
                checked={config.showProductImage}
                onChange={(e) => setConfig({ ...config, showProductImage: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Código de Identificação / SKU</p>
                <p className="text-[11px] text-slate-500">Exemplo: CAB-USBC-01</p>
              </div>
              <input
                type="checkbox"
                checked={config.showProductCode}
                onChange={(e) => setConfig({ ...config, showProductCode: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Categoria do Produto</p>
                <p className="text-[11px] text-slate-500">Exemplo: Carregadores e Fontes</p>
              </div>
              <input
                type="checkbox"
                checked={config.showProductCategory}
                onChange={(e) => setConfig({ ...config, showProductCategory: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Marca / Fabricante</p>
                <p className="text-[11px] text-slate-500">Exemplo: Kimaster, Bosteca Pro</p>
              </div>
              <input
                type="checkbox"
                checked={config.showProductBrand}
                onChange={(e) => setConfig({ ...config, showProductBrand: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Localização Física no Estoque</p>
                <p className="text-[11px] text-slate-500">Exemplo: Prateleira A1, Gaveta B2</p>
              </div>
              <input
                type="checkbox"
                checked={config.showProductLocation}
                onChange={(e) => setConfig({ ...config, showProductLocation: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Selo de Estoque Restante</p>
                <p className="text-[11px] text-slate-500">Badge colorido destacando a quantidade física disponível</p>
              </div>
              <input
                type="checkbox"
                checked={config.showStockRemainingBadge}
                onChange={(e) => setConfig({ ...config, showStockRemainingBadge: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIONS & SHORTCUTS */}
      {activeTab === 'actions' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Custom Quick Action Buttons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Botões de Ação Rápida no Painel Lateral</h3>
                <p className="text-xs text-slate-500">Crie botões customizados para diferentes motivos de saída de produtos.</p>
              </div>
              <button
                onClick={() => {
                  const newBtn = {
                    id: String(Date.now()),
                    label: 'Nova Ação Customizada',
                    tipoSaida: 'venda' as const,
                    color: 'blue'
                  };
                  setConfig({
                    ...config,
                    customActionButtons: [...config.customActionButtons, newBtn]
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Botão</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.customActionButtons.map((btn, idx) => (
                <div key={btn.id} className="p-3 bg-[#0B1220] rounded-xl border border-[#1F2937] flex items-center justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Nome do Botão:</span>
                      <input
                        type="text"
                        value={btn.label}
                        onChange={(e) => {
                          const updated = [...config.customActionButtons];
                          updated[idx].label = e.target.value;
                          setConfig({ ...config, customActionButtons: updated });
                        }}
                        className="w-full text-xs font-semibold bg-[#111827] text-white border border-[#1F2937] rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Tipo de Movimentação:</span>
                      <select
                        value={btn.tipoSaida}
                        onChange={(e) => {
                          const updated = [...config.customActionButtons];
                          updated[idx].tipoSaida = e.target.value as any;
                          setConfig({ ...config, customActionButtons: updated });
                        }}
                        className="w-full text-xs font-medium bg-[#111827] text-white border border-[#1F2937] rounded-lg p-2"
                      >
                        <option value="venda" className="bg-[#111827] text-white">Venda / Saída de Loja</option>
                        <option value="uso_interno" className="bg-[#111827] text-white">Uso Interno</option>
                        <option value="transferencia" className="bg-[#111827] text-white">Transferência</option>
                        <option value="descarte" className="bg-[#111827] text-white">Descarte / Avaria</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Cor do Destaque:</span>
                      <select
                        value={btn.color}
                        onChange={(e) => {
                          const updated = [...config.customActionButtons];
                          updated[idx].color = e.target.value;
                          setConfig({ ...config, customActionButtons: updated });
                        }}
                        className="w-full text-xs font-medium bg-[#111827] text-white border border-[#1F2937] rounded-lg p-2"
                      >
                        <option value="blue" className="bg-[#111827] text-white">Azul (Padrão)</option>
                        <option value="indigo" className="bg-[#111827] text-white">Índigo</option>
                        <option value="amber" className="bg-[#111827] text-white">Âmbar</option>
                        <option value="emerald" className="bg-[#111827] text-white">Verde</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const updated = config.customActionButtons.filter((_, i) => i !== idx);
                      setConfig({ ...config, customActionButtons: updated });
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                    title="Remover botão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REAL-TIME INTERACTIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Tv className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold">Prévia da Frente de Caixa em Tempo Real</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
              Modo de Simulação
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Veja exatamente como a Frente de Caixa será renderizada nos monitores e smartphones da loja com as configurações selecionadas:
          </p>

          {/* Simulated Screen */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-sans text-slate-800">
            {/* Top Bar Preview */}
            {config.showHeader && (
              <div
                className="bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-2xs"
                style={{ height: `${config.headerHeight}px` }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    B
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Bosteca Estoque</h4>
                    <span className="text-[10px] text-blue-600 font-bold">Frente de Caixa (POS)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{user.nome}</p>
                    <p className="text-[10px] text-slate-400">Administrador Supremo</p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Banco Único OK</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Area Simulated */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-[320px]">
              {/* Left/Center Area */}
              <div className="lg:col-span-2 space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* Search Bar Preview */}
                {config.showSearch && (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      disabled
                      placeholder={config.searchPlaceholder}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                )}

                {/* Shortcut Cards Preview */}
                {config.showShortcutCards && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Cartões de Atalho Rápidos ({config.shortcutTabDefault})
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 truncate">Cabo USB-C Turbo #{i}</p>
                          <p className="text-[10px] text-slate-400">Acessórios</p>
                          {config.showStockRemainingBadge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md inline-block">
                              Estoque: {12 + i * 5} UN
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Items List Preview */}
                {config.showSelectedList && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Produtos Selecionados para Saída (Sem Valores Financeiros)
                    </span>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {config.showProductImage && (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs">
                            📱
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-800">Carregador Kimaster Tipo-C 20W</p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            {config.showProductCode && <span>COD: CAR-KIM-20W</span>}
                            {config.showProductLocation && <span>Prateleira A1</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="w-6 h-6 rounded-md bg-slate-100 font-bold text-xs">-</button>
                        <span className="text-xs font-bold px-2">2 UN</span>
                        <button className="w-6 h-6 rounded-md bg-slate-100 font-bold text-xs">+</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel Preview */}
              {config.showRightPanel && (
                <div
                  className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between"
                  style={{ minWidth: `${Math.min(config.rightPanelWidth, 280)}px` }}
                >
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                      Resumo da Movimentação
                    </h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total de Itens:</span>
                        <span className="font-bold text-slate-900">2 UN</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Categorias:</span>
                        <span className="font-bold text-slate-900">Carregadores</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <button className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
                      Registrar Saída de Estoque
                    </button>
                    <button className="w-full py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                      Limpar Seleção
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Preview */}
            {config.showFooter && (
              <div className="bg-slate-100 p-2 rounded-xl text-center text-[10px] font-semibold text-slate-500 border border-slate-200">
                [F2] Pesquisar • [F4] Limpar • [F5] Atualizar • [F8] Registrar • [ESC] Cancelar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
