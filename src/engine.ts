export const ENGINE = '2048-reference-1';
export const dirs = ['left','up','right','down'] as const;
export type Dir = typeof dirs[number];
export type Board = number[];
export type Spawn = {index:number;value:number};
export type Game = {board:Board;score:number;rng:number};
// uint32 LCG; every spawn consumes exactly two draws, position then value.
export function draw(state:number):[number,number] { const next=(Math.imul(state,1664525)+1013904223)>>>0; return [next/4294967296,next]; }
export function slide(board:Board,dir:Dir) {
 const out=Array(16).fill(0); let score=0;
 for(let line=0;line<4;line++) {
  const ids=Array.from({length:4},(_,i)=>dir==='left'?line*4+i:dir==='right'?line*4+3-i:dir==='up'?i*4+line:(3-i)*4+line);
  const values=ids.map(i=>board[i]).filter(Boolean), merged:number[]=[];
  for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){merged.push(values[i]*2);score+=values[i]*2;i++;}else merged.push(values[i]);}
  ids.forEach((id,i)=>out[id]=merged[i]||0);
 }
 return {board:out,score,changed:out.some((v,i)=>v!==board[i])};
}
export const legal=(b:Board)=>dirs.filter(d=>slide(b,d).changed);
export function spawn(board:Board,rng:number){const empty=board.flatMap((v,i)=>v?[]:[i]);if(!empty.length)throw Error('没有空格');const [p,s]=draw(rng),[v,next]=draw(s);const tile={index:empty[Math.floor(p*empty.length)],value:v<.9?2:4};const out=[...board];out[tile.index]=tile.value;return {board:out,rng:next,tile};}
export function initial(seed:number):Game {const a=spawn(Array(16).fill(0),seed>>>0),b=spawn(a.board,a.rng);return {board:b.board,score:0,rng:b.rng};}
export function move(g:Game,d:Dir){const m=slide(g.board,d);if(!m.changed)return {game:g,tile:null};const s=spawn(m.board,g.rng);return {game:{board:s.board,score:g.score+m.score,rng:s.rng},tile:s.tile};}
export type Entry={dir:Dir;spawn:Spawn;strategy:string;fallbackReason?:string;algorithmVersion?:string;params:Record<string,number>;ms:number};
export type Replay={engine:string;algorithmVersion:string;seed:number;start:Game;actions:Entry[]};
export function frame(r:Replay,n:number):Game {let g={...r.start,board:[...r.start.board]};for(const e of r.actions.slice(0,n)){const m=slide(g.board,e.dir);if(!m.changed||m.board[e.spawn.index]!==0)throw Error('回放包含无效动作或落子');const b=[...m.board];b[e.spawn.index]=e.spawn.value;g={board:b,score:g.score+m.score,rng:draw(draw(g.rng)[1])[1]};}return g;}
export function parseReplay(text:string):Replay {const r=JSON.parse(text);const validBoard=(b:unknown)=>Array.isArray(b)&&b.length===16&&b.every(v=>Number.isSafeInteger(v)&&v>=0&&(v===0||(v>=2&&Number.isInteger(Math.log2(v)))));if(r.engine!==ENGINE||!['agents-1','agents-2'].includes(r.algorithmVersion)||!r.start||!validBoard(r.start.board)||!Number.isFinite(r.start.score)||!Number.isInteger(r.start.rng)||!Number.isInteger(r.seed)||!Array.isArray(r.actions)||r.actions.length>100000)throw Error('不支持或损坏的回放文件');for(const a of r.actions)if(!dirs.includes(a.dir)||!a.spawn||!Number.isInteger(a.spawn.index)||a.spawn.index<0||a.spawn.index>15||![2,4].includes(a.spawn.value))throw Error('回放动作格式错误');frame(r,r.actions.length);r.actions=r.actions.map((a:Entry)=>({...a,algorithmVersion:a.algorithmVersion??r.algorithmVersion}));return r;}
// Presentation-only provenance. Search still uses the unchanged allocation-light slide.
export type TilePath={from:number;to:number;value:number;merged:boolean};
export type MergeEvent={sources:[number,number];to:number;value:number};
export function slideWithTrace(board:Board,dir:Dir){
 const result=slide(board,dir),paths:TilePath[]=[],merges:MergeEvent[]=[];
 for(let line=0;line<4;line++){
  const ids=Array.from({length:4},(_,i)=>dir==='left'?line*4+i:dir==='right'?line*4+3-i:dir==='up'?i*4+line:(3-i)*4+line);
  const source=ids.filter(i=>board[i]);let dest=0;
  for(let i=0;i<source.length;i++){
   const from=source[i],other=source[i+1],to=ids[dest++];
   if(other!==undefined&&board[from]===board[other]){paths.push({from,to,value:board[from],merged:true},{from:other,to,value:board[other],merged:true});merges.push({sources:[from,other],to,value:board[from]*2});i++;}
   else paths.push({from,to,value:board[from],merged:false});
  }
 }
 return {...result,paths,merges};
}
