/* ═══════════════════════════════════════════════════════════
   js/tag.js  —  Etiket sistemi
   • getAutoLevel(word) → "A1" | null  (A1 listesi dahili)
   • renderTagChips    → seçili chip'lerde × silme butonu
═══════════════════════════════════════════════════════════ */

export const TAG_OPTIONS = [
  "fiil","isim","sıfat","zarf","A1","A2","B1","B2","seyahat","iş"
];

// ── Stil enjeksiyonu (bir kez) ────────────────────────────────
let _cssDone = false;
function _injectStyle() {
  if (_cssDone) return; _cssDone = true;
  const s = document.createElement('style');
  s.textContent = `
    .tag-chip { display:inline-flex; align-items:center; gap:3px; }
    .tag-chip-del {
      display:inline-flex; align-items:center; justify-content:center;
      width:15px; height:15px; border-radius:50%;
      font-size:12px; font-weight:700; line-height:1;
      cursor:pointer; opacity:0.5;
      transition:opacity 0.15s, background 0.15s;
      flex-shrink:0; margin-left:2px;
    }
    .tag-chip-del:hover { opacity:1; background:rgba(255,255,255,0.18); }
  `;
  document.head.appendChild(s);
}

// ── Kelime normalizasyonu ─────────────────────────────────────
function _norm(w) {
  if (!w) return '';
  return w.trim().toLowerCase()
    .replace(/^(der|die|das)\s+/i, '')  // artikel sil
    .split(',')[0].trim()               // "ein, eine" → "ein"
    .split(' ')[0].trim();              // "zu Hause" → "zu"
}

