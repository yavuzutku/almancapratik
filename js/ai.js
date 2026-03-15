import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ══════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════ */
const ADMIN_EMAIL   = "yavuzutku144@gmail.com";
const GEMINI_URL    = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const HISTORY_KEY   = "ai_history";
const API_KEY_STORE = "ai_gemini_key";
const MAX_HISTORY   = 20;

/* ══════════════════════════════════════════════
   MODLAR
══════════════════════════════════════════════ */
const MODES = {
  duzelt: {
    label: "Cümle Düzelt",
    icon: "✏️",
    placeholder: "Almanca cümlenizi yazın, hataları düzeltelim…",
    hint: "Cümle Düzeltme & Açıklama",
    systemPrompt: (text) =>
      `Sen bir Almanca dil uzmanısın. Aşağıdaki Almanca cümleyi düzelt ve hatalar varsa kısaca Türkçe açıkla. Önce düzeltilmiş hali, sonra açıklama ver.\n\nCümle: ${text}`,
    quickPrompts: [
      "Ich gehe gestern zum Markt.",
      "Er hat viele Bücher gelest.",
      "Die Kinder spielen in den Garten.",
    ],
  },
  cevir: {
    label: "Türkçe → Almanca",
    icon: "🔄",
    placeholder: "Türkçe metni yazın, Almancaya çevirelim…",
    hint: "Türkçe → Almanca Çeviri",
    systemPrompt: (text) =>
      `Aşağıdaki Türkçe metni doğal ve akıcı Almancaya çevir. Sadece çeviriyi ver, parantez içinde Türkçe açıklama ekleme.\n\nMetin: ${text}`,
    quickPrompts: [
      "Merhaba, nasılsınız?",
      "Bugün hava çok güzel.",
      "Sizi tanımaktan büyük memnuniyet duydum.",
    ],
  },
  gramer: {
    label: "Gramer Sor",
    icon: "📖",
    placeholder: "Almanca gramer sorunuzu yazın…",
    hint: "Gramer Sorusu",
    systemPrompt: (text) =>
      `Sen deneyimli bir Almanca öğretmenisin. Aşağıdaki Almanca gramer sorusunu Türkçe, anlaşılır ve örneklerle açıkla.\n\nSoru: ${text}`,
    quickPrompts: [
      "Akkusativ ve Dativ ne zaman kullanılır?",
      "Perfekt ve Präteritum farkı nedir?",
      "Trennbare Verben nasıl kullanılır?",
    ],
  },
  kelime: {
    label: "Kelime Analizi",
    icon: "🔍",
    placeholder: "Analiz edilecek Almanca kelimeyi yazın…",
    hint: "Kelime Analizi",
    systemPrompt: (text) =>
      `Almanca "${text}" kelimesini analiz et: artikel, kelime türü, anlam(lar), çoğul formu (isimsе), örnek cümleler (2-3 tane) ve varsa yaygın deyimler. Tüm açıklamaları Türkçe yap.`,
    quickPrompts: ["Hund", "gehen", "schön", "Freundschaft"],
  },
  serbest: {
    label: "Serbest Sohbet",
    icon: "💬",
    placeholder: "Almanca ile ilgili her şeyi sorabilirsiniz…",
    hint: "Serbest Almanca Sorusu",
    systemPrompt: (text) =>
      `Sen Almanca öğrenmeye yardımcı olan, Türkçe açıklama yapan bir dil asistanısın. Aşağıdaki soruyu yanıtla:\n\n${text}`,
    quickPrompts: [
      "A1 için en önemli 10 fiil nedir?",
      "Almanca öğrenmek için tavsiyeler",
      "Zaman zarfları listesi",
    ],
  },
};

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
let currentMode = "duzelt";
let isLoading   = false;
let currentUser = null;

