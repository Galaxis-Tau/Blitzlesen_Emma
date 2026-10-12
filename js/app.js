import { READING_CATEGORIES, AVATARS, SONGS, wordSections } from './data.js';
import { shuffle, parseWords, escapeHTML as esc, makeMathDeck, twentyCells, placeValue, answerMatches, AudioEngine } from './core.js';
import { PianoGame } from './piano.js';

const main = document.querySelector('#main');
const dialog = document.querySelector('#avatar-dialog');
const audio = new AudioEngine();
const state = { tab:'reading', screen:'setup', category:'basic', size:20, pack:0,
  words:READING_CATEGORIES[0].words.slice(0,20).join('\n'), duration:.8, font:'print', wordSize:88, fixation:'cross',
  range:20, operation:'mixed', showQuantity:true, song:'bruder', pianoMode:'step', pianoLoop:false, speed:80,
  avatar:null, results:[], deck:[], index:0, phase:'', timers:[], game:null, retry:false };
try {
  const saved=JSON.parse(localStorage.getItem('emma-preferences-v2') || '{}');
  if (Number.isFinite(saved.duration)) state.duration=Math.max(.1,Math.min(3,saved.duration));
  if (['print','hand'].includes(saved.font)) state.font=saved.font;
  if ([48,64,88,112].includes(saved.wordSize)) state.wordSize=saved.wordSize;
  if (typeof saved.sound==='boolean') audio.enabled=saved.sound;
} catch { /* Storage may be unavailable in private browsing. */ }
function save(){try{localStorage.setItem('emma-preferences-v2',JSON.stringify({duration:state.duration,font:state.font,wordSize:state.wordSize,sound:audio.enabled}));}catch{}}
const getCategory = () => READING_CATEGORIES.find(c=>c.id===state.category);
const button = (id,label,classes='primary') => `<button id="${id}" class="${classes}">${label}</button>`;
const option = (value,label,selected) => `<option value="${value}" ${selected?'selected':''}>${label}</option>`;
const avatarImage = (a, cls='') => `<img class="avatar-img avatar-${a.id} ${cls}" src="assets/avatar-${a.id}.${['bluey','bingo','muffin'].includes(a.id)?'png':'svg'}" alt="${esc(a.name)}" width="84" height="84">`;
function later(fn,ms){const id=setTimeout(fn,ms);state.timers.push(id);return id;}
function stop(){state.timers.forEach(clearTimeout);state.timers=[];state.game?.destroy();state.game=null;}
function on(id,event,fn){document.getElementById(id)?.addEventListener(event,fn);}
function selectWords(){const c=getCategory();state.words=c.words.slice(state.pack*state.size,(state.pack+1)*state.size).join('\n');}
function updateNav(){document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab===state.tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
function setup(){stop();state.screen='setup';state.phase='';updateNav();renderSetup();}
function hero(){
  const contents={
    reading:['Wörter werden vertraut.','Ein Wort.<br><span class="accent">Ein kleiner Erfolg.</span>','Schau genau hin. Lies laut vor. Und entdecke, wie viel du schon kannst.','<div class="word-tile tag">Dein Lesemoment</div><div class="word-tile">Sonne</div><div class="word-tile small">spielen</div>'],
    math:['Zahlen zum Begreifen.','Kleine Schritte.<br><span class="accent">Großes Können.</span>','Rechne in deinem Tempo. Punkte und Zehner helfen dir, Zahlen wirklich zu verstehen.','<div class="math-art"><span>8</span> + <i>5</i><div style="font-size:22px;letter-spacing:7px;margin-top:10px;color:#0071e3">●●●●● <span style="color:#dc4c58">●●●</span></div></div>'],
    piano:['Dein Moment am Klavier.','Taste für Taste.<br><span class="accent">Deine Melodie.</span>','Folge den Noten. Finde deinen Rhythmus. Und bring dein erstes Stück zum Klingen.','<div class="mini-piano">'+Array(7).fill('<span></span>').join('')+'</div>']
  }[state.tab];
  return `<section class="hero"><div><div class="eyebrow">${contents[0]}</div><h1>${contents[1]}</h1><p>${contents[2]}</p></div><div class="hero-art" aria-hidden="true">${contents[3]}</div></section>`;
}
function renderSetup(){
  main.innerHTML=hero()+(state.tab==='reading'?readingSetup():state.tab==='math'?mathSetup():pianoSetup());
  if(state.tab==='reading') bindReading();
  if(state.tab==='math') bindMath();
  if(state.tab==='piano') bindPiano();
}
function readingSetup(){
  const category=getCategory(), packs=wordSections(category.words,state.size), words=parseWords(state.words);
  return `<div class="section-heading"><h2>Was möchtest du lesen?</h2><p>In deinem Tempo.</p></div>
  <div class="category-grid">${READING_CATEGORIES.slice(0,3).map((c,i)=>`<button class="category ${state.category===c.id?'active':''}" data-category="${c.id}" aria-pressed="${state.category===c.id}"><span class="lettermark">${['Aa','tun.','Ding.'][i]}</span><h3>${c.title.replace('Grundwortschatz','Grundwort&shy;schatz')}</h3><small>${c.detail}</small></button>`).join('')}</div>
  <div class="theme-select field"><label for="themes">Oder eine Themenliste</label><select id="themes"><option value="">Thema auswählen …</option>${READING_CATEGORIES.slice(3).map(c=>option(c.id,c.title,c.id===state.category)).join('')}</select></div>
  <div class="section-heading"><h2>Deine Wörter.</h2><p id="word-count">${words.length} Wörter bereit</p></div>
  <section class="surface"><div class="row between"><strong>${category.title}</strong><div class="segmented" aria-label="Listengröße">${[20,100,200].filter(n=>n<=Math.max(20,category.words.length)).map(n=>`<button data-size="${n}" class="${state.size===n?'active':''}" aria-pressed="${state.size===n}">${n} Wörter</button>`).join('')}</div></div>
  <div class="packs" aria-label="Wortabschnitt">${packs.map((p,i)=>`<button class="pack ${state.pack===i?'active':''}" data-pack="${i}" aria-pressed="${state.pack===i}"> ${p.label}</button>`).join('')}</div>
  <div class="word-preview">${words.slice(0,10).map(w=>`<span>${esc(w)}</span>`).join('')}${words.length>10?`<span class="more">+ ${words.length-10} weitere</span>`:''}</div>
  <details class="details"><summary>Wörter ansehen oder selbst bearbeiten</summary><label for="word-editor">Ein Wort pro Zeile</label><textarea id="word-editor" spellcheck="false">${esc(state.words)}</textarea><button class="text-link" id="random">Zufalls-Mix · 20 Wörter aus allen Kategorien</button></details>
  <div class="settings">
    <div class="field"><label for="duration">Anzeigedauer <output id="duration-value">${state.duration.toFixed(1)} s</output></label><input id="duration" type="range" min="0.1" max="3" step="0.1" value="${state.duration}"><small>0,1 s blitzschnell · 3 s ganz in Ruhe</small></div>
    <div class="field"><label for="font">Schrift</label><select id="font">${option('print','Druckschrift',state.font==='print')}${option('hand','Handschrift',state.font==='hand')}</select><label for="word-size">Wortgröße</label><select id="word-size">${[48,64,88,112].map((n,i)=>option(n,['S','M','L','XL'][i],state.wordSize===n)).join('')}</select></div>
    <div class="field"><label for="fixation">Vor dem Wort</label><select id="fixation">${option('cross','Fixationskreuz +',state.fixation==='cross')}${option('countdown','Countdown 3–2–1',state.fixation==='countdown')}${option('dot','Fokuspunkt ●',state.fixation==='dot')}</select></div>
  </div>
  <div class="start-row"><p>Erst deinen Begleiter wählen.<br>Dann gemeinsam loslesen.</p>${button('start-reading',`Lesen starten <span aria-hidden="true">↗</span>`)}</div></section>`;
}
function bindReading(){
  main.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{state.category=b.dataset.category;state.size=20;state.pack=0;selectWords();renderSetup();});
  on('themes','change',e=>{if(e.target.value){state.category=e.target.value;state.pack=0;state.size=20;selectWords();renderSetup();}});
  main.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{state.size=Number(b.dataset.size);state.pack=0;selectWords();renderSetup();});
  main.querySelectorAll('[data-pack]').forEach(b=>b.onclick=()=>{state.pack=Number(b.dataset.pack);selectWords();renderSetup();});
  on('word-editor','input',e=>{state.words=e.target.value;document.querySelector('#word-count').textContent=`${parseWords(state.words).length} Wörter bereit`;document.querySelector('#start-reading').disabled=!parseWords(state.words).length;});
  on('random','click',()=>{state.words=shuffle([...new Set(READING_CATEGORIES.flatMap(c=>c.words))]).slice(0,20).join('\n');renderSetup();});
  on('duration','input',e=>{state.duration=Number(e.target.value);document.querySelector('#duration-value').textContent=`${state.duration.toFixed(1)} s`;save();});
  on('font','change',e=>{state.font=e.target.value;save();});
  on('word-size','change',e=>{state.wordSize=Number(e.target.value);save();});
  on('fixation','change',e=>state.fixation=e.target.value);
  document.querySelector('#start-reading').disabled=!parseWords(state.words).length;
  on('start-reading','click',()=>chooseAvatar(()=>startReading(parseWords(state.words))));
}
function mathSetup(){return `<div class="section-heading"><h2>Was rechnest du heute?</h2><p>20 Karten pro Runde</p></div><section class="surface">
  <div class="math-settings"><div class="field"><span>Zahlenraum</span><div class="segmented">${[20,100].map(n=>`<button data-range="${n}" class="${state.range===n?'active':''}" aria-pressed="${state.range===n}">Bis ${n}</button>`).join('')}</div></div>
  <div class="field"><span>Aufgaben</span><div class="segmented">${[['+','Plus'],['-','Minus'],['mixed','Gemischt']].map(([v,t])=>`<button data-operation="${v}" class="${state.operation===v?'active':''}" aria-pressed="${state.operation===v}">${t}</button>`).join('')}</div></div></div>
  <div class="math-info"><strong>${state.range}</strong><p>${state.range===20?'Jede Zahl bekommt ihr eigenes Feld mit 20 Plättchen: die erste Zahl in Blau, die zweite in Rot. Jedes Feld hat zwei Zehnerreihen mit einer Lücke nach fünf Plättchen.':'Ein Strich steht für zehn, ein Punkt für eins. Blau zeigt die erste Zahl, Rot die Zahl, die dazukommt oder weggenommen wird.'}</p></div>
  <label class="toggle"><input id="show-quantity" type="checkbox" ${state.showQuantity?'checked':''}> Mengenbilder als Rechenhilfe zeigen</label>
  <div class="start-row"><p>Ergebnis eintippen und prüfen.<br>Ohne Zeitdruck. Ohne negative Ergebnisse.</p>${button('start-math','Rechnen starten ↗')}</div></section>`;}
