import test from 'node:test';
import assert from 'node:assert/strict';
import {VERBS,NOUNS,READING_CATEGORIES,wordSections,SONGS,PIANO_KEYS,pianoKeysFor} from '../js/data.js';
import {makeMathDeck,makeMathPool,twentyCells,placeValue,parseWords,answerMatches,nearestNote,noteFrequency} from '../js/core.js';

for (const [name,words] of [['Verben',VERBS],['Nomen',NOUNS]]) {
  test(`${name}: exactly 200 unique entries, complete 20/100 sections`,()=>{
    assert.equal(words.length,200);assert.equal(new Set(words).size,200);
    for(const size of [20,100]){const sections=wordSections(words,size);assert.equal(sections.length,200/size);assert.ok(sections.every(s=>s.words.length===size));assert.deepEqual(sections.flatMap(s=>s.words),words);}
  });
}
test('Old reading lists remain available and custom word parsing is safe',()=>{
  for(const id of ['basic','starter','tierhelden','superhelden','pawpatrol','maus','bluey'])assert.ok(READING_CATEGORIES.some(c=>c.id===id));
  assert.equal(READING_CATEGORIES[0].words.length,100);
  assert.deepEqual(parseWords('1. Sonne\n\n2) Mond\n<< Hinweis\n Baum '),['Sonne','Mond','Baum']);
});
for(const max of [20,100])for(const op of ['+','-'])test(`All ${op} cards through ${max} stay in range`,()=>{
  const pool=makeMathPool(max,op);
  assert.ok(pool.some(c=>c.a===max || c.answer===max));
  for(const c of pool){assert.ok(c.a>=1&&c.a<=max);assert.ok(c.b>=1&&c.b<=max);assert.ok(c.answer>=0&&c.answer<=max);assert.equal(c.answer,op==='+'?c.a+c.b:c.a-c.b);}
});
test('Every session has 20 unique cards, mixed decks balance operations',()=>{
  for(let run=0;run<30;run++)for(const max of [20,100])for(const mode of ['+','-','mixed']){
    const cards=makeMathDeck(max,mode);assert.equal(cards.length,20);assert.equal(new Set(cards.map(c=>`${c.a}${c.op}${c.b}`)).size,20);
    if(mode==='mixed')assert.equal(cards.filter(c=>c.op==='+').length,10);
    else assert.ok(cards.every(c=>c.op===mode));
  }
});
test('Each operand has twenty slots and its own quantity, independent of the operation',()=>{
  for(const op of ['+','-'])for(const card of makeMathPool(20,op)){
    for(const [value,color] of [[card.a,'blue'],[card.b,'red']]){
      const cells=twentyCells(value,color);assert.equal(cells.length,20);
      assert.equal(cells.filter(c=>c===color).length,value);
      assert.equal(cells.filter(c=>c==='empty').length,20-value);
      assert.equal(cells.includes('removed'),false);
    }
  }
});
test('Tens and units represent every number through 100 exactly',()=>{
  for(let n=0;n<=100;n++){const v=placeValue(n);assert.equal(v.tens*10+v.ones,n);assert.ok(v.ones>=0&&v.ones<10);}
});
test('Answers reject blank, signed, decimal, exponent and mixed text',()=>{
  assert.ok(answerMatches('0',0));assert.ok(answerMatches(' 20 ',20));
  for(const value of ['',' ','-1','2e1','20x','20.0','+20'])assert.equal(answerMatches(value,20),false);
});
test('All songs fit the actual piano and contain valid ordered rhythms',()=>{
  assert.equal(SONGS.length,15);
  for(const song of SONGS){const keyboard=pianoKeysFor(song.notes);assert.equal(new Set(keyboard.map(k=>k.key)).size,keyboard.length);assert.ok(song.notes.every(n=>keyboard.some(k=>k.pitch===n.pitch)));assert.ok(song.bpm>0);let last=-1;for(const note of song.notes){assert.ok(PIANO_KEYS.some(k=>k.pitch===note.pitch));assert.ok(note.beat>last);assert.ok(note.duration>0);last=note.beat;}}
  assert.equal(SONGS.find(s=>s.id==='numb').notes.length,28);
  assert.equal(noteFrequency('A4'),440);
});
test('Rhythm grading rejects wrong pitch, early and late presses, and repeated hits',()=>{
  const notes=[{pitch:'C4',beat:0},{pitch:'C4',beat:1}];
  assert.equal(nearestNote(notes,new Set(),'C4',.1,.3),0);
  assert.equal(nearestNote(notes,new Set(),'D4',0,.3),-1);
  assert.equal(nearestNote(notes,new Set(),'C4',-.5,.3),-1);
  assert.equal(nearestNote(notes,new Set(),'C4',.5,.3),-1);
  assert.equal(nearestNote(notes,new Set([0]),'C4',.1,.3),-1);
  assert.equal(nearestNote(notes,new Set([0]),'C4',1,.3),1);
});
