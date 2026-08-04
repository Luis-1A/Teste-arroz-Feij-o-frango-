import { Product } from '../types';

/**
 * Normalizes text by removing accents, converting to lowercase, stripping punctuation and collapsing whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Standardizes product names according to Bosteca store guidelines:
 * - Proper Title Case (e.g., "Cabo Lightning", "Carregador Turbo 20W", "Película A56")
 * - Correct uppercase for technical terms & acronyms (USB, USB-C, Tipo-C, V8, P2, TWS, iPhone, etc.)
 * - Standardizes variations (e.g., "cabo tipo c" -> "Cabo Tipo-C")
 */
export function standardizeProductName(rawName: string): string {
  if (!rawName) return '';

  let name = rawName.trim().replace(/\s+/g, ' ');

  // Connective words that should stay lowercase unless at the start of the title
  const lowerConnectives = new Set(['para', 'de', 'do', 'da', 'dos', 'das', 'e', 'com', 'em', 'por']);

  // Dictionary for exact tech/brand formatting
  const exactTerms: Record<string, string> = {
    'usb-c': 'USB-C',
    'usbc': 'USB-C',
    'tipo-c': 'Tipo-C',
    'tipoc': 'Tipo-C',
    'usb': 'USB',
    'micro-usb': 'Micro USB',
    'microusb': 'Micro USB',
    'v8': 'V8',
    'p2': 'P2',
    'p10': 'P10',
    'tws': 'TWS',
    'lightning': 'Lightning',
    'iphone': 'iPhone',
    'ipad': 'iPad',
    'samsung': 'Samsung',
    'galaxy': 'Galaxy',
    'motorola': 'Motorola',
    'xiaomi': 'Xiaomi',
    'kimaster': 'Kimaster',
    'kingo': 'Kingo',
    'kaidi': 'Kaidi',
    'baseus': 'Baseus',
    'anker': 'Anker',
    'soundpro': 'SoundPro',
    'powertech': 'PowerTech',
    'glassshield': 'GlassShield',
    'armorcase': 'ArmorCase',
    'turbo': 'Turbo',
    'simples': 'Simples',
    'cabo': 'Cabo',
    'capinha': 'Capinha',
    'carregador': 'Carregador',
    'fone': 'Fone',
    'película': 'Película',
    'pelicula': 'Película',
    'bluetooth': 'Bluetooth',
  };

  // Pre-normalize common compound phrases
  name = name
    .replace(/\b(tipo[- ]?c|tipo c)\b/gi, 'Tipo-C')
    .replace(/\b(usb[- ]?c)\b/gi, 'USB-C')
    .replace(/\b(micro[- ]?usb|micro usb)\b/gi, 'Micro USB')
    .replace(/\b(usb[- ]?lightning|usb lightning)\b/gi, 'USB-Lightning')
    .replace(/\b(tipo-c para tipo-c|tipo c para tipo c)\b/gi, 'Tipo-C para Tipo-C')
    .replace(/\b(lightning para usb-c|lightning para usbc)\b/gi, 'Lightning para USB-C');

  const words = name.split(' ');

  const formattedWords = words.map((word, index) => {
    let prefix = '';
    let suffix = '';
    let cleanWord = word;

    if (cleanWord.startsWith('(')) {
      prefix = '(';
      cleanWord = cleanWord.slice(1);
    }
    if (cleanWord.endsWith(')')) {
      suffix = ')';
      cleanWord = cleanWord.slice(0, -1);
    }

    const lowerClean = cleanWord.toLowerCase();

    // Dictionary match
    if (exactTerms[lowerClean]) {
      return prefix + exactTerms[lowerClean] + suffix;
    }

    // Wattage pattern e.g., 20w -> 20W
    if (/^\d+w$/i.test(cleanWord)) {
      return prefix + cleanWord.toUpperCase() + suffix;
    }

    // Model hyphen pattern e.g., kd-788 -> KD-788, tws-350 -> TWS-350
    if (/^[a-z]{1,4}-\d+$/i.test(cleanWord)) {
      const parts = cleanWord.split('-');
      return prefix + parts[0].toUpperCase() + '-' + parts[1] + suffix;
    }

    // Phone model pattern e.g., A56, S24, G34, A36
    if (/^[a-z]\d{2,3}$/i.test(cleanWord)) {
      return prefix + cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1) + suffix;
    }

    // Connectives in lowercase if not at start
    if (index > 0 && lowerConnectives.has(lowerClean)) {
      return prefix + lowerClean + suffix;
    }

    // Capitalize first letter
    if (cleanWord.length > 0) {
      const capitalized = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
      return prefix + capitalized + suffix;
    }

    return word;
  });

  return formattedWords.join(' ');
}

/**
 * Checks if a product with the same name already exists in the target category (case-insensitive).
 */
export function findDuplicateProduct<T extends { id?: string; nome: string; categoria: string; ativo?: boolean }>(
  products: T[],
  inputName: string,
  inputCategory: string,
  excludeId?: string
): T | null {
  const stdInputName = normalizeText(standardizeProductName(inputName));
  const stdInputCat = normalizeText(inputCategory);

  return (
    products.find((p) => {
      if (p.ativo === false) return false;
      if (excludeId && p.id === excludeId) return false;

      const pCat = normalizeText(p.categoria || '');
      const pName = normalizeText(p.nome);

      if (pCat !== stdInputCat) return false;

      if (pName === stdInputName) return true;
      if (pName.replace(/\s+/g, '') === stdInputName.replace(/\s+/g, '')) return true;

      return false;
    }) || null
  );
}
