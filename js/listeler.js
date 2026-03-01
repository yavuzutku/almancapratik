function listeler(){

    hideAll();

    const listsArea = document.getElementById("listsArea");

    listsArea.style.display = "block";

    renderListsPage();
}



// ===============================
// LISTE ANA SAYFA
// ===============================

function renderListsPage(){

    const listsArea = document.getElementById("listsArea");

    listsArea.innerHTML = `
    
    <button class="secondary" onclick="goMenu()">🏠 Ana Menü</button>

    <h1 style="margin-top:15px;">🎯 Kelime Listeleri</h1>

    <button class="primary" onclick="createNewList()" style="margin:20px 0;">
        ➕ Yeni Liste Oluştur
    </button>

    <div class="listsGrid" id="listsContainer"></div>

    `;

    loadLists();
}



// ===============================
// LISTELERI YUKLE
// ===============================

function loadLists(){

    const listsContainer = document.getElementById("listsContainer");

    let lists = JSON.parse(localStorage.getItem("wordLists") || "[]");

    listsContainer.innerHTML = "";

    if(lists.length === 0){
        listsContainer.innerHTML = `
        <p style="opacity:0.6;">Henüz liste oluşturmadınız.</p>
        `;
        return;
    }

    lists.forEach((list,index)=>{

        let div = document.createElement("div");
        div.className = "listModernCard";

        div.innerHTML = `
        <h3>${list.name}</h3>
        <p>${list.words.length} kelime</p>

        <button class="primary" onclick="openList(${index})">
            Aç
        </button>
        `;

        listsContainer.appendChild(div);

    });

}



// ===============================
// YENI LISTE
// ===============================

function createNewList(){

    let name = prompt("Liste adı:");

    if(!name) return;

    let lists = JSON.parse(localStorage.getItem("wordLists") || "[]");

    lists.push({
        name: name,
        words: []
    });

    localStorage.setItem("wordLists", JSON.stringify(lists));

    renderListsPage();
}



// ===============================
// LISTE AC
// ===============================

function openList(index){

    const listsArea = document.getElementById("listsArea");

    let lists = JSON.parse(localStorage.getItem("wordLists") || "[]");

    let list = lists[index];

    listsArea.innerHTML = `
    
    <button class="secondary" onclick="listeler()">⬅ Geri</button>

    <h2 style="margin-top:15px;">📚 ${list.name}</h2>

    <button class="primary" onclick="addWordsToList(${index})">
        ➕ Kelime Ekle
    </button>

    <div class="wordsGrid" id="listWords"></div>
    `;

    const div = document.getElementById("listWords");

    if(list.words.length === 0){
        div.innerHTML = `<p style="opacity:0.6;">Liste boş</p>`;
        return;
    }

    list.words.forEach((w,i)=>{

        let row = document.createElement("div");
        row.className = "wordCard";

        row.innerHTML = `
        <b>${w.word}</b>
        <span>${w.meaning}</span>

        <button class="danger" onclick="removeWord(${index},${i})">
            ❌
        </button>
        `;

        div.appendChild(row);

    });
}



// ===============================
// LISTEYE KELIME EKLE
// ===============================

function addWordsToList(listIndex){

    const listsArea = document.getElementById("listsArea");

    let saved = JSON.parse(localStorage.getItem("words") || "[]");

    listsArea.innerHTML = `
    
    <button class="secondary" onclick="openList(${listIndex})">
        ⬅ Geri
    </button>

    <h2 style="margin-top:15px;">Kelime Seç</h2>

    <input type="text"
        id="listSearch"
        placeholder="Kelime ara..."
        onkeyup="filterListWords()"
        class="modernInput">

    <p>Toplam: <span id="listWordCount">${saved.length}</span></p>

    <div id="listWordSelect" class="checkboxList"></div>

    <button class="primary" style="margin-top:20px;"
        onclick="saveSelectedWords(${listIndex})">
        Kaydet
    </button>
    `;

    const container = document.getElementById("listWordSelect");

    saved.forEach(word=>{

        let div = document.createElement("div");
        div.className = "checkboxRow";

        div.innerHTML = `
        <label>
            <input type="checkbox" value="${word.id}">
            <b>${word.word}</b> → ${word.meaning}
        </label>
        `;

        container.appendChild(div);

    });

}



// ===============================
// SECILENLERI KAYDET
// ===============================

function saveSelectedWords(listIndex){

    let lists = JSON.parse(localStorage.getItem("wordLists") || "[]");
    let saved = JSON.parse(localStorage.getItem("words") || "[]");

    let checkboxes = document.querySelectorAll("#listWordSelect input:checked");

    let selectedIds = Array.from(checkboxes).map(cb => cb.value);

    let selectedWords = saved.filter(word =>
        selectedIds.includes(word.id)
    );

    lists[listIndex].words.push(...selectedWords);

    localStorage.setItem("wordLists", JSON.stringify(lists));

    openList(listIndex);
}



// ===============================
// LISTEDEN KELIME SIL
// ===============================

function removeWord(listIndex, wordIndex){

    let lists = JSON.parse(localStorage.getItem("wordLists") || "[]");

    lists[listIndex].words.splice(wordIndex, 1);

    localStorage.setItem("wordLists", JSON.stringify(lists));

    openList(listIndex);
}



// ===============================
// LISTE ICIN ARAMA
// ===============================

function filterListWords(){

    const searchValue = listSearch.value.toLowerCase();
    const items = listWordSelect.querySelectorAll(".checkboxRow");

    let visible = 0;

    items.forEach(div=>{

        let text = div.innerText.toLowerCase();

        if(text.includes(searchValue)){
            div.style.display = "block";
            visible++;
        } else {
            div.style.display = "none";
        }

    });

    listWordCount.innerText = visible;
}
