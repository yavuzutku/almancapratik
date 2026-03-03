/*
=========================================
STORAGE.JS - LOCALSTORAGE KONTROL MODÜLÜ
=========================================

Bu dosya tüm localStorage işlemlerini yönetir:
- Kelimeler (words)
- Yanlış kelimeler (wrongWords)
- Player XP/Level (playerData)
- Metin geçmişi (texts)
- Kelime listeleri (wordLists)
*/

export const Storage = {

    // ====== WORDS ======
    getWords: function(){
        return JSON.parse(localStorage.getItem("words") || "[]");
    },

    saveWords: function(words){
        localStorage.setItem("words", JSON.stringify(words));
    },

    addOrUpdateWord: function(word, meaning){
        let saved = this.getWords();
        word = word.trim();
        meaning = meaning.trim();
        if(!word || !meaning) return;

        let existing = saved.find(w => w.word.toLowerCase() === word.toLowerCase());

        if(existing){
            let meaningsArray = existing.meaning.split(" / ").map(m => m.trim());
            if(!meaningsArray.includes(meaning)){
                existing.meaning += " / " + meaning;
            }
        } else {
            saved.push({
                id: crypto.randomUUID(),
                word: word,
                meaning: meaning,
                difficulty: 2,
                date: new Date().toISOString()
            });
        }

        this.saveWords(saved);
    },

    deleteWord: function(id){
        let saved = this.getWords();
        saved = saved.filter(w => w.id !== id);
        this.saveWords(saved);
    },

    // ====== WRONG WORDS ======
    getWrongWords: function(){
        return JSON.parse(localStorage.getItem("wrongWords") || "[]");
    },

    saveWrongWords: function(list){
        localStorage.setItem("wrongWords", JSON.stringify(list));
    },

    addWrongWord: function(wordObj){
        let list = this.getWrongWords();
        if(!list.find(w => w.word === wordObj.word)){
            list.push(wordObj);
            this.saveWrongWords(list);
        }
    },

    removeWrongWord: function(word){
        let list = this.getWrongWords();
        list = list.filter(w => w.word !== word);
        this.saveWrongWords(list);
    },

    // ====== PLAYER DATA ======
    getPlayer: function(){
        return JSON.parse(localStorage.getItem("playerData") || '{"xp":0,"level":1,"combo":0}');
    },

    savePlayer: function(player){
        localStorage.setItem("playerData", JSON.stringify(player));
    },

    // ====== TEXTS ======
    getTexts: function(){
        return JSON.parse(localStorage.getItem("texts") || "[]");
    },

    saveText: function(content){
        let texts = this.getTexts();
        let newText = {
            id: crypto.randomUUID(),
            content: content,
            date: new Date().toISOString()
        };
        texts.push(newText);
        localStorage.setItem("texts", JSON.stringify(texts));
        return newText;
    },

    deleteText: function(id){
        let texts = this.getTexts().filter(t => t.id !== id);
        localStorage.setItem("texts", JSON.stringify(texts));
    },

    // ====== WORD LISTS ======
    getWordLists: function(){
        return JSON.parse(localStorage.getItem("wordLists") || "[]");
    },

    saveWordLists: function(lists){
        localStorage.setItem("wordLists", JSON.stringify(lists));
    },

    createList: function(name){
        let lists = this.getWordLists();
        lists.push({ name, words: [] });
        this.saveWordLists(lists);
    },

    addWordToList: function(listIndex, wordObj){
        let lists = this.getWordLists();
        if(lists[listIndex]){
            lists[listIndex].words.push(wordObj);
            this.saveWordLists(lists);
        }
    },

    removeWordFromList: function(listIndex, wordIndex){
        let lists = this.getWordLists();
        if(lists[listIndex]){
            lists[listIndex].words.splice(wordIndex,1);
            this.saveWordLists(lists);
        }
    }

};
