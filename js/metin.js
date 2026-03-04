import { saveMetin } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {

  const editor  = document.getElementById("textArea");
  const readBtn = document.getElementById("goReadBtn");

  if(!editor) return;

  editor.addEventListener("paste", (e) => {
    e.preventDefault();
    const text    = (e.clipboardData || window.clipboardData).getData("text");
    const cleaned = text.replace(/\s+/g, " ").trim(); // basit temizlik
    document.execCommand("insertText", false, cleaned);
  });

  if(readBtn){
    readBtn.addEventListener("click", async () => {

      const text = editor.innerText.trim();

      if(text.length < 1){
        alert("Metin boş!");
        return;
      }

      // ✅ window.getUserId() — core.js tarafından global'e açıldı
      const userId = window.getUserId();

      try{
        await saveMetin(userId, text);
      }catch(err){
        console.error("Kayıt hatası:", err);
      }

      sessionStorage.setItem("savedText", text);
      window.location.href = "okuma.html";
    });
  }
});