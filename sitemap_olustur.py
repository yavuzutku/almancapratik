import os
from datetime import datetime

# ── AYARLAR ──
SITE_URL = "https://almancapratik.com"  # Kendi site adresini yaz
PROJE_DIZINI = "./"               # Tarama yapılacak ana klasör
CIKTI_DOSYASI = "sitemap.xml"

# Haris tutulacak (sitemap'e eklenmeyecek) klasörler veya dosyalar
YASAKLI_KLASORLER = {'.git', 'node_modules', 'src', 'css', 'js', 'uploads'}
YASAKLI_DOSYALAR = {'404.html'}

def sitemap_uret():
    urller = []
    bugun = datetime.today().strftime('%Y-%m-%d')

    # Klasörleri ve dosyaları tara
    for root, dirs, files in os.walk(PROJE_DIZINI):
        # Yasaklı klasörleri tarama dışı bırak
        dirs[:] = [d for d in dirs if d not in YASAKLI_KLASORLER]
        
        for file in files:
            if file.endswith(".html") and file not in YASAKLI_DOSYALAR:
                # Dosya yolunu temizle ve URL'e dönüştür
                dosya_yolu = os.path.relpath(os.path.join(root, file), PROJE_DIZINI)
                dosya_yolu = dosya_yolu.replace(os.sep, '/')
                
                # index.html dosyalarını temiz URL yapmak için kaldır
                if dosya_yolu == "index.html":
                    temiz_url = f"{SITE_URL}/"
                elif dosya_yolu.endswith("/index.html"):
                    temiz_url = f"{SITE_URL}/{dosya_yolu[:-11]}/"
                else:
                    temiz_url = f"{SITE_URL}/{dosya_yolu}"

                urller.append(temiz_url)

    # XML Dosyasını Yazdır
    with open(CIKTI_DOSYASI, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        
        for url in sorted(urller):
            f.write('  <url>\n')
            f.write(f'    <loc>{url}</loc>\n')
            f.write(f'    <lastmod>{bugun}</lastmod>\n')
            f.write('    <changefreq>weekly</changefreq>\n')
            f.write('    <priority>0.8</priority>\n')
            f.write('  </url>\n')
            
        f.write('</urlset>\n')
    
    print(f"✓ Başarıyla {len(urller)} adet URL tarandı ve '{CIKTI_DOSYASI}' dosyası güncellendi!")

if __name__ == "__main__":
    sitemap_uret()