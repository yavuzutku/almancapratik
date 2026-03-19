/**
 * src/components/lemmaHint.js
 * 
 * Kullanım — otomatik dinleme (singleadd, wordsadd):
 *   const hint = new LemmaHint({ inputEl, mountEl, onApply });
 *   hint.destroy(); // temizlemek için
 *
 * Kullanım — tek seferlik (modal):
 *   await showLemmaHintOnce({ word: 'gegangen', mountEl, onApply });
 */

import { getLemma, buildLemmaSuggestion } from '../services/lemma.js';

/* ── CSS (bir kez inject edilir) ── */
let _cssInjected = false;
function injectCSS() {
  if (_cssInjected) return;
  _cssInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    .lh-wrap{display:flex;align-items:center;gap:10px;padding:9px 12px;
      background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.22);
      border-radius:9px;margin-top:5px;animation:lhIn .2s cubic-bezier(.34,1.56,.64,1) both;}
    @keyframes lhIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
    .lh-icon{font-size:15px;flex-shrink:0;}
    .lh-body{flex:1;min-width:0;}
    .lh-label{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
      color:rgba(201,168,76,.65);margin-bottom:1px;}
    .lh-text{font-size:13px;color:#f0eee8;display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
    .lh-lemma{font-family:'DM Mono',monospace;font-size:13px;font-weight:600;color:#c9a84c;
      background:rgba(201,168,76,.1);padding:1px 7px;border-radius:4px;}
    .lh-type{font-size:11px;color:rgba(240,238,232,.35);}
    .lh-uncertain{font-size:11px;color:rgba(240,238,232,.35);font-style:italic;}
    .lh-btn{padding:5px 12px;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);
      border-radius:6px;color:#c9a84c;font-size:12px;font-weight:700;cursor:pointer;
      white-space:nowrap;transition:.15s;flex-shrink:0;font-family:'DM Sans',sans-serif;}
    .lh-btn:hover{background:rgba(201,168,76,.22);}
    .lh-dismiss{width:20px;height:20px;background:transparent;border:none;
      color:rgba(240,238,232,.25);font-size:13px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      border-radius:3px;flex-shrink:0;transition:color .15s;line-height:1;}
    .lh-dismiss:hover{color:rgba(240,238,232,.6);}
    .lh-loading{display:flex;align-items:center;gap:7px;padding:6px 0;
      color:rgba(240,238,232,.35);font-size:12px;}
    .lh-dots{display:flex;gap:3px;}
    .lh-dots span{width:4px;height:4px;border-radius:50%;background:#c9a84c;
      animation:lhDot 1.2s ease-in-out infinite;}
    .lh-dots span:nth-child(2){animation-delay:.2s;}
    .lh-dots span:nth-child(3){animation-delay:.4s;}
    @keyframes lhDot{0%,80%,100%{transform:scale(.5);opacity:.3}40%{transform:scale(1);opacity:1}}
  `;
  document.head.appendChild(s);
}

export class LemmaHint {
  constructor({ inputEl, mountEl, onApply, debounce = 650 }) {
    injectCSS();
    this._input    = inputEl;
    this._mount    = mountEl;
    this._onApply  = onApply;
    this._delay    = debounce;
    this._timer    = null;
    this._lastWord = '';
    this._dismissed = new Set();
    this._handler  = () => this._schedule();
    inputEl.addEventListener('input', this._handler);
  }

  _schedule() {
    clearTimeout(this._timer);
    const word = this._input.value.trim();
    if (!word || word.length < 2) { this.clear(); return; }
    if (word === this._lastWord)   return;
    this._showLoading();
    this._timer = setTimeout(() => this._run(word), this._delay);
  }

  async _run(word) {
    if (this._dismissed.has(word.toLowerCase())) { this.clear(); return; }
    const result     = await getLemma(word);
    const suggestion = buildLemmaSuggestion(word, result);
    this._lastWord   = word;
    if (!suggestion || this._input.value.trim() !== word) { this.clear(); return; }
    this._render(suggestion);
  }

  _showLoading() {
    if (!this._mount) return;
    this._mount.innerHTML = `<div class="lh-loading">
      <div class="lh-dots"><span></span><span></span><span></span></div>
      <span>Temel form aranıyor…</span></div>`;
  }

  _render(sug) {
    if (!this._mount) return;
    const typeHtml = sug.type ? `<span class="lh-type">(${sug.type})</span>` : '';
    const uncHtml  = sug.uncertain ? `<span class="lh-uncertain">— emin değilim</span>` : '';
    this._mount.innerHTML = `
      <div class="lh-wrap">
        <span class="lh-icon">💡</span>
        <div class="lh-body">
          <div class="lh-label">Temel form önerisi</div>
          <div class="lh-text">
            <span>"${this._e(sug.original)}" →</span>
            <span class="lh-lemma">${this._e(sug.lemma)}</span>
            ${typeHtml}${uncHtml}
          </div>
        </div>
        <button class="lh-btn" id="lhApply">Uygula →</button>
        <button class="lh-dismiss" id="lhClose" title="Kapat">✕</button>
      </div>`;
    this._mount.querySelector('#lhApply').onclick = () => {
      this._onApply?.(sug.lemma); this.clear();
    };
    this._mount.querySelector('#lhClose').onclick = () => {
      this._dismissed.add(sug.original.toLowerCase()); this.clear();
    };
  }

  clear() {
    if (this._mount) this._mount.innerHTML = '';
    clearTimeout(this._timer);
  }

  destroy() {
    this.clear();
    this._input?.removeEventListener('input', this._handler);
  }

  _e(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}

/* ── Tek seferlik (modal kullanımı için) ── */
export async function showLemmaHintOnce({ word, mountEl, onApply }) {
  injectCSS();
  if (!word || !mountEl) return;
  const result     = await getLemma(word);
  const suggestion = buildLemmaSuggestion(word, result);
  if (!suggestion) return;

  // LemmaHint instance'ı fake input ile oluştur
  const fakeInput = { addEventListener(){}, removeEventListener(){}, value: word };
  const h = new LemmaHint({ inputEl: fakeInput, mountEl, onApply });
  h._render(suggestion);
  return h;
}