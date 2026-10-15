import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const b=await chromium.launch({channel:'msedge',headless:true});
try {const p=await b.newPage({reducedMotion:'reduce'});await p.context().route('https://github.com/ider-zh/2048-game-lab',route=>route.fulfill({status:200,body:'Repository navigation target verified'}));const target=process.argv[2]||'http://localhost:5179/';
await p.goto(target,{waitUntil:'networkidle'});console.log(JSON.stringify({url:p.url(),version:await p.locator('.header-note').innerText(),settings:await p.locator('.motion-settings').count()}));
for(const path of ['favicon.ico','favicon.svg','favicon-16.png','favicon-32.png','apple-touch-icon.png']){
 const r=await p.request.get(new URL(path,target).href);console.log(path,r.status(),r.headers()['content-type']);expect(r.status()).toBe(200);expect(r.headers()['content-type']).toMatch(/image\//);
}
await expect(p.locator('.motion-settings')).toHaveCount(0);
await p.locator('.live-demo .moving-tile').first().waitFor();
expect(await p.locator('.live-demo .moving-tile').first().evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0.36s');
for(const width of [1440,390]){
 await p.setViewportSize({width,height:900});
 for(const name of ['GitHub 仓库（新标签页）','GitHub 源代码（新标签页）']){
  const link=p.getByRole('link',{name,exact:true});await expect(link).toBeVisible();await expect(link).toHaveAttribute('href','https://github.com/ider-zh/2048-game-lab');await expect(link).toHaveAttribute('rel','noopener noreferrer');
  const popup=p.waitForEvent('popup');await link.click();const opened=await popup;await opened.waitForURL('https://github.com/ider-zh/2048-game-lab',{waitUntil:'domcontentloaded'});await opened.close();
 }
 expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await p.goto(new URL('#lab',target).href);await p.screenshot({path:'evidence/v0.5.1-'+(width===390?'mobile':'desktop')+'.png',fullPage:true});
}
console.log('Icon paths/MIME, fixed full motion and desktop/mobile GitHub links verified');
}finally{await b.close();}
