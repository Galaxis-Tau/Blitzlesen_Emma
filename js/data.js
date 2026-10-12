import { LEGACY_LISTS } from './legacy-lists.js';

// Editorial selection of frequent everyday vocabulary, not a corpus-ranked top 200.
// Each line intentionally contains 20 distinct infinitives / singular nouns.
export const VERBS = `
sein haben werden können müssen sagen machen geben kommen sollen wollen gehen wissen sehen lassen stehen finden bleiben liegen heißen
nehmen denken tun dürfen glauben halten nennen mögen zeigen führen sprechen bringen leben fahren meinen fragen kennen gelten stellen spielen
arbeiten brauchen folgen lernen bestehen verstehen setzen bekommen beginnen erzählen versuchen schreiben laufen erklären entsprechen sitzen ziehen scheinen fallen gehören
entstehen erhalten treffen suchen legen vorstellen handeln erreichen tragen schaffen lesen verlieren darstellen erkennen entwickeln reden aussehen erscheinen bilden anfangen
erwarten wohnen betreffen warten vergehen helfen gewinnen schließen fühlen bieten interessieren erinnern ergeben anbieten studieren verbinden ansehen fehlen bedeuten vergleichen
hören essen trinken schlafen kaufen verkaufen bezahlen kochen backen waschen putzen aufräumen öffnen benutzen besuchen reisen fliegen schwimmen springen tanzen
singen lachen weinen lächeln lieben hoffen wünschen danken bitten antworten rufen zählen rechnen malen zeichnen basteln bauen schneiden kleben messen
sammeln holen packen auspacken anziehen ausziehen aufstehen aufwachen einschlafen frühstücken duschen baden kämmen riechen schmecken atmen husten niesen wachsen blühen
regnen schneien frieren schützen werfen fangen rollen schieben drücken drehen heben senken steigen klettern reiten rennen wandern spazieren winken klopfen
klingeln telefonieren schicken senden speichern planen entscheiden wählen bestimmen lösen prüfen üben wiederholen merken vergessen erlauben verbieten teilen wechseln aufhören
`.trim().split(/\s+/);

export const NOUNS = `
Jahr Zeit Tag Mensch Kind Frau Mann Leben Welt Hand Haus Ende Land Stadt Arbeit Frage Wort Schule Familie Freund
Mutter Vater Eltern Bruder Schwester Oma Opa Name Kopf Auge Ohr Nase Mund Gesicht Haar Arm Bein Fuß Bauch Herz
Wasser Luft Feuer Erde Sonne Mond Stern Himmel Wolke Regen Schnee Wind Berg Wald Baum Blatt Blume Gras Garten Wiese
Hund Katze Maus Vogel Fisch Pferd Kuh Schwein Schaf Ziege Huhn Ente Biene Fliege Spinne Fuchs Hase Igel Löwe Tier
Buch Heft Stift Papier Tisch Stuhl Tür Fenster Wand Boden Zimmer Küche Bad Bett Schrank Lampe Uhr Bild Spiegel Schlüssel
Auto Bus Zug Fahrrad Straße Weg Platz Brücke Park Laden Geschäft Geld Preis Euro Tasche Rucksack Jacke Hose Schuh Kleid
Essen Brot Butter Käse Milch Ei Apfel Banane Birne Orange Kartoffel Tomate Karotte Salat Suppe Fleisch Reis Nudel Kuchen Obst
Freude Angst Liebe Glück Spaß Spiel Ball Puppe Spielzeug Musik Lied Stimme Ton Klavier Sport Ferien Urlaub Reise Fest Geburtstag
Morgen Abend Nacht Woche Monat Stunde Minute Sekunde Frühling Sommer Herbst Winter Anfang Pause Unterricht Lehrer Lehrerin Klasse Aufgabe Antwort
Zahl Farbe Form Kreis Punkt Strich Seite Teil Stück Gruppe Team Hilfe Idee Geschichte Nachricht Brief Telefon Computer Problem Grund
`.trim().split(/\s+/);

