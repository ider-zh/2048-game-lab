import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({channel:'msedge',headless:true}),results=[];
try {
 for(const reducedMotion of ['reduce','no-preference'])for(const legacy of [null,'system','reduced','fast','full']){
  const context=await b.newContext({reducedMotion});
  await context.addInitScript(value=>{if(value===null)localStorage.removeItem('2048-motion');else localStorage.setItem('2048-motion',value);},legacy);
  const p=await context.newPage();await p.goto('http://127.0.0.1:5178/#lab');
  const a=p.locator('.experiment').first(),board=a.locator('.board');
  await expect(board).toHaveAttribute('data-motion','full');
  await expect(p.locator('.motion-settings')).toHaveCount(0);
  await a.locator('.manual button').first().click();await board.locator('.moving-tile').first().waitFor();
  const state=await board.evaluate(el=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,mode:el.dataset.motion,duration:getComputedStyle(el.querySelector('.moving-tile')).transitionDuration}));
  expect(state.duration).toBe('0.36s');expect(state.reduced).toBe(reducedMotion==='reduce');
  await expect(board).toHaveAttribute('data-phase','idle');
  await p.goto('http://127.0.0.1:5178/#home');await p.locator('.live-demo .moving-tile').first().waitFor();
  expect(await p.locator('.live-demo .moving-tile').first().evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0.36s');
  await expect(p.getByLabel('演示速度')).toHaveCount(0);
  results.push({reducedMotion,legacy,state,homeFull:true});await context.close();
 }
 await writeFile('evidence/fixed-motion-results.json',JSON.stringify({passed:true,results},null,2));console.log('All 10 OS/legacy-storage combinations passed on home and lab');
} finally {await b.close();}
