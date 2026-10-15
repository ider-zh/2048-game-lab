import {expect,it} from 'vitest';
import {timing} from './MotionPreferences';
it('respects OS reduction by default, but supports explicit page opt-in',()=>{
 expect(timing('system',true).reduced).toBe(true);
 expect(timing('system',false).slide).toBe(360);
 expect(timing('full',true).slide).toBe(360);
 expect(timing('reduced',false).slide).toBe(0);
});
it('leaves time for recoil and delayed spawn in both animated modes',()=>{
 for(const mode of ['full','fast'] as const){const t=timing(mode,true);expect(t.slide).toBeGreaterThanOrEqual(180);expect(t.delay).toBeGreaterThan(0);expect(t.feedback).toBeGreaterThanOrEqual(t.delay+t.spawn);expect(t.feedback).toBeGreaterThanOrEqual(t.merge);}
});