/* ══════════════════════════════════════════════
   AUTH GUARD
══════════════════════════════════════════════ */
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user || user.email !== ADMIN_EMAIL) {
    document.getElementById("accessDenied").style.display = "flex";
    document.getElementById("aiContent").style.display    = "none";
    return;
  }
  document.getElementById("accessDenied").style.display = "none";
  document.getElementById("aiContent").style.display    = "flex";
  init();
});

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
function init() {
  loadApiKeyUI();
  buildModeTabs();
  setMode("duzelt");
  renderHistory();
  bindEvents();
}

/* ── API Key ── */
function loadApiKeyUI() {
  const stored = localStorage.getItem(API_KEY_STORE) || "";
  const input  = document.getElementById("apiKeyInput");
  if (stored) {
    input.value = "●".repeat(12) + stored.slice(-4);
    input.dataset.real = stored;
    setApiStatus("✓ API Key yüklü", false);
  }
}

function getApiKey() {
  const input = document.getElementById("apiKeyInput");
  return input.dataset.real || input.value.trim();
}

function setApiStatus(msg, isError = false) {
  const el = document.getElementById("apiStatus");
  el.textContent = msg;
  el.className   = "api-status" + (isError ? " error" : "");
  el.style.display = msg ? "inline" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("apiSaveBtn")?.addEventListener("click", () => {
    const raw = document.getElementById("apiKeyInput").value.trim();
    if (!raw || raw.startsWith("●")) return;
    localStorage.setItem(API_KEY_STORE, raw);
    document.getElementById("apiKeyInput").dataset.real = raw;
    document.getElementById("apiKeyInput").value = "●".repeat(12) + raw.slice(-4);
    setApiStatus("✓ Kaydedildi", false);
  });
});

/* ── Mode tabs ── */
function buildModeTabs() {
  const wrap = document.getElementById("modeTabs");
  Object.entries(MODES).forEach(([key, mode]) => {
    const btn = document.createElement("button");
    btn.className   = "mode-tab" + (key === currentMode ? " active" : "");
    btn.dataset.mode = key;
    btn.innerHTML = `<span>${mode.icon}</span> ${mode.label}`;
    btn.addEventListener("click", () => setMode(key));
    wrap.appendChild(btn);
  });
}

function setMode(key) {
  currentMode = key;
  const mode  = MODES[key];

  /* Tab aktif */
  document.querySelectorAll(".mode-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === key);
  });

  /* Placeholder & hint */
  const textarea = document.getElementById("promptInput");
  textarea.placeholder = mode.placeholder;
  document.getElementById("modeHint").textContent = mode.hint;

  /* Quick prompts */
  buildQuickPrompts(mode.quickPrompts);

  /* Temizle */
  clearResponse();
}

function buildQuickPrompts(prompts) {
  const wrap = document.getElementById("quickPrompts");
  wrap.innerHTML = "";
  prompts.forEach(p => {
    const chip = document.createElement("button");
    chip.className   = "quick-chip";
    chip.textContent = p;
    chip.addEventListener("click", () => {
      document.getElementById("promptInput").value = p;
      document.getElementById("promptInput").focus();
    });
    wrap.appendChild(chip);
  });
}

/* ── Events ── */
function bindEvents() {
  document.getElementById("sendBtn")?.addEventListener("click", sendPrompt);
  document.getElementById("promptInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendPrompt();
    }
  });
  document.getElementById("promptInput")?.addEventListener("input", (e) => {
    const len = e.target.value.length;
    document.getElementById("charHint").textContent = len > 0 ? `${len} karakter` : "Ctrl+Enter ile gönder";
  });
  document.getElementById("clearHistBtn")?.addEventListener("click", clearHistory);
}

