#!/usr/bin/env node
/**
 * build-lessons-manifest.mjs
 * ────────────────────────────────────────────────────────────────
 * /dersler/ altındaki her alt klasörü (ör: /dersler/ikinci-ders/)
 * tarar, içindeki index.html dosyasından ders bilgilerini çıkarır
 * ve hepsini /dersler/lessons.json içine yazar.
 *
 * Bu script her "git push" sonrasında GitHub Actions tarafından
 * otomatik çalıştırılır (bkz. .github/workflows/build-lessons-manifest.yml).
 * Elle çalıştırman gerekmez — sen sadece yeni bir ders klasörü
 * ekleyip push'lamaya devam et.
 * ────────────────────────────────────────────────────────────────
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT     = process.cwd();
const DERS_DIR = path.join(ROOT, "dersler");
const OUT_FILE = path.join(DERS_DIR, "lessons.json");

/* Kapak fotoğrafı için desteklenen dosya adları/uzantılar.
   Ders klasörüne bu isimlerden biriyle bir görsel koyman yeterli. */
const COVER_CANDIDATES = ["cover.jpg", "cover.jpeg", "cover.png", "cover.webp"];

function readText(p) {
  return fs.readFileSync(p, "utf-8");
}

function extract(re, html, groupIndex = 1) {
  const m = html.match(re);
  return m ? m[groupIndex].trim() : "";
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/* İlk commit tarihini git geçmişinden alır (dosyanın repoya ilk eklendiği tarih).
   Git geçmişi bulunamazsa dosyanın diskteki değişiklik tarihine düşer. */
function getFirstCommitDate(filePath) {
  try {
    const out = execSync(
      `git log --diff-filter=A --follow --format=%aI -- "${filePath}" | tail -1`,
      { cwd: ROOT, encoding: "utf-8" }
    ).trim();
    if (out) return out;
  } catch { /* git yoksa veya dosya henüz commit edilmediyse */ }
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function findCover(lessonDir) {
  for (const name of COVER_CANDIDATES) {
    if (fs.existsSync(path.join(lessonDir, name))) return name;
  }
  return null;
}

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function buildEntry(slug) {
  const lessonDir  = path.join(DERS_DIR, slug);
  const indexFile  = path.join(lessonDir, "index.html");
  if (!fs.existsSync(indexFile)) return null;

  const html = readText(indexFile);

  const rawTitle = extract(/<title>([\s\S]*?)<\/title>/i, html);
  const title = decodeEntities(rawTitle.replace(/\s*—\s*AlmancaPratik\s*$/i, "").trim()) || slug;

  const excerpt = decodeEntities(
    extract(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i, html)
  );

  const category = extract(/class=["'][^"']*lesson-cat-badge[^"']*["']\s+data-cat=["']([^"']+)["']/i, html);

  /* Taslak işaretlemek istersen ders sayfasının <head> kısmına şunu ekle:
     <meta name="robots" content="noindex">
     — o zaman bu ders "yayınlanmamış" (taslak) sayılır ve sitede görünmez
     (admin girişiyle bakınca "Taslak" etiketiyle görünür). */
  const isNoindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);

  const bodyMatch  = html.match(/<article[^>]*class=["'][^"']*lesson-body[^"']*["'][^>]*>([\s\S]*?)<\/article>/i);
  const readTime   = Math.max(1, Math.round(wordCount(bodyMatch ? bodyMatch[1] : "") / 200));

  const cover = findCover(lessonDir);
  const date  = getFirstCommitDate(indexFile);

  return {
    slug,
    title,
    excerpt,
    category,
    published: !isNoindex,
    cover,
    readTime,
    date
  };
}

function main() {
  if (!fs.existsSync(DERS_DIR)) {
    console.log("dersler/ klasörü bulunamadı, atlanıyor.");
    return;
  }
  const slugs = fs.readdirSync(DERS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const entries = slugs
    .map(buildEntry)
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(OUT_FILE, JSON.stringify(entries, null, 2) + "\n", "utf-8");
  console.log(`${entries.length} statik ders bulundu, yazıldı: ${path.relative(ROOT, OUT_FILE)}`);
}

main();