export function wordSections(words, size) {
  return Array.from({ length: Math.ceil(words.length / size) }, (_, i) => ({
    id: `${size}-${i}`, label: `${i * size + 1}–${Math.min((i + 1) * size, words.length)}`,
    words: words.slice(i * size, (i + 1) * size)
  }));
}
export const READING_CATEGORIES = [
  { id: 'basic', title: 'Grundwortschatz', detail: 'Die ersten 100 Wörter', words: LEGACY_LISTS[0].text.split('\n') },
  { id: 'verbs', title: 'Verben', detail: '200 häufige Tunwörter', words: VERBS },
  { id: 'nouns', title: 'Nomen', detail: '200 häufige Namenwörter', words: NOUNS },
  ...LEGACY_LISTS.filter(p => !p.id.startsWith('top100')).map(p => ({ id: p.id, title: p.label, detail: 'Themenwörter', words: p.text.split('\n') }))
];
export const AVATARS = [
  ['bluey','Bluey','Neugierig auf Neues.'], ['bingo','Bingo','Kleine Schritte. Große Freude.'], ['muffin','Muffin','Probier es einfach aus.'],
  ['batman','Batman','Bereit für deine Mission.'], ['sam','Feuerwehrmann Sam','Gemeinsam schaffen wir das.'], ['spidey','Spidey','Volle Spinnenkraft.'],
  ['maus','Die Maus','Entdecken macht schlau.'], ['paw','Paw Patrol','Bereit für deinen Einsatz.'], ['einhorn','Einhorn','Du kannst das.']
].map(([id,name,motto],index) => ({ id, name, motto, x: index % 3 * 50, y: Math.floor(index / 3) * 50 }));

