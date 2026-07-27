"use strict";
/* ═══════════════════════════════════════════════════════════
   JS 3/4 — EXPORT MOTORU: İndirilen index.html Şablonu
   (CSS, tema arka planları, quiz mantığı, PDF indirme, TTS motoru)
   Tek dosyadan birleştirilmiştir: export-template-builder.js
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   8) STATİK SAYFA ŞABLONU (buildExportHtml)
   Bu dosya, app.js'nin bölünmesiyle oluşturulmuştur.
   Diğer js/*.js dosyalarıyla aynı global scope'u paylaşır
   (module DEĞİLDİR) — bu yüzden index.html'deki script sırası önemlidir.
   ═══════════════════════════════════════════════════════════ */
function buildExportHtml(meta) {
    // Sayfa başlığı (H1) genelde ilk BAŞLIK bloğunun metninden otomatik türetilir
    // (bkz. getPreviewMeta). O blok zaten üstte H1 olarak yazıldığı için, aynı
    // metni taşıyan o bloğu gövdede tekrar basmayalım — yoksa başlık iki kez görünür.
    let titleAlreadyPrinted = false;
    function renderBlockList(list) {
      return list.map(b => {
        const bText = (b.text || "").trim();
        if (!titleAlreadyPrinted && b.type === "heading" && bText && bText === (meta.title || "").trim()) {
          titleAlreadyPrinted = true;
          return "";
        }
        return renderBlockExport(b);
      }).filter(Boolean).join("\n");
    }
    // Sekme sistemi: her blok, kullanıcının tanımladığı sekmelerden (projectTabs)
    // birine atanmıştır (bkz. blok ayarları > "Sekme"). Bloğu olmayan sekmeler
    // yayınlanan sayfada gösterilmez. Sadece BİRDEN FAZLA sekmede blok varsa
    // sekmeli görünüme geçiyoruz — aksi halde (ör. eski projeler ya da tek
    // sekmeye sığan yeni bir ders) tek akışlı eski görünüm korunur.
    const activeTabs = (typeof projectTabs !== "undefined" && projectTabs.length)
      ? projectTabs
      : [{ key: "content", label: "Ders İçeriği" }];
    const tabKeys = activeTabs.map(t => t.key);
    function tabKeyFor(b) { return tabKeys.includes(b.tab) ? b.tab : tabKeys[0]; }
    const tabGroups = activeTabs
      .map(t => ({ key: t.key, label: t.label, list: blocks.filter(b => tabKeyFor(b) === t.key) }))
      .filter(g => g.list.length > 0);
    const hasTabs = tabGroups.length > 1;
    const blocksHtml = hasTabs ? "" : renderBlockList(blocks);
    const TAB_ICO_CONTENT = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
    const TAB_ICO_ACTIVITY = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    const TAB_ICO_GENERIC = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    function iconForTabKey(key) {
      if (key === "content") return TAB_ICO_CONTENT;
      if (key === "activity") return TAB_ICO_ACTIVITY;
      return TAB_ICO_GENERIC;
    }
    const lessonBodyHtml = !hasTabs ? (
      '<article class="lesson-body">' + blocksHtml + '</article>'
    ) : [
      '<div class="lesson-tabs" role="tablist" aria-label="Ders bölümleri">',
      tabGroups.map((g, i) =>
        '<button type="button" class="lesson-tab-btn' + (i === 0 ? ' active' : '') + '" data-tab="' + esc(g.key) + '" role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-controls="lessonTab_' + esc(g.key) + '" id="lessonTabBtn_' + esc(g.key) + '">' + iconForTabKey(g.key) + '<span>' + esc(g.label) + '</span></button>'
      ).join("\n"),
      '</div>',
      '<article class="lesson-body lesson-body--tabbed">',
      tabGroups.map((g, i) =>
        '<div class="lesson-tab-panel' + (i === 0 ? ' active' : '') + '" data-tabpanel="' + esc(g.key) + '" id="lessonTab_' + esc(g.key) + '" role="tabpanel" aria-labelledby="lessonTabBtn_' + esc(g.key) + '">' + renderBlockList(g.list) + '</div>'
      ).join("\n"),
      '</article>'
    ].join("\n");
    // ── Performans: sadece bu derste GERÇEKTEN kullanılan font ailelerini yükle ──
    // Önceden 8 font ailesinin TAMAMI her sayfada yükleniyordu (223 KiB+ ağırlık,
    // FCP/LCP'yi geciktiren render-blocking istek). Artık blokların içinde hangi
    // font key'leri geçiyorsa (ör. "display","serif") sadece onlar istenir.
    // "body" ve "display" her zaman dahil edilir çünkü sabit CSS (lesson-body,
    // vocab-phon, lesson-heading, tablo başlıkları vb.) bunları hardcoded kullanır.
    const FONT_GOOGLE_SEGMENTS = {
      body:         "family=Inter:wght@400;500;600;700",
      display:      "family=Plus+Jakarta+Sans:wght@500;600;700;800",
      serif:        "family=Lora:ital,wght@0,400;0,500;0,600;1,400",
      merriweather: "family=Merriweather:ital,wght@0,400;0,700;1,400",
      playfair:     "family=Playfair+Display:wght@500;600;700;800",
      poppins:      "family=Poppins:wght@400;500;600;700",
      montserrat:   "family=Montserrat:wght@400;500;600;700;800",
      nunito:       "family=Nunito:wght@400;500;600;700;800"
    };
    const usedFontKeys = new Set(["body", "display"]);
    try {
      const blocksJson = JSON.stringify(blocks);
      Object.keys(FONT_GOOGLE_SEGMENTS).forEach(key => {
        if (blocksJson.indexOf('"font":"' + key + '"') !== -1) usedFontKeys.add(key);
      });
    } catch (e) { /* JSON.stringify başarısız olursa varsayılan (body+display) ile devam et */ }
    const fontFamiliesUrl = "https://fonts.googleapis.com/css2?" +
      Array.from(usedFontKeys).map(k => FONT_GOOGLE_SEGMENTS[k]).join("&") +
      "&display=swap";

    const canonicalTitle = esc(meta.title);
    const SITE_URL = "https://almancapratik.com";
    const slugPart = encodeURIComponent(meta.slug || slugify(meta.title));
    const canonicalUrl = SITE_URL + "/dersler/" + slugPart + "/";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "name": meta.title || "Ders",
      "description": meta.description || "",
      "url": canonicalUrl,
      "inLanguage": "de",
      "educationalLevel": meta.level || undefined,
      "author": meta.author ? { "@type": "Person", "name": meta.author } : undefined,
      "publisher": { "@type": "Organization", "name": "AlmancaPratik", "url": SITE_URL }
    };
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Anasayfa", "item": SITE_URL + "/" },
        { "@type": "ListItem", "position": 2, "name": "Dersler", "item": SITE_URL + "/dersler/" },
        { "@type": "ListItem", "position": 3, "name": meta.title || "Ders", "item": canonicalUrl }
      ]
    };

    return [
"<!DOCTYPE html>",
'<html lang="tr">',
"<head>",
'<!-- Bu dosya "Ders Builder" ile üretilmiştir. -->',
'<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
"<title>" + canonicalTitle + " — AlmancaPratik</title>",
'<meta name="description" content="' + esc(meta.description) + '">',
'<meta name="robots" content="index, follow">',
'<link rel="canonical" href="' + canonicalUrl + '">',
'<meta property="og:type" content="article">',
'<meta property="og:site_name" content="AlmancaPratik">',
'<meta property="og:title" content="' + canonicalTitle + '">',
'<meta property="og:description" content="' + esc(meta.description) + '">',
'<meta property="og:url" content="' + canonicalUrl + '">',
(meta.cover ? '<meta property="og:image" content="' + esc(meta.cover) + '">' : ""),
'<meta name="twitter:card" content="summary_large_image">',
'<meta name="twitter:title" content="' + canonicalTitle + '">',
'<meta name="twitter:description" content="' + esc(meta.description) + '">',
(meta.type ? '<meta name="lesson-type" content="' + esc(meta.type) + '">' : ""),
(meta.author ? '<meta name="author" content="' + esc(meta.author) + '">' : ""),
'<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</' + 'script>',
'<script type="application/ld+json">' + JSON.stringify(breadcrumbLd) + '</' + 'script>',
'<link rel="preconnect" href="https://fonts.googleapis.com">',
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
'<link rel="stylesheet" href="' + fontFamiliesUrl + '">',
'<link rel="stylesheet" href="../../css/global.css">',
'<link rel="stylesheet" href="../../src/styles/tokens.css">',
'<link rel="stylesheet" href="../lesson-static.css">',
"<style>",
":root { --xblue: #3b82f6; --xblueb: #60a5fa; --xgreen: #4fd69c; --xrose: #f07068; }",

"/* ── Ders arka plan tema sistemi (25 tema) ── */",
`
/* lesson-themes.css
 * Ders sayfaları için opsiyonel arka plan tema sistemi.
 * Konum: /dersler/lesson-themes.css (lesson-static.css ile aynı klasör)
 * Her /dersler/{slug}/index.html, global.css + tokens.css + lesson-static.css'ten
 * SONRA bu dosyaya referans verir. "Tema Yok" seçilirse <body> üzerinde
 * theme-* class'ı olmaz ve sayfa mevcut varsayılan (gold/mavi) görünümünde kalır.
 *
 * Her tema, gövde arka planını 3 katmanlı bir gradient ile (2x radial + 1x linear)
 * değiştirir ve lesson-static.css'teki .bg-glow--1 / .bg-glow--2 parlama
 * renklerini temayla uyumlu hale getirir.
 */

body.theme-ocean {
  background:
    radial-gradient(ellipse 900px 600px at 12% 15%, rgba(37,99,235,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 88% 85%, rgba(14,165,233,0.22), transparent 60%),
    linear-gradient(160deg, #050b16 0%, #0b1c33 100%);
  background-attachment: fixed;
}
body.theme-ocean .bg-glow--1 { background: radial-gradient(circle, #2563eb, transparent 70%); }
body.theme-ocean .bg-glow--2 { background: radial-gradient(circle, #0ea5e9, transparent 70%); }

body.theme-berlin {
  background:
    radial-gradient(ellipse 900px 600px at 15% 10%, rgba(255,255,255,0.05), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 90%, rgba(0,0,0,0.35), transparent 60%),
    linear-gradient(155deg, #2b2b2e 0%, #1c1c1e 45%, #131315 100%);
  background-attachment: fixed;
}
body.theme-berlin .bg-glow--1 { background: radial-gradient(circle, #9ca3af, transparent 70%); }
body.theme-berlin .bg-glow--2 { background: radial-gradient(circle, #52525b, transparent 70%); }

body.theme-iletisim {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(59,130,246,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(45,212,191,0.24), transparent 60%),
    linear-gradient(160deg, #0b1220 0%, #101d33 100%);
  background-attachment: fixed;
}
body.theme-iletisim .bg-glow--1 { background: radial-gradient(circle, #3b82f6, transparent 70%); }
body.theme-iletisim .bg-glow--2 { background: radial-gradient(circle, #2dd4bf, transparent 70%); }

body.theme-buzlucam {
  background:
    radial-gradient(ellipse 900px 600px at 10% -5%, rgba(96,165,250,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 95%, rgba(167,139,250,0.22), transparent 60%),
    linear-gradient(160deg, #0f172a 0%, #1c1a2b 100%);
  background-attachment: fixed;
}
body.theme-buzlucam .bg-glow--1 { background: radial-gradient(circle, #60a5fa, transparent 70%); }
body.theme-buzlucam .bg-glow--2 { background: radial-gradient(circle, #a78bfa, transparent 70%); }

body.theme-likitmetal {
  background:
    radial-gradient(ellipse 900px 600px at 20% 10%, rgba(255,255,255,0.06), transparent 60%),
    radial-gradient(ellipse 800px 550px at 80% 90%, rgba(0,0,0,0.30), transparent 60%),
    linear-gradient(135deg, #4b4f58 0%, #23262e 35%, #6b6f78 55%, #17181c 75%, #3c3e44 100%);
  background-attachment: fixed;
}
body.theme-likitmetal .bg-glow--1 { background: radial-gradient(circle, #9ca3af, transparent 70%); }
body.theme-likitmetal .bg-glow--2 { background: radial-gradient(circle, #52525b, transparent 70%); }

body.theme-prizma {
  background:
    radial-gradient(ellipse 900px 600px at 20% 15%, rgba(167,139,250,0.26), transparent 60%),
    radial-gradient(ellipse 800px 550px at 80% 85%, rgba(45,212,191,0.20), transparent 60%),
    linear-gradient(160deg, #0a0a0f 0%, #14121c 100%);
  background-attachment: fixed;
}
body.theme-prizma .bg-glow--1 { background: radial-gradient(circle, #a78bfa, transparent 70%); }
body.theme-prizma .bg-glow--2 { background: radial-gradient(circle, #2dd4bf, transparent 70%); }

body.theme-sunset {
  background:
    radial-gradient(ellipse 900px 600px at 10% 10%, rgba(244,63,94,0.35), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 90%, rgba(249,115,22,0.28), transparent 60%),
    linear-gradient(160deg, #1a0f1f 0%, #3b1225 100%);
  background-attachment: fixed;
}
body.theme-sunset .bg-glow--1 { background: radial-gradient(circle, #f43f5e, transparent 70%); }
body.theme-sunset .bg-glow--2 { background: radial-gradient(circle, #f97316, transparent 70%); }

body.theme-aurora {
  background:
    radial-gradient(ellipse 900px 600px at 15% 10%, rgba(16,185,129,0.30), transparent 60%),
    radial-gradient(ellipse 850px 550px at 85% 90%, rgba(147,51,234,0.28), transparent 60%),
    linear-gradient(160deg, #071016 0%, #0d1f24 100%);
  background-attachment: fixed;
}
body.theme-aurora .bg-glow--1 { background: radial-gradient(circle, #10b981, transparent 70%); }
body.theme-aurora .bg-glow--2 { background: radial-gradient(circle, #9333ea, transparent 70%); }

body.theme-forest {
  background:
    radial-gradient(ellipse 900px 600px at 10% 15%, rgba(34,197,94,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 85%, rgba(101,163,13,0.20), transparent 60%),
    linear-gradient(160deg, #081511 0%, #0f2a1d 100%);
  background-attachment: fixed;
}
body.theme-forest .bg-glow--1 { background: radial-gradient(circle, #22c55e, transparent 70%); }
body.theme-forest .bg-glow--2 { background: radial-gradient(circle, #65a30d, transparent 70%); }

body.theme-midnight {
  background:
    radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.5), transparent),
    radial-gradient(2px 2px at 70% 65%, rgba(255,255,255,0.35), transparent),
    radial-gradient(1.5px 1.5px at 45% 80%, rgba(255,255,255,0.3), transparent),
    radial-gradient(ellipse 900px 600px at 20% 20%, rgba(79,70,229,0.25), transparent 60%),
    linear-gradient(160deg, #05060d 0%, #0a0e1f 100%);
  background-attachment: fixed;
}
body.theme-midnight .bg-glow--1 { background: radial-gradient(circle, #4f46e5, transparent 70%); }
body.theme-midnight .bg-glow--2 { background: radial-gradient(circle, #818cf8, transparent 70%); }

body.theme-cyberpunk {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(168,85,247,0.35), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 30%, rgba(236,72,153,0.30), transparent 60%),
    radial-gradient(ellipse 700px 500px at 50% 90%, rgba(59,130,246,0.25), transparent 60%),
    linear-gradient(160deg, #0a0014 0%, #1a0a2e 100%);
  background-attachment: fixed;
}
body.theme-cyberpunk .bg-glow--1 { background: radial-gradient(circle, #a855f7, transparent 70%); }
body.theme-cyberpunk .bg-glow--2 { background: radial-gradient(circle, #ec4899, transparent 70%); }

body.theme-lavender {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(167,139,250,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(216,180,254,0.20), transparent 60%),
    linear-gradient(160deg, #12101d 0%, #221c38 100%);
  background-attachment: fixed;
}
body.theme-lavender .bg-glow--1 { background: radial-gradient(circle, #a78bfa, transparent 70%); }
body.theme-lavender .bg-glow--2 { background: radial-gradient(circle, #d8b4fe, transparent 70%); }

body.theme-desert {
  background:
    radial-gradient(ellipse 900px 600px at 10% 20%, rgba(217,119,6,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 80%, rgba(180,83,9,0.22), transparent 60%),
    linear-gradient(160deg, #1a1208 0%, #2e1f0d 100%);
  background-attachment: fixed;
}
body.theme-desert .bg-glow--1 { background: radial-gradient(circle, #d97706, transparent 70%); }
body.theme-desert .bg-glow--2 { background: radial-gradient(circle, #b45309, transparent 70%); }

body.theme-volcano {
  background:
    radial-gradient(ellipse 900px 600px at 20% 80%, rgba(220,38,38,0.35), transparent 60%),
    radial-gradient(ellipse 800px 550px at 80% 20%, rgba(249,115,22,0.28), transparent 60%),
    linear-gradient(160deg, #0d0403 0%, #1f0a05 100%);
  background-attachment: fixed;
}
body.theme-volcano .bg-glow--1 { background: radial-gradient(circle, #dc2626, transparent 70%); }
body.theme-volcano .bg-glow--2 { background: radial-gradient(circle, #f97316, transparent 70%); }

body.theme-emerald {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(16,185,129,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(5,150,105,0.22), transparent 60%),
    linear-gradient(160deg, #04140f 0%, #082820 100%);
  background-attachment: fixed;
}
body.theme-emerald .bg-glow--1 { background: radial-gradient(circle, #10b981, transparent 70%); }
body.theme-emerald .bg-glow--2 { background: radial-gradient(circle, #059669, transparent 70%); }

body.theme-sapphire {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(29,78,216,0.32), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(79,70,229,0.22), transparent 60%),
    linear-gradient(160deg, #050b1a 0%, #0b1533 100%);
  background-attachment: fixed;
}
body.theme-sapphire .bg-glow--1 { background: radial-gradient(circle, #1d4ed8, transparent 70%); }
body.theme-sapphire .bg-glow--2 { background: radial-gradient(circle, #4f46e5, transparent 70%); }

body.theme-rose {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(244,63,94,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(236,72,153,0.20), transparent 60%),
    linear-gradient(160deg, #170a10 0%, #2c111c 100%);
  background-attachment: fixed;
}
body.theme-rose .bg-glow--1 { background: radial-gradient(circle, #f43f5e, transparent 70%); }
body.theme-rose .bg-glow--2 { background: radial-gradient(circle, #ec4899, transparent 70%); }

body.theme-coffee {
  background:
    radial-gradient(ellipse 900px 600px at 10% 15%, rgba(146,64,14,0.25), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 85%, rgba(120,53,15,0.20), transparent 60%),
    linear-gradient(160deg, #140f0b 0%, #241a12 100%);
  background-attachment: fixed;
}
body.theme-coffee .bg-glow--1 { background: radial-gradient(circle, #92400e, transparent 70%); }
body.theme-coffee .bg-glow--2 { background: radial-gradient(circle, #78350f, transparent 70%); }

body.theme-neon {
  background:
    radial-gradient(ellipse 900px 600px at 10% 20%, rgba(34,211,238,0.32), transparent 60%),
    radial-gradient(ellipse 800px 550px at 90% 80%, rgba(217,70,239,0.28), transparent 60%),
    radial-gradient(ellipse 700px 500px at 50% 50%, rgba(74,222,128,0.15), transparent 60%),
    linear-gradient(160deg, #06060a 0%, #0c0c18 100%);
  background-attachment: fixed;
}
body.theme-neon .bg-glow--1 { background: radial-gradient(circle, #22d3ee, transparent 70%); }
body.theme-neon .bg-glow--2 { background: radial-gradient(circle, #d946ef, transparent 70%); }

body.theme-galaxy {
  background:
    radial-gradient(1.5px 1.5px at 25% 20%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1.5px 1.5px at 75% 60%, rgba(255,255,255,0.3), transparent),
    radial-gradient(ellipse 900px 600px at 20% 30%, rgba(124,58,237,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 80% 80%, rgba(59,130,246,0.20), transparent 60%),
    linear-gradient(160deg, #050414 0%, #0d0a24 100%);
  background-attachment: fixed;
}
body.theme-galaxy .bg-glow--1 { background: radial-gradient(circle, #7c3aed, transparent 70%); }
body.theme-galaxy .bg-glow--2 { background: radial-gradient(circle, #3b82f6, transparent 70%); }

body.theme-arctic {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(56,189,248,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(224,242,254,0.12), transparent 60%),
    linear-gradient(160deg, #0a1218 0%, #101f2b 100%);
  background-attachment: fixed;
}
body.theme-arctic .bg-glow--1 { background: radial-gradient(circle, #38bdf8, transparent 70%); }
body.theme-arctic .bg-glow--2 { background: radial-gradient(circle, #e0f2fe, transparent 70%); }

body.theme-tropical {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(20,184,166,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(250,204,21,0.18), transparent 60%),
    linear-gradient(160deg, #031815 0%, #06302a 100%);
  background-attachment: fixed;
}
body.theme-tropical .bg-glow--1 { background: radial-gradient(circle, #14b8a6, transparent 70%); }
body.theme-tropical .bg-glow--2 { background: radial-gradient(circle, #facc15, transparent 70%); }

body.theme-royal {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(126,34,206,0.32), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(212,175,55,0.20), transparent 60%),
    linear-gradient(160deg, #0f0a1a 0%, #1e1330 100%);
  background-attachment: fixed;
}
body.theme-royal .bg-glow--1 { background: radial-gradient(circle, #7e22ce, transparent 70%); }
body.theme-royal .bg-glow--2 { background: radial-gradient(circle, #d4af37, transparent 70%); }

body.theme-obsidian {
  background:
    radial-gradient(ellipse 900px 600px at 20% 20%, rgba(30,41,59,0.50), transparent 60%),
    radial-gradient(ellipse 800px 550px at 80% 80%, rgba(51,65,85,0.35), transparent 60%),
    linear-gradient(160deg, #000000 0%, #0a0a0c 100%);
  background-attachment: fixed;
}
body.theme-obsidian .bg-glow--1 { background: radial-gradient(circle, #1e293b, transparent 70%); }
body.theme-obsidian .bg-glow--2 { background: radial-gradient(circle, #334155, transparent 70%); }

body.theme-peach {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(251,146,60,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(244,114,182,0.18), transparent 60%),
    linear-gradient(160deg, #1a1109 0%, #2e1c10 100%);
  background-attachment: fixed;
}
body.theme-peach .bg-glow--1 { background: radial-gradient(circle, #fb923c, transparent 70%); }
body.theme-peach .bg-glow--2 { background: radial-gradient(circle, #f472b6, transparent 70%); }

body.theme-mint {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(52,211,153,0.28), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(45,212,191,0.18), transparent 60%),
    linear-gradient(160deg, #041512 0%, #082a23 100%);
  background-attachment: fixed;
}
body.theme-mint .bg-glow--1 { background: radial-gradient(circle, #34d399, transparent 70%); }
body.theme-mint .bg-glow--2 { background: radial-gradient(circle, #2dd4bf, transparent 70%); }

body.theme-titanium {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(148,163,184,0.22), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(100,116,139,0.18), transparent 60%),
    linear-gradient(160deg, #0e1013 0%, #181c21 100%);
  background-attachment: fixed;
}
body.theme-titanium .bg-glow--1 { background: radial-gradient(circle, #94a3b8, transparent 70%); }
body.theme-titanium .bg-glow--2 { background: radial-gradient(circle, #64748b, transparent 70%); }

body.theme-ruby {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(190,18,60,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(225,29,72,0.20), transparent 60%),
    linear-gradient(160deg, #12040a 0%, #260814 100%);
  background-attachment: fixed;
}
body.theme-ruby .bg-glow--1 { background: radial-gradient(circle, #be123c, transparent 70%); }
body.theme-ruby .bg-glow--2 { background: radial-gradient(circle, #e11d48, transparent 70%); }

body.theme-amethyst {
  background:
    radial-gradient(ellipse 900px 600px at 15% 15%, rgba(147,51,234,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 85%, rgba(192,132,252,0.18), transparent 60%),
    linear-gradient(160deg, #0f0716 0%, #1e0e2e 100%);
  background-attachment: fixed;
}
body.theme-amethyst .bg-glow--1 { background: radial-gradient(circle, #9333ea, transparent 70%); }
body.theme-amethyst .bg-glow--2 { background: radial-gradient(circle, #c084fc, transparent 70%); }

body.theme-coral {
  background:
    radial-gradient(ellipse 900px 600px at 15% 20%, rgba(251,113,133,0.30), transparent 60%),
    radial-gradient(ellipse 800px 550px at 85% 80%, rgba(249,115,22,0.18), transparent 60%),
    linear-gradient(160deg, #190b0b 0%, #2c1414 100%);
  background-attachment: fixed;
}
body.theme-coral .bg-glow--1 { background: radial-gradient(circle, #fb7185, transparent 70%); }
body.theme-coral .bg-glow--2 { background: radial-gradient(circle, #f97316, transparent 70%); }

`,

((meta.theme === "custom") ? (function () {
  const bg = meta.themeColor || "#0b1220";
  const auto = idealTextColor(bg) || "#ffffff";
  const dim = auto === "#0f172a" ? "rgba(15,23,42,0.62)" : "rgba(226,232,240,0.55)";
  const dot = auto === "#0f172a" ? "rgba(15,23,42,0.35)" : "rgba(226,232,240,0.3)";
  const badgeBg = auto === "#0f172a" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.1)";
  const badgeBorder = auto === "#0f172a" ? "rgba(15,23,42,0.22)" : "rgba(255,255,255,0.28)";
  return (
    "/* ── düz renk (özel), gradient yok ── */\n" +
    "body.theme-custom { background: " + esc(bg) + " !important; background-attachment: fixed; }\n" +
    "body.theme-custom .bg-glow, body.theme-custom .bg-grid { display: none !important; }\n" +
    "/* Seçilen düz arka plana göre TÜM sabit renkli metinler (başlık, üst bilgi,\n" +
    "   seviye/zorluk/tür rozetleri) otomatik okunaklı kalsın — hiçbiri silik durmasın */\n" +
    "body.theme-custom .lesson-heading { color: " + auto + " !important; }\n" +
    "body.theme-custom .lesson-meta-row, body.theme-custom .lb-byline { color: " + dim + " !important; }\n" +
    "body.theme-custom .lesson-card-dot { background: " + dot + " !important; }\n" +
    "body.theme-custom .lesson-cat-badge, body.theme-custom .lesson-diff-badge, body.theme-custom .lesson-type-tag { color: " + auto + " !important; background: " + badgeBg + " !important; border-color: " + badgeBorder + " !important; }"
  );
})() : ""),

