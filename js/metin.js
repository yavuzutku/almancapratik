document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("textArea");

    /* =========================
    PASTE CLEAN SYSTEM
    ========================= */

    editor.addEventListener("paste", (e) => {

        e.preventDefault();

        // Sadece düz yazı al
        const text = (e.clipboardData || window.clipboardData)
            .getData("text");

        // Temizleme işlemleri
        const cleaned = cleanText(text);

        document.execCommand("insertText", false, cleaned);
    });
    const readBtn = document.getElementById("goReadBtn");

        if(readBtn){
        readBtn.addEventListener("click", ()=>{

            const text = document.getElementById("textArea").innerText.trim();

            if(text.length < 10){
            alert("Metin boş! Önce metin ekle.");
            return;
            }

            localStorage.setItem("savedText", text);

            window.location.href = "okuma.html";
        });
    }
});
function cleanText(text){

    return text
        .replace(/\r/g, "")           // enter temizle
        .replace(/\t/g, " ")          // tab yerine boşluk
        .replace(/ +/g, " ")           // fazla boşlukları tek boşluk yap
        .trim();
}