// A note token is pitch:duration-in-quarter-note-beats; '-' means a rest.
function melody(text) {
  let beat = 0;
  return text.trim().split(/\s+/).flatMap(token => {
    const [pitch, value] = token.split(':');
    const duration = Number(value || 1);
    const event = { pitch, beat, duration };
    beat += duration;
    return pitch === '-' ? [] : [event];
  });
}
const NUMB_MOTIF = 'F#4:0.5 A4:0.5 C#5:1.5 A4:0.5 D5:1.5 C#5:1.5 A4:2';
export const SONGS = [
  { id:'bruder', title:'Bruder Jakob', author:'Traditionell', level:'Sehr leicht', bpm:76,
    detail:'Eine vertraute Melodie. Wiederholte Motive und ein tiefer Sprung.',
    notes: melody('G4 A4 B4 G4 G4 A4 B4 G4 B4 C5 D5:2 B4 C5 D5:2 D5:0.5 E5:0.5 D5:0.5 C5:0.5 B4 G4 D5:0.5 E5:0.5 D5:0.5 C5:0.5 B4 G4 G4 D4 G4:2 G4 D4 G4:2') },
  { id:'freude', title:'Freude, schöner Götterfunken', author:'Ludwig van Beethoven', level:'Leicht', bpm:80,
    detail:'Die berühmte Melodie, vereinfacht für eine Hand in C-Dur.',
    notes: melody('E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2') },
  { id:'stern', title:'Funkel, funkel, kleiner Stern', author:'Traditionelle französische Melodie', level:'Leicht', bpm:76,
    detail:'Gleichmäßige Schritte, kleine Pausen und ein großer Stern.',
    notes: melody('C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2') },
  { id:'haenschen', title:'Hänschen klein', author:'Traditionell', level:'Sehr leicht', bpm:80,
    detail:'Kurze Motive auf fünf weißen Tasten.',
    notes: melody('G4 E4 E4:2 F4 D4 D4:2 C4 D4 E4 F4 G4 G4 G4:2 G4 E4 E4:2 F4 D4 D4:2 C4 E4 G4 G4 C4:4') },
  { id:'numb', title:'Numb', author:'Linkin Park · kurzer Melodieausschnitt', level:'Zum Ausprobieren', bpm:88,
    detail:'28 Anschläge: vier Übungsdurchgänge des kurzen Sieben-Ton-Motivs, mit einer Pause dazwischen. Eine Oktave tiefer; kein vollständiges Stück.',
    notes: melody(Array(4).fill(NUMB_MOTIF).join(' -:2 ')) },
  { id:'elise', title:'Für Elise', author:'Ludwig van Beethoven', level:'Mit schwarzen Tasten', bpm:72,
    detail:'Der bekannte Einstieg als vereinfachte Melodie für eine Hand. Die Begleitung ist ausgelassen.',
    notes: melody('E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 -:0.5 C4:0.5 E4:0.5 A4:0.5 B4:1.5 -:0.5 E4:0.5 G#4:0.5 B4:0.5 C5:1.5 -:0.5 E4:0.5 E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 -:0.5 C4:0.5 E4:0.5 A4:0.5 B4:1.5 -:0.5 E4:0.5 C5:0.5 B4:0.5 A4:2') },
  { id:'menuett', title:'Menuett in G-Dur', author:'Christian Petzold · BWV Anh. 114', level:'Leicht', bpm:84,
    detail:'Die ersten acht Takte der Oberstimme. Langsam üben und die kurzen Noten verbinden.',
    notes: melody('D5 G4:0.5 A4:0.5 B4:0.5 C5:0.5 D5 G4 G4 E5 C5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5 G4 G4 C5 D5:0.5 C5:0.5 B4:0.5 A4:0.5 B4 C5:0.5 B4:0.5 A4:0.5 G4:0.5 F#4 G4:0.5 A4:0.5 B4:0.5 G4:0.5 B4:1.5 A4:0.5 A4') },
  { id:'nachtmusik', title:'Eine kleine Nachtmusik', author:'Wolfgang Amadeus Mozart', level:'Kleine Herausforderung', bpm:84,
    detail:'Das Eröffnungsthema, einstimmig und im ruhigen Übungstempo. Achte auf die Sprünge.',
    notes: melody('G4:1.5 D4:0.5 G4:1.5 D4:0.5 G4:0.5 D4:0.5 G4:0.5 B4:0.5 D5:2 C5:1.5 A4:0.5 C5:1.5 A4:0.5 C5:0.5 A4:0.5 F#4:0.5 A4:0.5 D4:2') },
  { id:'wiegenlied', title:'Guten Abend, gut’ Nacht', author:'Johannes Brahms · Wiegenlied', level:'Leicht', bpm:68,
    detail:'Die erste Melodiephrase, für eine Hand in C-Dur. Lass die langen Töne ruhig ausklingen.',
    notes: melody('E4:0.5 E4:0.5 G4:3 E4:0.5 E4:0.5 G4:3 E4:0.5 G4:0.5 C5 B4:1.5 A4:0.5 A4 G4:2 D4:0.5 E4:0.5 F4 D4:2 D4:0.5 E4:0.5 F4:3 D4:0.5 F4:0.5 B4 A4 G4 B4 C5:3') },
  { id:'fruehling', title:'Der Frühling', author:'Antonio Vivaldi · Die vier Jahreszeiten', level:'Leicht', bpm:88,
    detail:'Ein kurzer Themenbeginn, vereinfacht und nach C-Dur übertragen.',
    notes: melody('E5 E5 E5 D5:0.5 C5:0.5 G5:2 G5:1.5 F5:0.5 E5 E5 E5 D5:0.5 C5:0.5 G5:2 G5:1.5 F5:0.5 E5 F5:0.5 G5:0.5 F5 E5 D5:2 C5:2') },
  { id:'haydn', title:'Mit dem Paukenschlag', author:'Joseph Haydn · Sinfonie Nr. 94', level:'Sehr leicht', bpm:80,
    detail:'Der Anfang des langsamen Satzes als einstimmige Übung mit vielen Tonwiederholungen.',
    notes: melody('C5:0.5 C5:0.5 E5:0.5 E5:0.5 G5:0.5 G5:0.5 E5 F5:0.5 F5:0.5 D5:0.5 D5:0.5 B4:0.5 B4:0.5 G4 C5:0.5 C5:0.5 E5:0.5 E5:0.5 G5:0.5 G5:0.5 E5 C5:0.5 E5:0.5 G5:0.5 G4:0.5 C5:2') },
  { id:'morgen', title:'Morgenstimmung', author:'Edvard Grieg · Peer Gynt', level:'Leicht', bpm:72,
    detail:'Der ruhige Anfang des Themas, nach C-Dur übertragen. Drei kurze Noten bilden jeweils eine Gruppe.',
    notes: melody('E5:0.5 D5:0.5 C5:0.5 D5:0.5 E5:0.5 G5:0.5 A5:0.5 G5:0.5 E5:0.5 D5:0.5 C5:0.5 D5:0.5 E5:0.5 D5:0.5 E5:0.5 G5:0.5 D5:0.5 G5:0.5 E5:1.5 -:1.5 E5:0.5 D5:0.5 C5:0.5 D5:0.5 E5:0.5 G5:0.5 A5:0.5 G5:0.5 E5:0.5 D5:0.5 C5:0.5 D5:0.5 E5:1.5') },
  { id:'mond', title:'Au clair de la lune', author:'Traditionelles französisches Lied', level:'Sehr leicht', bpm:76,
    detail:'Eine ruhige Melodie mit wenigen Tönen – ideal für die ersten Schritte.',
    notes: melody('C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4 C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4') },
  { id:'entchen', title:'Alle meine Entchen', author:'Traditionell', level:'Sehr leicht', bpm:80,
    detail:'Schritt für Schritt aufwärts und wieder zurück. Eine Melodie auf sechs weißen Tasten.',
    notes: melody('C4 D4 E4 F4 G4:2 G4:2 A4 A4 A4 A4 G4:4 A4 A4 A4 A4 G4:4 F4 F4 F4 F4 E4:2 E4:2 G4 G4 G4 G4 C4:4') },
  { id:'champions', title:'Champions-League-Hymne', author:'Tony Britten · kurzes Anfangsmotiv', level:'Mit schwarzen Tasten', bpm:84,
    detail:'Acht Anschläge aus dem instrumentalen Beginn, als einzelne Oberstimme. Zweimal zum Üben – kein vollständiges Arrangement.',
    notes: melody('F#4:0.5 A4:0.5 A4:0.5 D5:0.5 D5:0.5 E5:0.5 E5:0.5 F#5:0.5 -:2 F#4:0.5 A4:0.5 A4:0.5 D5:0.5 D5:0.5 E5:0.5 E5:0.5 F#5:0.5') }
];
export const PIANO_KEYS = [
  ['C4','C','a'],['C#4','Cis','w'],['D4','D','s'],['D#4','Dis','e'],['E4','E','d'],['F4','F','f'],
  ['F#4','Fis','t'],['G4','G','g'],['G#4','Gis','z'],['A4','A','h'],['A#4','B','u'],['B4','H','j'],
  ['C5','C','k'],['C#5','Cis','o'],['D5','D','l'],['D#5','Dis','p'],['E5','E','ö'],
  ['F5','F','ä'],['F#5','Fis','ü'],['G5','G','y'],['G#5','Gis','+'],['A5','A','x'],['A#5','B','#'],['B5','H','c']
].map(([pitch,label,key]) => ({pitch,label,key,black:pitch.includes('#')}));

// Keep the familiar C4–E5 keyboard for older songs; extend only when needed.
export function pianoKeysFor(notes) {
  let last=Math.max(16,...notes.map(n=>PIANO_KEYS.findIndex(k=>k.pitch===n.pitch)));
  if(PIANO_KEYS[last].black)last++;
  return PIANO_KEYS.slice(0,last+1);
}
