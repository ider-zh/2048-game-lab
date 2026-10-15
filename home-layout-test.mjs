import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
const b=await chromium.launch({channel:'msedge',headless:false}),results=[];
try{for(const width of [1440,390]){
const p=await b.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce',isMobile:width===390,hasTouch:width===390});
await p.goto('http://127.0.0.1:5178');await p.locator('.live-demo').scrollIntoViewIfNeeded();await expect.poll(async()=>Number(await p.getByTestId('demo-steps').innerText()),{timeout:45000}).toBeGreaterThan(20);
await p.getByLabel('暂停演示').click();await expect(p.locator('.live-demo .board')).toHaveAttribute('data-phase','idle');await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'evidence/home-v06-'+width+'.png',fullPage:true});await p.screenshot({path:'evidence/home-v06-hero-'+width+'.png'});
results.push({width,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),font:await p.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily)});await p.close();}
await fs.writeFile('evidence/home-layout-v06.json',JSON.stringify(results,null,2));console.log(results);}finally{await b.close();}