// ── A1 Ham Kelime Listesi ─────────────────────────────────────
const _A1_RAW = [
  "der Abend","alles","antworten","auch","auf","aus","die Aussage","bisschen","bitte","danke",
  "dann","Deutsch","der Dialog","dir","du","ein","eine","die Entschuldigung","er","es",
  "die Form","die Frage","fragen","die Frau","ganz","gehen","die Grammatik","gut","hallo",
  "heißen","der Herr","hören","ich","Ihnen","ihr","im","ja","klar","kommen","der Kurs",
  "der Kursteilnehmer","die Kursteilnehmerin","das Land","lesen","der Mann","mein","meine",
  "mit","morgen","die Nacht","der Name","nein","neu","nicht","oder","die Person","richtig",
  "der Satz","schreiben","sehr","sein","sie","Sie","so","die Sprache","sprechen","supergut",
  "der Tag","Tschüss","und","was","welche","wer","das Wiedersehen","wie","wissen","wo",
  "woher","das Wort",
  "aber","die Adresse","alt","anmelden","die Anmeldung","arbeiten","das Bild","der Bruder",
  "buchstabieren","dein","deine","einmal","die Eltern","falsch","die Familie","der Familienname",
  "der Familienstand","das Formular","geschieden","die Geschwister","haben","die Handynummer",
  "die Hausnummer","das Heimatland","hier","Ihr","Ihre","in","die Information","das Jahr",
  "jetzt","kein","keine","das Kind","der Kindergarten","der Kontakt","leben","ledig",
  "die E-Mail","möchten","die Mutter","nach","der Nachname","noch","die Postleitzahl",
  "die Schwester","die Schwägerin","die Schwiegertochter","der Schwiegervater","der Sohn",
  "die Straße","die Telefonnummer","die Tochter","über","der Vater","vergleichen",
  "verheiratet","verwitwet","viel","viele","der Vorname","vorstellen","welcher","welches",
  "willkommen","wir","wohnen","der Wohnort","die Zahl","zu",
  "also","an","andere","benutzen","das Blatt","der Bleistift","das Buch","da",
  "der Deutschkurs","der Dienstag","doch","der Donnerstag","endlich","erklären","erzählen",
  "das Familienfoto","der Feiertag","das Fenster","das Foto","der Freitag","der Freund",
  "für","genau","gestern","groß","der Gruß","die Hausaufgabe","das Heft","heute","immer",
  "die Karte","klein","knifflig","der Kugelschreiber","das Kursbuch","der Kursraum",
  "die Lampe","die Landkarte","langsam","der Lehrer","die Lehrerin","lernen","liebe","lieber",
  "die Liste","machen","mir","der Mittwoch","der Montag","natürlich","nett","das Papier",
  "der Papierkorb","die Pause","das Problem","der Projektor","der Radiergummi","der Raum",
  "der Rucksack","die Sache","sagen","der Samstag","sehen","die Seite","der Schlüssel",
  "schnell","der Sonntag","der Spaß","spielen","der Spitzer","der Stuhl","die Tabelle",
  "die Tafel","die Tasche","der Text","der Tisch","die Tür","übermorgen","die Übung",
  "das Übungsbuch","verstehen","vorgestern","die Wand","die Woche","das Wochenende",
  "das Wörterbuch","zeigen","der Zettel","zusammen",
  "das Angebot","die Antwort","der Apfel","der Apfelsaft","die Aufgabe","die Babynahrung",
  "die Banane","der Becher","das Beispiel","das Bier","die Birne","das Bistro",
  "die Blaubeere","die Bohne","brauchen","das Brot","das Brötchen","der Cent","die Cola",
  "der Couscous","denn","diese","dieser","dieses","die Dose","durch","das Ei",
  "der Einkaufszettel","einige","die Erbse","die Erdbeere","essen","etwas","fertig",
  "der Fisch","die Flasche","das Fleisch","frisch","das Frühstück","frühstücken","gemeinsam",
  "das Gemüse","gern","das Getränk","das Glas","gleich","das Gramm","die Himbeere",
  "der Honig","der Joghurt","der Kaffee","die Kartoffel","der Käse","kaufen","der Keks",
  "die Kichererbse","das Kilo","die Kirsche","die Kiwi","die Kontrolle","kosten","der Kuchen",
  "der Kunde","die Kundin","kurz","das Lammfleisch","das Lebensmittel","die Limonade",
  "der Liter","man","die Mandarine","die Mango","der Markt","die Marmelade","das Mehl",
  "meistens","die Mengenangabe","die Melone","die Milch","das Milchprodukt","mögen",
  "die Möhre","müssen","nehmen","die Nudel","nur","das Obst","der Obstsalat","das Olivenöl",
  "die Orange","ordnen","die Packung","die Paprika","der Partner","die Partnerin","das Pfund",
  "der Pilz","planen","der Preis","pro","der Pudding","der Reis","das Rindfleisch","der Saft",
  "die Sahne","der Salat","das Salz","sich","schmecken","die Schokolade","schön",
  "das Schweinefleisch","sonst","stehen","streichen","das Stück","die Tasse","der Tee",
  "teuer","der Tipp","die Tomate","die Traube","trinken","unterstreichen","verbinden",
  "der Verkäufer","die Verkäuferin","von","das Wasser","der Wein","die Zitrone",
  "der Zucker","die Zwiebel",
  "abends","der Alltag","anrufen","die Arbeit","aufstehen","beginnen","beide","das Bett",
  "bis","das Büro","der Computer","das Computerspiel","erst","fernsehen","der Film",
  "die Freundin","früh","der Fußball","geöffnet","grillen","halb","der Hunger","die Idee",
  "das Interview","kochen","können","lecker","leider","manchmal","mehr","der Mittag",
  "mittags","die Mittagspause","der Morgen","morgens","müde","die Musik","der Nachmittag",
  "nachmittags","nachts","nie","der Notizzettel","oft","die Pizza","putzen","schade",
  "schlafen","der Schluss","die Schule","spät","spazieren","das Spiel","der Sport",
  "die Stunde","der Stundenplan","der Supermarkt","telefonieren","tun","die Uhr",
  "die Uhrzeit","um","der Unterricht","das Viertel","vor","der Vormittag","vormittags",
  "wann","die Wohnung","zeichnen","die Zeit","zu Hause",
  "ab","der Altbau","die Angabe","die Anzeige","das Arbeitszimmer","das Bad","baden",
  "die Badewanne","das Badezimmer","der Balkon","der Bauernhof","bei","bekommen",
  "der Besichtigungstermin","besser","billig","breit","circa","dazu","die Diele","direkt",
  "dort","draußen","dringend","dunkel","die Dusche","das Einfamilienhaus","einkaufen",
  "das Elektrogerät","das Erdgeschoss","ersetzen","der Euro","der Fernseher","finden",
  "die Firma","der Flur","frei","die Garage","der Garten","der Gast","das Geld","gemütlich",
  "gepflegt","das Gerät","das Geschäft","das Gespräch","die Größe","grün","hängen","hässlich",
  "die Hauptsache","das Haus","das Haustier","die Heizung","helfen","hell","der Herd",
  "die Hilfe","hinten","das Hochhaus","die Immobilie","insgesamt","interessant",
  "jeder","jede","jedes","der Juni","die Kaffeemaschine","kalt","die Kaution","der Keller",
  "das Kinderzimmer","der Kleiderschrank","die Küche","der Kühlschrank","lang","lassen",
  "laut","liebsten","liegen","maximal","das Mehrfamilienhaus","die Miete","mindestens",
  "die Möbel","möbliert","modern","der Monat","die Monatsmiete","der Müll","neben",
  "die Nebenkosten","ohne","das Obergeschoss","der Ort","die Pflanze","der Plan","der Platz",
  "der Quadratmeter","das Regal","das Reihenhaus","ruhig","schauen","das Schlafzimmer",
  "schmal","der Schrank","der Sessel","singen","sitzen","das Sofa","sofort","sollen",
  "das Sonderangebot","die Sonne","sonstiges","die Sprachschule","spülen","die Spülmaschine",
  "die Stadt","suchen","super","der Teppich","die Terrasse","die Toilette","toll",
  "die Traumwohnung","unbedingt","ungemütlich","unser","unsere","warum","waschen",
  "die Waschmaschine","das WC","wegziehen","weiter","wenn","werden","wichtig","wohnen",
  "die Wohnungsanzeige","die Wohnungssuche","das Wohnzimmer","wunderschön","wünschen",
  "zahlen","die Zeitung","das Zentrum","das Zimmer","zu Fuß",
  "die Ampel","die Ankunftszeit","die Ansage","die Apotheke","der Arzt","die Ärztin",
  "die Auskunft","außerdem","außerplanmäßig","das Auto","die Bahn","der Bahnhof","der Ball",
  "die Bank","bezahlen","die Bibliothek","das Bürgerbüro","der Bus","die Bushaltestelle",
  "das Café","dafür","dritte","die Durchsage","einfach","die Einzelfahrkarte","erste",
  "der Erwachsene","fahren","der Fahrgast","die Fahrkarte","das Fahrrad","fallen","fast",
  "der Flughafen","das Gebäude","geben","gegenüber","geradeaus","das Gleis","gültig",
  "halten","die Haltestelle","der Hauptbahnhof","hinter","das Hotel",
  "der Informationsschalter","der Intercity","das Jobcenter","das Kino","die Kirche",
  "das Krankenhaus","die Krankenkasse","die Kreuzung","die Kurzstrecke","die Linie","links",
  "die Lösung","der Meter","der Metzger","die Minute","die Mobilität","das Motorrad",
  "nachfragen","nächster","nächste","nächstes","nichts","öffentlich","die Orientierung",
  "der Park","die Parkgebühr","der Parkplatz","die Polizei","die Position","die Post",
  "praktisch","rechts","das Rathaus","die Regionalbahn","das Restaurant","die Ruhe",
  "der Schienenersatzverkehr","das Schwimmbad","selten","sowieso","später","der Stadtplan",
  "der Stadtwald","steigen","die Straßenbahn","die Tageskarte","das Taxi","überall",
  "umsteigen","ungefähr","unter","die Verfügung","das Verkehrsmittel","verstanden",
  "verzögern","die Volkshochschule","voll","vorbei","vorne","warten","der Weg","der Winter",
  "der Wochenmarkt","wohin","wollen","der Zug","zweimal","zweite","zwischen",
  "anfangen","der Arbeitstag","die Ausbildung","ausfüllen","die Aushilfe",
  "der Automechaniker","die Automechanikerin","backen","der Bäcker","die Bäckerin","bald",
  "berichten","der Beruf","beruflich","die Bürokauffrau","der Bürokaufmann","der Chef",
  "die Chefin","das Computerprogramm","das Computersystem","dauern","dreimal","der Fahrer",
  "fangen","der Feierabend","flexibel","fotografieren","freundlich","der Führerschein",
  "der Fußballspieler","die Gitarre","halbtags","die Hausfrau","der Hausmann","der Hund",
  "installieren","die Kantine","kaputt","die Kasse","der Kassierer","die Kassiererin",
  "die Kauffrau","der Kellner","die Kellnerin","klingeln","der Koch","die Köchin",
  "der Kollege","die Kollegin","das Konzert","korrigieren","das Kraftfahrzeug",
  "der Krankenpfleger","die Krankenschwester","kreativ","langweilig","die Leute",
  "die Mathematik","der Mechaniker","der Mensch","das Mittagessen","der Moment",
  "der Musiklehrer","die Musiklehrerin","der Nachtdienst","organisieren","der Pizzafahrer",
  "die Pizzeria","die Pflege","prüfen","pünktlich","das Radio","rechnen","der Rentner",
  "die Reparatur","reparieren","der Reporter","der Roman","schlimm","der Schüler",
  "die Schülerin","servieren","der Stress","der Student","die Studentin","studieren",
  "der Taxifahrer","die Taxifahrerin","der Techniker","das Telefon","der Traumberuf",
  "treffen","die Universität","unterrichten","vielleicht","wählen","die Werkstatt",
  "das Wiederhören","zuerst",
  "das Altenpflegeheim","anbei","die Anrede","der Arm","atmen","das Auge","der Bauch",
  "das Bein","die Bauchschmerzen","der Bescheid","die Besserung","der Betreff","bevor",
  "bleiben","der Brief","der Briefteil","die Brust","danach","das Datum","dürfen",
  "der Ellbogen","der Empfänger","das Entschuldigungsschreiben","erkälten","die Erkältung",
  "das Fieber","der Finger","das Gesicht","die Gesundheit","die Gesundheitskarte",
  "die Grippe","die Gruppe","das Haar","der Hals","der Hals-Nasen-Ohren-Arzt","das Halsweh",
  "die Hand","der Hausarzt","heiß","der Husten","Hustensaft","das Knie","der Kopf",
  "die Kopfschmerzen","der Körper","der Körperteil","krank","die Krankheit",
  "die Krankmeldung","der März","das Medikament","der Mund","der Nacken","die Nase",
  "die Notfallsprechstunde","das Ohr","der Orthopäde","der Patient","die Patientin","per",
  "das Pflaster","das Praktikum","die Praktikumsbetreuerin","die Praxis",
  "die Praxisgemeinschaft","rauchen","regelmäßig","das Rezept","rot","der Rücken","rund",
  "die Salbe","schicken","der Schmerz","der Schnupfen","die Schulter","schwanger","seine",
  "die Sprechstunde","die Sprechstundenhilfe","das Sprechzimmer","stark","die Stirn",
  "die Tablette","der Termin","der Tropfen","die Unterschrift","die Untersuchung",
  "der Verband","verschieden","die Vorsorge","das Wartezimmer","der Wechsel","wechseln",
  "wehtun","wieder","wiederkommen","der Zahn","der Zeh","zurzeit",
  "aufwachsen","beantworten","der Besuch","die Bewegung","bilden","die Blume","der Dienst",
  "extra","das Ferienhaus","früher","geboren","gerade","gucken","der Hausflur","heiraten",
  "das Hobby","der Ingenieur","die Insel","die Inselrundfahrt","kennen","der Koffer",
  "letzte","das Meer","der Mond","der Nachbar","die Nachbarin","die Natur","packen",
  "die Postkarte","die Reise","das Schiff","der Seehund","der Ski","der Strand","stressig",
  "das Studium","stundenlang","die Suppe","süß","das Tennis","der Tourist","unregelmäßig",
  "der Urlaub","verdienen","warten","das Wetter",
  "anziehen","der Anzug","beige","bequem","blau","blöd","die Bluse","braun","bringen",
  "denken","der Einkaufsbummel","eng","euch","die Farbe","furchtbar","gefallen",
  "gegenseitig","gelb","genauso","glauben","grau","günstig","das Hemd","die Hose","ihm",
  "die Jacke","die Jeans","der Jogginganzug","der Kassenbon","das Kaufhaus","die Klamotten",
  "klasse","das Kleid","die Kleidung","das Kleidungsstück","lila","der Mantel","meisten",
  "die Mode","das Modell","die Mütze","online","die Ordnung","das Paar","passen","positiv",
  "probieren","der Prospekt","der Pullover","raten","der Rock","der Schal","der Schuh",
  "schwarz","sicher","die Socke","der Sportschuh","die Strickjacke","der Strumpf","tragen",
  "das T-Shirt","typisch","überhaupt","umtauschen","uns","vergessen","der Wintermantel",
  "zurück",
  "die Achtung","der April","aufregen","der August","bauen","der Baum","besuchen","bewölkt",
  "die Braut","der Dank","darüber","die Deutschlandkarte","der Dezember","eben","einladen",
  "die Einladung","einverstanden","das Eis","der Februar","die Feier","feiern","das Fest",
  "freuen","froh","der Frühling","fühlen","die Gartenparty","der Geburtstag",
  "die Geburtstagstorte","das Geschenk","glücklich","der Glückstag","der Grad","hageln",
  "der Handschuh","der Hase","der Herbst","die Himmelsrichtung","die Hochzeit",
  "die Hochzeitsfeier","die Jahreszahl","die Jahreszeit","der Januar","der Juli",
  "der Kalender","lieben","der Luftballon","lustig","der Mai","die Mama","minus","mitbringen",
  "nass","nebelig","der Norden","der November","nun","der Oktober","das Oktoberfest",
  "die Oma","der Osten","das Osterei","das Osterfest","der Osterhase","das Ostern",
  "der Papa","räumen","reden","regnen","samstags","der Schatz","scheinen","schenken",
  "schlecht","der Schnee","der Schneemann","schneien","der Schokoladenkuchen","der Sekt",
  "der September","der Sommer","sonnig","die Spezialität","das Standesamt","stellen",
  "der Süden","tanzen","der Teller","die Torte","trocken","unglücklich","der Unglückstag",
  "warm","das Weihnachten","der Weihnachtsbaum","die Weihnachtsfeier",
  "das Weihnachtsgeschenk","der Weihnachtsmann","das Westdeutschland","der Westen",
  "der Wetterbericht","wieso"
];
const _A2_RAW = ["die Accessoires","anhaben","die Apfelschorle","die Aubergine","die Ausrüstung","der Babyartikel","die Badesachen","der Bart","die Bekleidung","bestimmt","blond","braten",
"bummeln","bunt","das Camping","der Champignon","die Currywurst","die Dame","darin","dick","der/die Dieb/in","das Ding","der Duft","dünn",
"das Duschgel","egal","das Ehepaar","einfarbig","die Elektronik","der Fahrradhelm","fantastisch","das Fast Food","die Flipflops","frittieren","die Gemüselasagne","gepunktet",
"das Gericht","gestreift","glatt","die Glatze","das Gold","griechisch","die Gulaschsuppe","der Gürtel","die Haarpflege","das Hauptgericht","die Hautpflege","hübsch",
"die Kamera","kariert","das Kompliment","der Kopfhörer","die Kosmetiktasche","die Krawatte","das Küchengerät","laufen","die Lieblingsfarbe","lockig","das Make-up","die Maus",
"das Mineralwasser","das Modegeschäft","der Modeschmuck","nachher","die Naturkosmetik","das Navigationsgerät","der Ofen","der Ohrring","die Parfümerie","die Pfanne","plötzlich","der/die Polizist/in",
"der Schafskäse","scharf","schauen","das Schaufenster","schick","schlank","der Schmuck","das Schnäppchen","das Schnitzel","der Schnurrbart","der Schrei","die Schuhgröße",
"die Shorts","das Silber","der Snack","die Spielwaren","das Steak","stehlen","der Stiefel","die Süßigkeiten","das Tattoo","der Toaster","ungarisch","die Unterwäsche",
"das Vanilleeis","der/die Vegetarier/in","vegetarisch","wandern","der Wanderschuh","der Wecker","wirklich","wunderbar","zubereiten","die Zucchini","absetzen","die Abteilung",
"angeben","der Anruf","der/die Anrufer/in","der/die Arbeitgeber/in","der Arbeitsauftrag","der Arbeitsbeginn","der Arbeitsschutz","der Arbeitsvertrag","der Aufzug","der Außendienst","ausmachen","der/die Beauftragte",
"bereit","bereitstellen","besprechen","die Besprechung","betätigen","betreffen","bewahren","bewegen","der Bildschirm","der Brand","die Brandbekämpfung","der Brandfall",
"der Brandmelder","der Brandschutz","brennen","die Buchhaltung","danken","deutlich","echt","die Einweisung","die Elektrik","der Entwurf","erlauben","erwarten",
"erwischen","der Feuerlöscher","die Flamme","folgen","gefährden","gestalten","gesund","die Grafik","der/die Grafiker/in","die Hektik","heraussuchen","hinfahren",
"höflich","der Internetzugang","der Kabelsalat","kennzeichnen","die Kerze","das Konto","die Kontoverbindung","kopieren","die Kraft","die Kundenbetreuung","der Laptop","das Marketing",
"die Mehrfachsteckdose","mitschreiben","die Nachbereitung","nennen","die Personalabteilung","das Personalbüro","der/die Personalleiter/in","das Protokoll","reagieren","die Regel","der Rettungswagen","die Rückfrage",
"das Sekretariat","die Sicherheit","die Steckdose","die Steuer","das Teelicht","überlasten","unbürokratisch","unterstützen","verabschieden","verbessern","verboten","das Verhalten",
"verlegen","vermeiden","die Vermeidung","die Versicherung","der Vertrieb","verwenden","vorbeikommen","vorbereiten","die Vorschrift","der Werbeflyer","die Werbeagentur","der/die Werbetexter/in",
"aggressiv","anders","die Angst","aufhören","aufpassen","ausreichend","befriedigend","die Begrüßung","beraten","der Bericht","das Berufskolleg","der Berufswunsch",
"die Biologie","das Bundesland","die Chemie","damals","dieselbe","das Diplom","der Elternabend","der Elternsprechtag","der/die Englischlehrer/in","die Erdkunde","etwa","das Fach",
"die Fachhochschule","die Fachhochschulreife","der Fluss","formell","der/die Fotograf/in","freiwillig","die Gesamtschule","die Geschichte","das Gipsbein","das Glück","das Gymnasium","das Halbjahr",
"die Hauptschule","hinfallen","der Integrationsverein","der/die Jugendliche","der Junge","die Kindertagesstätte","die Klasse","die Klassenarbeit","der/die Klassenlehrer/in","der Knöchel","der Korb","die Kunst",
"das Lieblingsfach","lösen","die Lust","das Mädchen","mangelhaft","die Mathearbeit","die Meinung","die Nachhilfe","normal","die Note","die Oberschule","olympisch",
"die Pflicht","die Physik","der/die Pilot/in","die Planung","die Realschule","die Rede","die Religion","das Schaubild","schrecklich","die Schulform","der/die Schulleiter/in","die Schulpflicht",
"das Schulsystem","selbst","der/die Sozialpädagoge/-pädagogin","der Sportunterricht","streng","die Tagesordnung","der Teenager","teilnehmen","das Tier","der/die Tierpfleger/in","träumen","traurig",
"turnen","umknicken","unfair","ungenügend","die Uniform","unten","der Unterschied","die Variante","die Vergangenheit","der Vokabeltest","der Vortrag","werfen",
"die Akupunktur","die Alternative","anerkannt","die Anweisung","die Auflistung","die Behandlung","belegen","die Bescheinigung","der Boden","dagegen","damit","der Eiswürfel",
"empfindlich","engagieren","entspannen","die Entspannung","erfahren","erstatten","fit","gesamt","gesundheitlich","die Gymnastik","das Handgelenk","das Hausmittel",
"die Haut","hiermit","hierzu","hochlegen","holen","klagen","kommunizieren","kompliziert","die Kostenerstattung","die Kostenübernahme","kühlen","leihen",
"manche","die Massage","massieren","die Meditation","der Muskel","die Nebenwirkung","das Pilates","der Rat","reizen","die Rückenmuskulatur","schlafengehen","schlagen",
"die Schmerztablette","die Schwellung","selber","speziell","die Sportart","der Sportverein","ständig","stärken","der Tanzkurs","die Teilnahme","die Teilnahmebescheinigung","telefonisch",
"die Therapie","der/die Trainer/in","treiben","die Tüte","die Übelkeit","übersenden","überweisen","übrigens","die Verabschiedung","vermitteln","verschreiben","der/die Versicherungsnehmer/in",
"der Versicherungstarif","die Verspannung","während","die Wärmflasche","weggehen","zwischendurch","abheben","die Aktivität","anfordern","die Armut","aufheben","ausdrucken",
"die Bankkarte","der/die Bankkaufmann/Bankkauffrau","die Bankleitzahl","der Bankschalter","bar","das Bargeld","bargeldlos","die Basis","begleichen","berechnen","die Bestellnummer","die Bestellung",
"der BIC","der Blick","die Broschüre","drücken","eigen","die Eingabe","eingeben","einzahlen","erledigen","eröffnen","die Filiale","folgend",
"formulieren","die Gebühr","der Geldautomat","die Geldbörse","das Geldstück","genießen","gewinnen","die Girocard","das Girokonto","das Hufeisen","die IBAN","indirekt",
"die Innenstadt","jederzeit","das Kleeblatt","das Kleingeld","der Kontoauszug","der/die Kontoinhaber/in","die Kontonummer","der Kontostand","kontrollieren","das Kreditinstitut","die Kreditkarte","die Kundennummer",
"die Kundenreferenz","der Laden","die Leistung","die Menge","mobil","monatlich","die Münze","niemand","der Nulltarif","nutzen","das Online-Banking","der Pfennig",
"der PIN","der Quatsch","die Rechnung","der Rechnungsbetrag","die Rechnungsnummer","reich","der Reichtum","der Respekt","der Schein","schieben","schlachten","der/die Schornsteinfeger/in",
"das Sparkonto","das Sparschwein","spätestens","stecken","stoßen","die TAN","die Taste","der/die Täter/in","der Überfall","überfallen","die Überwachungskamera","die Überweisung",
"das Überweisungsformular","der Versuch","der Verwendungszweck","der Vorteil","weglaufen","der/die Zahlungsempfänger/in","der Zeitungsartikel","der/die Zeuge/Zeugin","zurückgeben","abschalten","der Appetit","ärgern",
"asiatisch","der Ausflug","ausgezeichnet","der Ausgleich","außer","die Aussicht","der/die Babysitter/in","die Band","das Basketball","basteln","das Besteck","der Chor",
"daheim","der Daumen","der Einlass","entlang","das Event","das Feuerzeug","die Freizeit","die Freizeitaktivität","das Freizeitangebot","das Freizeitvergnügen","die Gabel","die Gastronomie",
"das Gedicht","der Gegensatz","der/die Geiger/in","gemischt","das Geschirr","der Grill","die Grillkohle","der Grillplatz","die Grillsoße","die Grillzange","herrlich","herum",
"interessieren","der/die Interviewpartner/in","irgendwo","jährlich","jeweils","knackig","konzentrieren","der Kumpel","die Leidenschaft","der Löffel","malen","meist",
"das Messer","mitfahren","nähen","normalerweise","das Open-Air-Konzert","der Poetry-Slam","die Regie","der Saal","das Schach","der Schnupperkurs","die Schüssel","segeln",
"der Sieg","das Spielfeld","das Sportergebnis","der Sportplatz","surfen","der Tango","der/die Tänzer/in","die Tischdecke","die Tischdekoration","trotzdem","umfangreich","die Umfrage",
"die Umkleide","unterhalten","veranstalten","der Veranstaltungshinweis","verbringen","die Verpackung","verteilen","das Volleyballspiel","die Vorlesung","wundervoll","die Abendkasse","abholen",
"aktuell","alle","anklicken","die App","aussuchen","der Benutzername","bestellen","chatten","die Datei","dich","diskutieren","drucken",
"der Eintritt","empfehlen","die Empfehlung","flirten","der Flohmarkt","das Forum","funktionieren","gebraucht","googeln","herausfinden","herunterladen","hochladen",
"informieren","international","das Internet","das Kennwort","die Kinokarte","klicken","der Kommentar","kostenlos","das Kulturcafé","der/die Leser/in","löschen","mailen",
"mich","mitkommen","mitmachen","nachschauen","der Neffe","nervös","Newsletter","oben","die Politik","prima","das Programm","die Radtour",
"der Regen","der Regenschirm","die Reihenfolge","reservieren","die Reservierung","die Rolle","sinken","das Smartphone","speichern","das Spielzeug","starten","die Startseite",
"steigen","das Straßenfest","das Symbol","tauschen","die Temperatur","das Theater","der Treffpunkt","unternehmen","die Verabredung","die Veranstaltung","der Veranstaltungstipp","der Vorschlag",
"die Welt","die Wettervorhersage","die Wirtschaft","das Würstchen","zeitweise","zuhören","zuschauen","abfahren","die Abfahrt","ankommen","die Ankunft","der Anschluss",
"der Anschlusszug","ausblenden","ausfallen","aussteigen","das Autofahren","der Automat","das Bahnfahren","der Bahnsteig","bitten","buchen","die Dauer","defekt",
"deshalb","drehen","drüben","die Einfahrt","einsteigen","erhalten","erreichen","der Fahrkartenschalter","der Fahrplan","der Fernbus","fliegen","das Flugzeug",
"der Grund","der Halt","hin","die Hinfahrt","der/die Mitarbeiter/in","mitnehmen","nah","nämlich","die Nummer","die Option","passieren","das Pech",
"planmäßig","preiswert","die Reisemöglichkeit","das Reiseziel","die Richtung","die Rückfahrt","der/die Schaffner/in","das Schild","schwarzfahren","schwierig","der/die Senior/in","der Serviceschalter",
"sondern","sparen","die Station","die Störung","die Strafe","die Strecke","umsteigen","die Umwelt","unterwegs","die Verbindung","verehrt, verehrte","verpassen",
"verschlafen","verspätet","die Verspätung","die Vorsicht","wenig","wohl","die Zeitschrift","der Zoo","ablesen","die Ablesung","abstellen","afrikanisch",
"das Altglas","aufschließen","ausführen","ausgeben","ausziehen","beachten","bedeuten","der Beinbruch","berufstätig","die Beschwerde","besichtigen","der Bezirk",
"der Biomüll","die Biotonne","das Brett","der Briefkasten","darum","dass","die Ecke","die Einbauküche","einrichten","die Einweihungsparty","die Einwurfzeit","einziehen",
"der Einzug","entsorgen","erfolgen","der Fahrradständer","die Fernwärme","das Gas","Gassi gehen","gehören","gesondert","der Glascontainer","der/die Hausbewohner/in","der/die Hausmeister/in",
"die Hausordnung","die Hausregel","die Hausreinigung","die Hausverwaltung","herzlich","hoch","Hof","hoffen","jemand","der Kellerzugang","der Kinderwagen","die Kleinmöbel",
"die Kommode","kündigen","legen","leidtun","der/die Lieferant/in","liefern","der/die Makler/in","der/die Mieter/in","der/die Mitbewohner/in","die Mitteilung","die Müllabfuhr","die Nachbarschaft",
"die Nachricht","der Nachtisch","die Nähe","ordnungsgerecht","privat","reichlich","der Restmüll","schließlich","schonen","setzen","sogar","sorgen",
"sorgfältig","Spaziergang","der Spiegel","der Stellplatz","die Tiefgarage","die Tonne","trennen","die Treppe","das Treppenhaus","übernehmen","umziehen","der Umzug",
"der Umzugskarton","die Vase","der Verbraucherzähler","vereinbaren","der/die Vermieter/in","vermieten","vorhanden","wegen","weil","weiterhin","die Wohngemeinschaft","die Wohnungsbesichtigung",
"der Wunsch","der Zähler","der Zugang","zuletzt","zuzüglich","abgeben","ablehnen","abmelden","die Abmeldung","ähnlich","das Amt","das Amtsdeutsch",
"ändern","der/die Angehörige","ankreuzen","die Anschrift","der Antrag","der/die Antragsteller/in","die Arbeitsagentur","die Arbeitserlaubnis","das Arbeitslosengeld","der Arbeitsplatz","die Arbeitsvermittlung","der Aufenthalt",
"die Aufenthaltserlaubnis","aufrufen","der Ausbildungsplatz","das Ausländeramt","die Ausländerbehörde","der Ausweis","beantragen","bearbeiten","die Behörde","die Berufsberatung","das Berufsinformationszentrum","der/die Cousin/e",
"dabei","das Dokument","der/die Ehepartner/in","die Eheschließung","das Einwohnermeldeamt","der/die Enkel/in","das Enkelkind","entschuldigen","das Familienbuch","die Familienkasse","das Familienmitglied","fehlen",
"das Finanzamt","die Geburt","das Geburtsdatum","das Geburtsland","der Geburtsname","der Geburtsort","die Geburtsurkunde","genehmigen","das Geschlecht","herein","hingehen","die Integration",
"der Integrationskurs","das Kindergeld","der/die Lebenspartner/in","der Lichtbildausweis","losfahren","männlich","die Nichte","notieren","der Personalausweis","der Reisepass","die Schwiegereltern","die Staatsangehörigkeit",
"das Team","der Teil","die Unterlagen","unterschreiben","die Urkunde","vollständig","die Webseite","weiblich","wiederholen","die Zulassungsstelle","zuständig","das Abitur",
"ablegen","abschließen","der Abschluss","anbieten","der/die Anfänger/in","die Architektur","das Ausland","der Autounfall","beenden","die Beratung","der Bereich","die Berufsausbildung",
"die Berufsschule","besonders","der Bildungsweg","die Büroorganisation","das Chaos","die Decke","das Ende","die Energie","enthalten","entscheiden","erforderlich","die Fitness",
"fliehen","fortgeschritten","der/die Frisör/in","genial","hoffentlich","jobben","die Kategorie","kaufmännisch","die Kenntnisse","die Kommunikation","kompakt","kürzen",
"die Kursgebühr","das Kurzprogramm","der Lebensweg","die Lehre","das Lehrmaterial","das Material","miserabel","mittlere","das Prost","die Prüfung","das Prüfungstraining","der Realschulabschluss",
"reisen","rhythmisch","schaffen","die Schulzeit","seit","das Semester","separat","die Situation","städtisch","die Terminplanung","der Test","das Thema",
"die Theorie","trainieren","das Training","der Trick","die Überraschung","die Überschrift","umschreiben","verlieben","verlieren","Vorbereitung","die Vorkenntnisse","das Vorstellungsgespräch",
"die Weiterbildung","das Yoga","das Zeitmanagement","das Zertifikat","das Zeugnis","zufrieden","der/die Ansprechpartner/in","der Aushilfsjob","aussehen","der/die Auszubildende","der/die Bäckereifachverkäufer/in","bedanken",
"bedienen","beeilen","begründen","das Beratungsgespräch","das Berufsfeld","der/die Bewerber/in","bieten","eindecken","genug","Grundschule","handwerklich","das Holz",
"der/die Informatiker/in","die Kneipe","kostenfrei","die Küchenhilfe","die Laufbahn","der Lebenslauf","lückenlos","melden","die Mittelschule","der/die Modedesigner/in","das Muster","nötig",
"ob","persönlich","professionell","die Reinigungsarbeiten","die Rente","der/die Restaurantfachmann/-frau","spezial","statt","die Stelle","das Stellenangebot","die Stellensuche","die Struktur",
"sympathisch","die Teilzeit","die Teilzeitstelle","tippen","der Tippfehler","der/die Tischler/in","üben","die Übersiedlung","unprofessionell","unsympathisch","unzufrieden","verrückt",
"das Volleyball","die Vollzeit","die Vollzeitstelle","die Voraussetzung","die Vorlage","zuverlässig",
]
const _B1_RAW = ["der Abfall","der Abflug","die Absage","aktiv","der Alkohol","angenehm","annulliert","die Anzeigetafel","der Aufruf","der Ausgang","die Ausstattung","der Behälter",
"betreten","der/die Bewohner/in","die Bordkarte","der/die Camper/in","der Campingplatz","der Check-in-Schalter","der Container","die Dienstreise","das Doppelbett","das Doppelzimmer","einchecken","die Einsteigezeit",
"das Einzelzimmer","erleben","der Flug","der/die Flugbegleiter/in","der Fluggast","die Fluggesellschaft","führen","füttern","das Gate","das Gepäck","die Gepäckausgabe","das Gepäckband",
"gestattet sein","die Halbpension","das Handgepäck","historisch","das Hostel","hygienisch","das Inlineskaten","die Jugendherberge","der Katalog","klettern","komfortabel","die Lage",
"das Lagerfeuer","landen","der Lärm","die Lautsprecherdurchsage","lebhaft","die Leine","der Leuchtturm","der Meerblick","mitten","der Nebel","neblig","das Paradies",
"der/die Passagier/in","die Passkontrolle","der Pilotenstreik","der Pool","rechtzeitig","das Reisebüro","der Reiseplan","die Reiseplanung","reiten","die Ruhezeit","sauber","die Sauberkeit",
"der Schalter","die Schlange","der Sonnenschirm","die Sonnenterrasse","der Sonnenuntergang","der Stern","stören","das Streichholz","streiken","die Taschenlampe","das Taschenmesser","traumhaft",
"übernachten","die Übernachtung","die Übernachtung mit Frühstück","die Umgebung","umgehend","verärgert","verreisen","verschieben","der Wanderer","die Wandertour","der Waschraum","der Wohnwagen",
"das Zelt","der Zoll","der Zuschlag","absprechen","der Abstellplatz","akzeptieren","anstreichen","der Ärger","ärgerlich","die Aufregung","die Ausnahme","das Balkongeländer",
"befestigen","behalten","beleidigen","die Beleidigung","berechtigt","beschimpfen","die Beschimpfung","beschweren","der Blumentopf","bohren","deswegen","dumm",
"eilig","einhalten","einlegen","einstellen","enden","die Entscheidung","entspannend","entsprechen","erhöhen","erleichtern","erwähnen","eskalieren",
"exotisch","fair","festkleben","die Freude","die Frist","fristgerecht","fristlos","der Gemeinschaftsraum","gesetzlich","hämmern","heizen","die Instandhaltung",
"klug","der Konflikt","die Kündigung","lüften","massiv","meckern","das Meerschweinchen","die Mieterhöhung","der Mietspiegel","der Mietvertrag","die Modernisierung","nachsehen",
"neugierig","obwohl","offenbar","protestieren","der/die Richter/in","die Rücksicht","sammeln","sauer","der Schaden","schmutzig","selbstverständlich","sinnlos",
"sinnvoll","sortieren","stinken","streiten","total","treu","überlegen","üblich","unglaublich","das Unrecht","das Urteil","vergleichbar",
"verpflichten","das Verständnis","der Verstoß","verstoßen","völlig","vorher","wegräumen","der Widerspruch","wütend","der Zeitraum","ziemlich","die Zimmerlautstärke",
"zugeben","zurücklassen","das Zusammenleben","zustimmen","der Zutritt","das Abgas","das Abwasser","das Altöl","das Altpapier","das Aluminium","andauernd","ankündigen",
"anstatt","die Begleitperson","belasten","die Belastung","beobachten","der Beutel","biologisch","die Chemikalie","der Deckel","doof","der Eierkarton","die Eierschale",
"einfallen","das Elektroauto","das Energiesparhaus","die Energiesparlampe","das Erdbeben","die Erde","die Erderwärmung","die Erlaubnis","der/die Förster/in","der Gegenstand","der Gegenvorschlag","giftig",
"der Haushalt","das Hochwasser","der/die Hörer/in","der Kaffeefilter","das Klima","der Klimawandel","die Konservendose","der Kunststoff","die Luft","die Matratze","das Metall","der Milchkarton",
"die Mülltonne","die Mülltrennung","die Naturkatastrophe","das Naturprodukt","die Obstschale","der Papiermüll","die Pappe","das Picknick","der Planet","das Plastik","recyceln","der Sack",
"die Sammelstelle","schädigen","schädlich","der Schadstoff","schützen","die Solarenergie","der Sondermüll","der Sonnenschein","die Sorge","sparsam","der Sperrmüll","stattfinden",
"der Tierschutz","das Trinkwasser","trüb","der Tsunami","der Turm","umdrehen","umgehen","umweltfreundlich","der Umweltschutz","die Umweltverschmutzung","das Unwetter","verändern",
"verlaufen","verschmutzen","verschwenden","die Verschwendung","versprechen","verwerten","voraussichtlich","vorhersagen","wahrscheinlich","wegschmeißen","wegwerfen","der Wertstoff",
"der Wind","die Windel","der Wirbelsturm","die Wolke","zerstören","die Zerstörung","die Zigarettenkippe","zurückfahren","die AGB","anfassen","die Anprobe","anprobieren",
"die Art","die Artikelnummer","die Atmung","atmungsaktiv","aufmerksam","der Auftrag","die Auftragsnummer","ausliefern","die Auswahl","der Bankeinzug","bereits","beschädigt",
"die Bestellhotline","der Betrag","der Bezahlvorgang","das Callcenter","der Datenschutz","dicht","durchlässig","ebenso","eher","das Eigentum","die Ergänzung","erhältlich",
"eventuell","falls","der Gutschein","herstellen","die Herstellung","das Impressum","innerhalb","irgendwie","der Kauf","die Kaufbestätigung","der/die Käufer/in","der Kaufvertrag",
"die Kosmetik","die Kundenbefragung","kundenfreundlich","das Lager","lieferbar","die Lieferbedingung","die Lieferung","luftdurchlässig","die Mehrkosten","die Nachnahme","der Nachteil","der Onlineeinkauf",
"der Onlineshop","das Onlineshopping","das Paket","der Paketbote","der Paketdienst","das Porto","portofrei","die Portokosten","produzieren","die Qualität","die Reklamation","die Retoure",
"der Retourenschein","die Rücksendung","das Shopping","unverbindlich","der/die Verbraucher/in","verpacken","der Versand","die Versandkosten","versandkostenfrei","die Versandkostenpauschale","versenden","die Ware",
"der Warenkorb","wasserdicht","der Werktag","wetterfest","widerrufen","das Widerrufsrecht","die Zahlung","zurückschicken","zurücksenden","zurücktreten","zustellen","das Alter",
"anschauen","der Anstoß","anstrengend","das Autorennen","befragen","begeistern","beliebt","der Biergarten","das Boxen","die Chips","demnächst","die Detektivgeschichte",
"das Diagramm","die Diskussion","die Dokumentation","doppelt","dramatisch","der Durchschnitt","die DVD","ehrlich","einschlafen","einsetzen","das Eishockey","der Eiskunstlauf",
"entstehen","das Ereignis","erfolgreich","das Ergebnis","der/die Experte/Expertin","der Fan","der Fußballclub","die Gewohnheit","das Golf","der Handball","das Herz","der Horrorfilm",
"der/die Kandidat/in","der/die Kommissar/in","der/die Kommentator/in","die Komödie","der Krimi","kuscheln","die Langeweile","die Leichtathletik","die Lieblingsbeschäftigung","das Magazin","die Mannschaft","die Mehrheit",
"die Minderheit","mitreden","das Mittelfeld","die Moderation","der Mord","motiviert","naschen","die Niederlage","objektiv","die Quizshow","das Radrennen","die Rangliste",
"das Rätsel","die Reportage","der/die Reporter/in","retten","romantisch","die Runde","schalten","der Schiedsrichter","schießen","die Seifenoper","die Sendung","die Serie",
"siegen","der/die Sieger/in","der Skisport","die Soap","spannend","der/die Spieler/in","der Spielfilm","das Stadion","die Statistik","der Tagesablauf","die Talkshow","das Tor",
"der/die Torwart/in","der/die Tote","die Übertragung","unentschieden","ungesund","die Unterhaltung","der/die Verlierer/in","die Weltmeisterschaft","weshalb","zappen","der Zeichentrickfilm","die Zeitverschwendung",
"der/die Zuschauer/in","der/die Alliierte","die Amtssprache","anfangs","anheben","die Arbeitskraft","die Arbeitslosigkeit","der/die Astronaut/in","das Asyl","aufschreiben","aufteilen","der Auswanderer",
"die Auswanderung","die Besatzungszone","besiegen","der/die Bundeskanzler/in","die Bundesrepublik","der/die Bürger/in","der Bürgerkrieg","die Demokratie","demokratisch","die Demonstration","die Deutsche Demokratische Republik","ehemalig",
"einführen","einsperren","die Einwanderung","emotional","entwickeln","erinnern","die Erinnerung","ernähren","die Europäische Union","die Euroeinführung","der Flüchtling","fördern",
"die Fremdsprache","friedlich","der/die Gastarbeiter/in","das Gefühl","der/die Gegner/in","das Gehalt","das Gewürz","die Grenze","gründen","hart","die Hauptstadt","die Heimat",
"die Industrie","irgendwann","jahrelang","das Jahrhundert","das Jahrzehnt","der/die Jude/Jüdin","kaum","die Kindheit","der Krieg","das Kriegsende","die Krippe","der/die Kritiker/in",
"die Mauer","der Mauerbau","der Mauerfall","die Medizin","merken","die Migration","miteinander","miterleben","musikalisch","die Muttersprache","die Nachkriegszeit","der Nationalsozialismus",
"die NATO","die Notunterkunft","die Öffnung","die Phase","politisch","der Protest","die Regierung","die Republik","der/die Russlanddeutsche","der Staat","die Staatsgründung","das Stipendium",
"tatsächlich","die Teilung","verdrängen","vereinigen","verfolgen","verhaften","verlängern","verlassen","vermischen","das Visum","das Weltall","wiedervereinigen",
"die Wiedervereinigung","zerschlagen","zurückkehren","abschicken","die Abwicklung","amtlich","anerkennen","die Anerkennung","der Anfang","ansteckend","ausstellen","die Bearbeitung",
"beglaubigen","die Beglaubigung","der/die Bekannte","benötigen","berufen","bescheinigen","dran sein","einreichen","enttäuschen","die Enttäuschung","der Erhalt","die Erklärung",
"erkundigen","die Fähigkeit","die Fantasie","die Formalität","förmlich","die Fotokopie","der Frieden","das Führungszeugnis","garantieren","der Gedanke","die Geduld","geduldig",
"die Gemeinsamkeit","der Geruch","das Gesundheitszeugnis","gewährleisten","häufig","das Heimweh","herkommen","das Herkunftsland","hierher","hilfsbereit","inzwischen","die Kopie",
"die Mentalität","nachdenklich","der/die Pflegehelfer/in","die Pflegekraft","die Reihe","der/die Sachbearbeiter/in","der Sprachnachweis","übereinstimmen","überglücklich","übersetzen","die Übersetzung","das Übersetzungsbüro",
"ungeduldig","vermissen","verurteilen","wahr","weitergehen","wohlfühlen","das Ziel","zügig","zusammenstellen","abhängig","absolvieren","der/die Abteilungsleiter/in",
"abwechslungsreich","der/die Altenpfleger/in","die Anlage","die Annahme","anrechnen","die Anstellung","die Arbeitsstelle","die Arbeitsweise","die Arbeitszeit","die Assistenz","die Aufteilung","der Auszug",
"der Bachelor","beherrschen","beilegen","die Berufsbezeichnung","die Berufserfahrung","das Berufsleben","die Betriebswirtschaft","beurteilen","das Bewerbungsschreiben","der/die Bilanzbuchhalter/in","bisher","das Briefpapier",
"das Büromaterial","die Bürozeit","das Catering","daneben","eigenverantwortlich","eingehen","einschreiben","das Eintrittsdatum","der Empfang","empfangen","englischsprachig","entnehmen",
"die Erstellung","färben","das Fax","die Festanstellung","festlegen","finanziell","das Finanzwesen","der Firmensitz","fließend","der Föhn","fordern","die Formulierung",
"die Fortbildung","die Frisur","die Gehaltsvorstellung","der/die Geschäftsführer/in","die Geschäftsführung","gleichzeitig","die Handlung","die Herausforderung","individuell","insofern","intern","die Jobbezeichnung",
"der Kamm","die Kommunikationsstärke","kommunikativ","der Konferenzraum","die Kontaktdaten","kümmern","leistungsgerecht","leiten","der/die Manager/in","der Maschinenbau","meistern","der/die Millionär/in",
"mittelständisch","nachdem","das Niveau","das Original","der PC","der Posteingang","die Probezeit","die Qualifikation","regeln","der/die Sales Manager/in","schneiden","das Schreiben",
"seitdem","der/die Selbstständige","senden","das Seniorenheim","soweit","die Speise","spezialisieren","die Stellenanzeige","der Steuerberater","das Steuerberatungsbüro","die Teamfähigkeit","die Telekommunikation",
"der Terminkalender","traditionsreich","die Überstunde","der Umgang","die Umschulung","unbefristet","das Unternehmen","der Urlaubstag","verabreden","die Vergütung","die Verstärkung","weiterhelfen",
"die Weiterleitung","das Werkzeug","zaubern","zeitlich","der Zeitpunkt","zusätzlich","die Zusatzqualifikation","die Zuverlässigkeit","abdrehen","abheften","allerdings","anmachen",
"ansehen","aufdrehen","aufmachen","ausschalten","ausschlafen","das Besprechungszimmer","der Büroalltag","der/die Büroassistent/in","der Büroraum","die Dienstleistung","drinnen","einschalten",
"die Energiekosten","die Energieverschwendung","der/die Handwerker/in","die Heizkosten","indem","kippen","der/die König/in","der Kopierer","langfristig","mehrmals","die Million","mitdenken",
"offen","die Privatnummer","rasieren","die Reinigungsfirma","der Reinigungsvertrag","senken","stinksauer","der Strom","der Stromanbieter","die Stromkosten","tropfen","übergeben",
"unnötig","der Verbrauch","verschwenden","das Vertragsende","die Vertragsnummer","die Wärme","der Wasserhahn","die Weise","zudrehen","zumachen","die Zusammenarbeit","zusammenarbeiten",
"abnehmen","achten","die Allergie","allergisch","der Anbau","angewöhnen","auseinandersetzen","ausgewogen","ausprobieren","bedenklich","die Bedingung","behaupten",
"die Berufstätigkeit","die Bevölkerung","bewusst","bio","das Bioprodukt","bloß","der/die Diabetiker/in","der Döner","durchschnittlich","das Einkommen","einseitig","das Eiweiß",
"erkennen","die Ernährung","der/die Esser/in","das Fertiggericht","fett","fix","fleischfrei","fleischlos","der Freundeskreis","der Frust","furchtbar","der Gang",
"der/die Gemüsehändler/in","der Geschmack","das Getreide","glutenfrei","grundsätzlich","der Hartweizen","die Haselnuss","der Hauptgrund","die Hülsenfrucht","industriell","die Institution","irgendwelche",
"irgendwer","das Kochbuch","kulinarisch","laktosefrei","die Laune","leiden","die Massentierhaltung","der Milchzucker","moralisch","der Nährstoff","das Nahrungsmittel","nebenbei",
"die Nuss","präsentieren","problemlos","der Quark","reduzieren","die Studie","die Tiefkühlpizza","tierisch","der Trend","überzeugen","vegan","der/die Veganer/in",
"vereinbar","versorgen","vertragen","der Verzehr","verzichten","vorbeigehen","der Wert","die Wurst","der Zeitmangel","der Zeitungsbericht","zufällig","zunehmen",
"der Zusatzstoff","abdecken","absichtlich","anfahren","ärztlich","aufkommen","ausparken","der Außenspiegel","der/die Autofahrer/in","die Automarke","das Autoteil","die Autoversicherung",
"das Benzin","beschädigen","betrunken","der Blinker","bremsen","das Dach","der Diebstahl","das Dorf","einbrechen","der/die Einbrecher/in","der Einbruch","einparken",
"die Fahrerseite","der/die Freiwillige","frustriert","der Gebrauchtwagen","die Haftpflicht","die Haftpflichtversicherung","der Hagel","der Hügel","die Kaskoversicherung","der Kilometer","der Kofferraum","korrekt",
"krachen","der Kratzer","lenken","lohnen","der Motor","die Motorhaube","der/die Motorradfahrer/in","nachdenken","der Neuwagen","das Nummernschild","der Oldtimer","optimistisch",
"parken","die Parklücke","der Personenschaden","PS","quietschen","regulieren","die Regulierung","der Reifen","das Rücklicht","die Rückscheibe","rückwärts","rutschen",
"der Sachschaden","der Schadensfall","die Scheibe","der Scheinwerfer","der Schläger","schwingen","der Sinn","der Sportwagen","die Stoßstange","der Straßenrand","der Straßenverkehr","der Sturm",
"das/der Sport Utility Vehicle","die Teilkaskoversicherung","überraschen","die Überschwemmung","umfallen","umso","der Unfall","die Unfallgefahr","verletzen","versehentlich","versichern","der/die Versicherungsberater/in",
"der Versicherungsschutz","verursachen","die Vollkaskoversicherung","vorschreiben","vorsichtig","wegfahren","die Windschutzscheibe","zulassen","zusammenstoßen","die Zusatzversicherung",
]
const _B2_RAW = ["der/die Arbeitgeber/-in","der/die Architekt/-in","der/die Automechaniker/-in","der Autoproduzent","die Beratung","die Betreuung","die Branche","der Betrieb","der Familienbetrieb","die Hilfsorganisation","das internationale Unternehmen","die Lebensmittelbranche",
"der Malerbetrieb","der soziale Bereich","beschäftigen","produzieren","geistig","handwerklich","sozial","die Grundschule","die weiterführende Schule","die Hauptschule","die Mittelschule","die Realschule",
"die Gesamtschule","das Gymnasium","der Haupt-/Realschulabschluss","das Abitur","die Mittlere Reife","die Berufsausbildung","der Berufsabschluss","der Bachelor","der Master","das Zertifikat","mehr als","weniger als",
"die Hälfte","ein Viertel","ein Drittel","jeder Zehnte","der/die Ansprechpartner/-in","die Beratungsstelle","das Berufspraktikum","die duale Ausbildung","die Fachschule","die Fortbildung","die Meisterprüfung","der Schichtdienst",
"die staatliche Ausbildung","die Weiterbildung","der Wunschberuf","die Zugangsvoraussetzungen","einen Beruf ausüben","jobben","in der Verwaltung arbeiten","sich selbstständig machen","zuständig sein","die Schwäche","die Stärke","belastbar",
"eigeninitiativ","flexibel","hilfsbereit","kreativ","lernbereit","organisiert","selbstbewusst","teamfähig","tolerant","verantwortungsbewusst","die Anerkennung","der Antrag",
"der Berufsabschluss","der Lebenslauf","die Unterlagen","das Zeugnis","die Zulassung","der Arbeitsablauf","das Berufsfeld","das Fachdeutsch","die Fachkräfte","der Fachwortschatz","der/die Handwerker/-in","der MINT-Beruf",
"die Teilzeit","die Vollzeit","der gefragte Beruf","der Umgang mit Kunden","die Berechtigung","die Förderung","der Lehrgang","der Nachweis über Deutschkenntnisse","die Vorkenntnisse","der/die Vermittler/-in","die Zugangsvoraussetzung","die Meisterprüfung machen",
"sich beruflich neu orientieren","die beglaubigte Kopie","die beglaubigte Übersetzung","die Qualifikation","das Übersetzungsbüro","der/die Einzelunternehmer/-in","der/die Geschäftspartner/-in","die freiberufliche Tätigkeit","sich selbständig machen","die Berufserfahrung","das Bewerbungstraining","die Spezialisierung",
"das Stellengesuch","die Anforderung","der/die Arbeitssuchende","das mittelständische Unternehmen","das Ehrenamt","die Schulbildung","die berufliche Station","die persönlichen Daten","verhandlungssicher","die ausgeschriebene Stelle","die Gehaltsvorstellung","die Herausforderung",
"das Arbeitsverhältnis","das Betriebsgeheimnis","das Gehalt","die Krankmeldung","die Kündigungsfrist","die Lohnfortzahlung","die Probezeit","die Überstunde","der Verdienst","die Vergütung","die Verschwiegenheitspflicht","die Anweisung",
"die Gefahrenstelle","das Schild","der Verbesserungsvorschlag","das Zeichen","die Alarmanlage","die ätzende Säure","das Berichtsheft","das brennende Material","die elektrische Spannung","das explosive Material","das giftige Material","auf Hygiene achten",
"der Krankenschein","die Krankmeldung","der Schwindel","der Stromschlag","die Übelkeit","die Haut kühlen","der Rettungsdienst","sich krankmelden","die Stromquelle","die Vertretung","der Unfallbericht","die antibakterielle Seife",
"die Ordnung","der Putzlappen","der Staubsauger","das Waschbecken","der Mengenrabatt","die Preisangabe","der Preisnachlass","der vereinbarte Termin","nachfragen","vorbeikommen","am Apparat","der Anrufbeantworter",
"das Missverständnis","das Berufsinformationszentrum","die Gastronomie","der Großhandel","der Einzelhandel","die Immobilienbranche","die IT-Branche","der Maschinenbau","die Medien","die Metallindustrie","der Öffentliche Dienst","die Pharmaindustrie",
"der Einkauf","die Finanzabteilung","die Geschäftsleitung","die Kundenbetreuung","das Lager","die Marketingabteilung","die Personalabteilung","die Produktion","die Berufschancen","der Einsatzplan","die Konkurrenz","der/die Vorgesetzte",
"die Ware","die Anredeform","die Firmenphilosophie","das Image","duzen","siezen","angemessen","förmlich","konservativ","locker","respektlos","traditionsreich",
"die Ausbildung","der Ausbildungsberuf","die Berufsfachschule","das Berufsinformationszentrum","das Berufskolleg","das Berufsvorbereitungsjahr","die Fortbildungsakademie","die Handelssprache","die Sprachkenntnisse","absolvieren","der erlernte Beruf","die fundierte Ausbildung",
"die Altersbegrenzung","das Anliegen","der Aushilfsjob","die Ausschreibung","die Bewerbungsunterlagen","die Jobbörse","der/die Personalchef/-in","beeindrucken","jobben","derzeitig","gelegentlich","gewissenhaft",
"reibungslos","zuverlässig","der/die Anlagenmechaniker/-in","der/die Bilanzbuchhalter/-in","der/die Bürokaufmann/-frau","der/die Gärtner/-in","der/die Gesundheits- und Krankenpfleger/-in","der/die Näher/-in","die Servicekraft","der Zimmerservice","die Aufstiegschancen","der Außentermin",
"die Besprechung","die Kantine","die Sozialleistungen","das Gehalt verhandeln","Karriere machen","die 40-Stunden-Woche","das Entgegenkommen","die Gleitzeit","die Kernzeit","die Wechselschicht","das Betreuungsangebot","die Tagesmutter",
"alleinerziehend","familienfreundlich","die An-/Abreise","der Besprechungsraum","die Buchungsbestätigung","das Doppelzimmer","das Einzelzimmer","die Fahrgemeinschaft","die Flugverbindung","das Gewerbegebiet","das Meeting","das Mietauto",
"die Parkmöglichkeit","das Tagungshotel","die Tiefgarage","die Zimmer-/Hotelkategorie","die Arbeitsplatzbeschreibung","die Qualitätssicherung","die Richtlinien","der/die Vorarbeiter/-in","das Vorgehen","der Aufkleber","der Aussteller","die Broschüre",
"das Datenblatt","das Detail","die Dienstleistung","der Flyer","das Give-away","der Großhändler","der Katalog","die Leistungsschau","das Logo","das Muster","das Poster","der Prospektständer",
"der Stand","das Start-up-Unternehmen","die To-do-Liste","der Veranstalter","die Visitenkarte","das Werbegeschenk","der Wettbewerber","innovativ","einzigartig","wettbewerbsfähig","die Ab-/Zusage","die Filiale",
"die Qualität","die Saison","die Wartung","die Anfrage","der Eilzuschlag","der Gesamtpreis","das Mailing","der Nettopreis","der Bruttopreis","die Neukundengewinnung","der Sonderwunsch","die Lieferkosten",
"der Preisnachlass","der Rabatt","die Ratenzahlung","das Skonto","die Vorauszahlung","der Werktag","der Versand","frühestens","spätestens","höchstens","mindestens","bankrott sein",
"die Bürokommunikation","die Vertriebskenntnisse","zukunftsorientiert","die Artikelnummer","die Bestellnummer","die Artikelbezeichnung","der Bestandskunde","die Kundennummer","der Neukunde","der Onlineshop","der Versandhandel","die Barzahlung",
"die Mahnung","das Onlinebanking","der Online-Bezahldienst","die Sicherheitsbedenken","der Zahlungsempfänger","die Zahlungserinnerung","das Budget","das Komma","das Drittel","das Achtel","das Viertel","die Bewertung",
"die Enttäuschung","die Konsequenzen","das Streitgespräch","der Vorfall","der Vorwurf","fehlerhaft","ungerecht","die Agenda","die Ankündigung","der Antrag","der Bericht","das Besprechungsprotokoll",
"das Ergebnisprotokoll","die Mitarbeiterbesprechung","die Projektvorstellung","der Rückblick","die Sitzung","der Tagesordnungspunkt","die Teambesprechung","das Verlaufsprotokoll","die Vorbesprechung","mailen","nachfragen","nachvollziehen",
"protokollieren","widersprechen","zustimmen","der Beamer","die Besprechungsunterlagen","der Flipchart","der Internetzugang","die Leinwand","die Moderationskarten","der Moderationskoffer","der Netzwerkanschluss","die Pinnwand",
"der Tagungsraum","das Whiteboard","der Ausblick","das Controlling","die Jahresbilanz","die Prognose","die Quartalsaufstellung","die Quote","knapp","ungefähr","die Abdeckung","der Anschlusskontakt",
"das Display","der Pfeil","der QR-Code","der Standort","der Touchscreen","der USB-Anschluss","aktualisieren","einrasten","einrichten","herunterladen","navigieren","zoomen",
"die Arbeitsunfähigkeit","die Bestimmungen","die Freistellung","der Freizeitausgleich","das Kalenderjahr","die Arbeitsschutzschuhe","die Berufsgruppe","die Blutung","der/die Ersthelfer/-in","die Evakuierung","der Flucht-/Rettungsweg","der Gehörschutz",
"der Notausgang","die Platzwunde","der Rettungswagen","die Rutschgefahr","die Sammelstelle","der/die Sanitäter/-in","die Schutzausrüstung","die Schutzbrille","der Schutzhelm","die Stolper-/Sturzgefahr","die Abmahnung","die Ausnahmegenehmigung",
"die Beförderung","die Freistellung","die Führungsqualitäten","die Honorartätigkeit","der Minijob","die Nebentätigkeit","die Sperrzeit","der Werkvertrag","die Zeitarbeit","befristet","beiderseits","die Arbeitslosenversicherung",
"die Bruttovergütung","die Kirchensteuer","die Konfession","die Lohnsteuer","der Nettoverdienst","die Pflegeversicherung","die Rentenversicherung","der Solidaritätszuschlag","die Steuerklasse","abziehen","einbehalten","die Belegschaft",
"die Gleichberechtigung","die Integration","der/die Nachfolger/-in","der/die Schwerbehinderte","die Norm","das Qualitätsmanagementsystem","die Anforderung",]
// Set oluştur: artikel soyulmuş, küçük harf
const A1_WORDS = new Set(_A1_RAW.map(_norm).filter(Boolean));
const A2_WORDS = new Set(_A2_RAW.map(_norm).filter(Boolean));
const B1_WORDS = new Set(_B1_RAW.map(_norm).filter(Boolean));
const B2_WORDS = new Set(_B2_RAW.map(_norm).filter(Boolean));

