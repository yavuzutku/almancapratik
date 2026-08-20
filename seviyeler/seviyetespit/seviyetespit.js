/* ═══════════════════════════════════════════════════════════════
   ALMANCA SEVİYE TESPİT SINAVI — v2
   Gerçek CEFR mantığıyla çalışan seviye tespit motoru.

   Nasıl çalışır:
   - 5 bölüm (A1→C1), her bölümde 6 soru = 30 soru.
   - Sorular iki tipte olabilir: "mc" (çoktan seçmeli) veya
     "input" (klavyeyle yazılan serbest cevap — büyük/küçük harfe
     duyarlı kontrol edilir, çünkü Almancada isimler büyük harfle
     başlar ve bu, seviye ölçümünün bir parçasıdır).
   - Bazı sorularda `listen` alanı vardır: Web Speech API (tarayıcı
     sesi) ile o Almanca cümle okunur; kullanıcı dinleyerek cevaplar.
   - Seviye, toplam puana değil, her bölümü GERÇEKTEN geçip
     geçmediğine göre belirlenir: bir bölümde en az %60 doğru
     yapılmadıkça bir üst seviyeye "geçilmiş" sayılmaz. Bu, gerçek
     bir yerleştirme sınavının mantığıdır.
   ═══════════════════════════════════════════════════════════════ */

const PASS_RATIO = 0.6; // bir bölümü "geçmek" için gereken oran

