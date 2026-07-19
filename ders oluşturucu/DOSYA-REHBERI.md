# Ders Builder — Dosya Rehberi (Kod Bilmeyenler İçin)

Bu proje artık tek bir dev dosya değil, her biri işi belli, küçük parçalara bölünmüş durumda. Aşağıda her dosyanın **ne iş yaptığı** ve bir sorun yaşadığında **hangi dosyaya bakman gerektiği** anlatılıyor.

Bir binaya benzetirsek: `index.html` binanın iskeleti (odalar, kapılar), `styles.css` boyası/dekorasyonu, `js/` klasöründeki 10 dosya ise binanın elektrik-su-ısıtma gibi farklı tesisatları. Bir musluk akıtıyorsa elektrik tesisatına bakmazsın — aynı mantık burada da geçerli.

## Ana Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Sayfanın iskeleti: butonlar, menüler, üstteki bar, sol taraftaki "Blok Ekle" listesi, açılan pencerelerin (export/önizleme) boş kalıpları buradadır. Yazı/görsel **içeriği** değil, **düzeni** burada. |
| `styles.css` | Her şeyin **görünümü**: renkler, yazı tipleri, boşluklar, yuvarlak köşeler, hover efektleri. Bir şeyin rengi/boyutu/hizası yanlışsa buraya bakılır. |

## `js/` Klasöründeki 10 Dosya