function bindMath(){
  main.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{state.range=Number(b.dataset.range);renderSetup();});
  main.querySelectorAll('[data-operation]').forEach(b=>b.onclick=()=>{state.operation=b.dataset.operation;renderSetup();});
  on('show-quantity','change',e=>state.showQuantity=e.target.checked);
  on('start-math','click',()=>chooseAvatar(()=>startMath(makeMathDeck(state.range,state.operation))));
}
function pianoSetup(){const song=SONGS.find(s=>s.id===state.song);return `<div class="section-heading"><h2>Welches Stück darf es sein?</h2><p>Für deinen ersten Auftritt</p></div><section class="surface"><div class="song-list">${SONGS.map((s,i)=>`<button class="song-card ${s.id===state.song?'active':''}" data-song="${s.id}" aria-pressed="${s.id===state.song}"><span class="song-no">${String(i+1).padStart(2,'0')}</span><span><strong>${s.title}</strong><small>${s.author}</small></span><span class="song-level">${s.level}</span></button>`).join('')}</div>
  <p class="song-description">${song.detail}</p><div class="piano-options"><div class="field"><span>So möchtest du spielen</span><div class="segmented"><button data-mode="step" class="${state.pianoMode==='step'?'active':''}" aria-pressed="${state.pianoMode==='step'}">Schritt für Schritt</button><button data-mode="rhythm" class="${state.pianoMode==='rhythm'?'active':''}" aria-pressed="${state.pianoMode==='rhythm'}">Im Rhythmus</button><button data-mode="free" class="${state.pianoMode==='free'?'active':''}" aria-pressed="${state.pianoMode==='free'}">Freispiel</button></div></div><div class="field"><label for="speed">Tempo <output id="speed-value">${state.speed} %</output></label><input id="speed" type="range" min="40" max="120" step="10" value="${state.speed}"><small>Langsamer ist ein guter Anfang.</small></div></div>
  ${state.pianoMode==='free'?`<div class="free-mode-info"><p>Die Noten laufen von allein. Spiele auf deinem Klavier oder einem anderen Gerät mit – ohne Eingabe und ohne Bewertung. Mit „Ton aus“ nutzt du nur die visuelle Anleitung.</p><label class="toggle"><input id="piano-loop" type="checkbox" ${state.pianoLoop?'checked':''}> Melodie in einer Schleife wiederholen</label></div>`:''}
  <details class="details"><summary>So funktioniert das Klavierspiel</summary><p>Die Noten fallen auf die Tasten zu. Drücke die passende Taste, sobald die Unterkante der Note die blaue Linie erreicht. Die Länge zeigt dir, wie lange der Ton klingt. Du kannst die Bildschirmtasten antippen oder die eingeblendeten Buchstaben auf deiner Tastatur verwenden.</p><p>„Schritt für Schritt“ wartet an jeder Note auf dich. „Im Rhythmus“ läuft weiter und zählt deine Treffer. „Freispiel“ spielt die Anleitung automatisch ab, ohne Eingaben zu erwarten oder Fehler zu zählen. Mit „Vorspielen“ kannst du dir das Stück zuerst anhören. Beim Wechsel in einen unsichtbaren Tab pausiert die Anleitung. Im Freispiel darf ein anderes Fenster den Fokus haben, solange die Seite sichtbar bleibt.</p></details>
  <div class="start-row"><p>Dein Begleiter sitzt mit am Klavier.<br>Bereit für die erste Note?</p>${button('start-piano','Klavier spielen ↗')}</div></section>`;}
