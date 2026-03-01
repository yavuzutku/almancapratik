

function showBulkWordPage(){
    document.querySelectorAll('.card').forEach(c => c.style.display = "none");
    document.getElementById("bulkWordArea").style.display = "block";
}

function prepareMeaningArea(){
    let germanText = document.getElementById("bulkGermanWords").value;
    
    // boş satırları sil
    let germanList = germanText
        .split("\n")
        .map(w => w.trim())
        .filter(w => w !== "");

    if(germanList.length === 0){
        alert("Kelime yok!");
        return;
    }

    // temizlenmiş listeyi geri yaz
    document.getElementById("bulkGermanWords").value = germanList.join("\n");

    document.getElementById("meaningSection").style.display = "block";
    document.getElementById("directAddBtn").style.display = "inline-block";
}

function saveBulkWordList(){
    let directMode = document.getElementById("bulkTurkishWords").value.trim() === "";
    let germanList = document.getElementById("bulkGermanWords").value
        .split("\n")
        .map(w => w.trim())
        .filter(w => w !== "");

    let turkishList = document.getElementById("bulkTurkishWords").value
        .split("\n")
        .map(w => w.trim())
        .filter(w => w !== "");

    if(!directMode && germanList.length !== turkishList.length){
        alert("Kelime ve anlam sayısı eşit değil!");
        return;
    }
    let savedWords = JSON.parse(localStorage.getItem("words") || "[]");

    let addedCount = 0;
    let updatedCount = 0;

    for(let i = 0; i < germanList.length; i++){

        let rawLine = germanList[i];

        // 1) Sayıları ve tabı temizle
        rawLine = rawLine.replace(/^\s*\d+\s*/, "");

        // 2) Eğer → varsa böl
        let parts = rawLine.split(/→|=|-|:/);

        let wordPart = parts[0].trim().toLowerCase();
        let meaningPart = "";

        if(parts.length > 1){
            meaningPart = parts[1].trim();
        }

        // 3) Eğer anlam alanı ayrıca yazılmışsa onu da al
        let meaningFromInput = turkishList[i] ? turkishList[i].trim() : "";

        // 4) Anlamları birleştir
        let finalMeaning = "";
        finalMeaning = finalMeaning.replace(/\([^)]*\)/g, "");

        if(meaningPart !== ""){
            finalMeaning = meaningPart;
        }

        if(meaningFromInput !== ""){
            if(finalMeaning !== ""){
                finalMeaning += " / " + meaningFromInput;
            } else {
                finalMeaning = meaningFromInput;
            }
        }

        // 5) Virgül varsa anlamı böl
        // Anlamı ayıran tüm işaretler
        let separators = /,|;|\/|\||-/;

        if(separators.test(finalMeaning)){
            let splitted = finalMeaning
                .split(separators)
                .map(m => m.trim())
                .filter(m => m !== "");

            finalMeaning = splitted.join(" / ");
        }
        // 6) Word ve meaning final hal
        let word = wordPart;
        let meaning = finalMeaning;

        // İlk harfi büyüt (meaning boş değilse)
        if(meaning !== ""){
            meaning = meaning.charAt(0).toUpperCase() + meaning.slice(1);
        }
        // İlk harfi büyüt

        let existingWord = savedWords.find(w => w.word === word);

        if(existingWord){

            let meaningsArray = existingWord.meaning
                .split(" / ")
                .map(m => m.trim());

            if(meaning !== "" && !meaningsArray.includes(meaning)){
                existingWord.meaning += " / " + meaning;
                updatedCount++;
            }

        } else {

            savedWords.push({
                id: Date.now().toString() + i,
                word: word,
                meaning: meaning,
                difficulty: 1,
                wrong: 0,
                date: new Date().toISOString()
            });

            addedCount++;
        }
    }

    localStorage.setItem("words", JSON.stringify(savedWords));

    alert(
        "✅ " + addedCount + " yeni kelime eklendi!\n" +
        "🔄 " + updatedCount + " kelimeye yeni anlam eklendi!"
    );

    document.getElementById("bulkGermanWords").value = "";
    document.getElementById("bulkTurkishWords").value = "";
    document.getElementById("meaningSection").style.display = "none";

    goMenu();
}
