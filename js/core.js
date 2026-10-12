export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export const parseWords = text => text.split('\n').map(s => s.trim().replace(/^\d+[\s.\-)\t]+/, '').trim()).filter(s => s && !s.startsWith('<<'));
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function makeMathPool(max, op) {
  const cards = [];
  for (let a = 1; a <= max; a++) for (let b = 1; b <= max; b++) {
    const answer = op === '+' ? a + b : a - b;
    if (answer >= 0 && answer <= max) cards.push({a,b,op,answer});
  }
  return cards;
}
export function makeMathDeck(max = 20, mode = 'mixed', random = Math.random) {
  if (![20,100].includes(max) || !['+','-','mixed'].includes(mode)) throw new Error('Ungültiger Zahlenraum oder Modus.');
  if (mode === 'mixed') return shuffle([
    ...shuffle(makeMathPool(max, '+'), random).slice(0, 10),
    ...shuffle(makeMathPool(max, '-'), random).slice(0, 10)
  ], random);
  return shuffle(makeMathPool(max, mode), random).slice(0, 20);
}
// Each operand gets its own complete twenty-frame; no result or operation is drawn.
export function twentyCells(value, color = 'blue') {
  if (!Number.isInteger(value) || value < 0 || value > 20) throw new Error('Ungültige Plättchenzahl.');
  return Array.from({length:20}, (_,i) => i < value ? color : 'empty');
}

export const placeValue = n => ({tens:Math.floor(n/10),ones:n%10});
export const answerMatches = (input, answer) => /^\d+$/.test(input.trim()) && Number(input) === answer;
export function noteFrequency(pitch) {
  const match = /^([A-G])(#?)(\d)$/.exec(pitch);
  if (!match) throw new Error('Ungültiger Ton');
  const midi = (Number(match[3]) + 1) * 12 + ({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1]]) + (match[2] ? 1 : 0);
  return 440 * 2 ** ((midi - 69)/12);
}
export function nearestNote(notes, resolved, pitch, beat, tolerance) {
  return notes.map((n,i) => ({n,i})).filter(({n,i}) => !resolved.has(i) && n.pitch === pitch && Math.abs(n.beat-beat) <= tolerance)
    .sort((a,b) => Math.abs(a.n.beat-beat)-Math.abs(b.n.beat-beat))[0]?.i ?? -1;
}
export class AudioEngine {
  context = null;
  enabled = true;
  async unlock() {
    if (!this.enabled) return;
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) return;
    this.context ||= new Audio();
    if (this.context.state === 'suspended') await this.context.resume();
  }
  tone(pitch, duration = .3) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime, frequency = noteFrequency(pitch);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0,now);
    gain.gain.linearRampToValueAtTime(.16,now+.008);
    gain.gain.exponentialRampToValueAtTime(.045,now+.12);
    gain.gain.exponentialRampToValueAtTime(.001,now+Math.max(.2,duration));
    gain.connect(this.context.destination);
    [1,2,3].forEach((harmonic,i) => {
      const osc=this.context.createOscillator(), partial=this.context.createGain();
      osc.frequency.value=frequency*harmonic; partial.gain.value=[1,.23,.08][i];
      osc.connect(partial); partial.connect(gain); osc.start(now); osc.stop(now+Math.max(.2,duration)+.02);
      osc.onended=()=>{osc.disconnect();partial.disconnect();};
    });
    setTimeout(()=>gain.disconnect(),(Math.max(.2,duration)+.1)*1000);
  }
}
