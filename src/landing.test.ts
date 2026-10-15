import {describe,it,expect} from 'vitest';
import {startDemo,stepDemo,restartDemo} from './Landing';
import {initial,legal} from './engine';
describe('live landing demo state',()=>{
 it('starts from exactly the real seeded initial game',()=>{const s=startDemo(2048);expect(s.game).toEqual(initial(2048));expect(s.steps).toBe(0);expect(s.game.board.filter(Boolean)).toHaveLength(2);});
 it('advances only a legal move and preserves real score / RNG',()=>{const s=startDemo(2048),next=stepDemo(s,legal(s.game.board)[0]);expect(next.steps).toBe(1);expect(next.game.rng).not.toBe(s.game.rng);expect(s.steps).toBe(0);});
 it('invalid move neither spawns nor increments the displayed step count',()=>{const s={...startDemo(1),game:{board:[2,...Array(15).fill(0)],score:0,rng:1}};expect(stepDemo(s,'left')).toBe(s);});
 it('next round is a clean genuine seeded game, not a fabricated demonstration',()=>{const s=restartDemo({...startDemo(2048),steps:999});expect(s.round).toBe(2);expect(s.seed).toBe(2049);expect(s.steps).toBe(0);expect(s.game).toEqual(initial(2049));});
});
