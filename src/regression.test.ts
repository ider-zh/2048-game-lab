import {describe,it,expect} from 'vitest';
import {decide,safeDecide,defaults,names,type Strategy} from './agents';
import {initial,legal,move,parseReplay,ENGINE} from './engine';
const dead=[2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2];
describe('stop diagnosis and robust search',()=>{
 it('512 and 2048 tiles do not terminate playable games',()=>{for(const max of [512,2048,4096]){const b=[max,2,0,0,...Array(12).fill(0)];for(const strategy of Object.keys(names) as Strategy[])expect(legal(b)).toContain(decide(b,strategy,{...defaults,budget:8},42).dir);}});
 it('only a true terminal board returns no action, for all strategies',()=>{for(const strategy of Object.keys(names) as Strategy[])expect(decide(dead,strategy,defaults).dir).toBe(null);});
 it('tiny or malformed budgets cannot return an invalid action or exceed normalized budget',()=>{const b=initial(55).board;for(const budget of [0,1,4,20,NaN,Infinity]){const d=decide(b,'expectimax',{budget,depth:5,horizon:12});expect(legal(b)).toContain(d.dir);expect(Number.isFinite(d.rows.find(r=>r.dir===d.dir)?.estimate)).toBe(true);expect(d.nodes).toBeLessThanOrEqual(Number.isFinite(budget)?Math.max(4,budget):defaults.budget);}});
 it('incomplete deeper iteration retains all estimates from the previous complete depth',()=>{const b=initial(81).board;const shallow=decide(b,'expectimax',{...defaults,depth:1,budget:200000});const deeper=decide(b,'expectimax',{...defaults,depth:4,budget:shallow.nodes+1});expect(deeper.completedDepth).toBe(1);expect(deeper.rows.map(r=>r.estimate)).toEqual(shallow.rows.map(r=>r.estimate));});
 it('runtime exception safely falls back to a legal heuristic action',()=>{const b=initial(19).board,d=safeDecide(b,'expectimax',null as any);expect(legal(b)).toContain(d.dir);expect(d.fallback).toContain('异常');});
 it('legacy replay remains readable',()=>{expect(parseReplay(JSON.stringify({engine:ENGINE,algorithmVersion:'agents-1',seed:1,start:initial(1),actions:[]})).algorithmVersion).toBe('agents-1');});
 it('moves always progress for six strategies on a bounded trajectory',()=>{for(const strategy of Object.keys(names) as Strategy[]){let g=initial(80);for(let i=0;i<50&&legal(g.board).length;i++){const d=safeDecide(g.board,strategy,{...defaults,budget:50},i+90);const next=move(g,d.dir!);expect(next.tile).not.toBe(null);g=next.game;}}});
});