"/* ── premium scroll progress bar ── */",
".premium-progress-bar { position: fixed; top: 0; left: 0; width: 0%; height: 4px; background: linear-gradient(90deg, var(--xblue), var(--xblueb)); z-index: 9999; transition: width 0.1s ease; }",

"/* ── byline / difficulty badge ── */",
".lb-byline { font-size: 12.5px; color: rgba(226,232,240,0.55); margin: -18px 0 24px; }",
".lb-byline b { color: var(--xblueb); font-weight: 600; }",
'.lesson-diff-badge { padding: 2px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); color: #93c5fd; }',
'.lesson-type-tag { padding: 2px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; letter-spacing: .06em; }',
'.lesson-type-tag[data-type="iletisim"] { background: rgba(96,200,240,0.1); border: 1px solid rgba(96,200,240,0.25); color: #60c8f0; }',
'.lesson-type-tag[data-type="kultur"] { background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.25); color: #a78bfa; }',
'.lesson-type-tag[data-type="gramer"] { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #22c55e; }',

"/* ── vocab card premium ── */",
".vocab-card { background: linear-gradient(160deg, rgba(59,130,246,0.1), rgba(15,23,42,0.55)); border: 1px solid rgba(59,130,246,0.18); border-left: 4px solid var(--xblue); border-radius: 14px; padding: 26px 30px 24px; margin: 30px 0; position: relative; box-shadow: 0 18px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.03); }",
".vocab-card::before { content: 'DE'; position: absolute; top: 18px; right: 22px; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .12em; color: var(--xblueb); opacity: .6; }",
".vocab-de { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 25px; font-weight: 700; color: var(--xblueb); margin-bottom: 4px; text-shadow: 0 2px 14px rgba(59,130,246,.3); }",
".vocab-phon { font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(226,232,240,.48); margin-bottom: 12px; font-style: italic; }",
".vocab-tr { font-family: 'Inter', sans-serif; font-size: 16.5px; color: #ffffff; font-weight: 600; margin-bottom: 15px; }",
".vocab-example { font-family: 'Inter', sans-serif; font-size: 14.5px; font-style: italic; color: rgba(226,232,240,.68); border-left: 2px solid rgba(148,163,184,.2); padding-left: 14px; }",
".vocab-tip { margin-top: 14px; padding: 11px 15px; background: rgba(96,165,250,.1); border: 1px solid rgba(96,165,250,.28); border-radius: 9px; font-size: 13.5px; color: rgba(226,232,240,.78); }",
".vocab-tip strong { color: #60a5fa; }",
/* Kart Boyutu: Orta — uzun kelime listelerinde sayfa gereksiz uzamasın diye varsayılan boyut */
".vocab-card.vocab-size-medium { padding: 16px 20px 15px; margin: 14px 0; border-left-width: 3px; }",
".vocab-card.vocab-size-medium .vocab-de { font-size: 19px; margin-bottom: 2px; }",
".vocab-card.vocab-size-medium .vocab-phon { font-size: 11.5px; margin-bottom: 6px; }",
".vocab-card.vocab-size-medium .vocab-tr { font-size: 14px; margin-bottom: 8px; }",
".vocab-card.vocab-size-medium .vocab-example { font-size: 13px; padding-left: 11px; }",
".vocab-card.vocab-size-medium .vocab-tip { margin-top: 10px; padding: 8px 12px; font-size: 12.5px; }",
".vocab-card.vocab-size-medium::before { font-size: 9px; top: 13px; right: 16px; }",
/* Kart Boyutu: Küçük — tek satıra yakın, çok sayıda kelimeyi art arda sığdırmak için */
".vocab-card.vocab-size-small { padding: 9px 14px; margin: 6px 0; border-left-width: 3px; border-radius: 10px; display: flex; align-items: baseline; flex-wrap: wrap; column-gap: 9px; row-gap: 1px; }",
".vocab-card.vocab-size-small::before { display: none; }",
".vocab-card.vocab-size-small .vocab-de { font-size: 14.5px; margin-bottom: 0; }",
".vocab-card.vocab-size-small .vocab-phon { font-size: 11px; margin-bottom: 0; }",
".vocab-card.vocab-size-small .vocab-tr { font-size: 13px; margin-bottom: 0; font-weight: 500; color: rgba(226,232,240,.88); }",
".vocab-card.vocab-size-small .vocab-tr::before { content: '→ '; color: var(--xblueb); }",
".vocab-card.vocab-size-small .vocab-example { flex-basis: 100%; font-size: 11.5px; padding-left: 9px; margin-top: 2px; border-left-width: 1.5px; }",
".vocab-card.vocab-size-small .vocab-tip { flex-basis: 100%; margin-top: 4px; padding: 6px 10px; font-size: 11.5px; }",

