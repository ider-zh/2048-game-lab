import {expect,it} from 'vitest';
import {FULL_MOTION,PLAYBACK_DELAY} from './MotionPreferences';
it('fixes complete comfortable motion independent of external preferences',()=>{
 expect(FULL_MOTION).toEqual({slide:360,merge:300,delay:160,spawn:200,feedback:380,reduced:false});
 expect(Object.isFrozen(FULL_MOTION)).toBe(true);
 expect(PLAYBACK_DELAY).toBe(500);
});
it('allows merge recoil and delayed spawn to finish',()=>{
 expect(FULL_MOTION.feedback).toBeGreaterThanOrEqual(FULL_MOTION.delay+FULL_MOTION.spawn);
 expect(FULL_MOTION.feedback).toBeGreaterThanOrEqual(FULL_MOTION.merge);
});