| # | Dosya adı | Ne işe yarar (basit anlatım) |
|---|---|---|
| 1 | `constants.js` | Programın "sözlüğü". Her blok türünün (Başlık, Paragraf, Quiz, Tablo vs.) **varsayılan** hâli burada tanımlı — yeni bir blok eklediğinde ilk başta hangi yazı/renk/boyutla geldiği. Ayrıca tüm küçük ikonlar (simgeler) burada saklanır. |
| 2 | `audio-text-utils.js` | Sol taraftaki "Sesli Okuma Aracı"nı bir metin kutusuna **sürükleyip bırakma** özelliği burada çalışır. Ayrıca metin içindeki `[kelime|açıklama]` ipucu balonlarını ve `{{cevap}}` boşluk-doldurma yazımını çözen küçük yardımcılar da burada. |
| 3 | `canvas-core.js` | Ortadaki büyük çalışma alanının (canvas) **kalbi**: blok ekleme, blok yukarı/aşağı taşıma, blok silme, "Tümünü Temizle", ve blokların ekranda yeniden çizilmesi. |
| 4 | `settings-panel.js` | Bir bloğun üstündeki **⚙ (dişli) simgesine** basınca açılan ayar panelinin içindeki tüm kontroller (renk seçici, kayar boyut ayarları, hizalama düğmeleri vb.) burada üretilir. |
| 5 | `block-editor-render.js` | **En büyük dosya.** Canvas'ta gördüğün her blok türünün (Başlık, Paragraf, Görsel, Kelime Kartı, Quiz, Tablo, Eşleştirme, Diyalog... 19 tür) **düzenleme ekranındaki** görünümünü çizer. Yani sen çalışırken ekranda gördüğün her şeyin çoğu buradan gelir. |
| 6 | `theme-preview-export-ui.js` | Üstteki **tema seçici** (Ocean, Sunset, Aurora...), **"Önizle"** penceresi ve **"HTML Oluştur"** (export) penceresindeki form alanları (Başlık, Slug, Açıklama, Seviye vb.) burada yönetilir. |
| 7 | `block-export-render.js` | Sen "HTML Oluştur" dediğinde, her blok türünün **indirilen sayfadaki temiz/statik** hâlinin nasıl görüneceğini belirler (editördeki etkileşimli hâlinden farklı, öğrenciye gidecek son hâl). |
| 8 | `export-template-builder.js` | **En büyük dosya (ikinci).** İndirdiğin `index.html` dosyasının **tamamı** (CSS'i, arka plan temaları, quiz kontrol mantığı, PDF indirme, sesli okuma motoru dahil) burada bir şablon olarak duruyor. "HTML Oluştur" butonuna basınca gerçekte üretilen dosya budur. |
| 9 | `rich-text-toolbar.js` | Bir paragrafta **metin seçtiğinde** beliren küçük biçimlendirme çubuğu: kalın, italik, altı çizili, renk, bağlantı ekleme vb. |
| 10 | `project-io-templates.js` | **"Projeyi Kaydet/Yükle"** (.json dosyası), **"Oluşturulan HTML'den Yükle"** ve sol alttaki **hazır şablonlar** (Kelime Odaklı Ders, Okuma-Anlama, Gramer Yoğun) ile **kendi kaydettiğin şablonların** listesi burada yönetilir. |

---

## Sorun Giderme: "Şu problem varsa, şu dosyaya bak"

| Yaşadığın sorun / belirti | Bakman gereken dosya |
|---|---|
| Yeni eklenen bir bloğun varsayılan yazısı/rengi yanlış geliyor | `constants.js` |
| Bir simge (ikon) hatalı/eksik görünüyor | `constants.js` |
| Sesli okuma aracını sürükleyip bırakamıyorum, ya da rozet tıklanmıyor | `audio-text-utils.js` |
| `[kelime|açıklama]` yazınca ipucu balonu çıkmıyor | `audio-text-utils.js` |
| `{{cevap}}` yazınca boşluk doldurma oluşmuyor | `audio-text-utils.js` |
| Blok ekle / sil / yukarı-aşağı taşı çalışmıyor | `canvas-core.js` |
| "Tümünü Temizle" çalışmıyor, blok sayısı yanlış gösteriliyor | `canvas-core.js` |
| Bloklar sürükleyerek sıralanamıyor | `canvas-core.js` (blok sürükleme kısmı) |
| ⚙ simgesine basınca ayar paneli açılmıyor/kapanmıyor | `settings-panel.js` |
| Ayar panelindeki bir kontrol (renk, kayar çubuk, hizalama) çalışmıyor | `settings-panel.js` |
| Belirli bir blok türü (örn. Quiz, Tablo, Eşleştirme) **editörde** yanlış/bozuk görünüyor | `block-editor-render.js` |
| Bir blok türüne yeni bir alan/özellik eklemek istiyorum | `constants.js` (varsayılan değer) + `block-editor-render.js` (editör görünümü) + `block-export-render.js` (export görünümü) |
| Tema seçici (Ocean, Sunset vb.) çalışmıyor, sayfa arka planı değişmiyor | `theme-preview-export-ui.js` |
| "Önizle" penceresi açılmıyor ya da içi boş/bozuk | `theme-preview-export-ui.js` |
| "HTML Oluştur" penceresindeki form alanları (Başlık, Slug vb.) çalışmıyor | `theme-preview-export-ui.js` |
| İndirilen HTML dosyasında bir blok türü **yanlış/eksik** görünüyor | `block-export-render.js` |
| İndirilen HTML dosyasının geneli bozuk (CSS gelmiyor, sayfa çirkin, quiz'ler çalışmıyor, PDF indirme çalışmıyor) | `export-template-builder.js` |
| İndirilen sayfada arka plan temaları (Ocean, Galaxy, Neon vb.) yanlış görünüyor | `export-template-builder.js` |
| Metin seçince biçimlendirme çubuğu çıkmıyor, ya da kalın/italik/renk/link çalışmıyor | `rich-text-toolbar.js` |
| Projeyi `.json` olarak kaydedemiyorum / yükleyemiyorum | `project-io-templates.js` |
| "Oluşturulan HTML'den Yükle" ile eski bir dersi geri açamıyorum | `project-io-templates.js` |
| Hazır şablonlar (Kelime Odaklı, Okuma-Anlama, Gramer) çalışmıyor | `project-io-templates.js` |
| Kendi kaydettiğim şablonlar listede görünmüyor/silinemiyor | `project-io-templates.js` |
| Genel yazı tipi, renk, boşluk, hizalama **görünüşü** bozuk | `styles.css` |
| Bir buton/menü/pencere **hiç yok** ya da yanlış yerde | `index.html` |
| Sayfa hiç açılmıyor, tamamen boş/bozuk geliyor | Önce `index.html`'deki 10 `<script>` satırının sırası bozulmuş mu diye bak — sıra karışmışsa hiçbir şey çalışmaz |

---

## Aklında kalması gereken tek kural

`index.html` dosyasının sonundaki şu 10 satırın **sırası** çok önemli — biri eksik olursa ya da yerleri değişirse program bozulur:

```
constants.js → audio-text-utils.js → canvas-core.js → settings-panel.js →
block-editor-render.js → theme-preview-export-ui.js → block-export-render.js →
export-template-builder.js → rich-text-toolbar.js → project-io-templates.js
```

Bir geliştiriciye (veya bana) "şurada sorun var" derken, önce yukarıdaki tablodan hangi dosyaya işaret ettiğini söylersen, sorunu çok daha hızlı buluruz.
