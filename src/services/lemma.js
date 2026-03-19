/**
 * src/services/lemma.js
 * Almanca kelimenin temel formunu (lemma) Wiktionary'den bulur.
 * Bulamazsa kural tabanlı fallback dener.
 */

const _cache = new Map();

/* ── Ana fonksiyon ── */
export async function getLemma(word) {
  if (!word || word.trim().length < 2) return { lemma: null };
  const key = word.trim().toLowerCase();
  if (_cache.has(key)) return _cache.get(key);

  let result = await _tryWiktionary(word.trim());
  if (!result.lemma) result = _ruleBased(word.trim());

  _cache.set(key, result);
  return result;
}

/* ── Wiktionary API ── */
async function _tryWiktionary(word) {
  try {
    const cap    = word.charAt(0).toUpperCase() + word.slice(1);
    const params = new URLSearchParams({
      action: 'parse', page: cap,
      prop: 'wikitext', format: 'json', origin: '*',
    });
    const res  = await fetch('https://de.wiktionary.org/w/api.php?' + params);
    const data = await res.json();
    const wt   = data?.parse?.wikitext?.['*'] || '';
    if (!wt) return { lemma: null };
    return _parseWikitext(wt, word);
  } catch {
    return { lemma: null };
  }
}

function _parseWikitext(wt, originalWord) {
  const orig = originalWord.toLowerCase();

  // Kelime türü
  const typeMatch = wt.match(/\{\{Wortart\|([^|}\n]+)/);
  const rawType   = typeMatch?.[1]?.trim() || '';

  // Zaten temel form mu?
  const BASE_TYPES = ['Substantiv','Verb','Adjektiv','Adverb','Partikel',
                      'Konjunktion','Präposition','Pronomen','Interjektion'];
  if (BASE_TYPES.includes(rawType)) {
    return { lemma: null, type: _typeLabel(rawType), isBase: true };
  }

  // Grundform
  const grundMatch = wt.match(/\|\s*Grundform\s*=\s*([^\n|{}[\]]+)/i);
  if (grundMatch) {
    const lemma = grundMatch[1].trim().replace(/\[\[|\]\]/g, '');
    if (lemma && lemma.toLowerCase() !== orig)
      return { lemma, type: _typeFromContext(wt), source: 'wiktionary' };
  }

  // Infinitiv (fiiller)
  const infMatch = wt.match(/\|\s*Infinitiv\s*=\s*([^\n|{}[\]]+)/i);
  if (infMatch) {
    const lemma = infMatch[1].trim().replace(/\[\[|\]\]/g, '');
    if (lemma && lemma.toLowerCase() !== orig)
      return { lemma, type: 'Fiil', source: 'wiktionary' };
  }

  // Positiv (sıfatlar)
  const posMatch = wt.match(/\|\s*Positiv\s*=\s*([^\n|{}[\]]+)/i);
  if (posMatch) {
    const lemma = posMatch[1].trim().replace(/\[\[|\]\]/g, '');
    if (lemma && lemma.toLowerCase() !== orig)
      return { lemma, type: 'Sıfat', source: 'wiktionary' };
  }

  // Nominativ Singular (isimler)
  const nomMatch = wt.match(/\|\s*Nominativ Singular\s*=\s*([^\n|{}[\]]+)/i);
  if (nomMatch) {
    const lemma = nomMatch[1].trim().replace(/\[\[|\]\]/g, '');
    if (lemma && lemma.toLowerCase() !== orig)
      return { lemma, type: 'İsim', source: 'wiktionary' };
  }

  // Açıklama metninden parse
  const descPatterns = [
    /konjugierte(?:n)? Form (?:des Verbs? )?\[\[([^\]]+)\]\]/i,
    /deklinierte(?:n)? Form (?:des Substantivs? )?\[\[([^\]]+)\]\]/i,
    /deklinierte(?:n)? Form (?:des Adjektivs? )?\[\[([^\]]+)\]\]/i,
    /Partizip (?:I{1,2}|Perfekt|Präsens) (?:des Verbs? )?\[\[([^\]]+)\]\]/i,
    /Imperativ (?:des Verbs? )?\[\[([^\]]+)\]\]/i,
    /(?:Genitiv|Dativ|Akkusativ|Nominativ).*?\[\[([^\]]+)\]\]/i,
  ];
  for (const p of descPatterns) {
    const m = wt.match(p);
    if (m) {
      const lemma = m[1].split('|')[0].trim();
      if (lemma && lemma.toLowerCase() !== orig)
        return { lemma, type: _typeFromContext(wt), source: 'wiktionary' };
    }
  }

  // "Form" tipindeki sayfalarda ilk link
  if (rawType.includes('Form')) {
    const linkMatch = wt.match(/\[\[([a-zA-ZäöüÄÖÜß]+(?:\|[^\]]+)?)\]\]/);
    if (linkMatch) {
      const lemma = linkMatch[1].split('|')[0].trim();
      if (lemma && lemma.toLowerCase() !== orig && lemma.length > 1)
        return { lemma, type: _typeFromContext(wt), source: 'wiktionary' };
    }
  }

  return { lemma: null };
}

