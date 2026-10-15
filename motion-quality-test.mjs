import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const dir='evidence/motion-capture';await fs.mkdir(dir,{recursive:true});
// Visible browser, no reducedMotion override. The system preference is recorded
// before explicitly choosing the same page control offered to the user.
const browser=await chromium.launch({channel:'msedge',headless:false});
const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5178/');
const actual=await page.evaluate(()=>({systemReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,mode:document.querySelector('[aria-label="棋盘动画"]').value,version:document.querySelector('.header-note').textContent}));
await expect(page.getByLabel('棋盘动画',{exact:true})).toHaveValue('system');
await page.getByLabel('棋盘动画',{exact:true}).selectOption('full');
const cdp=await context.newCDPSession(page),frames=[],writes=[];let index=0;
cdp.on('Page.screencastFrame',e=>{const name=`frame-${String(index++).padStart(5,'0')}.jpg`;frames.push({name,time:e.metadata.timestamp});writes.push(fs.writeFile(`${dir}/${name}`,Buffer.from(e.data,'base64')));void cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId});});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1280,maxHeight:1000,everyNthFrame:1});
await expect.poll(async()=>+(await page.getByTestId('demo-steps').innerText()),{timeout:15000}).toBeGreaterThan(5);
await page.getByRole('button',{name:'暂停演示',exact:true}).click();await expect(page.locator('.live-demo .board')).toHaveAttribute('data-phase','idle');results.push({check:'visible homepage, actual OS preference, explicit full mode, six real AI steps',actual});
await page.getByRole('button',{name:'实验室',exact:true}).click();const a=page.locator('.experiment').first(),board=a.locator('.board');
await a.locator('summary').filter({hasText:'自定义局面'}).click();
async function load(values){await a.getByLabel('自定义棋盘').fill([...values,...Array(16-values.length).fill(0)].join(' '));await a.getByRole('button',{name:'应用局面',exact:true}).click();await board.scrollIntoViewIfNeeded();}
async function observe(name,values,expected,merges){
 await load(values);await page.waitForTimeout(400);
 await page.evaluate(()=>{window.motionFrames=[];window.sampling=true;const start=performance.now();function sample(){const b=document.querySelector('.experiment .board'),moving=[...b.querySelectorAll('.moving-tile')],merge=[...b.querySelectorAll('.merge-arrival')],spawn=b.querySelector('.spawn-arrival');window.motionFrames.push({t:performance.now()-start,phase:b.dataset.phase,moving:moving.map(e=>({from:e.dataset.from,to:e.dataset.to,x:e.getBoundingClientRect().x,transition:getComputedStyle(e).transitionDuration})),merge:merge.map(e=>({text:e.textContent,tier:e.dataset.tier,transform:getComputedStyle(e).transform,ring:getComputedStyle(e,':after').opacity})),spawn:spawn?{opacity:+getComputedStyle(spawn).opacity,delay:getComputedStyle(spawn).animationDelay}:null});if(window.sampling)requestAnimationFrame(sample);}requestAnimationFrame(sample);});
 await a.locator('.manual button').first().click();await expect(a.getByTestId('steps-0')).toHaveText('1');await expect(board).toHaveAttribute('data-phase','idle');
 const data=await page.evaluate(()=>{window.sampling=false;return window.motionFrames;});
 const moving=data.filter(f=>f.phase==='moving');if(moving.length<10)throw Error(name+': insufficient perceptible slide');
 const contact=data.filter(f=>f.merge.length);if(merges&&(!contact.length||!contact.some(f=>f.merge.length===merges)))throw Error(name+': merge missing');
 if(merges){const scales=contact.flatMap(f=>f.merge.map(m=>+m.transform.match(/matrix\(([^,]+)/)?.[1]||1));if(!scales.some(v=>v<.98)||!scales.some(v=>v>1.03))throw Error(name+': compression/rebound absent');}
 if(!data.some(f=>f.spawn?.opacity===0)||!data.some(f=>f.spawn?.opacity>.5))throw Error(name+': delayed spawn absent');
 for(let i=0;i<expected.length;i++)await expect(board.locator('[data-cell]').nth(i)).toHaveText(String(expected[i]||''));
 results.push({name,values,expected,merges,data});await page.waitForTimeout(400);
}
await observe('two sources become one',[2,0,2,0],[4],1);
await observe('two simultaneous merges',[2,2,2,2],[4,4],2);
await observe('large-value merge',[128,0,128,0],[256],1);
await observe('milestone merge',[1024,0,1024,0],[2048],1);
await observe('slide without merge',[0,2,0,8],[2,8],0);
await board.focus();for(const key of ['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'])await page.keyboard.press(key);await expect(a.getByTestId('steps-0')).toHaveText('5');await expect(board).toHaveAttribute('data-phase','idle');
await a.locator('summary').filter({hasText:'记录与回放'}).click();await a.getByRole('button',{name:'回放下一步',exact:true}).click();await expect(a.getByTestId('steps-0')).toHaveText('1');await expect(board).toHaveAttribute('data-phase','idle');
await a.getByRole('button',{name:'回放下一步',exact:true}).click();await a.getByRole('button',{name:'重置',exact:true}).click();await page.waitForTimeout(900);await expect(a.getByTestId('steps-0')).toHaveText('0');
await a.getByRole('button',{name:'AI 接管',exact:true}).click();await a.locator('.moving-tile').first().waitFor();await a.getByRole('button',{name:'暂停',exact:true}).click();await expect(board).toHaveAttribute('data-phase','idle');const paused=await a.getByTestId('steps-0').innerText();await page.waitForTimeout(1000);await expect(a.getByTestId('steps-0')).toHaveText(paused);
results.push({check:'rapid four moves, replay, reset during replay, pause finishes current step'});
await page.getByLabel('棋盘动画',{exact:true}).selectOption('fast');await load([2,2,2,2]);await a.locator('.manual button').first().click();await expect(a.getByTestId('steps-0')).toHaveText('1');await expect(board).toHaveAttribute('data-phase','idle');
await page.getByLabel('棋盘动画',{exact:true}).selectOption('system');await expect(board).toHaveAttribute('data-motion',actual.systemReduced?'reduced':'full');results.push({check:'fast mode and restore system preference'});
await cdp.send('Page.stopScreencast');await Promise.all(writes);
const lines=frames.flatMap((f,i)=>[`file '${f.name}'`,`duration ${Math.min(2,Math.max(.01,(frames[i+1]?.time??f.time+.1)-f.time))}`]);lines.push(`file '${frames.at(-1).name}'`);await fs.writeFile(`${dir}/frames.txt`,lines.join('\n'));
execFileSync('ffmpeg',['-y','-f','concat','-safe','0','-i',`${dir}/frames.txt`,'-vf','fps=30','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','evidence/motion-v0.5.mp4'],{stdio:'ignore'});
await fs.writeFile('evidence/motion-quality-results.json',JSON.stringify({actual,results,errors,capturedFrames:frames.length},null,2));
await browser.close();if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({actual,checks:results.length,capturedFrames:frames.length,video:'evidence/motion-v0.5.mp4'}));
