export const TAG_OPTIONS = [
  "fiil","isim","sıfat","zarf","A1","A2","B1","B2","seyahat","iş"
];

// Kullanıcının tüm kelimelerinden unique tag'leri toplar
export function extractAllTags(words = []) {
  const set = new Set(TAG_OPTIONS);
  words.forEach(w => {
    if (Array.isArray(w.tags)) w.tags.forEach(t => set.add(t));
  });
  return [...set];
}

export function renderTagChips(containerId, selected = [], allTags = TAG_OPTIONS) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  // Sabit + kullanıcı tag'leri
  allTags.forEach(tag => {
    container.appendChild(_makeChip(tag, selected.includes(tag)));
  });

  // selected içinde allTags'de olmayan özel etiketleri de göster
  selected.forEach(tag => {
    if (!allTags.includes(tag)) {
      container.appendChild(_makeChip(tag, true));
    }
  });

  // Özel etiket input'u
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;gap:6px;margin-top:8px;width:100%;";

  const input = document.createElement("input");
  input.placeholder = "Yeni etiket...";
  input.style.cssText = `
    flex:1;min-width:0;
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.12);
    border-radius:8px;color:white;
    font-size:12px;font-family:inherit;
    padding:6px 10px;outline:none;transition:0.2s;
  `;
  input.addEventListener("focus", () => input.style.borderColor = "#c9a84c");
  input.addEventListener("blur",  () => input.style.borderColor = "rgba(255,255,255,0.12)");

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "+ Ekle";
  addBtn.style.cssText = `
    padding:6px 12px;border-radius:8px;white-space:nowrap;
    border:1px solid rgba(201,168,76,0.4);
    background:rgba(201,168,76,0.1);color:#c9a84c;
    font-size:12px;font-family:inherit;cursor:pointer;
    font-weight:600;transition:0.2s;
  `;
  addBtn.addEventListener("mouseenter", () => addBtn.style.background = "rgba(201,168,76,0.2)");
  addBtn.addEventListener("mouseleave", () => addBtn.style.background = "rgba(201,168,76,0.1)");

  function addCustomTag() {
    const val = input.value.trim();
    if (!val) return;
    const existing = [...container.querySelectorAll(".tag-chip")]
      .find(c => c.dataset.tag.toLowerCase() === val.toLowerCase());
    if (existing) {
      existing.classList.add("selected");
    } else {
      container.insertBefore(_makeChip(val, true), wrapper);
    }
    input.value = "";
    input.focus();
  }

  addBtn.addEventListener("click", addCustomTag);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }
  });

  wrapper.appendChild(input);
  wrapper.appendChild(addBtn);
  container.appendChild(wrapper);
}

export function getSelectedTags(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return [...container.querySelectorAll(".tag-chip.selected")]
    .map(c => c.dataset.tag);
}

function _makeChip(tag, selected = false) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "tag-chip" + (selected ? " selected" : "");
  chip.dataset.tag = tag;
  chip.textContent = tag;
  chip.addEventListener("click", () => chip.classList.toggle("selected"));
  return chip;
}