function bindPiano(){
  const list=main.querySelector('.song-list'), selected=list.querySelector('.active');
  list.scrollTop=selected.getBoundingClientRect().top-list.getBoundingClientRect().top-(list.clientHeight-selected.clientHeight)/2;
  main.querySelectorAll('[data-song]').forEach(b=>b.onclick=()=>{state.song=b.dataset.song;renderSetup();});
  main.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.pianoMode=b.dataset.mode;renderSetup();});
  on('piano-loop','change',e=>state.pianoLoop=e.target.checked);
  on('speed','input',e=>{state.speed=Number(e.target.value);document.querySelector('#speed-value').textContent=`${state.speed} %`;});
  on('start-piano','click',()=>chooseAvatar(startPiano));
}
function chooseAvatar(next){
  dialog.innerHTML=`<div class="dialog-top"><div><div class="eyebrow">Dein Team für diese Runde</div><h2 id="avatar-title" class="dialog-title">Wer begleitet dich?</h2></div><button class="close" id="close-avatar" aria-label="Auswahl schließen">×</button></div><p class="dialog-caption">Such dir einen Freund aus. Dann geht’s los.</p><div class="avatar-grid">${AVATARS.map(a=>`<button class="avatar-option" data-avatar="${a.id}" aria-pressed="false">${avatarImage(a)}<span>${a.name}</span></button>`).join('')}</div><div class="dialog-actions"><p id="avatar-motto">Wähle deinen Begleiter.</p><button id="confirm-avatar" class="primary" disabled>Gemeinsam starten</button></div>`;
  let selected=null;
  dialog.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>{selected=AVATARS.find(a=>a.id===b.dataset.avatar);dialog.querySelectorAll('[data-avatar]').forEach(c=>{c.classList.toggle('selected',c===b);c.setAttribute('aria-pressed',String(c===b));});document.querySelector('#avatar-motto').textContent=selected.motto;document.querySelector('#confirm-avatar').disabled=false;});
  on('close-avatar','click',()=>dialog.close());
  on('confirm-avatar','click',()=>{if(!selected)return;state.avatar=selected;dialog.close();audio.unlock().catch(()=>{});next();main.focus({preventScroll:true});});
  dialog.showModal();
}
function sessionHeader(label,progress=state.index,total=state.deck.length){return `<div class="session-header"><div class="companion">${avatarImage(state.avatar,'avatar-small')}<div><strong>${state.avatar.name} ist dabei.</strong><small>${label}</small></div></div>${button('exit','Beenden','secondary')}</div><div class="progress" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${progress}"><span style="width:${total?progress/total*100:0}%"></span></div>`;}
function startReading(words){stop();state.screen='exercise';state.deck=shuffle(words);state.index=0;state.results=[];readingCard();}
function readingCard(){
  if(state.index>=state.deck.length){summary();return;}
  state.phase='fixation';
  main.innerHTML=`<section class="exercise">${sessionHeader(`Wort ${state.index+1} von ${state.deck.length}`)}<div class="flash-card" id="flash"><div class="fixation">${state.fixation==='dot'?'●':state.fixation==='cross'?'+':'3'}</div><p class="card-caption">Schau auf die Mitte.</p></div><div class="rating">${button('read-yes','Gelesen ✓')}${button('read-no','Noch einmal üben','secondary')}</div><p class="session-footnote">← / J = gelesen · → / N = noch üben · Esc = beenden</p></section>`;
  on('exit','click',setup);document.querySelector('#read-yes').disabled=true;document.querySelector('#read-no').disabled=true;
  on('read-yes','click',()=>rateReading(true));on('read-no','click',()=>rateReading(false));
  if(state.fixation==='countdown') [2,1].forEach((n,i)=>later(()=>{document.querySelector('.fixation').textContent=n;},(i+1)*350));
  later(()=>{state.phase='flash';document.querySelector('#flash').innerHTML=`<div class="flash-word ${state.font==='hand'?'hand':''}" style="--word-size:${state.wordSize}px">${esc(state.deck[state.index])}</div>`;audio.tone('D5',.1);
    later(()=>{state.phase='rating';document.querySelector('#flash').innerHTML='<h2>Laut gelesen?</h2><p class="card-caption">Hast du das Wort erkannt und laut gesagt?</p>';document.querySelector('#read-yes').disabled=false;document.querySelector('#read-no').disabled=false;},state.duration*1000);
  },state.fixation==='countdown'?1050:750);
}
function rateReading(correct){if(state.phase!=='rating')return;state.phase='done';state.results.push({word:state.deck[state.index],correct});if(correct)audio.tone('G5');state.index++;readingCard();}
function numberLine(card){
  const max=state.range,ticks=state.range===20?20:10;
  const start=10+card.a/max*480,end=10+card.answer/max*480,mid=(start+end)/2;
  return `<svg class="number-line" viewBox="0 0 500 65" role="img" aria-label="Zahlenstrahl von 0 bis ${max}. Start bei ${card.a}, ${card.op==='+'?'vorwärts':'rückwärts'} um ${card.b}."><defs><marker id="jump-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="#dc4c58"/></marker></defs><path d="M10 36H490" stroke="#c7cdd7" stroke-width="2"/>${Array.from({length:ticks+1},(_,i)=>{const x=10+i*480/ticks;return `<path d="M${x} 31V41" stroke="#929aa7"/><text x="${x}" y="58" text-anchor="middle" fill="#68686d" font-size="10">${i*max/ticks}</text>`;}).join('')}<path d="M${start} 31Q${mid} -2 ${end} 29" stroke="#dc4c58" stroke-width="2" fill="none" marker-end="url(#jump-arrow)"/><text x="${Math.max(20,Math.min(480,mid))}" y="12" text-anchor="middle" fill="#b13440" font-size="11">${card.op==='+'?'+':'−'}${card.b}</text><circle cx="${start}" cy="36" r="5" fill="#0071e3"/></svg>`;
}
function baseTen(n,color='blue',label=String(n)) {const {tens,ones}=placeValue(n);return `<div class="base-ten ${color}" role="img" aria-label="${esc(label)}: ${tens} Zehner und ${ones} Einer"><strong>${esc(label)}</strong><div class="blocks">${Array(tens).fill('<i class="rod"></i>').join('')}${Array(ones).fill('<i class="unit"></i>').join('')}${n===0?'<span>0</span>':''}</div><small>${tens} Zehner · ${ones} Einer</small></div>`;}
function quantity(card,reveal=false){
  if(!state.showQuantity)return '';
  let visual;
  if(state.range===20){
    visual=`<div class="operand-frames">${[[card.a,'blue','Erste Zahl'],[card.b,'red','Zweite Zahl']].map(([value,color,label])=>{
      const cells=twentyCells(value,color);
      return `<section class="operand-frame" data-operand="${color}"><div class="operand-label ${color}-label">${label}: <strong>${value}</strong></div><div class="twenty-frame" role="img" aria-label="${value} ${color==='blue'?'blaue':'rote'} Plättchen auf einem eigenen Zwanzigerfeld">${[0,10].map(start=>`<div class="ten-row">${[0,5].map(g=>`<span class="five-group">${cells.slice(start+g,start+g+5).map(c=>`<i class="dot ${c}"></i>`).join('')}</span>`).join('')}</div>`).join('')}</div></section>`;
    }).join('')}</div>`;
  }else visual=`<div class="quantity-pair">${baseTen(card.a,'blue',`${card.a} am Anfang`)}<span class="operator">${card.op==='+'?'+':'−'}</span>${baseTen(card.b,'red',`${card.b} ${card.op==='+'?'dazu':'weg'}`)}</div><div class="legend"><span>1 Strich = 10</span><span>1 Punkt = 1</span></div>${reveal?`<div class="result-quantity">${baseTen(card.answer,'blue',`${card.answer} ${card.op==='+'?'zusammen':'übrig'}`)}</div>`:''}`;
  return `<div class="quantities">${visual}${state.range===100?numberLine(card):''}</div>`;
}
function startMath(cards){stop();state.screen='exercise';state.deck=cards;state.results=[];state.index=0;mathCard();}
function mathCard(){
  if(state.index>=state.deck.length){summary();return;}
  const card=state.deck[state.index];state.phase='answer';state.retry=false;
  main.innerHTML=`<section class="exercise">${sessionHeader(`Karte ${state.index+1} von ${state.deck.length}`)}<div class="flash-card math-card"><p class="eyebrow">${card.op==='+'?'Wie viel ist es zusammen?':'Wie viel bleibt übrig?'}</p><div class="equation" aria-label="${card.a} ${card.op==='+'?'plus':'minus'} ${card.b} gleich wie viel?"><span class="a">${card.a}</span> ${card.op==='+'?'+':'−'} <span class="b">${card.b}</span> = <span id="solution">?</span></div><div id="quantity-area" style="width:100%">${quantity(card)}</div><form class="answer-form" id="answer-form"><label class="answer-field" for="answer">Dein Ergebnis<input id="answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="3" required aria-describedby="math-feedback"></label><button class="primary" type="submit">Prüfen</button></form><p id="math-feedback" class="feedback" role="status" aria-live="polite"></p><button id="show-answer" class="text-link">Lösung zeigen</button><button id="next-card" class="primary" hidden>Weiter →</button></div></section>`;
  on('exit','click',setup);on('answer-form','submit',e=>{e.preventDefault();checkMath();});on('show-answer','click',()=>finishMath(false));on('next-card','click',()=>{state.index++;mathCard();});
  // Let the avatar dialog finish its focus restoration before focusing the answer.
  later(()=>document.querySelector('#answer')?.focus({preventScroll:true}),30);
}
function checkMath(){if(state.phase!=='answer')return;const input=document.querySelector('#answer');if(!/^\d+$/.test(input.value.trim())){document.querySelector('#math-feedback').textContent='Bitte gib eine ganze Zahl ein.';return;}
  if(answerMatches(input.value,state.deck[state.index].answer))finishMath(true);
  else{state.retry=true;const feedback=document.querySelector('#math-feedback');feedback.textContent='Noch nicht ganz. Schau auf die Mengen und probiere es noch einmal.';feedback.className='feedback try';input.setAttribute('aria-invalid','true');input.select();}
}
function finishMath(solved){if(state.phase!=='answer')return;state.phase='checked';const card=state.deck[state.index];state.results.push({...card,correct:solved&&!state.retry,solved});document.querySelector('#solution').textContent=card.answer;document.querySelector('#quantity-area').innerHTML=quantity(card,true);document.querySelector('#answer-form').hidden=true;document.querySelector('#show-answer').hidden=true;const feedback=document.querySelector('#math-feedback');feedback.textContent=solved?'Richtig! Gut gemacht.':`${card.a} ${card.op==='+'?'+':'−'} ${card.b} = ${card.answer}. Schau es dir in Ruhe an.`;feedback.className=`feedback ${solved?'good':''}`;const next=document.querySelector('#next-card');next.hidden=false;next.textContent=state.index===state.deck.length-1?'Runde abschließen':'Nächste Karte →';next.focus({preventScroll:true});if(solved)audio.tone('G5');}
function startPiano(){stop();state.screen='exercise';const song=SONGS.find(s=>s.id===state.song);main.innerHTML=`<section class="exercise">${sessionHeader('Dein Klaviermoment',0,song.notes.length)}<div id="piano-mount"></div></section>`;on('exit','click',setup);state.game=new PianoGame(document.querySelector('#piano-mount'),{song,mode:state.pianoMode,loop:state.pianoLoop,speed:state.speed,audio,onProgress:(count)=>{const p=main.querySelector('.progress');p.setAttribute('aria-valuenow',count);p.querySelector('span').style.width=`${count/song.notes.length*100}%`;},onComplete:result=>pianoSummary(result)});}
function summary(){stop();state.screen='summary';const correct=state.results.filter(r=>r.correct).length,total=state.results.length,missed=state.results.filter(r=>!r.correct);
  main.innerHTML=`<section class="summary">${avatarImage(state.avatar,'avatar-large')}<h1>Ein Stück weiter.</h1><p>${state.avatar.name} freut sich mit dir. Du hast deine Runde geschafft.</p><div class="score">${correct}<span style="font-size:30px;color:var(--muted);letter-spacing:-1px"> / ${total}</span></div><p>${state.tab==='reading'?'Wörter als gelesen markiert':`Aufgaben direkt richtig · ${state.results.filter(r=>r.solved).length} insgesamt selbst gelöst`}</p><div class="summary-actions">${button('repeat','Noch eine Runde')}${missed.length?button('practice-missed','Noch einmal üben','secondary'):''}${button('back','Zur Auswahl','secondary')}</div><section class="surface"><h2>Deine Runde im Überblick</h2>${state.tab==='reading'?`<div class="result-list">${state.results.map(r=>`<span class="result-word ${r.correct?'correct':'missed'}">${r.correct?'✓':'↻'} ${esc(r.word)}</span>`).join('')}</div>`:`<table class="result-table"><thead><tr><th>Aufgabe</th><th>Ergebnis</th><th>Dein Weg</th></tr></thead><tbody>${state.results.map(r=>`<tr><td>${r.a} ${r.op==='+'?'+':'−'} ${r.b}</td><td>${r.answer}</td><td>${r.correct?'Direkt richtig':r.solved?'Mit neuem Versuch':'Lösung angeschaut'}</td></tr>`).join('')}</tbody></table>`}</section></section>`;
  on('back','click',setup);on('repeat','click',()=>chooseAvatar(()=>state.tab==='reading'?startReading(state.deck):startMath(makeMathDeck(state.range,state.operation))));on('practice-missed','click',()=>chooseAvatar(()=>state.tab==='reading'?startReading(missed.map(r=>r.word)):startMath(shuffle(missed))));
}
function pianoSummary(result){
  stop();state.screen='summary';
  const free=result.free;
  main.innerHTML=`<section class="summary">${avatarImage(state.avatar,'avatar-large')}<h1>${free?'Deine Begleitung ist fertig.':'Dein kleiner Auftritt.'}</h1><p>${esc(SONGS.find(s=>s.id===state.song).title)} · ${{step:'Schritt für Schritt',rhythm:'Im Rhythmus',free:'Freispiel'}[state.pianoMode]}</p>${free?`<div class="score">${result.total}</div><p>Noten durchlaufen · ohne Bewertung</p>`:`<div class="score">${result.hits}<span style="font-size:30px;color:var(--muted);letter-spacing:-1px"> / ${result.total}</span></div><p>Töne getroffen · ${result.misses} verpasst · ${result.wrong} zusätzliche Versuche</p>`}<div class="summary-actions">${button('repeat-piano',free?'Begleitung wiederholen':'Noch einmal spielen')}${button('back','Andere Melodie','secondary')}</div><p>Jeder Versuch macht dich ein bisschen sicherer.</p></section>`;
  on('repeat-piano','click',()=>chooseAvatar(startPiano));on('back','click',setup);
}

