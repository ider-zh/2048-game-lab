import {describe,it,expect} from 'vitest';
import {slideWithTrace,slide,dirs,draw} from './engine';
describe('animation provenance',()=>{
 it('pairs four identical tiles once, in direction order',()=>{
  const b=[2,2,2,2,...Array(12).fill(0)],left=slideWithTrace(b,'left'),right=slideWithTrace(b,'right');
  expect(left.merges).toEqual([{sources:[0,1],to:0,value:4},{sources:[2,3],to:1,value:4}]);
  expect(right.merges).toEqual([{sources:[3,2],to:3,value:4},{sources:[1,0],to:2,value:4}]);
  expect(left.score).toBe(8);
 });
 it('does not merge a newly merged tile again',()=>{
  const r=slideWithTrace([2,2,4,0,...Array(12).fill(0)],'left');
  expect(r.board.slice(0,4)).toEqual([4,4,0,0]);expect(r.merges).toHaveLength(1);
  expect(r.paths.find(p=>p.from===2)).toEqual({from:2,to:1,value:4,merged:false});
 });
 it('reconstructs all four directions, conserving each source and score over 500 boards',()=>{
  let rng=981;
  for(let n=0;n<500;n++){
   const b=Array.from({length:16},()=>{let v;[v,rng]=draw(rng);return v<.3?0:2**(1+Math.floor(v*5));});
   for(const d of dirs){const r=slideWithTrace(b,d),out=Array(16).fill(0);r.paths.forEach(p=>out[p.to]+=p.value);
    expect(out).toEqual(slide(b,d).board);expect(new Set(r.paths.map(p=>p.from)).size).toBe(b.filter(Boolean).length);
    expect(r.merges.reduce((s,m)=>s+m.value,0)).toBe(r.score);
    for(const m of r.merges){expect(m.sources.map(i=>b[i])).toEqual([m.value/2,m.value/2]);expect(r.paths.filter(p=>p.to===m.to)).toHaveLength(2);}
   }
  }
 });
});
