document.addEventListener("DOMContentLoaded", ()=>{

  const text = localStorage.getItem("savedText");
  const reader = document.getElementById("readerText");

  if(!text || text.trim().length < 10){
    reader.innerHTML = "<h2>Metin Bulunamadı</h2>";
    return;
  }

  reader.innerText = text;
});

function goBack(){
  window.location.href = "metin.html";
}

let currentSize = 20;

function increaseFont(){
  currentSize += 2;
  document.getElementById("readerText").style.fontSize = currentSize + "px";
}

function decreaseFont(){
  currentSize = Math.max(12, currentSize - 2);
  document.getElementById("readerText").style.fontSize = currentSize + "px";
}

function toggleDark(){
  document.body.classList.toggle("light-mode");
}
const readerText = document.getElementById("readerText");

function loadText(text) {
  const words = text.split(" ");
  readerText.innerHTML = "";

  words.forEach(word => {
    const span = document.createElement("span");
    span.textContent = word + " ";
    span.classList.add("clickable-word");

    span.onclick = async () => {
      showMeaning(span, word);
    };

    readerText.appendChild(span);
  });
}

async function showMeaning(element, word) {
  const cleanWord = word.replace(/[.,!?]/g, "");

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=tr&dt=t&q=${encodeURIComponent(cleanWord)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const meaning = data[0][0][0];

    showPopup(element, meaning);
  } catch (error) {
    console.log("Çeviri hatası:", error);
  }
}

function showPopup(element, meaning) {
  let popup = document.createElement("div");
  popup.classList.add("word-popup");
  popup.textContent = meaning;

  document.body.appendChild(popup);

  const rect = element.getBoundingClientRect();
  popup.style.top = rect.bottom + window.scrollY + "px";
  popup.style.left = rect.left + window.scrollX + "px";

  setTimeout(() => {
    popup.remove();
  }, 3000);
}