"/* ── callout premium ── */",
".callout-box { border-radius: 12px; padding: 18px 22px 18px 20px; margin: 26px 0; display: flex; gap: 14px; border: 1px solid; }",
'.callout-box[data-theme="amber"] { background: rgba(255,210,80,.08); border-color: rgba(255,210,80,.28); box-shadow: 0 10px 28px rgba(255,210,80,.06); }',
'.callout-box[data-theme="green"] { background: rgba(79,214,156,.08); border-color: rgba(79,214,156,.3); box-shadow: 0 10px 28px rgba(79,214,156,.06); }',
'.callout-box[data-theme="blue"]  { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.32); box-shadow: 0 10px 28px rgba(59,130,246,.08); }',
'.callout-box[data-theme="rose"]  { background: rgba(240,112,104,.08); border-color: rgba(240,112,104,.3); box-shadow: 0 10px 28px rgba(240,112,104,.06); }',
".callout-ico { flex-shrink: 0; width: 24px; height: 24px; margin-top: 2px; color: #ffd250; }",
'.callout-box[data-theme="green"] .callout-ico { color: #4fd69c; }',
'.callout-box[data-theme="blue"]  .callout-ico { color: #60a5fa; }',
'.callout-box[data-theme="rose"]  .callout-ico { color: #f07068; }',
".callout-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15.5px; margin-bottom: 6px; color: #ffffff; }",
".callout-text { font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.7; color: rgba(226,232,240,.78); }",