const QUESTIONS = [

  /* ══════════════ A1 — Başlangıç ══════════════ */
  { level:'A1', section:'Bölüm 1: A1 — Başlangıç', type:'mc',
    q:`"Guten Morgen!" ne anlama gelir?`,
    choices:[`Günaydın`,`İyi akşamlar`,`İyi geceler`,`Merhaba`], answer:0,
    explanation:`"Guten Morgen" sabah selamlaşmasıdır: Günaydın.`,
    listen:`Guten Morgen!` },

  { level:'A1', section:'Bölüm 1: A1 — Başlangıç', type:'mc',
    q:`Ich ___ Student.`,
    choices:[`bin`,`bist`,`ist`,`sind`], answer:0,
    explanation:`"sein" fiilinin "ich" ile çekimi "bin"dir: Ich bin Student.`,
    listen:`Ich bin Student.` },

  { level:'A1', section:'Bölüm 1: A1 — Başlangıç', type:'input',
    q:`Boşluğu Almanca kelimeyle tamamla — büyük/küçük harfe dikkat et:\nIch habe eine ___ (kedi).`,
    answers:[`Katze`], caseSensitive:true, placeholder:`Almanca kelime`,
    explanation:`Doğru cevap "Katze"dir. Almancada tüm isimler büyük harfle başlar — bu yüzden "katze" değil "Katze" yazılmalıdır.`,
    listen:`Ich habe eine Katze.` },

  { level:'A1', section:'Bölüm 1: A1 — Başlangıç', type:'mc',
    q:`Saat 14:30. Almancada nasıl söylenir?`,
    choices:[`Halb drei`,`Viertel nach zwei`,`Viertel vor drei`,`Zehn nach zwei`], answer:0,
    explanation:`Almancada "halb drei" saat 14:30'u ifade eder (üçe yarım kalan an, yani 2:30) — Türkçedeki mantığın tersine, bir sonraki saate göre söylenir.`,
    listen:`Es ist halb drei.` },

  { level:'A1', section:'Bölüm 1: A1 — Başlangıç', type:'input',
    q:`Boşluğu doldur (cümle ortasında, küçük harfle yaz):\nDu ___ (sahip olmak) einen Hund.`,
    answers:[`hast`], caseSensitive:true, placeholder:`fiil çekimi`,
    explanation:`"haben" fiilinin "du" ile çekimi "hast"tır: Du hast einen Hund.`,
    listen:`Du hast einen Hund.` },

  { level:'A1', section:'Bölüm 1: A1 — Başlangıç', type:'mc', listen:`Ich wohne in Berlin, aber meine Familie wohnt in Hamburg.`,
    q:`Cümleyi dinle: konuşan kişi nerede yaşıyor?`,
    choices:[`Berlin`,`München`,`Hamburg`,`Köln`], answer:0,
    explanation:`Cümlede "Ich wohne in Berlin" (Berlin'de yaşıyorum) deniyor; Hamburg ailesinin yaşadığı yer.` },

  /* ══════════════ A2 — Temel ══════════════ */
  { level:'A2', section:'Bölüm 2: A2 — Temel', type:'mc',
    q:`Gestern ___ ich ins Kino gegangen.`,
    choices:[`bin`,`habe`,`war`,`hatte`], answer:0,
    explanation:`"gehen" fiili hareket bildirdiği için Perfekt'te "sein" yardımcı fiiliyle çekimlenir: Ich bin gegangen.`,
    listen:`Gestern bin ich ins Kino gegangen.` },

  { level:'A2', section:'Bölüm 2: A2 — Temel', type:'input',
    q:`Doğru edatı yaz (küçük harfle):\nIch komme ___ der Türkei.`,
    answers:[`aus`], caseSensitive:true, placeholder:`edat`,
    explanation:`Bir ülkeden/menşeden bahsederken "aus" edatı kullanılır: Ich komme aus der Türkei.`,
    listen:`Ich komme aus der Türkei.` },

  { level:'A2', section:'Bölüm 2: A2 — Temel', type:'mc',
    q:`Berlin ist groß, aber München ist ___.`,
    choices:[`klein`,`kleiner`,`am kleinsten`,`kleinste`], answer:1,
    explanation:`İki şey karşılaştırılırken sıfatın komparatif hali kullanılır: klein → kleiner.`,
    listen:`Berlin ist groß, aber München ist kleiner.` },

  { level:'A2', section:'Bölüm 2: A2 — Temel', type:'input',
    q:`Boşluğu doldur — büyük/küçük harfe dikkat et:\nMeine Schwester hat einen neuen ___ (araba) gekauft.`,
    answers:[`Wagen`], caseSensitive:true, placeholder:`Almanca kelime`,
    explanation:`"Wagen" (araba) bir isimdir, bu yüzden büyük harfle "Wagen" yazılmalıdır.`,
    listen:`Meine Schwester hat einen neuen Wagen gekauft.` },

  { level:'A2', section:'Bölüm 2: A2 — Temel', type:'mc',
    q:`Ich ___ heute nicht arbeiten, weil ich krank bin.`,
    choices:[`kann`,`kannst`,`könnt`,`können`], answer:0,
    explanation:`"können" fiilinin "ich" ile çekimi "kann"dır.`,
    listen:`Ich kann heute nicht arbeiten, weil ich krank bin.` },

  { level:'A2', section:'Bölüm 2: A2 — Temel', type:'mc', listen:`Am Wochenende gehe ich einkaufen und danach treffe ich meine Freunde im Park.`,
    q:`Cümleyi dinle: kişi hafta sonu ne yapıyor?`,
    choices:[`Alışverişe gidip arkadaşlarıyla buluşuyor`,`Bütün gün çalışıyor`,`Evde kalıp dinleniyor`,`Tatile çıkıyor`], answer:0,
    explanation:`Cümlede "einkaufen gehen" (alışverişe gitmek) ve "Freunde treffen" (arkadaşlarla buluşmak) geçiyor.` },

  /* ══════════════ B1 — Orta ══════════════ */
  { level:'B1', section:'Bölüm 3: B1 — Orta', type:'mc',
    q:`Wenn ich Zeit ___, würde ich dich besuchen.`,
    choices:[`habe`,`hätte`,`hatte`,`haben`], answer:1,
    explanation:`Gerçek dışı koşul cümlesinde (Konjunktiv II) "würde" ile birlikte "hätte" kullanılır.`,
    listen:`Wenn ich Zeit hätte, würde ich dich besuchen.` },

  { level:'B1', section:'Bölüm 3: B1 — Orta', type:'input',
    q:`Doğru ilgi zamirini yaz (küçük harfle):\nDer Mann, ___ ich geholfen habe, war sehr dankbar.`,
    answers:[`dem`], caseSensitive:true, placeholder:`ilgi zamiri`,
    explanation:`"helfen" fiili Dativ ister; maskulin Dativ ilgi zamiri "dem"dir.`,
    listen:`Der Mann, dem ich geholfen habe, war sehr dankbar.` },

  { level:'B1', section:'Bölüm 3: B1 — Orta', type:'mc',
    q:`Das Auto ___ gerade repariert.`,
    choices:[`wird`,`werden`,`ist`,`hat`], answer:0,
    explanation:`Edilgen (Passiv) çatı "werden" yardımcı fiiliyle kurulur: Das Auto wird repariert.`,
    listen:`Das Auto wird gerade repariert.` },

  { level:'B1', section:'Bölüm 3: B1 — Orta', type:'input',
    q:`Boşluğu doldur — büyük/küçük harfe dikkat et:\nSie interessiert sich sehr für ___ (müzik).`,
    answers:[`Musik`], caseSensitive:true, placeholder:`Almanca kelime`,
    explanation:`"Musik" bir isim olduğu için büyük harfle yazılır: Sie interessiert sich für Musik.`,
    listen:`Sie interessiert sich sehr für Musik.` },

  { level:'B1', section:'Bölüm 3: B1 — Orta', type:'mc',
    q:`Ich weiß nicht, ___ er heute noch kommt.`,
    choices:[`ob`,`dass`,`wenn`,`als`], answer:0,
    explanation:`Bir şeyin olup olmayacağından emin olunmadığında "ob" (…-ip …-mediğini) kullanılır.`,
    listen:`Ich weiß nicht, ob er heute noch kommt.` },

  { level:'B1', section:'Bölüm 3: B1 — Orta', type:'input', listen:`Nächstes Jahr möchte ich nach Spanien reisen, um dort Spanisch zu lernen.`,
    q:`Cümleyi dinle ve konuşanın gitmek istediği ülkeyi Almanca yaz (büyük harfle):`,
    answers:[`Spanien`], caseSensitive:true, placeholder:`ülke adı`,
    explanation:`Cümlede "nach Spanien reisen" (İspanya'ya seyahat etmek) geçiyor. Ülke isimleri de büyük harfle başlar: Spanien.` },

  /* ══════════════ B2 — Üst Orta ══════════════ */
  { level:'B2', section:'Bölüm 4: B2 — Üst Orta', type:'mc',
    q:`Trotz ___ Wetters gingen wir spazieren.`,
    choices:[`das`,`des`,`dem`,`den`], answer:1,
    explanation:`"trotz" edatı Genitiv ister; nötr Genitiv artikeli "des"tir: trotz des Wetters.`,
    listen:`Trotz des schlechten Wetters gingen wir spazieren.` },

  { level:'B2', section:'Bölüm 4: B2 — Üst Orta', type:'input',
    q:`Dolaylı anlatımda doğru fiil formunu yaz (küçük harfle, Konjunktiv I):\nEr sagte, er ___ (sein) sehr müde.`,
    answers:[`sei`], caseSensitive:true, placeholder:`fiil çekimi`,
    explanation:`Dolaylı anlatımda (yazılı/resmi dilde) "sein" fiilinin Konjunktiv I hali "sei"dir: Er sagte, er sei müde.`,
    listen:`Er sagte, er sei sehr müde.` },

  { level:'B2', section:'Bölüm 4: B2 — Üst Orta', type:'mc',
    q:`Das Haus, in ___ ich wohne, ist über hundert Jahre alt.`,
    choices:[`das`,`dem`,`der`,`denen`], answer:1,
    explanation:`Edat + ilgi zamiri: "in" Dativ ister, nötr Dativ ilgi zamiri "dem"dir.`,
    listen:`Das Haus, in dem ich wohne, ist über hundert Jahre alt.` },

  { level:'B2', section:'Bölüm 4: B2 — Üst Orta', type:'input',
    q:`Boşluğu isimleştirilmiş fiille doldur — büyük harfle başlamalı:\nDas ___ (früh aufstehen) fällt mir sehr schwer.`,
    answers:[`Frühaufstehen`], caseSensitive:true, placeholder:`isimleşmiş fiil`,
    explanation:`Fiiller isimleştirildiğinde (Nominalisierung) büyük harfle yazılır ve genelde birleşik yazılır: das Frühaufstehen.`,
    listen:`Das Frühaufstehen fällt mir sehr schwer.` },

  { level:'B2', section:'Bölüm 4: B2 — Üst Orta', type:'mc',
    q:`Die Aufgabe muss bis morgen ___ werden.`,
    choices:[`erledigt`,`erledigen`,`erledigte`,`erledigend`], answer:0,
    explanation:`Modal fiil + edilgen yapı: "muss erledigt werden" — Partizip II kullanılır.`,
    listen:`Die Aufgabe muss bis morgen erledigt werden.` },

  { level:'B2', section:'Bölüm 4: B2 — Üst Orta', type:'mc', listen:`Trotz des schlechten Wetters entschied sich das Team, das Spiel wie geplant durchzuführen.`,
    q:`Cümleyi dinle: takım neye rağmen maçı planlandığı gibi oynamaya karar verdi?`,
    choices:[`Kötü havaya rağmen`,`Sakatlıklara rağmen`,`Hakem kararına rağmen`,`Seyirci azlığına rağmen`], answer:0,
    explanation:`"Trotz des schlechten Wetters" = kötü havaya rağmen.` },

  /* ══════════════ C1 — İleri ══════════════ */
  { level:'C1', section:'Bölüm 5: C1 — İleri', type:'mc',
    q:`Hätte ich das gewusst, ___ ich anders gehandelt.`,
    choices:[`würde`,`hätte`,`habe`,`wäre`], answer:1,
    explanation:`Geçmişe yönelik gerçek dışı koşulda (Konjunktiv II Vergangenheit) "hätte...gehandelt" kullanılır.`,
    listen:`Hätte ich das gewusst, hätte ich anders gehandelt.` },

  { level:'C1', section:'Bölüm 5: C1 — İleri', type:'input',
    q:`Deyimi tamamla — büyük harfe dikkat et:\nEr hat den Nagel auf den ___ getroffen.`,
    answers:[`Kopf`], caseSensitive:true, placeholder:`Almanca kelime`,
    explanation:`"den Nagel auf den Kopf treffen" = tam üstüne basmak, deyimin sabit hâli budur.`,
    listen:`Er hat den Nagel auf den Kopf getroffen.` },

  { level:'C1', section:'Bölüm 5: C1 — İleri', type:'mc',
    q:`___ dessen, dass er sehr müde war, arbeitete er die ganze Nacht weiter.`,
    choices:[`Ungeachtet`,`Trotzdem`,`Obwohl`,`Dennoch`], answer:0,
    explanation:`"ungeachtet dessen, dass..." resmi/yazılı dilde kullanılan ileri düzey bir zıtlık bağlacıdır.`,
    listen:`Ungeachtet dessen, dass er sehr müde war, arbeitete er die ganze Nacht weiter.` },

  { level:'C1', section:'Bölüm 5: C1 — İleri', type:'input',
    q:`Boşluğu doldur — büyük harfle, doğru Dativ çoğul hâliyle:\nDie Entscheidung hängt von den ___ (koşullar) ab.`,
    answers:[`Umständen`], caseSensitive:true, placeholder:`Almanca kelime`,
    explanation:`"Umstand" kelimesinin çoğulu "Umstände", Dativ çoğulda ise "Umständen" olur: von den Umständen abhängen.`,
    listen:`Die Entscheidung hängt von den Umständen ab.` },

  { level:'C1', section:'Bölüm 5: C1 — İleri', type:'mc',
    q:`Der Politiker behauptete, er habe nichts davon ___.`,
    choices:[`gewusst`,`wissen`,`gewisst`,`weiß`], answer:0,
    explanation:`"wissen" fiilinin Partizip II hali düzensizdir: gewusst (gewisst değil).`,
    listen:`Der Politiker behauptete, er habe nichts davon gewusst.` },

  { level:'C1', section:'Bölüm 5: C1 — İleri', type:'input', listen:`Obwohl die Verhandlungen sich zäh hinzogen, einigten sich beide Parteien schließlich auf einen Kompromiss.`,
    q:`Cümleyi dinle: iki taraf sonunda ne üzerinde anlaştı? (Almanca, büyük harfle yaz)`,
    answers:[`Kompromiss`], caseSensitive:true, placeholder:`Almanca kelime`,
    explanation:`Cümlede "sich auf einen Kompromiss einigen" (bir uzlaşıya varmak) geçiyor.` },
];

