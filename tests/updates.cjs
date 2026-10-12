const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto('http://127.0.0.1:4173');
 const dir='/tmp/emma-v2-qa';fs.mkdirSync(dir,{recursive:true});
 async function avatar(){await page.locator('[data-avatar=bluey]').click();await page.locator('#confirm-avatar').click();await page.clock.runFor(50);}
 await page.locator('[data-tab=math]').click();
 for(const mode of ['+','-']){
  await page.locator(`[data-operation="${mode}"]`).click();await page.locator('#start-math').click();await avatar();
  const a=Number(await page.locator('.equation .a').innerText()),b=Number(await page.locator('.equation .b').innerText());
  assert.equal(await page.locator('.twenty-frame').count(),2);assert.equal(await page.locator('[data-operand=blue] .dot').count(),20);assert.equal(await page.locator('[data-operand=red] .dot').count(),20);
  assert.equal(await page.locator('.dot.blue').count(),a);assert.equal(await page.locator('.dot.red').count(),b);
  assert.equal(await page.locator('.dot.removed,.number-line,.quantities .operator').count(),0);
  assert.equal(await page.locator('#solution').innerText(),'?');
  await page.screenshot({path:`${dir}/math-${mode==='+'?'plus':'minus'}.png`,fullPage:true});
  await page.locator('#show-answer').click();assert.equal(await page.locator('.number-line').count(),0);await page.locator('#exit').click();
 }
 await page.locator('[data-range="100"]').click();await page.locator('#start-math').click();await avatar();
 assert.equal(await page.locator('.base-ten').count(),2);assert.equal(await page.locator('.number-line').count(),1);await page.locator('#exit').click();
 await page.locator('[data-tab=piano]').click();assert.equal(await page.locator('.song-card').count(),15);
 const songs=await page.evaluate(async()=>{const {SONGS}=await import('/js/data.js');return SONGS.map(s=>({id:s.id,count:s.notes.length,end:s.notes.at(-1).beat+s.notes.at(-1).duration,bpm:s.bpm}));});
 // All 15 songs render their actual notes and can run in the automatic mode.
 await page.locator('[data-mode=free]').click();
 for(const song of songs){
  await page.locator(`[data-song="${song.id}"]`).click();await page.locator('#start-piano').click();await avatar();
  assert.equal(await page.locator('[data-note]').count(),song.count);
  await page.locator('#play').click();await page.clock.runFor(4800);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal(await page.locator('.piano-overlay').isVisible(),false,'Freispiel must keep running on focus loss');
  if(song.id==='elise'){
   await page.screenshot({path:dir+'/free-elise.png',fullPage:true});await page.locator('#pause').click();
   const before=await page.locator('[data-note="10"]').getAttribute('style');await page.clock.runFor(2000);assert.equal(await page.locator('[data-note="10"]').getAttribute('style'),before);await page.locator('#resume-piano').click();
  }
  await page.clock.runFor(Math.ceil((song.end+5)*60000/(song.bpm*.8)));
  assert.equal(await page.locator('.summary h1').innerText(),'Deine Begleitung ist fertig.');
  assert.ok((await page.locator('.summary').innerText()).includes('ohne Bewertung'));
  assert.equal((await page.locator('.summary').innerText()).includes('verpasst'),false);
  await page.locator('#back').click();
 }
 // Loop mode keeps going without a result screen; muting does not stop the guide.
 await page.locator('[data-song=champions]').click();await page.locator('#piano-loop').check();await page.locator('#start-piano').click();await avatar();await page.locator('#sound').click();await page.locator('#play').click();await page.clock.runFor(17000);
 assert.ok((await page.locator('#piano-feedback').innerText()).includes('Durchgang 2'));assert.equal(await page.locator('.summary').count(),0);
 await page.locator('#pause').click();assert.equal(await page.locator('#resume-piano').isVisible(),true);await page.locator('#resume-piano').click();await page.clock.runFor(3000);
 await page.locator('[data-tab=math]').click();await page.clock.runFor(25000);assert.equal(await page.locator('.summary').count(),0);
 // Mobile: both fields remain distinct; large-song keyboard scrolls internally.
 await page.setViewportSize({width:390,height:844});await page.locator('[data-range="20"]').click();await page.locator('#start-math').click();await avatar();await page.screenshot({path:dir+'/math-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('[data-tab=piano]').click();await page.locator('[data-song=morgen]').click();await page.screenshot({path:dir+'/songs-mobile.png',fullPage:true});await page.locator('#start-piano').click();await avatar();await page.locator('#play').click();await page.clock.runFor(4500);await page.screenshot({path:dir+'/piano-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: independent 20+20 counters, no result clues, unchanged 100 range, 15 automatic songs, pause, focus loss, looping, muted playback, navigation cleanup and mobile.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