"/* ── ultra modern responsive table ── */",
".lb-table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; margin: 24px 0; }",
".lb-table th, .lb-table td { border: 1px solid rgba(148,163,184,0.18); padding: 11px 15px; font-size: 14.5px; text-align: left; }",
".lb-table th { background: rgba(59,130,246,0.14); color: #ffffff; font-weight: 600; }",
".lb-table td { color: #cbd5e1; background: rgba(255,255,255,0.012); }",
".lb-table tr:nth-child(even) td { background: rgba(255,255,255,0.025); }",

"/* ── premium tooltip engine ── */",
".lb-tooltip { position: relative; border-bottom: 1.5px dashed var(--xblueb); color: var(--xblueb); font-weight: 600; cursor: help; display: inline-block; }",
".lb-tooltip-bubble { position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%) scale(0.9); background: rgba(11,19,36,0.96); border: 1px solid rgba(96,165,250,0.3); color: #ffffff; padding: 7px 11px; border-radius: 8px; font-size: 12.5px; line-height: 1.4; white-space: nowrap; visibility: hidden; opacity: 0; z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transition: all 0.15s cubic-bezier(.4,0,.2,1); pointer-events: none; }",
".lb-tooltip-bubble::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: rgba(11,19,36,0.96); }",
".lb-tooltip:hover .lb-tooltip-bubble, .lb-tooltip:focus .lb-tooltip-bubble { visibility: visible; opacity: 1; transform: translateX(-50%) scale(1); }",

"/* ── premium quiz elements ── */",
".premium-quiz-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".quiz-question-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; margin-bottom: 20px; line-height: 1.5; }",
".quiz-options-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }",
".quiz-option-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; cursor: pointer; transition: all 0.2s ease; }",
".quiz-option-item:hover { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.25); }",
".quiz-option-item.selected { background: rgba(59,130,246,0.14); border-color: var(--xblue); }",
".quiz-indicator { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }",
".quiz-option-item.selected .quiz-indicator { border-color: var(--xblueb); background: var(--xblue); }",
".quiz-opt-text { font-family: 'Inter', sans-serif; font-size: 14.5px; color: #e2e8f0; }",
".quiz-action-btn { display: block; width: 100%; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".quiz-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".quiz-option-item.correct-reveal { border-color: var(--xgreen) !important; background: rgba(79,214,156,0.12) !important; }",
".quiz-option-item.correct-reveal .quiz-indicator { border-color: var(--xgreen) !important; background: var(--xgreen) !important; }",
".quiz-option-item.wrong-reveal { border-color: var(--xrose) !important; background: rgba(240,112,104,0.12) !important; }",
".quiz-option-item.wrong-reveal .quiz-indicator { border-color: var(--xrose) !important; background: var(--xrose) !important; }",
".quiz-explain-panel { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; margin-top: 16px; padding: 0 16px; background: rgba(255,255,255,0.02); border-left: 3px solid var(--xgreen); font-size: 13.5px; color: #cbd5e1; line-height: 1.6; }",

"/* ── premium fill-in-the-blank elements ── */",
".premium-fillblank-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".fib-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 16px; }",
".fib-text-body { font-family: 'Inter', sans-serif; font-size: 16px; line-height: 2.2; color: #e2e8f0; }",
".fib-input { display: inline-block; margin: 0 3px; padding: 4px 8px; background: rgba(255,255,255,0.04); border: none; border-bottom: 2px solid var(--xblue); border-radius: 4px 4px 0 0; color: #ffffff; font-family: 'Inter', sans-serif; font-size: 15px; text-align: center; }",
".fib-input:focus { outline: none; background: rgba(59,130,246,0.1); }",
".fib-input.fib-correct { border-bottom-color: var(--xgreen); background: rgba(79,214,156,0.14); color: var(--xgreen); }",
".fib-input.fib-wrong { border-bottom-color: var(--xrose); background: rgba(240,112,104,0.14); color: var(--xrose); }",
".fib-action-btn { display: block; width: 100%; margin-top: 20px; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".fib-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".fib-result-msg { margin-top: 14px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; text-align: center; }",

"/* ── premium matching (eşleştirme) elements — real drag & drop ── */",
".premium-matching-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".matching-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 18px; }",
".matching-columns { display: flex; gap: 24px; }",
".matching-col-left, .matching-col-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }",
".matching-drop-zone { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 2px dashed rgba(255,255,255,0.14); border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 14px; color: #e2e8f0; min-height: 52px; transition: all 0.18s ease; }",
".matching-drop-zone:focus { outline: 2px solid var(--xblueb); outline-offset: 2px; }",
".matching-drop-zone.drop-hover { border-color: var(--xblueb); background: rgba(59,130,246,0.1); }",
".matching-num { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--xblue); color: #071022; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; }",
".matching-drop-fixed { flex-shrink: 0; display: flex; align-items: center; }",
".matching-drop-slot { flex: 1; min-height: 34px; display: flex; align-items: center; }",
".matching-drop-slot:empty::before { content: 'Buraya bırakın'; color: rgba(226,232,240,0.32); font-size: 12.5px; font-style: italic; }",
".matching-card { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; cursor: grab; font-family: 'Inter', sans-serif; font-size: 14px; color: #e2e8f0; transition: all 0.18s ease; user-select: none; }",
".matching-card:hover { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.08); }",
".matching-card:focus { outline: 2px solid var(--xblueb); outline-offset: 2px; }",
".matching-card.kbd-selected { border-color: var(--xblueb); box-shadow: 0 0 0 2px rgba(96,165,250,0.35); }",
".matching-card.dragging-card { opacity: 0.35; }",
".matching-card.placed-card { cursor: default; width: 100%; }",
".matching-card-img { max-width: 64px; max-height: 64px; border-radius: 6px; object-fit: cover; }",
".matching-drop-zone.matching-correct { border-style: solid; border-color: var(--xgreen); background: rgba(79,214,156,0.12); }",
".matching-drop-zone.matching-wrong { border-style: solid; border-color: var(--xrose); background: rgba(240,112,104,0.12); }",
".matching-btn-row { display: flex; gap: 10px; margin-top: 22px; }",
".matching-action-btn, .matching-retry-btn { display: block; flex: 1; padding: 12px; border: none; border-radius: 9px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".matching-action-btn { background: linear-gradient(135deg, var(--xblue), var(--xblueb)); color: #071022; }",
".matching-retry-btn { background: rgba(255,255,255,0.05); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.16); }",
".matching-action-btn:hover, .matching-retry-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".matching-result-msg { margin-top: 14px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; text-align: center; }",
"@media (max-width: 640px) { .matching-columns { flex-direction: column; } }",

"/* ── premium image block: figure, caption, lightbox ── */",
".premium-image-figure { margin: 0; }",
".lb-image-trigger { display: inline-block; padding: 0; border: none; background: transparent; }",
".premium-image-el { display: block; }",
".premium-image-caption { margin-top: 10px; font-family: 'Inter', sans-serif; font-size: 12.5px; color: rgba(226,232,240,0.5); text-align: center; }",
".lb-lightbox-overlay { position: fixed; inset: 0; background: rgba(4,8,16,0.92); z-index: 10000; display: none; align-items: center; justify-content: center; overflow: hidden; touch-action: none; }",
".lb-lightbox-overlay.open { display: flex; }",
".lb-lightbox-img { max-width: 92vw; max-height: 88vh; border-radius: 10px; box-shadow: 0 30px 80px rgba(0,0,0,0.6); cursor: zoom-in; transition: transform 0.12s ease-out; touch-action: none; }",
".lb-lightbox-close { position: absolute; top: 18px; right: 22px; width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }",
".lb-lightbox-close:hover { background: rgba(255,255,255,0.16); }",
".lb-lightbox-hint { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); font-family: 'Inter', sans-serif; font-size: 12px; color: rgba(255,255,255,0.45); }",
"@media (max-width: 640px) { .premium-image-el { width: 100% !important; height: auto !important; } }",

"/* ── premium sentence ordering (cümle sıralama) elements ── */",
".premium-sentorder-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".sentorder-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 16px; }",
".sentorder-list { display: flex; flex-direction: column; gap: 8px; }",
".sentorder-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; transition: all 0.2s ease; }",
".sentorder-text { flex: 1; font-family: 'Inter', sans-serif; font-size: 14.5px; color: #e2e8f0; }",
".sentorder-btns { display: flex; gap: 4px; flex-shrink: 0; }",
".sentorder-btns button { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #cbd5e1; cursor: pointer; transition: all 0.15s ease; }",
".sentorder-btns button:hover { background: rgba(59,130,246,0.15); color: #fff; }",
".sentorder-item.sentorder-correct { border-color: var(--xgreen); background: rgba(79,214,156,0.1); }",
".sentorder-item.sentorder-wrong { border-color: var(--xrose); background: rgba(240,112,104,0.1); }",
".sentorder-action-btn { display: block; width: 100%; margin-top: 20px; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".sentorder-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".sentorder-result-msg { margin-top: 14px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; text-align: center; }",

"/* ── premium word-order (duolingo style) elements ── */",
".premium-wordorder-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".wordorder-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 16px; }",
".wordorder-answer-line { display: flex; flex-wrap: wrap; gap: 8px; min-height: 46px; padding: 10px; margin-bottom: 18px; background: rgba(255,255,255,0.02); border: 2px dashed rgba(255,255,255,0.12); border-radius: 10px; }",
".wordorder-bank { display: flex; flex-wrap: wrap; gap: 8px; }",
".wordorder-chip, .wordorder-placed-chip { font-family: 'Inter', sans-serif; font-size: 14.5px; font-weight: 600; color: #e2e8f0; padding: 9px 15px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; cursor: pointer; transition: all 0.15s ease; }",
".wordorder-chip:hover:not(:disabled) { background: rgba(59,130,246,0.14); border-color: rgba(59,130,246,0.4); transform: translateY(-1px); }",
".wordorder-chip:disabled { opacity: 0.25; cursor: default; }",
".wordorder-placed-chip { background: rgba(59,130,246,0.14); border-color: var(--xblueb); }",
".wordorder-placed-chip:hover { background: rgba(240,112,104,0.14); border-color: var(--xrose); }",
".wordorder-placed-chip.wordorder-correct { border-color: var(--xgreen) !important; background: rgba(79,214,156,0.16) !important; cursor: default; }",
".wordorder-placed-chip.wordorder-wrong { border-color: var(--xrose) !important; background: rgba(240,112,104,0.16) !important; }",
".wordorder-actions { display: flex; gap: 10px; margin-top: 20px; }",
".wordorder-reset-btn { padding: 12px 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 9px; color: #cbd5e1; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".wordorder-reset-btn:hover { border-color: rgba(240,112,104,0.4); color: var(--xrose); }",
".wordorder-action-btn { flex: 1; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".wordorder-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".wordorder-result-msg { margin-top: 14px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; text-align: center; }",