/* Bölüm sırası (seviye ilerleme mantığı için) */
const LEVEL_ORDER = ['A1','A2','B1','B2','C1'];

const LEVELS = {
  A1: { name:"Başlangıç Seviyesi", emoji:"🌱", color:"#22c55e", bg:"rgba(34,197,94,0.1)", border:"rgba(34,197,94,0.25)",
    desc:`Almancayla yeni tanışıyorsun. Temel kelimeler ve basit cümleler kurabilirsin. <a href="/wordsadd/">Kelime ekleme aracıyla</a> günlük kelimeler öğrenerek başla, <a href="/artikel/">artikel bulucu</a> ile der/die/das farkını pekiştir.` },
  A2: { name:"Temel Seviye", emoji:"📗", color:"#86efac", bg:"rgba(134,239,172,0.08)", border:"rgba(134,239,172,0.2)",
    desc:`Günlük hayatta basit iletişimi sürdürebilirsin. Temel gramer kurallarına hakimsin. kısa Almanca metinler okuyarak, <a href="/quiz/">kelime quizi</a> ile öğrendiklerini pekiştirerek A2→B1 geçişini hızlandırabilirsin.` },
  B1: { name:"Orta Seviye", emoji:"📘", color:"#60c8f0", bg:"rgba(96,200,240,0.08)", border:"rgba(96,200,240,0.2)",
    desc:`Günlük hayatın büyük bölümünde Almancayı kullanabilirsin. <a href="/cumlebul/">Cümle örnekleri aracıyla</a> kelimeleri bağlamında öğrenmek, <a href="/dersler/">B1 derslerini</a> takip etmek B2'ye geçişini destekleyecek.` },
  B2: { name:"Üst Orta Seviye", emoji:"📙", color:"#818cf8", bg:"rgba(129,140,248,0.08)", border:"rgba(129,140,248,0.2)",
    desc:`Karmaşık konularda Almanca anlayabilir ve ifade edebilirsin. <a href="/metin/">Gerçek Almanca metinler</a> okuyarak öğrenebilirsin.` },
  C1: { name:"İleri Seviye", emoji:"🏆", color:"#c9a84c", bg:"rgba(201,168,76,0.1)", border:"rgba(201,168,76,0.25)",
    desc:`Almancayı akıcı ve etkili kullanabiliyorsun. Tebrikler! <a href="/cumlebul/">Cümle örnekleri</a> ve <a href="/blog/">blog yazıları</a> ile nüanslı ifadeleri geliştirmeye devam edebilirsin.` }
};

