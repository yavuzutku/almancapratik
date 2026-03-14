export async function fetchTranslate(word, { sl = "de", tl = "tr" } = {}) {
  const url = `https://translate.googleapis.com/translate_a/single`
    + `?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=at`
    + `&q=${encodeURIComponent(word)}`;
    
  const res  = await fetch(url);
  const data = await res.json();

  const main = data[0]?.map(t => t?.[0]).filter(Boolean).join("") || "—";

  const alts = [];
  if (data[5]) {
    data[5].forEach(entry => {
      entry?.[2]?.forEach(item => {
        const w = item?.[0];
        if (w && w !== main) alts.push(w);
      });
    });
  }

  return { main, alts: [...new Set(alts)].slice(0, 8) };
}