// ── Otomatik seviye tespiti ───────────────────────────────────
export function getAutoLevel(word) {
  if (!word) return null;
  const n = _norm(word);
  if (!n) return null;
  if (A1_WORDS.has(n)) return 'A1';
  if (A2_WORDS.has(n)) return 'A2';
  if (B1_WORDS.has(n)) return 'B1';
  if (B2_WORDS.has(n)) return 'B2';
  return null;
}

// ── Kullanıcının tüm kelimelerinden unique tag'leri toplar ────
export function extractAllTags(words = []) {
  const set = new Set(TAG_OPTIONS);
  words.forEach(w => {
    if (Array.isArray(w.tags)) w.tags.forEach(t => set.add(t));
  });
  return [...set];
}

// ── Chip: silme butonu ────────────────────────────────────────
function _appendDelBtn(chip, isCustom) {
  const x = document.createElement("span");
  x.className = "tag-chip-del";
  x.textContent = "×";
  x.title = "Etiketi kaldır";
  x.addEventListener("click", e => {
    e.stopPropagation();
    if (isCustom) {
      chip.remove();                       // özel etiket: DOM'dan sil
    } else {
      chip.classList.remove("selected");   // standart etiket: sadece seçimi kaldır
      x.remove();
    }
  });
  chip.appendChild(x);
}

