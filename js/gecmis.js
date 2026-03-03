import { Storage } from "./storage.js";
let currentTextId = null;
function showHistory(){
    hideAll();
    historyArea.style.display="block";
    loadHistory();
}
function saveText(text){
    return Storage.saveText(text);
}
function getTexts(){
    return Storage.getTexts();
}

function loadHistory(){

    let texts = getTexts();
    texts.sort((a,b)=> new Date(b.date) - new Date(a.date));

    historyList.innerHTML = "";
    historyCount.innerText = texts.length;

    if(texts.length === 0){
        historyList.innerHTML = `
            <div style="text-align:center;opacity:0.6;margin-top:40px;">
                📭 Henüz kayıtlı metin yok
            </div>
        `;
        return;
    }

    texts.forEach(t=>{

        let preview = t.content.length > 150
            ? t.content.substring(0,150) + "..."
            : t.content;

        let wordCount = t.content.split(/\s+/).length;

        let div = document.createElement("div");
        div.className="historyItemModern";

        div.innerHTML = `
            <div class="historyTop">
                <span class="historyDate">
                    📅 ${new Date(t.date).toLocaleString()}
                </span>

                <span class="historyStats">
                    📝 ${wordCount} kelime
                </span>
            </div>

            <div class="historyPreview" onclick="togglePreview(this)">
                ${preview}
            </div>

            <div class="historyButtons">
                <button class="primary" onclick="startReading('${t.id}')">Oku</button>
                <button class="secondary" onclick="editText('${t.id}')">Düzenle</button>
                <button class="danger" onclick="deleteText('${t.id}')">Sil</button>
            </div>
        `;

        historyList.appendChild(div);
    });
}
function editText(id){
    let texts=getTexts();
    let found=texts.find(t=>t.id===id);
    if(!found) return;

    hideAll();
    inputArea.style.display="block";
    userText.value=found.content;
    currentTextId=id;
}

function filterHistory(){

    let search = historySearch.value.toLowerCase();
    let items = historyList.querySelectorAll(".historyItemModern");

    let visible = 0;

    items.forEach(item=>{
        let text = item.innerText.toLowerCase();

        if(text.includes(search)){
            item.style.display = "block";
            visible++;
        } else {
            item.style.display = "none";
        }
    });

    historyCount.innerText = visible;
}
function togglePreview(element){

    let fullText = element.innerText;

    let texts = getTexts();
    let found = texts.find(t => 
        fullText.includes(t.content.substring(0,50))
    );

    if(!found) return;

    if(element.dataset.expanded === "true"){
        element.innerText = found.content.substring(0,150) + "...";
        element.dataset.expanded = "false";
    } else {
        element.innerText = found.content;
        element.dataset.expanded = "true";
    }
}
function deleteText(id){
    Storage.deleteText(id);
    loadHistory();
}