let current = 0, answered = false, answers = []; // answers: {q, correct, given}

/* ── Ekran geçişi ── */
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function highlightBlank(t){return escHtml(t).replace(/\n/g,'<br>').replace(/___/g,'<em>___</em>');}

/* ── Web Speech API ile Almanca telaffuz ── */
let deVoice = null;
function pickGermanVoice(){
  if(!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  deVoice = voices.find(v=>v.lang==='de-DE') || voices.find(v=>v.lang && v.lang.startsWith('de')) || null;
}
if('speechSynthesis' in window){
  pickGermanVoice();
  speechSynthesis.onvoiceschanged = pickGermanVoice;
}
function speak(text){
  if(!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  if(deVoice) u.voice = deVoice;
  u.rate = 0.92;
  const btn = document.getElementById('btn-listen');
  if(btn){
    btn.classList.add('playing');
    u.onend = ()=>btn.classList.remove('playing');
    u.onerror = ()=>btn.classList.remove('playing');
  }
  speechSynthesis.speak(u);
}

/* ── Testi başlat ── */
function startQuiz(){
  current = 0; answered = false; answers = [];
  show('screen-quiz'); renderQuestion();
  sessionStorage.removeItem('svt_result');
  document.dispatchEvent(new CustomEvent('svt:start'));
}
function restartQuiz(){ startQuiz(); }

/* ── Soruyu ekrana bas ── */
function renderQuestion(){
  const q = QUESTIONS[current]; answered = false;
  const pct = Math.round(((current+1)/QUESTIONS.length)*100);
  document.getElementById('progress-fill').style.width = pct+'%';
  document.getElementById('q-label').textContent = `Soru ${current+1} / ${QUESTIONS.length}`;
  document.getElementById('q-section-label').textContent = q.section;

  const correctSoFar = answers.filter(a=>a.correct).length;
  document.getElementById('score-pill').textContent = `✓ ${correctSoFar}`;

  const sw = document.getElementById('section-tag-wrap');
  const isNew = current===0 || q.section !== QUESTIONS[current-1].section;
  sw.innerHTML = isNew ? `<div class="section-tag">📌 ${escHtml(q.section)}</div>` : '';

  document.getElementById('q-num').textContent = String(current+1).padStart(2,'0');

  const badge = document.getElementById('q-type-badge');
  badge.textContent = q.type==='input' ? '✍️ Yazılı cevap' : '🔘 Çoktan seçmeli';

  const listenBtn = document.getElementById('btn-listen');
  if(q.listen){
    listenBtn.style.display = 'inline-flex';
    listenBtn.onclick = ()=>speak(q.listen);
  } else {
    listenBtn.style.display = 'none';
  }

  document.getElementById('q-text').innerHTML = highlightBlank(q.q);

  const box = document.getElementById('choices');
  box.innerHTML = '';

  if(q.type === 'input'){
    box.innerHTML = `
      <div class="text-input-wrap">
        <input type="text" class="text-input" id="text-answer" placeholder="${escHtml(q.placeholder||'Cevabını yaz')}" autocomplete="off" autocapitalize="off" spellcheck="false">
        <div class="input-hint">Büyük/küçük harfe dikkat et — cevap tam olarak eşleşmelidir.</div>
        <button class="btn-submit-answer" id="btn-submit-answer" type="button">Cevabı Gönder</button>
      </div>`;
    const input = document.getElementById('text-answer');
    const submit = document.getElementById('btn-submit-answer');
    submit.addEventListener('click', ()=>submitTextAnswer());
    input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); submitTextAnswer(); } });
    setTimeout(()=>input.focus(), 50);
  } else {
    const keys=['a','b','c','d'];
    q.choices.forEach((c,i)=>{
      const btn=document.createElement('button');
      btn.className='choice';
      btn.innerHTML=`<span class="choice-key">${keys[i]}</span> ${escHtml(c)}`;
      btn.addEventListener('click',()=>selectAnswer(i));
      box.appendChild(btn);
    });
  }

  document.getElementById('feedback-bar').className='feedback-bar';
  document.getElementById('btn-next').classList.remove('show');
  window.scrollTo(0,0);
}