/* ══════════════════════════════════════════════
   GEMINI API
══════════════════════════════════════════════ */
async function sendPrompt() {
  if (isLoading) return;

  const apiKey = getApiKey();
  const text   = document.getElementById("promptInput").value.trim();

  if (!apiKey) {
    showError("Önce Gemini API key'inizi girin ve kaydedin.");
    return;
  }
  if (!text) {
    document.getElementById("promptInput").focus();
    return;
  }

  isLoading = true;
  setLoading(true);

  const mode   = MODES[currentMode];
  const prompt = mode.systemPrompt(text);

  try {
    const res  = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || "API hatası");
    }

    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) throw new Error("Yanıt alınamadı.");

    showResponse(answer);
    addToHistory(text, answer, currentMode);
    document.getElementById("promptInput").value = "";
    document.getElementById("charHint").textContent = "Ctrl+Enter ile gönder";

  } catch (err) {
    showError(err.message);
  } finally {
    isLoading = false;
    setLoading(false);
  }
}

/* ══════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════ */
function setLoading(on) {
  const sendBtn = document.getElementById("sendBtn");
  const loading = document.getElementById("responseLoading");
  const empty   = document.getElementById("responseEmpty");

  sendBtn.disabled = on;
  loading.style.display = on ? "flex" : "none";
  if (on) empty.style.display = "none";
}

function clearResponse() {
  document.getElementById("responseEmpty").style.display   = "flex";
  document.getElementById("responseLoading").style.display = "none";
  document.getElementById("responseContent").style.display = "none";
  document.getElementById("errorBox").style.display        = "none";
}

function showResponse(text) {
  document.getElementById("responseEmpty").style.display   = "none";
  document.getElementById("responseLoading").style.display = "none";
  document.getElementById("errorBox").style.display        = "none";

  const content = document.getElementById("responseContent");
  const textEl  = document.getElementById("responseText");

  textEl.innerHTML = formatResponse(text);
  content.style.display = "block";
}

function showError(msg) {
  document.getElementById("responseEmpty").style.display   = "none";
  document.getElementById("responseLoading").style.display = "none";

  const box = document.getElementById("errorBox");
  box.textContent   = "⚠️ " + msg;
  box.style.display = "block";
}

/* Basit markdown → HTML dönüşümü */
function formatResponse(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

/* Kopyala butonu */
document.addEventListener("click", async (e) => {
  if (!e.target.closest("#copyRespBtn")) return;
  const text = document.getElementById("responseText").innerText;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("copyRespBtn");
    btn.textContent = "✓ Kopyalandı";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "Kopyala";
      btn.classList.remove("copied");
    }, 1800);
  } catch { /* pass */ }
});

/* ══════════════════════════════════════════════
   GEÇMİŞ
══════════════════════════════════════════════ */
function addToHistory(question, answer, mode) {
  let hist = loadHistory();
  hist.unshift({ question, answer, mode, time: Date.now() });
  if (hist.length > MAX_HISTORY) hist = hist.slice(0, MAX_HISTORY);
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  renderHistory();
}

function loadHistory() {
  try { return JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function renderHistory() {
  const list  = document.getElementById("historyItems");
  const strip = document.getElementById("historyStrip");
  const hist  = loadHistory();

  if (hist.length === 0) { strip.style.display = "none"; return; }
  strip.style.display = "block";
  list.innerHTML = "";

  hist.slice(0, 10).forEach(item => {
    const el  = document.createElement("div");
    el.className = "history-item";
    const mode = MODES[item.mode] || MODES.serbest;
    const time = new Date(item.time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    el.innerHTML = `
      <div class="history-item-q">${mode.icon} ${escHtml(item.question)}</div>
      <div class="history-item-meta">${mode.label} · ${time}</div>
    `;
    el.addEventListener("click", () => {
      showResponse(item.answer);
      document.getElementById("promptInput").value = item.question;
      setMode(item.mode);
    });
    list.appendChild(el);
  });
}

function clearHistory() {
  sessionStorage.removeItem(HISTORY_KEY);
  document.getElementById("historyStrip").style.display = "none";
}

/* ── Helpers ── */
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}