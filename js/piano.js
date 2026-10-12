import { pianoKeysFor } from './data.js';
import { escapeHTML as esc, nearestNote } from './core.js';

export class PianoGame {
  constructor(mount, {song,mode,loop=false,speed,audio,onProgress,onComplete}) {
    Object.assign(this,{mount,song,mode,loop,speed,audio,onProgress,onComplete});
    this.beat=-4;this.lastTime=null;this.frame=0;this.phase='ready';this.resolved=new Set();this.hits=0;this.wrong=0;this.misses=0;this.preview=false;this.destroyed=false;this.cycle=1;this.keys=pianoKeysFor(song.notes);
    this.bpm=song.bpm*speed/100;this.beatSeconds=60/this.bpm;
    this.abort=new AbortController();this.keyTimers=new Set();this.keyReleaseTimers=new Map();
    this.layout();this.bind();this.draw();
  }
  layout(){
    let white=0;
    const whiteCount=this.keys.filter(k=>!k.black).length, width=100/whiteCount;
    this.keyLayout=this.keys.map(k=>{const left=k.black?white*width-width*.3:white++*width;return {...k,left,width:k.black?width*.6:width};});
    this.mount.innerHTML=`<div class="piano-topline"><div><h2>${esc(this.song.title)}</h2><p>${{step:'Schritt für Schritt',rhythm:'Im Rhythmus',free:'Freispiel'}[this.mode]} · ${Math.round(this.bpm)} Schläge / Minute · C4–${this.keys.at(-1).label}${this.keys.at(-1).pitch.slice(-1)}</p></div><button id="demo" class="secondary">Vorspielen</button></div>
    <div class="piano-scroll"><div class="piano-shell" style="--white-width:${width}%;--piano-min-width:${whiteCount*36}px"><div class="runway" aria-label="Noten fallen zur blauen Spiellinie">${Array.from({length:whiteCount},(_,i)=>`<div class="lane" style="left:${i*width}%;width:${width}%"></div>`).join('')}${this.song.notes.map((n,i)=>{const k=this.keyLayout.find(k=>k.pitch===n.pitch);return `<div class="falling-note ${k.black?'sharp':''}" data-note="${i}" aria-hidden="true" style="left:${k.left+.7}%;width:${k.width-1.4}%">${k.label}</div>`;}).join('')}<div class="hit-line"></div></div>
    <div class="keyboard" aria-label="Klaviatur">${this.keyLayout.filter(k=>!k.black).map(k=>this.keyHTML(k)).join('')}${this.keyLayout.filter(k=>k.black).map(k=>this.keyHTML(k)).join('')}</div>
    <div class="piano-overlay"><h3>Deine Bühne ist bereit.</h3><p>${this.mode==='free'?'Spiele auf deinem Instrument mit.':'Triff die Note an der blauen Linie.'}</p><button id="play" class="primary">${this.mode==='free'?'Begleitung starten':'Losspielen'}</button></div></div></div>
    <div class="piano-controls"><p class="piano-hint">${this.mode==='free'?'Spiele auf deinem Klavier mit. Die Anleitung läuft ohne Eingabe und ohne Bewertung. Mit „Ton aus“ bleibt nur die visuelle Begleitung.':`Tippe auf die Tasten oder nutze die Buchstaben darunter. ${this.mode==='step'?'Jede Note wartet an der Linie auf dich.':'Spiele, wenn die Note die blaue Linie berührt.'}`}</p><button id="pause" class="secondary" disabled>Pause</button></div><p class="piano-feedback" id="piano-feedback" role="status" aria-live="polite">C, D, E – probier die Tasten schon einmal aus.</p>`;
    this.noteElements=[...this.mount.querySelectorAll('[data-note]')];
    this.keyElements=[...this.mount.querySelectorAll('[data-pitch]')];
    this.overlay=this.mount.querySelector('.piano-overlay');
    this.runway=this.mount.querySelector('.runway');
    this.feedback=this.mount.querySelector('#piano-feedback');
    this.pauseButton=this.mount.querySelector('#pause');
    this.demoButton=this.mount.querySelector('#demo');
  }
  keyHTML(k){return `<button class="piano-key ${k.black?'black':''}" data-pitch="${k.pitch}" style="left:${k.black?k.left:0}%;width:${k.width}%" aria-label="${k.label}${k.pitch.slice(-1)}, Taste ${k.key.toUpperCase()}"><strong>${k.label}<sub>${k.pitch.slice(-1)}</sub></strong><small>${k.key}</small></button>`;}
  listen(target,type,fn){target.addEventListener(type,fn,{signal:this.abort.signal});}
  bind(){
    this.listen(this.mount.querySelector('#play'),'click',()=>this.start(false));
    this.listen(this.demoButton,'click',()=>this.start(true));
    this.listen(this.pauseButton,'click',()=>this.phase==='paused'?this.resume():this.pause());
    this.keyElements.forEach(b=>{
      this.listen(b,'pointerdown',e=>{e.preventDefault();this.press(b.dataset.pitch);});
      this.listen(b,'click',e=>{if(e.detail===0)this.press(b.dataset.pitch);});
    });
    this.listen(window,'keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=this.keys.find(k=>k.key===e.key.toLowerCase());if(k){e.preventDefault();this.press(k.pitch);}});
    this.listen(window,'blur',()=>{if(this.mode!=='free')this.pause();});
    this.listen(document,'visibilitychange',()=>{if(document.hidden)this.pause();});
  }
  reset(){this.beat=-4;this.lastTime=null;this.resolved.clear();this.hits=0;this.misses=0;this.wrong=0;this.noteElements.forEach(n=>n.classList.remove('hit','missed'));this.onProgress(0);}
  start(preview){
    if(this.destroyed)return;
    cancelAnimationFrame(this.frame);this.reset();this.cycle=1;this.preview=preview;this.phase='playing';
    this.audio.unlock().catch(()=>{this.feedback.textContent='Der Browser konnte den Ton nicht starten. Das Spiel funktioniert auch ohne Ton.';});
    this.overlay.hidden=true;this.demoButton.disabled=true;this.pauseButton.disabled=false;this.pauseButton.textContent='Pause';
    this.feedback.textContent=preview?'Hör zu und schau auf die Tasten.':this.mode==='free'?`Freispiel · Durchgang ${this.cycle} · spiele auf deinem Instrument mit.`:'Gleich geht es los …';
    this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  tick(time){
    if(this.phase!=='playing'||this.destroyed)return;
    if(this.lastTime===null){this.lastTime=time;window.__ready=true;this.draw();this.frame=requestAnimationFrame(t=>this.tick(t));return;}
    const dt=Math.min((time-this.lastTime)/1000,.1);this.lastTime=time;
    let nextBeat=this.beat+dt/this.beatSeconds;
    const nextIndex=this.song.notes.findIndex((_,i)=>!this.resolved.has(i));
    const next=this.song.notes[nextIndex];
    if(!this.preview&&this.mode==='step'&&next)nextBeat=Math.min(nextBeat,next.beat);
    this.beat=nextBeat;
    const tolerance=.3/this.beatSeconds;
    this.song.notes.forEach((n,i)=>{
      if(this.resolved.has(i))return;
      if((this.preview||this.mode==='free')&&this.beat>=n.beat){this.resolved.add(i);this.sound(n.pitch,n.duration*this.beatSeconds);this.noteElements[i].classList.add('hit');if(!this.preview)this.onProgress(this.resolved.size);}
      else if(!this.preview&&this.mode==='rhythm'&&this.beat>n.beat+tolerance){this.resolved.add(i);this.misses++;this.noteElements[i].classList.add('missed');this.feedback.textContent='Die nächste Note ist eine neue Chance.';this.onProgress(this.resolved.size);}
    });
    const end=this.song.notes.at(-1);
    if(this.resolved.size===this.song.notes.length&&this.beat>end.beat+end.duration+.5){this.finish();return;}
    this.draw();this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  draw(){
    const height=this.runway.clientHeight, scale=height/4;
    this.song.notes.forEach((note,i)=>{
      const node=this.noteElements[i], noteHeight=Math.max(26,note.duration*scale*.85);
      const bottom=height-(note.beat-this.beat)*scale;
      node.style.height=`${noteHeight}px`;
      node.style.transform=`translateY(${bottom-noteHeight}px)`;
      node.style.visibility=bottom<-5||bottom-noteHeight>height+5?'hidden':'visible';
    });
    const next=this.song.notes.find((_,i)=>!this.resolved.has(i));
    this.keyElements.forEach(b=>b.classList.toggle('expected',!!next&&b.dataset.pitch===next.pitch&&next.beat-this.beat<.5));
    if(this.phase==='playing'&&!this.preview&&this.mode==='step'&&next&&this.beat>=next.beat){
      const k=this.keys.find(k=>k.pitch===next.pitch);const text=`Jetzt ${k.label} spielen · Taste ${k.key.toUpperCase()}`;
      if(this.feedback.textContent!==text)this.feedback.textContent=text;
    }
  }
  sound(pitch,duration=.35){
    this.audio.tone(pitch,Math.min(duration,2));
    const b=this.keyElements.find(b=>b.dataset.pitch===pitch);b.classList.add('pressed');
    const previous=this.keyReleaseTimers.get(pitch);clearTimeout(previous);this.keyTimers.delete(previous);
    const timer=setTimeout(()=>{b.classList.remove('pressed');this.keyTimers.delete(timer);this.keyReleaseTimers.delete(pitch);},Math.max(160,Math.min(duration,2)*1000));this.keyTimers.add(timer);this.keyReleaseTimers.set(pitch,timer);
  }
  press(pitch){
    if(this.destroyed||this.phase==='paused'||this.preview)return;
    if(this.phase!=='playing'||this.mode==='free'){this.audio.unlock().then(()=>{if(!this.destroyed)this.sound(pitch);}).catch(()=>{});return;}
    const index=nearestNote(this.song.notes,this.resolved,pitch,this.beat,.3/this.beatSeconds);
    // Step mode advances only its next unresolved note; later repetitions cannot skip ahead.
    const first=this.song.notes.findIndex((_,i)=>!this.resolved.has(i));
    if(index>=0&&(this.mode!=='step'||index===first)){
      this.resolved.add(index);this.hits++;this.noteElements[index].classList.add('hit');this.feedback.textContent=this.mode==='step'?'Richtig. Weiter geht’s!':'Im Takt getroffen!';this.onProgress(this.resolved.size);
      this.sound(pitch,this.song.notes[index].duration*this.beatSeconds);
    }else{this.sound(pitch);this.wrong++;this.feedback.textContent='Schau auf die nächste Note und die blaue Linie.';}
  }
  pause(){if(this.phase!=='playing')return;this.phase='paused';cancelAnimationFrame(this.frame);this.pauseButton.textContent='Weiter';this.overlay.innerHTML='<h3>Kurze Pause.</h3><p>Deine Melodie wartet auf dich.</p><button class="primary" id="resume-piano">Weiterspielen</button>';this.overlay.hidden=false;this.overlay.querySelector('button').onclick=()=>this.resume();}
  resume(){if(this.phase!=='paused')return;this.phase='playing';this.lastTime=null;this.overlay.hidden=true;this.pauseButton.textContent='Pause';this.audio.unlock().catch(()=>{});this.frame=requestAnimationFrame(t=>this.tick(t));}
  finish(){
    cancelAnimationFrame(this.frame);
    if(this.preview){this.phase='ready';this.preview=false;this.reset();this.draw();this.pauseButton.disabled=true;this.demoButton.disabled=false;this.overlay.innerHTML='<h3>Jetzt bist du dran.</h3><p>Spiel die Melodie mit deinem Begleiter.</p><button class="primary" id="play-again">Losspielen</button>';this.overlay.hidden=false;this.overlay.querySelector('button').onclick=()=>this.start(false);this.feedback.textContent='Bereit für deinen Auftritt?';}
    else if(this.mode==='free'&&this.loop){this.cycle++;this.reset();this.feedback.textContent=`Freispiel · Durchgang ${this.cycle} · spiele auf deinem Instrument mit.`;this.draw();this.frame=requestAnimationFrame(t=>this.tick(t));}
    else{this.phase='done';this.onComplete({hits:this.hits,total:this.song.notes.length,wrong:this.wrong,misses:this.misses,free:this.mode==='free'});}
  }
  destroy(){this.destroyed=true;cancelAnimationFrame(this.frame);this.abort.abort();this.keyTimers.forEach(clearTimeout);this.keyTimers.clear();}
}