/* ── Çoktan seçmeli cevap ── */
function selectAnswer(idx){
  if(answered) return; answered = true;
  const q = QUESTIONS[current];
  const btns = document.querySelectorAll('.choice');
  btns.forEach(b=>b.disabled=true);
  const ok = idx === q.answer;
  btns[idx].classList.add(ok?'correct':'wrong');
  if(!ok) btns[q.answer].classList.add('correct');
  answers.push({ q, correct: ok, given: q.choices[idx] });
  finishAnswer(ok, ok ? '' : `Doğru cevap: ${q.choices[q.answer]}`);
}

/* ── Yazılı cevap ── */
function submitTextAnswer(){
  if(answered) return;
  const q = QUESTIONS[current];
  const input = document.getElementById('text-answer');
  const given = (input.value||'').trim();
  input.disabled = true;
  document.getElementById('btn-submit-answer').disabled = true;
  answered = true;

  const ok = q.answers.some(correct=>{
    return q.caseSensitive ? given === correct : given.toLowerCase() === correct.toLowerCase();
  });

  input.style.borderColor = ok ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)';
  answers.push({ q, correct: ok, given: given || '(boş bırakıldı)' });
  finishAnswer(ok, ok ? '' : `Doğru cevap: ${q.answers[0]}`);
}

