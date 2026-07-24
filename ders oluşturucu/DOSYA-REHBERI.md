# Ders Builder — Dosya Rehberi (Kod Bilmeyenler İçin)

Bu projede artık `js/` klasöründe **5 dosya** var (önceki 4 dosyaya, Gemini AI asistanı için 5. bir dosya eklendi). Aşağıda her dosyanın **ne iş yaptığı** ve bir sorun yaşadığında **hangi dosyaya bakman gerektiği** anlatılıyor.

Bir binaya benzetirsek: `index.html` binanın iskeleti (odalar, kapılar), `styles.css` boyası/dekorasyonu, `js/` klasöründeki 4 dosya ise binanın elektrik-su-ısıtma gibi farklı tesisatları. Bir musluk akıtıyorsa elektrik tesisatına bakmazsın — aynı mantık burada da geçerli.

## Ana Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Sayfanın iskeleti: butonlar, menüler, üstteki bar, sol taraftaki "Blok Ekle" listesi, açılan pencerelerin (export/önizleme) boş kalıpları buradadır. Yazı/görsel **içeriği** değil, **düzeni** burada. |
| `styles.css` | Her şeyin **görünümü**: renkler, yazı tipleri, boşluklar, yuvarlak köşeler, hover efektleri. Bir şeyin rengi/boyutu/hizası yanlışsa buraya bakılır. |

## `js/` Klasöründeki 4 Dosya