document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;setup();});
const soundButton=document.querySelector('#sound');
function updateSound(){soundButton.textContent=audio.enabled?'Ton an':'Ton aus';soundButton.setAttribute('aria-pressed',String(audio.enabled));}
soundButton.onclick=()=>{audio.enabled=!audio.enabled;if(audio.enabled)audio.unlock().catch(()=>{});else audio.context?.suspend();save();updateSound();};
window.addEventListener('keydown',e=>{
  if(dialog.open || e.repeat || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.key==='Escape'&&state.screen==='exercise'){e.preventDefault();setup();return;}
  if(state.tab==='reading'&&state.screen==='exercise'&&state.phase==='rating'){
    if(['ArrowLeft','j','J','1','y'].includes(e.key)){e.preventDefault();rateReading(true);}
    if(['ArrowRight','n','N','2'].includes(e.key)){e.preventDefault();rateReading(false);}
  }
});
// Hidden reading tabs cannot silently advance a flash that the learner never saw.
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.tab==='reading'&&state.screen==='exercise'){stop();state.phase='paused';document.querySelector('#flash').innerHTML='<h2>Kurze Pause.</h2><p class="card-caption">Wir zeigen dir dasselbe Wort noch einmal.</p><button id="resume-reading" class="primary" style="margin-top:20px">Weiterlesen</button>';document.querySelector('#read-yes').disabled=true;document.querySelector('#read-no').disabled=true;on('resume-reading','click',readingCard);}});
updateSound();setup();