/* ── Ortak geri bildirim ── */
function finishAnswer(ok, correctLine){
  const q = QUESTIONS[current];
  const correctSoFar = answers.filter(a=>a.correct).length;
  document.getElementById('score-pill').textContent = `✓ ${correctSoFar}`;

  const fb=document.getElementById('feedback-bar');
  const icon=document.getElementById('feedback-icon');
  const txt=document.getElementById('feedback-text');
  fb.className='feedback-bar '+(ok?'ok':'ko')+' show';
  icon.textContent = ok?'✅':'❌';
  const head = ok ? 'Doğru!' : `Yanlış. ${correctLine}`;
  txt.innerHTML = `<strong>${escHtml(head)}</strong> ${escHtml(q.explanation)}`;
  document.getElementById('btn-next').classList.add('show');
}

function nextQuestion(){
  current++;
  if(current>=QUESTIONS.length) showResult();
  else renderQuestion();
}

/* ── Bölüm bazlı gerçek seviye belirleme ──
   Bir üst seviyeye "geçmek" için o bölümde en az %60 doğru gerekir.
   İlk başarısız olunan bölümde durulur; en son geçilen seviye sonuçtur. */
function determinePlacement(){
  let placement = 'A1';
  for(const lvl of LEVEL_ORDER){
    const inLevel = answers.filter(a=>a.q.level===lvl);
    const correct = inLevel.filter(a=>a.correct).length;
    const ratio = inLevel.length ? correct/inLevel.length : 0;
    if(ratio >= PASS_RATIO) placement = lvl;
    else break;
  }
  return placement;
}

