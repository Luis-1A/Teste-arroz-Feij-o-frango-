import { POSConfig } from '../types';

export const DEFAULT_POS_CONFIG: POSConfig = {
  theme: 'light',
  primaryColor: '#1e40af', // Corporate Deep Blue
  borderRadius: 'rounded', // 16px (rounded-2xl)
  fontSize: 'standard',
  buttonSize: 'standard',
  
  showHeader: true,
  headerHeight: 80,
  
  showSidebar: true,
  sidebarPosition: 'left',
  sidebarStyle: 'collapsible',
  sidebarWidth: 260,
  
  showSearch: true,
  searchPlaceholder: 'Pesquisar produto por nome, código ou categoria...',
  autoFocusSearch: true,
  
  showShortcutCards: true,
  shortcutTabDefault: 'movimentados',
  shortcutCardCount: 6,
  
  showSelectedList: true,
  
  showRightPanel: true,
  rightPanelPosition: 'right',
  rightPanelWidth: 360,
  
  showFooter: true,
  
  showProductImage: true,
  showProductCode: true,
  showProductCategory: true,
  showProductBrand: true,
  showProductLocation: true,
  showStockRemainingBadge: true,

  shortcutKeys: {
    search: 'F2',
    clear: 'F4',
    refresh: 'F5',
    register: 'F8',
    cancel: 'ESC'
  },

  customActionButtons: [
    { id: '1', label: 'Saída Venda', tipoSaida: 'venda', color: 'blue' },
    { id: '2', label: 'Uso Interno / Loja', tipoSaida: 'uso_interno', color: 'indigo' },
    { id: '3', label: 'Transferência / Troca', tipoSaida: 'transferencia', color: 'amber' }
  ]
};
