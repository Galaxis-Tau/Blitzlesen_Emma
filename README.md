# Emmas Lernwelt

Eine eigenständige Lernwebsite für Lesen, Mathematik und erste Klaviermelodien. Läuft als statische Website ohne Build-Schritt, CDN-Bibliotheken, Konten oder Backend.

## Lernbereiche

- **Lesen:** bisheriger Grundwortschatz und Themenlisten; zusätzlich jeweils 200 häufige Verben und Nomen. Zehn 20er-Listen, zwei 100er-Abschnitte und eine 200er-Gesamtliste pro neuer Kategorie. Eigene Wörter, Zufallsmix, Anzeigedauer, Schrift, Wortgröße und Fixierhilfe. Selbstbewertung und Wiederholung noch unsicherer Wörter.
- **Mathematik:** Zahlenräume bis 20 und bis 100, jeweils Plus, Minus oder gemischt. Jede neue Runde hat 20 unterschiedliche Aufgaben; gemischt enthält zehn pro Rechenart. Operanden sind positiv, Ergebnisse liegen zwischen 0 und der gewählten Obergrenze. Bis 20 bekommt jede Ausgangszahl ihr eigenes Feld mit 20 Plättchen, jeweils in zwei Zehnerreihen und Fünfergruppen: die erste Zahl blau, die zweite rot. Keine Zusammenlegung, keine durchgestrichenen Punkte und kein Zahlenstrahl in diesem Zahlenraum. Bis 100 bleiben Zehnerstriche, Einerpunkte und Zahlenstrahl erhalten. Eingetippte Ergebnisse, erneute Versuche, Lösungshilfe und Nachüben. Wiederholungsrunden enthalten nur die zuvor unsicheren Karten.
- **Klavier:** 15 vereinfachte Melodieübungen. Die bisherigen Stücke bleiben erhalten; Numb (Linkin Park) umfasst vier Wiederholungen des kurzen Sieben-Ton-Motivs, insgesamt 28 Anschläge. Fallende Noten, weiß/schwarz zugeordnete Tasten, synthetische Tonausgabe, Vorschau, Tempo 40–120 %, Schritt-, Rhythmus- und Freispielmodus, Pause und Auswertung. Freispiel spielt die Notenanleitung ohne Eingaben und ohne Bewertung ab, wahlweise als Endlosschleife. Mit „Ton aus“ dient es als reine visuelle Begleitung für ein echtes Klavier oder ein anderes Gerät. Gesteuert über Touch, Maus oder Computertastatur; keine MIDI- oder Mikrofon-Erkennung eines echten Klaviers.
- **Begleiter:** vor jeder neuen Runde wird aktiv einer von neun Avataren gewählt. Der Avatar bleibt während der Runde sichtbar. Die Auswahl gilt für die Runde, nicht nur für den ersten Besuch.

Die Wörter sind ein redaktionell ausgewählter Alltagswortschatz, keine statistisch exakt geordnete Top-200-Liste. Quellen und Inhaltshinweise stehen in [docs/sources.md](docs/sources.md).

## Lokal starten

```sh
npm start
```

Danach http://localhost:4173 öffnen. Alternativ direkt `python3 -m http.server 4173` im Projektverzeichnis starten. Python 3 wird für den lokalen Server benötigt. Ein Doppelklick auf `index.html` ist wegen JavaScript-Modulen nicht vorgesehen. Für Hosting (z. B. GitHub Pages) den gesamten Projektordner mit `index.html`, `styles.css`, `js/` und `assets/` veröffentlichen.

## Bedienung

Lesen: `←` / `J` / `1` = gelesen, `→` / `N` / `2` = noch üben. Mathematik: Ergebnis eingeben und mit Enter bestätigen. Klavier: die Buchstaben unter den Tasten verwenden. Deutsches H entspricht intern B; die schwarze Taste B entspricht intern A#. Bildschirmtasten funktionieren unabhängig vom Tastaturlayout. Im Rhythmusmodus wird der Anschlag innerhalb von ±300 ms bewertet; die Tondauer klingt automatisch. Der Schrittmodus wartet auf die nächste korrekte Note.

„Ton an/aus“ schaltet alle Töne. Die Tonausgabe wird erst nach einem Klick aktiviert. Beim Verlassen des Fensters pausieren Schritt- und Rhythmusmodus. Freispiel läuft bei Fokusverlust weiter, solange die Seite sichtbar bleibt; ein unsichtbarer Tab pausiert in allen Modi. Beim Wechsel in einen unsichtbaren Tab pausiert die Leseübung und zeigt das aktuelle Wort nach Fortsetzen erneut. Beim Wechsel des Lernbereichs endet eine laufende Runde.

Nur Schrift, Wortgröße, Anzeigedauer und Ton-Einstellung werden lokal im Browser gespeichert. Es gibt keine Übertragung von Lernergebnissen und keine dauerhafte Leistungsakte. Die App fordert keine Mikrofonrechte an. Die Bildschirmklaviatur erweitert sich je nach Melodie bis A5; auf kleinen Bildschirmen ist sie seitlich scrollbar. Die Noten und Tasten verwenden die internationale Oktavbezeichnung (C4 = mittleres C).

## Tests

Node.js ab Version 20:

```sh
npm test
```

Browser-Integrationstest (Playwright und Google Chrome erforderlich; lokaler Server auf Port 4173):

```sh
npm install --no-save --package-lock=false playwright
node tests/browser.cjs
node tests/updates.cjs
```

Der Test prüft vollständige Runden einschließlich Fehlern/Wiederholung, Avatarauswahl, Klaviervorschau, Treffer, Pause und responsive Ansichten. Bildschirmansichten landen standardmäßig unter `/tmp/emma-qa` (änderbar mit `EMMA_SHOTS`).

## Aufbau

- `js/data.js`, `js/legacy-lists.js`: Wortschatz, Avatare, Melodien.
- `js/core.js`: reine Aufgabenlogik, Zählbilder, Notentreffer und Audio.
- `js/app.js`: Lesetraining, Mathematik, Auswahl und Auswertung.
- `js/piano.js`: Klaviatur, Rhythmus, Pause und Wiedergabe.
- `styles.css`: responsives Design.

Die ursprüngliche App bleibt in der Git-Historie erhalten. Die Gestaltung orientiert sich an Apple-Webseiten; die Website besitzt eine eigene visuelle Identität.

## Zehn neue Melodieübungen

1. Für Elise — Beethoven, vereinfachter Einstieg.
2. Menuett in G-Dur — Christian Petzold, erste acht Takte.
3. Eine kleine Nachtmusik — Mozart, Eröffnungsthema.
4. Guten Abend, gut’ Nacht — Brahms, erste Melodiephrase.
5. Der Frühling — Vivaldi, kurzer Themenbeginn in C-Dur.
6. Mit dem Paukenschlag — Haydn, Beginn des langsamen Satzes.
7. Morgenstimmung — Grieg, vereinfachter Themenbeginn in C-Dur.
8. Au clair de la lune — traditionelle Melodie.
9. Alle meine Entchen — traditionelle Melodie.
10. Champions-League-Hymne — Tony Britten, kurzes Acht-Ton-Anfangsmotiv zweimal zum Üben.

Dies sind einstimmige Übungsversionen bzw. kurze Motive, keine vollständigen Klavierarrangements. Im Freispiel werden nur die durchgelaufenen Noten angezeigt, keine angeblichen Treffer auf einem externen Instrument.
