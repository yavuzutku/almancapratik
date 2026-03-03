document.addEventListener("DOMContentLoaded", ()=>{

  const text = localStorage.getItem("savedText");

  const reader = document.getElementById("readerText");

  if(!text || text.trim() === ""){
    reader.innerHTML = "<h2>Metin Bulunamadı</h2>";
    return;
  }

  reader.innerText = text;

});


function goBack(){
  window.location.href = "metin.html";
}