import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('public',{recursive:true});
const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#ece7d8"/><path d="M10 11V9h12v7l-8 5h8v3H10v-6l8-5v-1h-8z" fill="#46573b"/></svg>';
await fs.writeFile('public/favicon.svg',svg);
const b=await chromium.launch({channel:'msedge',headless:true}),images=[];
for(const size of [16,32,48,180]){
 const p=await b.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 await p.setContent('<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>'+svg);
 const png=await p.screenshot({omitBackground:true});await fs.writeFile('public/'+(size===180?'apple-touch-icon.png':'favicon-'+size+'.png'),png);
 if(size!==180)images.push({size,png});await p.close();
}
await b.close();
const header=Buffer.alloc(6+16*images.length);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);
let offset=header.length;images.forEach(({size,png},i)=>{const n=6+16*i;header[n]=size;header[n+1]=size;header.writeUInt16LE(1,n+4);header.writeUInt16LE(32,n+6);header.writeUInt32LE(png.length,n+8);header.writeUInt32LE(offset,n+12);offset+=png.length;});
await fs.writeFile('public/favicon.ico',Buffer.concat([header,...images.map(x=>x.png)]));
let html=await fs.readFile('index.html','utf8');
html=html.replace(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g,'').replace(/<meta name="theme-color"[^>]*>/g,'');
html=html.replace('</head>','<link rel="icon" href="/favicon.ico" sizes="any"/><link rel="icon" href="/favicon.svg" type="image/svg+xml"/><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"/><link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png"/><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"/><meta name="theme-color" content="#46573b"/></head>');
await fs.writeFile('index.html',html);
console.log('Original icons generated, ICO contains 16/32/48 PNG frames.');