/* ── Kural tabanlı fallback ── */
function _ruleBased(word) {
  const w = word.toLowerCase();

  // Partizip II: ge...t / ge...en
  if (/^ge[a-zäöü]+t$/.test(w) || /^ge[a-zäöü]+en$/.test(w))
    return { lemma: _infinitiv(w), type: 'Fiil', source: 'rule', uncertain: true };

  // -st, -t (fiil çekimi)
  if (w.endsWith('st') && w.length > 4)
    return { lemma: w.slice(0, -2) + 'en', type: 'Fiil', source: 'rule', uncertain: true };
  if (w.endsWith('t') && !/(heit|keit|schaft|iert)$/.test(w) && w.length > 3)
    return { lemma: w.slice(0, -1) + 'en', type: 'Fiil', source: 'rule', uncertain: true };

  // Sıfat çekimleri -em/-en/-er/-es
  for (const end of ['em','en','er','es']) {
    if (w.endsWith(end) && w.length > end.length + 2) {
      const base = w.slice(0, -end.length);
      if (base.length > 2)
        return { lemma: base, type: 'Sıfat', source: 'rule', uncertain: true };
    }
  }

  // İsim çekimleri
  if (w.endsWith('es') && w.length > 4)
    return { lemma: w.slice(0,-2), type: 'İsim', source: 'rule', uncertain: true };
  if (w.endsWith('s')  && w.length > 3)
    return { lemma: w.slice(0,-1), type: 'İsim', source: 'rule', uncertain: true };
  if (w.endsWith('en') && w.length > 4)
    return { lemma: w.slice(0,-2), type: 'İsim', source: 'rule', uncertain: true };

  return { lemma: null };
}

function _infinitiv(w) {
  if (w.startsWith('ge') && w.endsWith('t'))  return w.slice(2,-1) + 'en';
  if (w.startsWith('ge') && w.endsWith('en')) return w.slice(2);
  return w.replace(/^ge/,'') + 'en';
}

function _typeFromContext(wt) {
  if (/Verb|Infinitiv|konjugiert/i.test(wt))    return 'Fiil';
  if (/Substantiv|Nominativ|Genitiv/i.test(wt)) return 'İsim';
  if (/Adjektiv|dekliniert/i.test(wt))          return 'Sıfat';
  if (/Adverb/i.test(wt))                       return 'Zarf';
  return null;
}

function _typeLabel(r) {
  return { Substantiv:'İsim', Verb:'Fiil', Adjektiv:'Sıfat', Adverb:'Zarf',
           Partikel:'Parçacık', Konjunktion:'Bağlaç', Präposition:'Edat',
           Pronomen:'Zamir', Interjektion:'Ünlem' }[r] || r;
}

/* ── Öneri oluşturucu ── */
export function buildLemmaSuggestion(originalWord, lemmaResult) {
  if (!lemmaResult) return null;
  const { lemma, type, isBase, uncertain } = lemmaResult;
  if (isBase || !lemma) return null;
  if (lemma.toLowerCase() === originalWord.toLowerCase()) return null;
  return { original: originalWord, lemma, type, uncertain: !!uncertain };
}