| # | Dosya adı | İçinde ne var (eski dosya adlarıyla) | Ne işe yarar (basit anlatım) |
|---|---|---|---|
| 1 | `01-core-canvas-settings.js` | eski: `constants.js` + `audio-text-utils.js` + `canvas-core.js` + `settings-panel.js` | Programın "sözlüğü" (her blok türünün varsayılan hâli, ikonlar) + Sesli Okuma Aracı sürükle-bırak + `[kelime\|açıklama]` / `{{cevap}}` yardımcıları + Canvas'ın kalbi (blok ekle/sil/taşı, Tümünü Temizle) + ⚙ ayar panelinin içindeki tüm kontroller. |
| 2 | `02-block-render-theme-export.js` | eski: `block-editor-render.js` + `theme-preview-export-ui.js` + `block-export-render.js` | Canvas'ta gördüğün her blok türünün (Başlık, Paragraf, Görsel, Quiz, Tablo... 19 tür) **düzenleme ekranındaki** görünümü + üstteki **tema seçici**, **"Önizle"** ve **"HTML Oluştur"** pencerelerinin form alanları + her blok türünün **indirilen sayfadaki** temiz/statik hâli. |
| 3 | `03-export-template-builder.js` | eski: `export-template-builder.js` (tek dosya, değişmedi) | **En büyük dosya.** İndirdiğin `index.html` dosyasının tamamı (CSS'i, arka plan temaları, quiz kontrol mantığı, PDF indirme, sesli okuma motoru dahil) burada bir şablon olarak duruyor. "HTML Oluştur" butonuna basınca gerçekte üretilen dosya budur. |
| 4 | `04-toolbar-projectio.js` | eski: `rich-text-toolbar.js` + `project-io-templates.js` | Metin seçince beliren biçimlendirme çubuğu (kalın, italik, altı çizili, renk, link) + **"Projeyi Kaydet/Yükle"** (.json), **"Oluşturulan HTML'den Yükle"**, hazır şablonlar ve kendi kaydettiğin şablonların listesi. |
| 5 | `05-gemini-assistant.js` | yeni dosya | Üstteki **"Gemini AI"** butonuyla açılan pencere: kendi Gemini API anahtarınızı girip, doğal dille ("tüm başlıkları lacivert yap", "3. bloğun arka planını açık mavi yap" gibi) sayfadaki **her bloğa** (yazı tipi, renk, arka plan, boyut, hizalama, boşluk, blok ekleme/silme/sıralama) ve genel **sayfa temasına** tam yetkiyle erişip değişiklik yaptırmanızı sağlar. Bu dosya, önceki 4 dosyanın tanımladığı fonksiyon/değişkenleri kullandığı için **her zaman en sonda** yüklenmelidir. |

---

## Sorun Giderme: "Şu problem varsa, şu dosyaya bak"

| Yaşadığın sorun / belirti | Bakman gereken dosya |
|---|---|
| Yeni eklenen bir bloğun varsayılan yazısı/rengi yanlış geliyor | `01-core-canvas-settings.js` |
| Bir simge (ikon) hatalı/eksik görünüyor | `01-core-canvas-settings.js` |
| Sesli okuma aracını sürükleyip bırakamıyorum, ya da rozet tıklanmıyor | `01-core-canvas-settings.js` |
| `[kelime|açıklama]` yazınca ipucu balonu çıkmıyor | `01-core-canvas-settings.js` |
| `{{cevap}}` yazınca boşluk doldurma oluşmuyor | `01-core-canvas-settings.js` |
| Blok ekle / sil / yukarı-aşağı taşı çalışmıyor | `01-core-canvas-settings.js` |
| "Tümünü Temizle" çalışmıyor, blok sayısı yanlış gösteriliyor | `01-core-canvas-settings.js` |
| Bloklar sürükleyerek sıralanamıyor | `01-core-canvas-settings.js` (blok sürükleme kısmı) |
| ⚙ simgesine basınca ayar paneli açılmıyor/kapanmıyor | `01-core-canvas-settings.js` |
| Ayar panelindeki bir kontrol (renk, kayar çubuk, hizalama) çalışmıyor | `01-core-canvas-settings.js` |
| Belirli bir blok türü (örn. Quiz, Tablo, Eşleştirme) **editörde** yanlış/bozuk görünüyor | `02-block-render-theme-export.js` |
| Tema seçici (Ocean, Sunset vb.) çalışmıyor, sayfa arka planı değişmiyor | `02-block-render-theme-export.js` |
| "Önizle" penceresi açılmıyor ya da içi boş/bozuk | `02-block-render-theme-export.js` |
| "HTML Oluştur" penceresindeki form alanları (Başlık, Slug vb.) çalışmıyor | `02-block-render-theme-export.js` |
| İndirilen HTML dosyasında bir blok türü **yanlış/eksik** görünüyor | `02-block-render-theme-export.js` |
| Bir blok türüne yeni bir alan/özellik eklemek istiyorum | `01-core-canvas-settings.js` (varsayılan değer) + `02-block-render-theme-export.js` (editör + export görünümü) |
| İndirilen HTML dosyasının geneli bozuk (CSS gelmiyor, sayfa çirkin, quiz'ler çalışmıyor, PDF indirme çalışmıyor) | `03-export-template-builder.js` |
| İndirilen sayfada arka plan temaları (Ocean, Galaxy, Neon vb.) yanlış görünüyor | `03-export-template-builder.js` |
| Metin seçince biçimlendirme çubuğu çıkmıyor, ya da kalın/italik/renk/link çalışmıyor | `04-toolbar-projectio.js` |
| Projeyi `.json` olarak kaydedemiyorum / yükleyemiyorum | `04-toolbar-projectio.js` |
| "Oluşturulan HTML'den Yükle" ile eski bir dersi geri açamıyorum | `04-toolbar-projectio.js` |
| Hazır şablonlar (Kelime Odaklı, Okuma-Anlama, Gramer) çalışmıyor | `04-toolbar-projectio.js` |
| Kendi kaydettiğim şablonlar listede görünmüyor/silinemiyor | `04-toolbar-projectio.js` |
| "Gemini AI" butonu/penceresi hiç görünmüyor | `index.html` (modal ve buton burada tanımlı) |
| Gemini AI istek gönderince "API anahtarı" hatası veriyor | Google AI Studio'dan (aistudio.google.com/apikey) aldığınız anahtarın doğru girildiğinden emin olun — anahtar sadece tarayıcınızda saklanır |
| Gemini AI bir değişiklik yapmıyor / hata veriyor / yanlış blok değiştiriyor | `05-gemini-assistant.js` |
| Genel yazı tipi, renk, boşluk, hizalama **görünüşü** bozuk | `styles.css` |
| Bir buton/menü/pencere **hiç yok** ya da yanlış yerde | `index.html` |
| Sayfa hiç açılmıyor, tamamen boş/bozuk geliyor | Önce `index.html`'deki 4 `<script>` satırının sırası bozulmuş mu diye bak — sıra karışmışsa hiçbir şey çalışmaz |

---

## Aklında kalması gereken tek kural

`index.html` dosyasının sonundaki şu 5 satırın **sırası** çok önemli — biri eksik olursa ya da yerleri değişirse program bozulur:

```
01-core-canvas-settings.js → 02-block-render-theme-export.js →
03-export-template-builder.js → 04-toolbar-projectio.js → 05-gemini-assistant.js
```

Bu 5 dosya hâlâ **module değil**, yani hepsi aynı global scope'u paylaşıyor — aralarına başka bir script eklemeyin, sırasını değiştirmeyin. (`05-gemini-assistant.js` kendi içinde bir fonksiyon kabuğuna sarılmıştır, bu yüzden kendi yerel değişkenleri diğer dosyalarla çakışmaz; ama diğer 4 dosyanın tanımladığı şeyleri kullanabilmesi için mutlaka **en sonda** kalmalıdır.)

Bir geliştiriciye (veya bana) "şurada sorun var" derken, önce yukarıdaki tablodan hangi dosyaya işaret ettiğini söylersen, sorunu çok daha hızlı buluruz.