"/* ── premium dialogue / chat-bubble elements ── */",
".premium-dialogue-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".dialogue-instruction { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--xblueb); margin-bottom: 18px; }",
".dialogue-step { margin-bottom: 14px; }",
".dialogue-step.dialogue-locked { display: none; }",
".dialogue-bubble { display: flex; align-items: flex-end; gap: 10px; max-width: 78%; }",
".dialogue-bubble.dialogue-right { margin-left: auto; flex-direction: row-reverse; }",
".dialogue-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px; color: #071022; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); }",
".dialogue-right .dialogue-avatar { background: linear-gradient(135deg, var(--xgreen), #38b98a); }",
".dialogue-bubble-body { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 10px 14px; }",
".dialogue-left .dialogue-bubble-body { border-bottom-left-radius: 3px; }",
".dialogue-right .dialogue-bubble-body { border-bottom-right-radius: 3px; background: rgba(79,214,156,0.08); border-color: rgba(79,214,156,0.25); }",
".dialogue-bubble-name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700; color: var(--xblueb); margin-bottom: 2px; }",
".dialogue-right .dialogue-bubble-name { color: var(--xgreen); text-align: right; }",
".dialogue-bubble-text { font-family: 'Inter', sans-serif; font-size: 14.5px; color: #e2e8f0; line-height: 1.5; }",
".dialogue-options-wrap { max-width: 90%; }",
".dialogue-choice-label { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; font-weight: 700; color: rgba(226,232,240,0.55); margin-bottom: 8px; }",
".dialogue-opt-btn { display: block; width: 100%; text-align: left; margin-bottom: 8px; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #e2e8f0; font-family: 'Inter', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.15s ease; }",
".dialogue-opt-btn:hover { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.35); }",
".dialogue-opt-btn.dialogue-opt-wrong { border-color: var(--xrose) !important; background: rgba(240,112,104,0.16) !important; animation: dlgShake 0.4s ease; }",
"@keyframes dlgShake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-4px);} 75%{transform:translateX(4px);} }",

"/* ── premium audio elements ── */",
".premium-audio-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; margin: 24px 0; }",
".premium-audio-btn { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--xblue); border: none; color: #071022; cursor: pointer; transition: all 0.2s ease; }",
".premium-audio-btn:hover { background: var(--xblueb); transform: scale(1.05); }",
".premium-audio-btn svg { width: 18px; height: 18px; }",
".premium-audio-details { display: flex; flex-direction: column; gap: 4px; }",
".premium-audio-text { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 800; color: #ffffff; }",
".premium-audio-caption { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.55); }",
".premium-audio-meta { font-size: 11.5px; color: rgba(255,255,255,0.3); }",
".premium-audio-btn-slow { width: 36px; height: 36px; background: rgba(59,130,246,0.14); color: var(--xblueb); }",
".premium-audio-btn-slow:hover { background: rgba(59,130,246,0.26); }",
".premium-audio-btn-slow svg { width: 15px; height: 15px; }",

"/* ── Sesli Okuma (TTS) mini kontrolleri: kelime kartı, diyalog, cümle sıralama vb. ── */",
".tts-cluster { display: inline-flex; align-items: center; gap: 4px; margin-left: 9px; vertical-align: middle; }",
".tts-btn { display: inline-flex; align-items: center; justify-content: center; width: 23px; height: 23px; flex-shrink: 0; padding: 0; border-radius: 50%; border: 1px solid rgba(59,130,246,0.32); background: rgba(59,130,246,0.09); color: var(--xblueb); cursor: pointer; transition: all 0.15s ease; }",
".tts-btn:hover { background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.55); transform: scale(1.08); }",
".tts-btn svg { width: 12px; height: 12px; pointer-events: none; display: block; }",
".tts-cluster.tts-cluster-sm .tts-btn { width: 19px; height: 19px; }",
".tts-cluster.tts-cluster-sm .tts-btn svg { width: 10px; height: 10px; }",
".tts-playing { animation: ttsPulse 0.9s ease-in-out infinite; }",
"@keyframes ttsPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); } 50% { box-shadow: 0 0 0 5px rgba(59,130,246,0); } }",

"/* ── premium paragraf varyantları (alıntı / vurgu kutusu / drop cap) ── */",
".lb-dropcap::first-letter { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 3.3em; font-weight: 800; float: left; line-height: 0.82; padding: 4px 8px 0 0; color: var(--xblueb); }",
".lb-paragraph-quote { margin: 26px 0; padding: 6px 0 6px 22px; border-left: 4px solid var(--xblue); }",
".lb-paragraph-quote p { font-style: italic; color: #e2e8f0 !important; }",
".lb-paragraph-highlight { margin: 26px 0; padding: 18px 22px; background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; }",

"/* ── Dinleme Anlama (Hörverstehen) elements ── */",
".listen-prev { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".listen-audio-player { width: 100%; height: 42px; margin-bottom: 14px; border-radius: 10px; }",
".listen-audio-empty { padding: 16px; text-align: center; border: 1.5px dashed rgba(255,255,255,0.16); border-radius: 10px; color: rgba(226,232,240,0.4); font-family: 'Inter', sans-serif; font-size: 13px; margin-bottom: 16px; }",
".listen-caption { font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(226,232,240,0.55); font-style: italic; margin-bottom: 20px; }",
".listen-question { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }",
".listen-question:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }",
".listen-question h4 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15.5px; font-weight: 700; color: #ffffff; margin: 0 0 12px; line-height: 1.5; }",
".listen-options { display: flex; flex-direction: column; gap: 8px; }",
".listen-option { display: flex; align-items: center; gap: 10px; padding: 11px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 14px; color: #e2e8f0; transition: all 0.18s ease; }",
".listen-option:hover { border-color: rgba(59,130,246,0.32); background: rgba(59,130,246,0.06); }",
".listen-option input[type=radio] { accent-color: var(--xblue); flex-shrink: 0; }",
".listen-option.listen-correct { border-color: var(--xgreen) !important; background: rgba(79,214,156,0.13) !important; color: var(--xgreen); }",
".listen-option.listen-wrong { border-color: var(--xrose) !important; background: rgba(240,112,104,0.13) !important; color: var(--xrose); }",
".listen-feedback { margin-top: 9px; font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 700; min-height: 16px; }",
".listen-feedback.is-correct { color: var(--xgreen); }",
".listen-feedback.is-wrong { color: var(--xrose); }",

"/* ── Fiil Çekim Alıştırması (Konjugation) elements ── */",
".konj-prev { background: rgba(15,23,42,0.6); border: 1px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 26px 28px; margin: 30px 0; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }",
".konj-header { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; color: #ffffff; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }",
".konj-header strong { color: var(--xblueb); }",
".konj-header span { font-family: 'Inter', sans-serif; font-size: 12px; padding: 3px 10px; background: rgba(59,130,246,0.14); border-radius: 20px; color: var(--xblueb); font-weight: 600; }",
".konj-rows { display: flex; flex-direction: column; gap: 10px; }",
".konj-row { display: flex; align-items: center; gap: 12px; }",
".konj-person { flex: 0 0 92px; font-family: 'Inter', sans-serif; font-size: 13.5px; color: rgba(226,232,240,0.68); font-weight: 600; }",
".konj-input { flex: 1; min-width: 0; padding: 9px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; color: #ffffff; font-family: 'Inter', sans-serif; font-size: 14px; }",
".konj-input:focus { outline: none; border-color: var(--xblue); background: rgba(59,130,246,0.08); }",
".konj-input.konj-correct { border-color: var(--xgreen); background: rgba(79,214,156,0.13); color: var(--xgreen); }",
".konj-input.konj-wrong { border-color: var(--xrose); background: rgba(240,112,104,0.13); color: var(--xrose); }",
".konj-correct-answer { flex: 0 0 auto; max-width: 40%; font-family: 'Inter', sans-serif; font-size: 12px; color: var(--xgreen); font-style: italic; text-align: right; }",
".konj-action-btn { display: block; width: 100%; margin-top: 22px; padding: 12px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); border: none; border-radius: 9px; color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease; }",
".konj-action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }",
".konj-result { margin-top: 14px; text-align: center; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 700; }",
"@media (max-width: 480px) { .konj-row { flex-wrap: wrap; } .konj-person { flex: 0 0 100%; } .konj-correct-answer { flex: 0 0 100%; text-align: left; max-width: 100%; } }",

"/* ── premium accordion elements ── */",
".premium-accordion-wrap { display: flex; flex-direction: column; gap: 8px; margin: 24px 0; }",
".accordion-item-box { border: 1px solid rgba(255,255,255,0.06); background: rgba(15,23,42,0.4); border-radius: 10px; overflow: hidden; transition: all 0.2s ease; }",
".accordion-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; background: transparent; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; color: #ffffff; text-align: left; cursor: pointer; }",
".accordion-trigger:hover { background: rgba(255,255,255,0.02); }",
".acc-chevron { font-size: 10px; transition: transform 0.2s ease; color: rgba(255,255,255,0.4); }",
".accordion-item-box.active { border-color: rgba(59,130,246,0.3); }",
".accordion-item-box.active .acc-chevron { transform: rotate(180deg); color: var(--xblueb); }",
".accordion-panel-content { max-height: 0; overflow: hidden; transition: max-height 0.2s ease-out; background: rgba(255,255,255,0.01); }",
".accordion-panel-content p { padding: 15px 20px; margin: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #cbd5e1; line-height: 1.6; }",

"/* ── premium responsive video ── */",
".premium-video-card { border-radius: 14px; overflow: hidden; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); margin: 30px 0; }",
".video-ratio-box { position: relative; width: 100%; padding-top: 56.25%; }",
".video-ratio-box iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }",
".premium-video-caption { padding: 12px; text-align: center; font-size: 12.5px; color: rgba(226,232,240,0.5); background: rgba(255,255,255,0.01); border-top: 1px solid rgba(255,255,255,0.04); }",

"/* ── premium code formatting ── */",
".premium-code-box { background: #080c14; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; margin: 24px 0; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }",
".code-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06); }",
".code-lang-tag { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.4); letter-spacing: 0.05em; }",
".code-copy-btn { background: transparent; border: 1px solid rgba(255,255,255,0.15); border-radius: 5px; color: rgba(255,255,255,0.6); font-size: 11.5px; padding: 4px 8px; cursor: pointer; transition: all 0.2s ease; }",
".code-copy-btn:hover { background: rgba(255,255,255,0.05); color: #ffffff; }",
".premium-code-box pre { margin: 0; padding: 16px; overflow-x: auto; }",
".premium-code-box code { font-family: 'Consolas', 'Courier New', monospace; font-size: 13.5px; color: #e2e8f0; line-height: 1.5; }",

"/* ── premium auto-TOC widget ── */",
".premium-toc-card { background: rgba(59,130,246,0.03); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; padding: 20px 24px; margin: 28px 0; }",
".toc-header-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; color: #ffffff; margin-bottom: 14px; letter-spacing: -0.01em; }",
".toc-links-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }",
".toc-links-list li { margin: 0; padding: 0; }",
".toc-link-a { display: block; font-family: 'Inter', sans-serif; font-size: 13.5px; color: rgba(255,255,255,0.6); text-decoration: none; transition: color 0.15s ease; }",
".toc-link-a:hover { color: var(--xblueb); }",
".toc-link-h3 { padding-left: 18px; position: relative; }",
".toc-link-h3::before { content: '↳'; position: absolute; left: 4px; color: rgba(255,255,255,0.2); }",