function _makeChip(tag, selected = false, isCustom = false) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "tag-chip" + (selected ? " selected" : "");
  chip.dataset.tag      = tag;
  chip.dataset.isCustom = isCustom ? "1" : "";

  const label = document.createElement("span");
  label.textContent = tag;
  chip.appendChild(label);

  if (selected) _appendDelBtn(chip, isCustom);

  chip.addEventListener("click", () => {
    const nowSel = chip.classList.contains("selected");
    if (nowSel) {
      chip.classList.remove("selected");
      chip.querySelector(".tag-chip-del")?.remove();
    } else {
      chip.classList.add("selected");
      _appendDelBtn(chip, isCustom);
    }
  });

  return chip;
}

// ── Ana render fonksiyonu ─────────────────────────────────────
export function renderTagChips(containerId, selected = [], allTags = TAG_OPTIONS) {
  _injectStyle();
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // Standart + kullanıcı tag'leri
  allTags.forEach(tag => {
    container.appendChild(_makeChip(tag, selected.includes(tag), false));
  });

  // selected içinde allTags'de olmayan özel etiketler
  selected.forEach(tag => {
    if (!allTags.includes(tag)) {
      container.appendChild(_makeChip(tag, true, true));
    }
  });

  // ── Özel etiket ekleme alanı ──
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;gap:6px;margin-top:8px;width:100%;";

  const input = document.createElement("input");
  input.placeholder = "Yeni etiket...";
  input.style.cssText = `
    flex:1;min-width:0;
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.12);
    border-radius:8px;color:white;
    font-size:12px;font-family:inherit;
    padding:6px 10px;outline:none;transition:0.2s;
  `;
  input.addEventListener("focus", () => input.style.borderColor = "#c9a84c");
  input.addEventListener("blur",  () => input.style.borderColor = "rgba(255,255,255,0.12)");

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "+ Ekle";
  addBtn.style.cssText = `
    padding:6px 12px;border-radius:8px;white-space:nowrap;
    border:1px solid rgba(201,168,76,0.4);
    background:rgba(201,168,76,0.1);color:#c9a84c;
    font-size:12px;font-family:inherit;cursor:pointer;
    font-weight:600;transition:0.2s;
  `;
  addBtn.addEventListener("mouseenter", () => addBtn.style.background = "rgba(201,168,76,0.2)");
  addBtn.addEventListener("mouseleave", () => addBtn.style.background = "rgba(201,168,76,0.1)");

  function addCustomTag() {
    const val = input.value.trim();
    if (!val) return;
    const existing = [...container.querySelectorAll(".tag-chip")]
      .find(c => c.dataset.tag.toLowerCase() === val.toLowerCase());
    if (existing) {
      if (!existing.classList.contains("selected")) {
        existing.classList.add("selected");
        _appendDelBtn(existing, !!existing.dataset.isCustom);
      }
    } else {
      container.insertBefore(_makeChip(val, true, true), wrapper);
    }
    input.value = "";
    input.focus();
  }

  addBtn.addEventListener("click", addCustomTag);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }
  });

  wrapper.appendChild(input);
  wrapper.appendChild(addBtn);
  container.appendChild(wrapper);
}

// ── Seçili tag'leri döndür ────────────────────────────────────
export function getSelectedTags(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return [...container.querySelectorAll(".tag-chip.selected")]
    .map(c => c.dataset.tag);
}