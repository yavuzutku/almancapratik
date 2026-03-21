// ── js/cumlebul.js ──

function getWordRange() {
  const min = parseInt(document.getElementById('minWords').value) || 1;
  const max = parseInt(document.getElementById('maxWords').value) || 999;
  return { min, max };
}

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseExamples(wikitext) {
  // 1. <ref>...</ref> etiketlerini içerikleriyle birlikte sil
  wikitext = wikitext
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '');

  const lines = wikitext.split('\n');
  const examples = [];
  let inBeispiele = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 2. Sadece gerçek {{Beispiele}} şablonu veya == Beispiele == başlığı tetiklesin.
    //    Daha önce line.includes('Beispiele') kullanıyorduk; bu Bedeutungen açıklamalarında
    //    geçen "Beispiele" kelimesini de yakalıyor ve yanlış bölümde okumaya başlıyordu.
    if (
      /^\{\{Beispiele/.test(trimmed) ||
      /^={2,}\s*Beispiele\s*={2,}/.test(trimmed)
    ) {
      inBeispiele = true;
      continue;
    }

    // 3. Bölüm sonlandırıcılar: başka bir {{Şablon}} veya yeni başlık (== ... ==)
    if (inBeispiele) {
      if (
        /^\{\{(Herkunft|Synonyme|Übersetzungen|Wortbildungen|Bedeutungen|
         Redewendungen|Charakteristische|Oberbegriffe|Unterbegriffe|Gegenwörter|
         Sprichwörter|Referenzen|Abgeleitete|Verkleinerungsformen|
         Steigerungsformen|Leerzeile|Quellen)/x.test(trimmed) ||
        /^={2,}/.test(trimmed)
      ) {
        inBeispiele = false;
        continue;
      }
    }

    if (inBeispiele && trimmed) {
      const match = line.match(/^:+\s*(?:\[\d+\]\s*)?(.+)/);
      if (match) {
        let text = match[1];
        text = text
          // Nested template içerikleri
          .replace(/\{\{[^{}]*\}\}/g, '')
          .replace(/\{\{[^{}]*\}\}/g, '')
          .replace(/\}\}/g, '')
          .replace(/\{\{/g, '')
          // Wiki biçimlendirme
          .replace(/'{2,3}/g, '')
          .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
          // HTML etiketleri
          .replace(/<[^>]+>/g, '')
          // Satır içi atıf numaraları [1] [2] ...
          .replace(/\[\d+\]/g, '')
          // Özel karakterler
          .replace(/&nbsp;/g, ' ')
          .replace(/[„""\u201C\u201D\u201E\u00AB\u00BB'']/g, '')
          // Sondaki kaynak metni (Yazar Yıl. formatı)
          .replace(/\s*[A-ZÄÖÜ][^.!?]*\d{4}\s*\.?\s*$/, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (text.length > 10) examples.push(text);
      }
    }
  }

  const { min, max } = getWordRange();
  return examples.filter(e => {
    const wc = wordCount(e);
    return wc >= min && wc <= max;
  }).slice(0, 3);
}

async function fetchWiktionary(pageTitle) {
  const params = new URLSearchParams({
    action: 'parse',
    page: pageTitle,
    prop: 'wikitext',
    format: 'json',
    origin: '*'
  });
  const response = await fetch('https://de.wiktionary.org/w/api.php?' + params);
  const data = await response.json();
  if (data.error) return null;
  return data?.parse?.wikitext?.['*'] || null;
}

async function getTatoebaExamples(word) {
  const res = document.getElementById('results');
  const err = document.getElementById('error');
  res.innerHTML = '<p class="loading">🌍 Tatoeba cümleleri aranıyor...</p>';

  try {
    const params = new URLSearchParams({
      from: 'deu',
      query: word,
      orphans: 'no',
      unapproved: 'no',
      sort: 'relevance'
    });
    const url = `https://tatoeba.org/eng/api_v0/search?${params}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const rawResults = data?.results ?? data?.data ?? [];

    if (rawResults.length === 0) {
      err.textContent = "Tatoeba'da da cümle bulunamadı.";
      res.innerHTML = '';
      return;
    }

    const { min, max } = getWordRange();
    const sentences = rawResults
      .map(s => s.text ?? s)
      .filter(text => typeof text === 'string' && text.trim().length > 0)
      .filter(text => { const wc = wordCount(text); return wc >= min && wc <= max; })
      .slice(0, 3);

    if (sentences.length === 0) {
      err.textContent = `Tatoeba'da ${min}–${max} kelime aralığında cümle bulunamadı.`;
      res.innerHTML = '';
      return;
    }

    res.innerHTML = sentences.map(text =>
      `<div class="result-item"><div class="de">🇩🇪 ${escHtml(text)}</div></div>`
    ).join('') +
    `<p class="source">Kaynak: <a href="https://tatoeba.org/tr/sentences/search?from=deu&query=${encodeURIComponent(word)}" target="_blank">tatoeba.org</a></p>`;

  } catch (e) {
    err.textContent = 'Tatoeba erişim hatası: ' + e.message;
    res.innerHTML = '';
  }
}

async function getExamples() {
  const word = document.getElementById('wordInput').value.trim();
  const btn  = document.getElementById('btn');
  const res  = document.getElementById('results');
  const err  = document.getElementById('error');

  err.textContent = '';
  res.innerHTML = '';

  if (!word) { err.textContent = 'Lütfen bir kelime gir.'; return; }

  btn.disabled = true;
  res.innerHTML = '<p class="loading">🔍 Wiktionary aranıyor...</p>';

  try {
    // 4. Hem orijinal haliyle hem büyük harfle dene.
    //    "immer" → önce "immer", bulamazsa "Immer"
    //    "haus"  → önce "haus", bulamazsa "Haus"
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
    const attempts = word === capitalized
      ? [word]                    // zaten büyük harf, tek deneme
      : [word, capitalized];      // küçük → önce orijinal, sonra büyük

    let wikitext = null;
    for (const title of attempts) {
      wikitext = await fetchWiktionary(title);
      if (wikitext) break;
    }

    const examples = wikitext ? parseExamples(wikitext) : [];

    if (examples.length > 0) {
      const pageTitle = capitalized;
      res.innerHTML = examples.map(e =>
        `<div class="result-item"><div class="de">🇩🇪 ${escHtml(e)}</div></div>`
      ).join('') +
      `<p class="source">Kaynak: <a href="https://de.wiktionary.org/wiki/${encodeURIComponent(pageTitle)}" target="_blank">Wiktionary</a></p>`;
    } else {
      await getTatoebaExamples(word);
    }
  } catch (e) {
    await getTatoebaExamples(word);
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn').addEventListener('click', getExamples);
  document.getElementById('wordInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') getExamples();
  });
});