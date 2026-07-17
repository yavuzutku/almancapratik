#!/bin/bash

# 1. Önce uzak depodaki güncellemeleri çek (Action'ın oluşturduğu lessons.json vb.)
# Hata oluşursa script'i durdurmaması için || true ekledik
git pull origin main || true

# 2. Sitemap oluşturma betiğini çalıştır
python3 sitemap_olustur.py

# 3. Değişiklikleri sahneye ekle
git add .

# 4. Değişiklikleri kaydet (Mesajı biraz daha açıklayıcı yaptım)
git commit -m "auto update: sitemap and lessons sync"

# 5. GitHub'a yükle
git push