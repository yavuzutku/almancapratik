import json, unicodedata, os

SRC = '/Users/yavuz/Desktop/almancapratik/artikel/datalar/nouns.json'
OUT_DIR = '/Users/yavuz/Desktop/almancapratik/artikel/datalar'

with open(SRC, encoding='utf-8') as f:
    data = json.load(f)

# Almanca özel harfleri normalize eden harita
UMLAUT_MAP = {'Ä': 'A', 'Ö': 'O', 'Ü': 'U', 'ß': 'S'}

buckets = {c: {} for c in 'abcdefghijklmnopqrstuvwxyz'}
misc = {}  # A-Z dışına düşen her şey (rakamlar, semboller, Yunan/Kiril harfleri vs.)

for key, val in data.items():
    ch = key[0]
    ch_norm = UMLAUT_MAP.get(ch, ch)
    ch_norm = unicodedata.normalize('NFKD', ch_norm)[0]  # aksanları temizle (é->e gibi)
    letter = ch_norm.lower()
    if letter in buckets:
        buckets[letter][key] = val
    else:
        misc[key] = val

os.makedirs(OUT_DIR, exist_ok=True)
total_written = 0
summary = []
for letter, words in buckets.items():
    path = os.path.join(OUT_DIR, f'nouns-{letter}.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, separators=(',', ':'))
    total_written += len(words)
    summary.append((letter, len(words), os.path.getsize(path)))

misc_path = os.path.join(OUT_DIR, 'nouns-misc.json')
with open(misc_path, 'w', encoding='utf-8') as f:
    json.dump(misc, f, ensure_ascii=False, separators=(',', ':'))
total_written += len(misc)

print(f'Orijinal toplam: {len(data)}, dagitilan toplam: {total_written}')
print()
for letter, count, size in summary:
    print(f'{letter}: {count} kelime, {size/1024:.1f} KB')
print(f'misc: {len(misc)} kelime, {os.path.getsize(misc_path)/1024:.1f} KB')