function showResult(){
  const totalCorrect = answers.filter(a=>a.correct).length;
  const wrongs = answers.filter(a=>!a.correct);
  const placementCode = determinePlacement();

  document.dispatchEvent(new CustomEvent('svt:result', { detail:{ score: totalCorrect, wrongs, level: placementCode } }));
  sessionStorage.setItem('svt_result', JSON.stringify({ score: totalCorrect, level: placementCode, total: QUESTIONS.length }));

  paintResult(totalCorrect, placementCode, wrongs);
}

/* Daha önce kaydedilmiş bir sonucu (yanlış cevap detayı olmadan) ekrana bas.
   index.html tarafından, oturum açan bir kullanıcının eski sonucunu
   göstermek için kullanılır. */
function renderSavedResult(data){
  if(!data || typeof data.score !== 'number' || !LEVELS[data.level]) return;
  paintResult(data.score, data.level, []);
}
window.renderSavedResult = renderSavedResult;

function paintResult(totalCorrect, placementCode, wrongs){
  const lv = LEVELS[placementCode];
  show('screen-result');
  const pct = Math.round((totalCorrect/QUESTIONS.length)*100);

  document.getElementById('result-emoji').textContent = lv.emoji;
  document.getElementById('result-title').textContent = lv.name;
  document.getElementById('result-sub').textContent = '';

  const badge=document.getElementById('result-badge');
  badge.textContent = placementCode;
  badge.style.cssText = `background:${lv.bg};border:1px solid ${lv.border};color:${lv.color};font-size:18px;font-family:var(--fd);font-weight:800;`;

  document.getElementById('result-score-num').textContent = totalCorrect;
  document.getElementById('result-score-num').style.color = lv.color;

  const circle=document.getElementById('score-ring-circle');
  const circ=2*Math.PI*56;
  circle.style.stroke = lv.color;
  setTimeout(()=>{circle.style.strokeDashoffset = circ*(1-pct/100);},100);

  document.getElementById('res-correct').textContent = totalCorrect;
  document.getElementById('res-wrong').textContent = QUESTIONS.length-totalCorrect;
  document.getElementById('res-pct').textContent = pct+'%';
  document.getElementById('score-total').textContent = `/ ${QUESTIONS.length}`;

  const dc=document.getElementById('level-desc-card');
  dc.style.background = lv.bg; dc.style.borderColor = lv.border;
  document.getElementById('level-desc-title').style.color = lv.color;
  document.getElementById('level-desc-title').textContent = `${placementCode} — ${lv.name}`;
  document.getElementById('level-desc-text').innerHTML = lv.desc;

  const ws=document.getElementById('wrongs-section');
  const wl=document.getElementById('wrongs-list');
  if(wrongs.length>0){
    ws.style.display='block';
    wl.innerHTML = wrongs.map(({q,given})=>`
      <div class="wrong-item">
        <div class="wrong-q">${escHtml(q.q.replace(/\n/g,' '))}</div>
        <div class="wrong-answers">
          <span class="wrong-your">✗ Senin: ${escHtml(given)}</span>
          <span class="wrong-correct">✓ Doğru: ${escHtml(q.type==='input' ? q.answers[0] : q.choices[q.answer])}</span>
        </div>
      </div>`).join('');
  } else ws.style.display='none';
}