"/* ── Ders sekmeleri (Ders İçeriği / Etkinlikler) — sadece hem içerik hem",
"   etkinlik bloğu olan derslerde görünür; tek akışlı eski dersler etkilenmez ── */",
".lesson-tabs { display: flex; gap: 10px; margin: 28px 0 6px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; }",
".lesson-tab-btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 4px 14px; margin-bottom: -1px; background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: rgba(226,232,240,0.5); border-bottom: 2px solid transparent; transition: color 0.15s ease, border-color 0.15s ease; }",
".lesson-tab-btn:hover { color: #ffffff; }",
".lesson-tab-btn.active { color: var(--xblueb); border-bottom-color: var(--xblueb); }",
".lesson-tab-panel { display: none; }",
".lesson-tab-panel.active { display: block; }",
"@media (max-width: 480px) { .lesson-tabs { gap: 4px; } .lesson-tab-btn { font-size: 13px; padding: 9px 2px 12px; flex: 1; justify-content: center; } }",
"@media print { .lesson-tabs { display: none !important; } .lesson-tab-panel { display: block !important; } }",

"@media (max-width: 480px) { .callout-box { flex-direction: column; } .lb-table th, .lb-table td { padding: 8px 10px; font-size: 13px; } }",

"/* ── PDF indirme butonu (yazdır tabanlı) ── */",
".pdf-download-btn { position: fixed; right: 22px; bottom: 22px; z-index: 9998; display: flex; align-items: center; gap: 9px; padding: 13px 20px; border: none; border-radius: 50px; background: linear-gradient(135deg, var(--xblue), var(--xblueb)); color: #071022; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; cursor: pointer; box-shadow: 0 10px 30px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset; transition: all 0.2s ease; }",
".pdf-download-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 38px rgba(59,130,246,0.5), 0 0 0 1px rgba(255,255,255,0.12) inset; }",
".pdf-download-btn svg { flex-shrink: 0; }",
"@media (max-width: 640px) { .pdf-download-btn { right: 14px; bottom: 14px; padding: 14px 17px; min-width: 48px; min-height: 48px; font-size: 0; } .pdf-download-btn svg { width: 20px; height: 20px; } }",

