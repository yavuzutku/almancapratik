document.addEventListener("DOMContentLoaded", () => {

  const newTextBtn    = document.getElementById("newTextBtn");
  const gecmisBtn     = document.getElementById("gecmisBtn");
  const kelimelerBtn  = document.getElementById("kelimelerBtn");
  const kelimeEkleBtn = document.getElementById("kelimeEkleBtn");
  const artikelBtn    = document.getElementById("artikelBtn");

  if (newTextBtn) {
    newTextBtn.addEventListener("click", () => {
      window.location.href = "../metin/";
    });
  }

  if (gecmisBtn) {
    gecmisBtn.addEventListener("click", () => {
      window.location.href = "../gecmis/";
    });
  }

  if (kelimelerBtn) {
    kelimelerBtn.addEventListener("click", () => {
      window.location.href = "../kelimeler/";
    });
  }

  if (kelimeEkleBtn) {
    kelimeEkleBtn.addEventListener("click", () => {
      window.location.href = "../wordsadd/";
    });
  }

  if (artikelBtn) {
    artikelBtn.addEventListener("click", () => {
      window.location.href = "../artikel/";
    });
  }

});