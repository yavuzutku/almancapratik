export function normalizeGermanWord(word, wikiData) {
  if (!word) return word;
  const { artikel = "", wordType = "" } = wikiData || {};
  if (artikel) {
    const lower = word.toLowerCase();
    if (lower.startsWith("der ") || lower.startsWith("die ") || lower.startsWith("das ")) {
      return word;
    }
    return `${artikel} ${word.charAt(0).toUpperCase() + word.slice(1)}`;
  }
  if (wordType === "İsim") return word.charAt(0).toUpperCase() + word.slice(1);
  return word;
}

export function artikelBadgeHtml(artikel, { size = 13 } = {}) {
  const colors = {
    der: { text: "#60c8f0", bg: "rgba(96,200,240,0.12)",  border: "rgba(96,200,240,0.25)" },
    die: { text: "#f07068", bg: "rgba(240,112,104,0.10)", border: "rgba(240,112,104,0.25)" },
    das: { text: "#a064ff", bg: "rgba(160,100,255,0.10)", border: "rgba(160,100,255,0.25)" },
  };
  if (!artikel || !colors[artikel]) return "";
  const c = colors[artikel];
  return `<span style="font-family:monospace;font-size:${size}px;padding:2px 8px;border-radius:5px;background:${c.bg};color:${c.text};border:1px solid ${c.border};">${artikel}</span>`;
}