"/* ── PDF / Yazdırma çıktısı (window.print tabanlı, harici kütüphane yok) ── */",
"@media print {",
"  .pdf-download-btn, .premium-progress-bar, .lesson-nav-row, .bg-canvas, .lb-lightbox-overlay,",
"  .quiz-action-btn, .fib-action-btn, .matching-action-btn, .matching-retry-btn,",
"  .sentorder-action-btn, .wordorder-actions, .code-copy-btn, .rt-toolbar,",
"  .konj-action-btn, .listen-audio-player,",
"  .premium-audio-btn, .tts-cluster, nav, [data-navbar], .lb-image-trigger { display: none !important; }",
"  html, body { background: #ffffff !important; color: #111827 !important; }",
"  .lesson-wrap { max-width: 100% !important; }",
"  * { box-shadow: none !important; text-shadow: none !important; backdrop-filter: none !important; }",
"  .lesson-heading, .lb-byline, .lesson-meta-row { color: #111827 !important; }",
"  .premium-quiz-card, .premium-fillblank-card, .premium-matching-card, .premium-sentorder-card,",
"  .premium-wordorder-card, .premium-dialogue-card, .premium-audio-card, .premium-accordion-wrap,",
"  .accordion-item-box, .premium-video-card, .premium-code-box, .vocab-card, .callout-box,",
"  .listen-prev, .konj-prev, .lb-paragraph-quote, .lb-paragraph-highlight,",
"  .premium-toc-card, .lb-table { background: #f8fafc !important; border: 1px solid #cbd5e1 !important; page-break-inside: avoid; }",
"  .quiz-question-title, .fib-instruction, .matching-instruction, .sentorder-instruction, .wordorder-instruction,",
"  .dialogue-instruction, .quiz-opt-text, .matching-card-text, .fib-input, .sentorder-text, .wordorder-chip,",
"  .wordorder-placed-chip, .dialogue-bubble-text, .vocab-de, .vocab-tr, .vocab-example, .callout-title,",
"  .listen-question h4, .listen-option span, .listen-caption, .konj-header, .konj-person, .konj-input, .konj-result,",
"  .callout-text, .lb-table th, .lb-table td, .toc-link-a, .accordion-trigger, .code-lang-tag { color: #111827 !important; }",
"  .accordion-panel-content { max-height: none !important; }",
"  .accordion-panel-content p { color: #1f2937 !important; }",
"  .dialogue-step.dialogue-locked { display: block !important; }",
"  .matching-drop-zone, .matching-card { border-color: #94a3b8 !important; }",
"  .premium-code-box code { color: #1f2937 !important; }",
"  img, .premium-image-el { max-width: 100% !important; box-shadow: none !important; }",
"  .premium-video-card { display: none !important; }",
"  a[href]::after { content: '' !important; }",
"  @page { margin: 16mm 14mm; }",
"}",
"</style>",
'<script type="application/json" id="ders-builder-data">' +
  JSON.stringify({ seq, blocks, meta, tabs: (typeof projectTabs !== "undefined" ? projectTabs : undefined) }).replace(/<\//g, "<\\/") +
'</' + 'script>',
"</head>",
((meta.theme && meta.theme !== "none") ? '<body class="theme-' + esc(meta.theme) + '">' : "<body>"),
'<div class="premium-progress-bar" id="readingProgressBar"></div>',
'<button type="button" class="pdf-download-btn" onclick="downloadAsPDF()" title="Bu dersi PDF olarak indir">' +
'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
'<span>PDF Olarak İndir</span></button>',
'<div class="bg-canvas"><div class="bg-grid"></div><div class="bg-glow bg-glow--1"></div><div class="bg-glow bg-glow--2"></div></div>',

'<div class="lesson-nav-row">',
'<a href="/dersler/" class="lesson-back"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg> Tüm dersler</a>',
"</div>",

'<main class="lesson-wrap">',
(meta.cover ? '<img src="' + esc(meta.cover) + '" alt="' + canonicalTitle + '" class="lesson-hero-img" fetchpriority="high" decoding="async" loading="eager">' : ""),
'<div class="lesson-meta-row">',
'<span class="lesson-cat-badge" data-cat="' + meta.level + '">' + meta.level + "</span>",
'<span class="lesson-card-dot"></span>',
'<span class="lesson-diff-badge">' + esc(meta.difficulty) + "</span>",
'<span class="lesson-card-dot"></span>',
"<span>" + esc(meta.readTime) + " dk okuma</span>",
"</div>",
'<h1 class="lesson-heading">' + canonicalTitle + "</h1>",
(meta.author ? '<div class="lb-byline">Yazar: <b>' + esc(meta.author) + "</b></div>" : ""),
lessonBodyHtml,
"</main>",

'<div class="lb-lightbox-overlay" id="lbLightboxOverlay" role="dialog" aria-modal="true" aria-label="Görsel büyütme">',
'<button type="button" class="lb-lightbox-close" onclick="closeLightbox()" aria-label="Kapat (ESC)">×</button>',
'<img class="lb-lightbox-img" id="lbLightboxImg" src="" alt="" draggable="false">',
'<div class="lb-lightbox-hint">Yakınlaştırmak için fare tekerleği veya iki parmakla sıkıştırın · Kapatmak için ESC</div>',
"</div>",

"<!-- Navbar + Radyal FAB (gerçek site altyapısı) -->",
'<scr' + 'ipt type="module">',
'  import "../../js/core.js";',
'  if(window.loadNavbar) window.loadNavbar();',
"</scr" + "ipt>",

"<!-- PREMIUM INTERACTION ENGINE -->",
"<scr" + "ipt>", // <-- Güvenli Script Açılışı
"/* 0. PDF İndirme (window.print tabanlı, kütüphanesiz) */",
"function downloadAsPDF() {",
"  document.title = document.title; // dosya adı için mevcut başlığı korur",
"  window.print();",
"}",
"window.addEventListener('beforeprint', () => {",
"  closeLightbox();",
"  document.querySelectorAll('.accordion-item-box').forEach(box => {",
"    box.classList.add('active');",
"    const panel = box.querySelector('.accordion-panel-content');",
"    if (panel) panel.style.maxHeight = 'none';",
"  });",
"  document.querySelectorAll('.dialogue-step').forEach(step => step.classList.remove('dialogue-locked'));",
"});",

"/* 1. Progress Bar Logic */",
"window.addEventListener('scroll', () => {",
"  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;",
"  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;",
"  const scrolled = (winScroll / height) * 100;",
"  document.getElementById('readingProgressBar').style.width = scrolled + '%';",
"});",

"/* 2. Audio Playback (Speech Synthesis) Engine — hızlı/yavaş sesli okuma */",
"var __ttsActiveBtn = null;",
"function playSpeechText(btn, text, lang, rate) {",
"  if (!('speechSynthesis' in window)) { alert('Tarayıcınız sesli okumayı desteklemiyor.'); return; }",
"  window.speechSynthesis.cancel();",
"  if (__ttsActiveBtn) __ttsActiveBtn.classList.remove('tts-playing');",
"  const utterance = new SpeechSynthesisUtterance(text);",
"  utterance.lang = lang || 'de-DE';",
"  utterance.rate = rate || 0.95;",
"  btn.classList.add('tts-playing');",
"  __ttsActiveBtn = btn;",
"  const resetBtn = () => { btn.classList.remove('tts-playing'); if (__ttsActiveBtn === btn) __ttsActiveBtn = null; };",
"  utterance.onend = resetBtn;",
"  utterance.onerror = resetBtn;",
"  window.speechSynthesis.speak(utterance);",
"}",

"/* 2b. Ders Sekmesi Geçişi (Ders İçeriği / Etkinlikler) */",
"document.querySelectorAll('.lesson-tab-btn').forEach(function (btn) {",
"  btn.addEventListener('click', function () {",
"    var tab = btn.dataset.tab;",
"    document.querySelectorAll('.lesson-tab-btn').forEach(function (b) {",
"      var isActive = b === btn;",
"      b.classList.toggle('active', isActive);",
"      b.setAttribute('aria-selected', isActive ? 'true' : 'false');",
"    });",
"    document.querySelectorAll('.lesson-tab-panel').forEach(function (p) {",
"      p.classList.toggle('active', p.dataset.tabpanel === tab);",
"    });",
"  });",
"});",
"/* TOC bağlantısı gizli bir sekmedeki başlığa gidiyorsa, önce o sekmeye geçer */",
"function activateTabForElement(el) {",
"  var panel = el.closest('.lesson-tab-panel');",
"  if (!panel) return;",
"  var tab = panel.dataset.tabpanel;",
"  var btn = document.querySelector('.lesson-tab-btn[data-tab=\"' + tab + '\"]');",
"  if (btn && !btn.classList.contains('active')) btn.click();",
"}",
"document.querySelectorAll('.toc-link-a').forEach(function (a) {",
"  a.addEventListener('click', function () {",
"    var id = a.getAttribute('href').slice(1);",
"    var target = document.getElementById(id);",
"    if (target) activateTabForElement(target);",
"  });",
"});",

"/* 3. Dynamic Accordion Toggler */",
"function toggleAccordion(btn) {",
"  const item = btn.parentElement;",
"  const panel = item.querySelector('.accordion-panel-content');",
"  const isOpening = !item.classList.contains('active');",
"  ",
"  document.querySelectorAll('.accordion-item-box').forEach(box => {",
"    box.classList.remove('active');",
"    box.querySelector('.accordion-panel-content').style.maxHeight = null;",
"  });",
"  ",
"  if (isOpening) {",
"    item.classList.add('active');",
"    panel.style.maxHeight = panel.scrollHeight + 'px';",
"  } else {",
"    item.classList.remove('active');",
"    panel.style.maxHeight = null;",
"  }",
"}",

"/* 4. Code Block Clipboard Copier */",
"function copyCodePayload(btn) {",
"  const box = btn.closest('.premium-code-box');",
"  const codeText = box.querySelector('code').innerText;",
"  navigator.clipboard.writeText(codeText).then(() => {",
"    const oldText = btn.innerText;",
"    btn.innerText = 'Kopyalandı!';",
"    btn.style.color = '#4fd69c';",
"    setTimeout(() => { btn.innerText = oldText; btn.style.color = ''; }, 2000);",
"  });",
"}",

"/* 5. Premium Quiz Engine */",
"document.addEventListener('DOMContentLoaded', () => {",
"  document.querySelectorAll('.premium-quiz-card').forEach(card => {",
"    card.querySelectorAll('.quiz-option-item').forEach(opt => {",
"      opt.addEventListener('click', () => {",
"        if (card.dataset.evaluated === 'true') return;",
"        card.querySelectorAll('.quiz-option-item').forEach(o => o.classList.remove('selected'));",
"        opt.classList.add('selected');",
"      });",
"    });",
"  });",
"});",
"function checkQuizAnswer(qId) {",
"  const card = document.getElementById(qId);",
"  if (!card || card.dataset.evaluated === 'true') return;",
"  const selectedOpt = card.querySelector('.quiz-option-item.selected');",
"  if (!selectedOpt) { alert('Lütfen bir seçenek işaretleyin.'); return; }",
"  ",
"  const correctIndex = parseInt(card.dataset.correct);",
"  const selectedIndex = parseInt(selectedOpt.dataset.index);",
"  card.dataset.evaluated = 'true';",
"  ",
"  if (selectedIndex === correctIndex) {",
"    selectedOpt.classList.add('correct-reveal');",
"  } else {",
"    selectedOpt.classList.add('wrong-reveal');",
"    card.querySelector('[data-index=\"' + correctIndex + '\"]').classList.add('correct-reveal');",
"  }",
"  ",
"  const explain = card.querySelector('.quiz-explain-panel');",
"  if (explain) {",
"    explain.style.maxHeight = explain.scrollHeight + 32 + 'px';",
"  }",
"  card.querySelector('.quiz-action-btn').style.display = 'none';",
"}",

"/* 5b. Dinleme Anlama (Hörverstehen) Engine */",
"function checkListenAnswer(input, correctIndex) {",
"  const qBlock = input.closest('.listen-question');",
"  if (!qBlock || qBlock.dataset.answered === 'true') return;",
"  qBlock.dataset.answered = 'true';",
"  const chosenIndex = parseInt(input.value, 10);",
"  const options = qBlock.querySelectorAll('.listen-option');",
"  options.forEach((opt, idx) => {",
"    const radio = opt.querySelector('input[type=radio]');",
"    if (radio) radio.disabled = true;",
"    if (idx === correctIndex) opt.classList.add('listen-correct');",
"    else if (idx === chosenIndex) opt.classList.add('listen-wrong');",
"  });",
"  const feedback = qBlock.querySelector('.listen-feedback');",
"  if (feedback) {",
"    if (chosenIndex === correctIndex) {",
"      feedback.textContent = 'Doğru! ✓';",
"      feedback.classList.add('is-correct');",
"    } else {",
"      feedback.textContent = 'Yanlış ✗';",
"      feedback.classList.add('is-wrong');",
"    }",
"  }",
"}",

"/* 5c. Fiil Çekim Alıştırması (Konjugation) Engine */",
"function checkKonjugation(kjId) {",
"  const card = document.getElementById(kjId);",
"  if (!card || card.dataset.evaluated === 'true') return;",
"  const inputs = card.querySelectorAll('.konj-input');",
"  let correctCount = 0;",
"  inputs.forEach(inp => {",
"    const correctAnswer = (inp.dataset.answer || '').trim().toLowerCase();",
"    const userAnswer = inp.value.trim().toLowerCase();",
"    const answerLabel = inp.closest('.konj-row').querySelector('.konj-correct-answer');",
"    inp.classList.remove('konj-correct', 'konj-wrong');",
"    if (correctAnswer !== '' && userAnswer === correctAnswer) {",
"      inp.classList.add('konj-correct');",
"      correctCount++;",
"      if (answerLabel) answerLabel.textContent = '';",
"    } else {",
"      inp.classList.add('konj-wrong');",
"      if (answerLabel) answerLabel.textContent = 'Doğrusu: ' + inp.dataset.answer;",
"    }",
"    inp.disabled = true;",
"  });",
"  card.dataset.evaluated = 'true';",
"  const resultEl = card.querySelector('.konj-result');",
"  if (resultEl) {",
"    resultEl.textContent = correctCount + ' / ' + inputs.length + ' doğru';",
"    resultEl.style.color = correctCount === inputs.length ? '#4fd69c' : (correctCount === 0 ? '#f07068' : '#ffd250');",
"  }",
"  const actionBtn = card.querySelector('.konj-action-btn');",
"  if (actionBtn) actionBtn.style.display = 'none';",
"}",

"/* 6. Boşluk Doldurma (Fill-in-the-blank) Engine */",
"function checkFillBlank(fbId) {",
"  const card = document.getElementById(fbId);",
"  if (!card) return;",
"  const inputs = card.querySelectorAll('.fib-input');",
"  let correct = 0;",
"  inputs.forEach(inp => {",
"    const answer = (inp.dataset.answer || '').trim().toLowerCase();",
"    const val = inp.value.trim().toLowerCase();",
"    inp.classList.remove('fib-correct', 'fib-wrong');",
"    if (val === answer) { inp.classList.add('fib-correct'); correct++; }",
"    else { inp.classList.add('fib-wrong'); }",
"    inp.disabled = true;",
"  });",
"  const msg = card.querySelector('.fib-result-msg');",
"  if (msg) {",
"    msg.textContent = correct + ' / ' + inputs.length + ' doğru';",
"    msg.style.color = correct === inputs.length ? '#4fd69c' : '#f07068';",
"  }",
"  card.querySelector('.fib-action-btn').style.display = 'none';",
"}",

"/* 7. Eşleştirme (Matching) Engine — gerçek sürükle-bırak + klavye desteği */",
"document.addEventListener('DOMContentLoaded', () => { initMatchingBlocks(); });",
"function initMatchingBlocks() {",
"  document.querySelectorAll('.premium-matching-card').forEach(card => {",
"    card.dataset.evaluated = 'false';",
"    card.querySelectorAll('.matching-card').forEach(wireMatchingCard);",
"    card.querySelectorAll('.matching-drop-zone').forEach(wireMatchingZone);",
"  });",
"}",
"function wireMatchingCard(c) {",
"  c.addEventListener('dragstart', (e) => {",
"    if (c.closest('.premium-matching-card').dataset.evaluated === 'true') { e.preventDefault(); return; }",
"    e.dataTransfer.setData('text/plain', c.dataset.pairIdx);",
"    e.dataTransfer.effectAllowed = 'move';",
"    c.classList.add('dragging-card');",
"  });",
"  c.addEventListener('dragend', () => c.classList.remove('dragging-card'));",
"  c.addEventListener('click', () => {",
"    const parent = c.closest('.premium-matching-card');",
"    if (parent.dataset.evaluated === 'true') return;",
"    if (c.classList.contains('placed-card')) { unplaceMatchingCard(c); return; }",
"    parent.querySelectorAll('.matching-card.kbd-selected').forEach(x => x.classList.remove('kbd-selected'));",
"    c.classList.toggle('kbd-selected');",
"  });",
"  c.addEventListener('keydown', (e) => {",
"    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }",
"  });",
"}",
"function wireMatchingZone(z) {",
"  z.addEventListener('dragenter', (e) => { e.preventDefault(); z.classList.add('drop-hover'); });",
"  z.addEventListener('dragover', (e) => { e.preventDefault(); });",
"  z.addEventListener('dragleave', () => z.classList.remove('drop-hover'));",
"  z.addEventListener('drop', (e) => {",
"    e.preventDefault();",
"    z.classList.remove('drop-hover');",
"    const parent = z.closest('.premium-matching-card');",
"    if (parent.dataset.evaluated === 'true') return;",
"    const idx = e.dataTransfer.getData('text/plain');",
"    const cardEl = parent.querySelector('.matching-card[data-pair-idx=\"' + idx + '\"]');",
"    if (cardEl) placeMatchingCard(cardEl, z);",
"  });",
"  z.addEventListener('click', () => {",
"    const parent = z.closest('.premium-matching-card');",
"    if (parent.dataset.evaluated === 'true') return;",
"    const selected = parent.querySelector('.matching-card.kbd-selected');",
"    if (selected) { placeMatchingCard(selected, z); selected.classList.remove('kbd-selected'); }",
"  });",
"  z.addEventListener('keydown', (e) => {",
"    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); z.click(); }",
"  });",
"}",
"function placeMatchingCard(cardEl, zone) {",
"  const slot = zone.querySelector('[data-slot]');",
"  const pool = zone.closest('.premium-matching-card').querySelector('.matching-col-right');",
"  const existing = slot.querySelector('.matching-card');",
"  if (existing) { existing.classList.remove('placed-card'); existing.draggable = true; pool.appendChild(existing); }",
"  cardEl.classList.add('placed-card');",
"  cardEl.classList.remove('kbd-selected');",
"  cardEl.draggable = false;",
"  slot.appendChild(cardEl);",
"  zone.dataset.placed = cardEl.dataset.pairIdx;",
"}",
"function unplaceMatchingCard(cardEl) {",
"  const zone = cardEl.closest('.matching-drop-zone');",
"  if (zone) zone.dataset.placed = '';",
"  cardEl.classList.remove('placed-card');",
"  cardEl.draggable = true;",
"  const pool = cardEl.closest('.premium-matching-card').querySelector('.matching-col-right');",
"  pool.appendChild(cardEl);",
"}",
"function checkMatching(mId) {",
"  const card = document.getElementById(mId);",
"  if (!card) return;",
"  const zones = card.querySelectorAll('.matching-drop-zone');",
"  let correctCount = 0;",
"  let anyWrong = false;",
"  zones.forEach(zone => {",
"    zone.classList.remove('matching-correct', 'matching-wrong');",
"    const target = zone.dataset.targetIdx;",
"    const placed = zone.dataset.placed;",
"    if (placed !== undefined && placed !== '' && placed === target) {",
"      zone.classList.add('matching-correct'); correctCount++;",
"    } else {",
"      zone.classList.add('matching-wrong'); anyWrong = true;",
"    }",
"  });",
"  card.dataset.evaluated = 'true';",
"  card.querySelectorAll('.matching-card').forEach(c => { c.draggable = false; });",
"  const msg = card.querySelector('.matching-result-msg');",
"  if (msg) {",
"    msg.textContent = correctCount + ' / ' + zones.length + ' doğru eşleşme';",
"    msg.style.color = correctCount === zones.length ? '#4fd69c' : '#f07068';",
"  }",
"  card.querySelector('.matching-action-btn').style.display = 'none';",
"  const retryBtn = card.querySelector('.matching-retry-btn');",
"  if (anyWrong && retryBtn) retryBtn.style.display = '';",
"}",
"function retryMatching(mId) {",
"  const card = document.getElementById(mId);",
"  if (!card) return;",
"  const wrongZones = card.querySelectorAll('.matching-drop-zone.matching-wrong');",
"  wrongZones.forEach(zone => {",
"    const slot = zone.querySelector('[data-slot]');",
"    const placedCard = slot.querySelector('.matching-card');",
"    zone.classList.remove('matching-wrong');",
"    zone.dataset.placed = '';",
"    if (placedCard) {",
"      placedCard.classList.remove('placed-card');",
"      placedCard.draggable = true;",
"      card.querySelector('.matching-col-right').appendChild(placedCard);",
"    }",
"  });",
"  card.dataset.evaluated = 'false';",
"  card.querySelectorAll('.matching-col-right .matching-card').forEach(c => { c.draggable = true; });",
"  card.querySelector('.matching-retry-btn').style.display = 'none';",
"  card.querySelector('.matching-action-btn').style.display = '';",
"  const msg = card.querySelector('.matching-result-msg');",
"  if (msg) msg.textContent = '';",
"}",

"/* 7b. Lightbox (görsel büyütme) Engine — zoom (wheel + pinch) + ESC */",
"let lbScale = 1;",
"function openLightbox(imgId) {",
"  const srcImg = document.getElementById(imgId);",
"  const overlay = document.getElementById('lbLightboxOverlay');",
"  const lbImg = document.getElementById('lbLightboxImg');",
"  if (!srcImg || !overlay || !lbImg) return;",
"  lbImg.src = srcImg.src;",
"  lbImg.alt = srcImg.alt || '';",
"  lbScale = 1;",
"  lbImg.style.transform = 'scale(1)';",
"  overlay.classList.add('open');",
"  document.body.style.overflow = 'hidden';",
"}",
"function closeLightbox() {",
"  const overlay = document.getElementById('lbLightboxOverlay');",
"  if (!overlay) return;",
"  overlay.classList.remove('open');",
"  document.body.style.overflow = '';",
"}",
"document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });",
"document.addEventListener('DOMContentLoaded', () => {",
"  const overlay = document.getElementById('lbLightboxOverlay');",
"  if (!overlay) return;",
"  const lbImg = document.getElementById('lbLightboxImg');",
"  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });",
"  overlay.addEventListener('wheel', (e) => {",
"    e.preventDefault();",
"    lbScale += (e.deltaY < 0 ? 0.15 : -0.15);",
"    lbScale = Math.min(Math.max(lbScale, 1), 4);",
"    lbImg.style.transform = 'scale(' + lbScale + ')';",
"  }, { passive: false });",
"  let lastPinchDist = null;",
"  overlay.addEventListener('touchmove', (e) => {",
"    if (e.touches.length === 2) {",
"      e.preventDefault();",
"      const dx = e.touches[0].clientX - e.touches[1].clientX;",
"      const dy = e.touches[0].clientY - e.touches[1].clientY;",
"      const dist = Math.hypot(dx, dy);",
"      if (lastPinchDist) {",
"        lbScale += (dist - lastPinchDist) * 0.01;",
"        lbScale = Math.min(Math.max(lbScale, 1), 4);",
"        lbImg.style.transform = 'scale(' + lbScale + ')';",
"      }",
"      lastPinchDist = dist;",
"    }",
"  }, { passive: false });",
"  overlay.addEventListener('touchend', () => { lastPinchDist = null; });",
"});",

"/* 8. Cümle Sıralama (Sentence Ordering) Engine */",
"function moveSentOrderItem(btn, dir) {",
"  const item = btn.closest('.sentorder-item');",
"  const list = item.parentElement;",
"  if (dir === -1 && item.previousElementSibling) {",
"    list.insertBefore(item, item.previousElementSibling);",
"  } else if (dir === 1 && item.nextElementSibling) {",
"    list.insertBefore(item.nextElementSibling, item);",
"  }",
"}",
"function checkSentOrder(soId) {",
"  const card = document.getElementById(soId);",
"  if (!card) return;",
"  const items = Array.from(card.querySelectorAll('.sentorder-item'));",
"  let correctCount = 0;",
"  items.forEach((item, i) => {",
"    item.classList.remove('sentorder-correct', 'sentorder-wrong');",
"    if (parseInt(item.dataset.orig) === i) { item.classList.add('sentorder-correct'); correctCount++; }",
"    else { item.classList.add('sentorder-wrong'); }",
"    item.querySelectorAll('button').forEach(b => b.disabled = true);",
"  });",
"  const msg = card.querySelector('.sentorder-result-msg');",
"  if (msg) {",
"    msg.textContent = correctCount + ' / ' + items.length + ' doğru sırada';",
"    msg.style.color = correctCount === items.length ? '#4fd69c' : '#f07068';",
"  }",
"  card.querySelector('.sentorder-action-btn').style.display = 'none';",
"}",

"/* 8b. Kelime Sıralama (Duolingo-style Word Order) Engine */",
"function selectWordOrderChip(chip) {",
"  if (chip.disabled) return;",
"  const card = chip.closest('.premium-wordorder-card');",
"  const line = card.querySelector('.wordorder-answer-line');",
"  chip.disabled = true;",
"  const placed = document.createElement('button');",
"  placed.type = 'button';",
"  placed.className = 'wordorder-placed-chip';",
"  placed.textContent = chip.dataset.word;",
"  placed.dataset.orig = chip.dataset.orig;",
"  placed.dataset.chipid = chip.id;",
"  placed.setAttribute('onclick', 'unplaceWordOrderChip(this)');",
"  line.appendChild(placed);",
"}",
"function unplaceWordOrderChip(el) {",
"  const card = el.closest('.premium-wordorder-card');",
"  if (el.classList.contains('wordorder-correct')) return;",
"  const original = card.querySelector('#' + el.dataset.chipid);",
"  if (original) { original.disabled = false; }",
"  el.remove();",
"  const msg = card.querySelector('.wordorder-result-msg');",
"  if (msg) msg.textContent = '';",
"}",
"function checkWordOrder(woId) {",
"  const card = document.getElementById(woId);",
"  if (!card) return;",
"  const line = card.querySelector('.wordorder-answer-line');",
"  const placed = Array.from(line.querySelectorAll('.wordorder-placed-chip'));",
"  const total = parseInt(card.dataset.total, 10);",
"  const msg = card.querySelector('.wordorder-result-msg');",
"  if (placed.length < total) {",
"    if (msg) { msg.textContent = 'Önce tüm kelimeleri sıraya yerleştirin.'; msg.style.color = '#ffd250'; }",
"    return;",
"  }",
"  let correct = true;",
"  placed.forEach((chip, i) => { if (parseInt(chip.dataset.orig, 10) !== i) correct = false; });",
"  placed.forEach(chip => {",
"    chip.classList.remove('wordorder-correct', 'wordorder-wrong');",
"    chip.classList.add(correct ? 'wordorder-correct' : 'wordorder-wrong');",
"  });",
"  if (msg) {",
"    msg.textContent = correct ? 'Doğru! 🎉' : 'Yanlış sıra, kelimeleri çıkarıp tekrar deneyebilirsiniz.';",
"    msg.style.color = correct ? '#4fd69c' : '#f07068';",
"  }",
"  const actionBtn = card.querySelector('.wordorder-action-btn');",
"  if (correct && actionBtn) actionBtn.style.display = 'none';",
"}",
"function resetWordOrder(woId) {",
"  const card = document.getElementById(woId);",
"  if (!card) return;",
"  const line = card.querySelector('.wordorder-answer-line');",
"  Array.from(line.querySelectorAll('.wordorder-placed-chip')).forEach(chip => {",
"    const original = card.querySelector('#' + chip.dataset.chipid);",
"    if (original) { original.disabled = false; }",
"  });",
"  line.innerHTML = '';",
"  const msg = card.querySelector('.wordorder-result-msg');",
"  if (msg) msg.textContent = '';",
"  const actionBtn = card.querySelector('.wordorder-action-btn');",
"  if (actionBtn) actionBtn.style.display = '';",
"}",

"/* 8c. Diyalog / Sohbet Balonu (Chat Dialogue) Engine */",
"function unlockDialogueCard(card) {",
"  const steps = Array.from(card.querySelectorAll('.dialogue-step'));",
"  let locking = false;",
"  steps.forEach(step => {",
"    if (locking) { step.classList.add('dialogue-locked'); return; }",
"    step.classList.remove('dialogue-locked');",
"    if (step.classList.contains('dialogue-choice-step') && !step.classList.contains('dialogue-resolved')) {",
"      locking = true;",
"    }",
"  });",
"}",
"function checkDialogueChoice(btn) {",
"  const step = btn.closest('.dialogue-choice-step');",
"  const card = btn.closest('.premium-dialogue-card');",
"  if (!step || !card || step.classList.contains('dialogue-resolved')) return;",
"  if (btn.dataset.correct === 'true') {",
"    step.classList.add('dialogue-resolved');",
"    const wrap = step.querySelector('.dialogue-options-wrap');",
"    if (wrap && step.dataset.bubbleHtml) { wrap.outerHTML = step.dataset.bubbleHtml; }",
"    unlockDialogueCard(card);",
"  } else {",
"    btn.classList.add('dialogue-opt-wrong');",
"    setTimeout(() => btn.classList.remove('dialogue-opt-wrong'), 450);",
"  }",
"}",
"document.addEventListener('DOMContentLoaded', () => {",
"  document.querySelectorAll('.premium-dialogue-card').forEach(unlockDialogueCard);",
"});",

"/* 9. Dynamic Auto-TOC (Table of Contents) Generator */",
"document.addEventListener('DOMContentLoaded', () => {",
"  const tocList = document.getElementById('auto-toc-list');",
"  if (!tocList) return;",
"  const headings = Array.from(document.querySelectorAll('article.lesson-body h2, article.lesson-body h3'));",
"  ",
"  if (headings.length === 0) {",
"    const container = document.getElementById('auto-toc-container');",
"    if (container) container.style.display = 'none';",
"    return;",
"  }",
"  ",
"  tocList.innerHTML = '';",
"  headings.forEach(h => {",
"    const li = document.createElement('li');",
"    const a = document.createElement('a');",
"    a.href = '#' + h.id;",
"    a.innerText = h.innerText;",
"    a.className = 'toc-link-a';",
"    if (h.tagName.toLowerCase() === 'h3') {",
"      a.classList.add('toc-link-h3');",
"    }",
"    li.appendChild(a);",
"    tocList.appendChild(li);",
"  });",
"});",
"</" + "script>", // <-- Güvenli Script Kapanışı

"</body>",
"</html>"
    ].join("\n");
  }