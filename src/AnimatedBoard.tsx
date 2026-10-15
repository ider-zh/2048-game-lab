import {useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {type Board,type Dir} from './engine';
import {type Motion} from './motion';
import {useMotionPreferences,timing} from './MotionPreferences';
import './animated-board.css';
type TileStyle=CSSProperties&Record<`--${string}`,string|number>;
const color=(v:number)=>v?{background:`hsl(${42-Math.min(11,Math.log2(v))*2} ${24+Math.log2(v)*4}% ${94-Math.min(13,Math.log2(v))*5}%)`,color:v>=128?'#fff':'#443e34'}:{};
export function AnimatedBoard({board,motion,onCommit,onFinish,onMove,label='2048 棋盘'}:{board:Board;motion:Motion|null;onCommit:(id:number)=>void;onFinish:(id:number)=>void;onMove?:(d:Dir)=>void;label?:string}){
 const preferences=useMotionPreferences(),currentTiming=timing(preferences.mode,preferences.systemReduced);
 const [phase,setPhase]=useState<'start'|'moving'|'settled'>('start'),[pace,setPace]=useState(currentTiming),touch=useRef([0,0]),commitRef=useRef(onCommit),finishRef=useRef(onFinish);commitRef.current=onCommit;finishRef.current=onFinish;
 // A mode change takes effect on the next transaction, without restarting a step.
 useLayoutEffect(()=>{if(!motion)return;const t=currentTiming;setPace(t);setPhase('start');let raf1=0,raf2=0,timer:ReturnType<typeof setTimeout>|undefined,feedback:ReturnType<typeof setTimeout>|undefined;
  raf1=requestAnimationFrame(()=>{raf2=requestAnimationFrame(()=>{setPhase('moving');timer=setTimeout(()=>{setPhase('settled');commitRef.current(motion.id);feedback=setTimeout(()=>finishRef.current(motion.id),t.feedback);},t.slide);});});
  return()=>{cancelAnimationFrame(raf1);cancelAnimationFrame(raf2);clearTimeout(timer);clearTimeout(feedback);};
 },[motion?.id]);
 const sliding=!!motion&&phase!=='settled',display=motion?(sliding?motion.before:motion.after):board,t=motion?pace:currentTiming;
 return <div className="board animated-board" data-motion={t.reduced?'reduced':'full'} data-phase={motion?phase:'idle'} data-motion-id={motion?.id??0} style={{'--slide-ms':`${t.slide}ms`,'--merge-ms':`${t.merge}ms`,'--spawn-delay':`${t.delay}ms`,'--spawn-ms':`${t.spawn}ms`} as TileStyle} tabIndex={0} aria-label={label} onTouchStart={e=>touch.current=[e.touches[0].clientX,e.touches[0].clientY]} onTouchEnd={e=>{const x=e.changedTouches[0].clientX-touch.current[0],y=e.changedTouches[0].clientY-touch.current[1];if(Math.max(Math.abs(x),Math.abs(y))>25)onMove?.(Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up');}}>
 {display.map((v,i)=><div key={i} className="tile cell-well" data-cell={i} aria-label={`第 ${Math.floor(i/4)+1} 行 ${i%4+1} 列：${v||'空'}`}>
 {!sliding&&v>0&&<div className={'tile-face filled '+(motion?.merges.some(m=>m.to===i)?'merge-arrival ':'')+(motion?.spawn?.index===i?'spawn-arrival':'')} data-tier={v>=2048?'milestone':v>=128?'large':'small'} style={color(v)}><span className="tile-number">{v}</span></div>}
 </div>)}
 {sliding&&motion.paths.map(p=><div aria-hidden="true" key={`${motion.id}-${p.from}`} className="moving-tile filled" data-from={p.from} data-to={p.to} style={{...color(p.value),'--col':p.from%4,'--row':Math.floor(p.from/4),'--dx':phase==='moving'?p.to%4-p.from%4:0,'--dy':phase==='moving'?Math.floor(p.to/4)-Math.floor(p.from/4):0} as TileStyle}>{p.value}</div>)}
 </div>;
}
