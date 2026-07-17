#!/bin/bash

# İlk olarak sitemap oluşturma betiğini çalıştırıyoruz
python3 sitemap_olustur.py

# Değişiklikleri sahneye ekliyoruz (yeni sitemap dahil)
git add .

# Değişiklikleri kaydediyoruz
git commit -m "auto update"

# GitHub'a yüklüyoruz
git push