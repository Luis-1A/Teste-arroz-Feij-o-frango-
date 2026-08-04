import { normalizeText } from './productStandardizer';

export { normalizeText };

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const SYNONYMS: Record<string, string[]> = {
  capa: ['capinha', 'case', 'protecao', 'capas'],
  capinha: ['capa', 'case', 'protecao', 'capinhas'],
  pelicula: ['película', 'peliculada', 'vidro', 'peliculas'],
  cabo: ['fio', 'cabos', 'cordao'],
  carregador: ['fonte', 'tomada', 'carregadores'],
  fone: ['headphone', 'headset', 'auricular', 'fones'],
  garrafa: ['copo', 'termica', 'garrafas']
};

/**
 * Checks if tokenA matches tokenB directly, via synonym, or via fuzzy edit distance
 */
function tokenMatches(qTok: string, cTok: string): boolean {
  if (qTok === cTok) return true;
  if (cTok.includes(qTok) || qTok.includes(cTok)) return true;

  // Synonyms
  const qSyns = SYNONYMS[qTok] || [];
  if (qSyns.includes(cTok)) return true;

  const cSyns = SYNONYMS[cTok] || [];
  if (cSyns.includes(qTok)) return true;

  // Fuzzy edit distance for typos (e.g. ipone -> iphone)
  if (qTok.length >= 4 && cTok.length >= 4) {
    const maxDist = qTok.length >= 7 ? 2 : 1;
    if (levenshteinDistance(qTok, cTok) <= maxDist) return true;
  }

  return false;
}

/**
 * Smart Search Matching
 * Ignores accents, casing, extra spaces, and handles space variations (e.g., "iphone15" vs "iPhone 15"),
 * synonyms ("capa" -> "capinha"), and small typos.
 */
export function smartMatch(candidateText: string, queryText: string): boolean {
  if (!candidateText || !queryText) return false;

  const nc = normalizeText(candidateText);
  const nq = normalizeText(queryText);

  if (!nc || !nq) return false;

  // Exact / substring match
  if (nc.includes(nq)) return true;

  // Space-stripped match (e.g. "iphone15" vs "iphone 15" or "capaiphone")
  const ncNoSpace = nc.replace(/\s+/g, '');
  const nqNoSpace = nq.replace(/\s+/g, '');

  if (ncNoSpace.includes(nqNoSpace) || nqNoSpace.includes(ncNoSpace)) return true;

  // Tokenize
  const ignoreWords = new Set(['de', 'do', 'da', 'dos', 'das', 'para', 'com', 'em', 'por', 'e']);
  const qTokens = nq.split(' ').filter(t => t.length > 0 && !ignoreWords.has(t));
  const cTokens = nc.split(' ').filter(t => t.length > 0);

  if (qTokens.length === 0) return false;

  // Every query token must match at least one candidate token
  for (const qTok of qTokens) {
    let matched = false;

    // Direct check against full candidate space-less
    if (ncNoSpace.includes(qTok)) {
      matched = true;
    } else {
      for (const cTok of cTokens) {
        if (tokenMatches(qTok, cTok)) {
          matched = true;
          break;
        }
      }
    }

    if (!matched) return false;
  }

  return true;
}
