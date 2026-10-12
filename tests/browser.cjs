/* Run with Playwright available on NODE_PATH, and npm start in another terminal. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const broken=[];page.on('response',r=>{if(r.status()>=400)broken.push(r.url());});
 await page.clock.install();
 await page.goto('http://127.0.0.1:4173');
 const dir=process.env.EMMA_SHOTS || '/tmp/emma-qa';fs.mkdirSync(dir,{recursive:true});
 await page.screenshot({path:dir+'/reading-desktop.png',fullPage:true});
 async function avatar(id='bluey'){
  await page.locator('#avatar-dialog').waitFor({state:'visible'});
  assert.equal(await page.locator('#confirm-avatar').isDisabled(),true);
  await page.locator(`[data-avatar="${id}"]`).click();await page.locator('#confirm-avatar').click();
 }
 // Complete a custom reading round, then make sure retries require an avatar again.
 await page.locator('summary').click();await page.locator('#word-editor').fill('Sonne\nMond');
 await page.locator('#start-reading').click();await page.locator('#avatar-dialog img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:dir+'/avatars.png'});await avatar('batman');
 await page.clock.runFor(1700);await page.locator('#read-yes').click();
 await page.clock.runFor(1700);await page.locator('#read-no').click();
 assert.ok((await page.locator('.score').innerText()).includes('1'));
 await page.locator('#practice-missed').click();await avatar('bingo');
 await page.clock.runFor(1700);await page.locator('#read-yes').click();await page.locator('#back').click();
 await page.locator('[data-category="verbs"]').click();assert.equal(await page.locator('.pack').count(),10);
 await page.locator('[data-size="100"]').click();assert.equal(await page.locator('.pack').count(),2);
 await page.locator('[data-pack="1"]').click();assert.equal(await page.locator('#word-count').innerText(),'100 Wörter bereit');
 // Full 20-card math round with an incorrect first attempt and a revealed answer.
 await page.locator('[data-tab="math"]').click();await page.locator('#start-math').click();await avatar('sam');await page.clock.runFor(50);
 await page.screenshot({path:dir+'/math-desktop.png',fullPage:true});
 for(let i=0;i<20;i++){
  const a=Number(await page.locator('.equation .a').innerText()),b=Number(await page.locator('.equation .b').innerText());
  const plus=(await page.locator('.equation').innerText()).includes('+'),answer=plus?a+b:a-b;
  assert.equal(await page.locator('.dot').count(),40);assert.equal(await page.locator('.five-group').count(),8);
  if(i===0){await page.locator('#answer').fill('999');await page.locator('#answer-form button').click();assert.ok((await page.locator('#math-feedback').innerText()).includes('Noch nicht'));}
  if(i===1)await page.locator('#show-answer').click();
  else{await page.locator('#answer').fill(String(answer));await page.locator('#answer-form button').click();}
  assert.equal(await page.locator('#solution').innerText(),String(answer));
  await page.locator('#next-card').click();await page.clock.runFor(50);
 }
 assert.ok((await page.locator('.score').innerText()).includes('18'));
 assert.equal(await page.locator('.result-table tbody tr').count(),20);
 await page.locator('#back').click();await page.locator('[data-range="100"]').click();await page.locator('[data-operation="-"]').click();await page.locator('#start-math').click();await avatar('muffin');await page.clock.runFor(50);
 assert.equal(await page.locator('.base-ten').count(),2);await page.screenshot({path:dir+'/math-100.png',fullPage:true});
 await page.locator('#exit').click();
 // Fully play a step-mode song via actual UI keys and verify cleanup/navigation.
 await page.locator('[data-tab="piano"]').click();await page.locator('#start-piano').click();await avatar();
 await page.locator('#play').click();
 const notes=await page.evaluate(async()=>{const {SONGS}=await import('/js/data.js');return SONGS[0].notes;});
 for(let i=0;i<notes.length;i++){
  await page.clock.runFor(i===0?5000:2400);
  if(i===0){await page.locator('#pause').click();await page.clock.runFor(5000);assert.equal(await page.locator('#resume-piano').isVisible(),true);await page.locator('#resume-piano').click();await page.clock.runFor(20);await page.screenshot({path:dir+'/piano-desktop.png',fullPage:true});}
  await page.locator(`[data-pitch="${notes[i].pitch}"]`).click();
 }
 await page.clock.runFor(5000);assert.equal(await page.locator('.summary h1').innerText(),'Dein kleiner Auftritt.');
 assert.ok((await page.locator('.score').innerText()).includes(String(notes.length)));
 await page.locator('#back').click();
 // Short Linkin Park excerpt, autoplay completes and returns control; rhythm misses finish.
 await page.locator('[data-song="numb"]').click();await page.locator('[data-mode="rhythm"]').click();await page.locator('#start-piano').click();await avatar('spidey');
 await page.locator('#demo').click();await page.clock.runFor(50000);assert.equal(await page.locator('#play-again').isVisible(),true);
 await page.locator('#play-again').click();await page.clock.runFor(3450);await page.keyboard.press('t');await page.clock.runFor(50000);assert.ok((await page.locator('.summary').innerText()).includes('27 verpasst'));assert.ok((await page.locator('.score').innerText()).includes('1'));
 await page.locator('#back').click();
 for(const width of [390,768]){
  await page.setViewportSize({width,height:844});
  for(const tab of ['reading','math','piano']){
   await page.locator(`[data-tab="${tab}"]`).click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${tab} overflow at ${width}`);
   await page.screenshot({path:`${dir}/${tab}-${width}.png`,fullPage:true});
  }
 }
 // Mobile active cards and all avatar images load.
 await page.setViewportSize({width:390,height:844});await page.locator('[data-tab="math"]').click();await page.locator('[data-range="20"]').click();await page.locator('#start-math').click();
 assert.ok(await page.locator('#avatar-dialog img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));await avatar('paw');await page.clock.runFor(50);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:dir+'/math-mobile-active.png',fullPage:true});
 await page.locator('[data-tab="piano"]').click();await page.locator('#start-piano').click();await avatar('einhorn');await page.locator('#play').click();await page.clock.runFor(3500);await page.screenshot({path:dir+'/piano-mobile-active.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);assert.deepEqual(broken,[]);
 console.log('PASS: reading and retry, 20 math cards, 100 range, all avatars, full piano step song, preview, rhythm misses, pause, responsive layouts; zero console or HTTP errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
