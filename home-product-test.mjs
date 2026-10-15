import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
try{
for(const width of [1440,768,390,320]){
 const p=await browser.newPage({viewport:{width,height:width<740?844:1000},isMobile:width<740,hasTouch:width<740,reducedMotion:'reduce'});
 p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5178');
 await p.locator('.live-demo').scrollIntoViewIfNeeded();await expect.poll(async()=>Number(await p.getByTestId('demo-steps').innerText())).toBeGreaterThan(2);
 const perf=await p.evaluate(()=>new Promise(resolve=>{const frames=[],positions=[];let last=performance.now(),start=last;function sample(t){frames.push(t-last);last=t;const tile=document.querySelector('.live-demo .moving-tile');if(tile)positions.push(getComputedStyle(tile).transform);if(t-start<2400)requestAnimationFrame(sample);else resolve({frames:frames.length,p95:frames.sort((a,b)=>a-b)[Math.floor(frames.length*.95)],positions:new Set(positions).size});}requestAnimationFrame(sample);}));
 expect(perf.positions).toBeGreaterThan(4);
 await p.getByLabel('暂停演示').click();await expect(p.locator('.live-demo .board')).toHaveAttribute('data-phase','idle');const n=await p.getByTestId('demo-steps').innerText();await p.waitForTimeout(650);await expect(p.getByTestId('demo-steps')).toHaveText(n);
 await p.getByLabel('新一局',{exact:true}).click();await expect(p.getByTestId('demo-steps')).toHaveText('0');await p.getByLabel('继续演示').click();
 await p.locator('.closing-chapter').scrollIntoViewIfNeeded();await p.waitForTimeout(150);const off=await p.getByTestId('demo-steps').innerText();await p.waitForTimeout(800);await expect(p.getByTestId('demo-steps')).toHaveText(off);
 await p.getByRole('button',{name:'观察随机 · 固定优先',exact:true}).click();await expect(p.locator('.demo-top')).toContainText('随机策略');await expect.poll(async()=>Number(await p.getByTestId('demo-steps').innerText())).toBeGreaterThan(+off);
 expect(await p.locator('.landing select').count()).toBe(0);expect(await p.locator('.motion-settings').count()).toBe(0);
 expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 const fonts=await p.locator('h1').evaluate(e=>({size:getComputedStyle(e).fontSize,lineHeight:getComputedStyle(e).lineHeight}));
 await p.getByLabel('暂停演示').click();await expect(p.locator('.live-demo .board')).toHaveAttribute('data-phase','idle');await p.evaluate(()=>scrollTo(0,0));
 if(width===1440||width===390){await p.screenshot({path:'evidence/home-v06-'+width+'.png',fullPage:true});await p.screenshot({path:'evidence/home-v06-hero-'+width+'.png'});}
 await p.getByRole('button',{name:'进入实验室',exact:false}).click();await expect(p.locator('.experiments')).toBeVisible();await p.getByRole('button',{name:'首页',exact:true}).click();await p.getByRole('button',{name:'展开这手棋的理由',exact:false}).click();await expect(p.getByRole('complementary',{name:'课程目录'})).toBeVisible();
 checks.push({width,perf,fonts,checks:['auto Worker','pause/reset/resume','offscreen pause','strategy story switch','no overflow','no animation/form settings','lab and classroom CTA']});await p.close();
}
expect(errors).toEqual([]);await fs.writeFile('evidence/home-product-results.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify(checks));
}finally{await browser.close();}
