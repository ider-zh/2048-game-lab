import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
export type MotionMode='system'|'full'|'fast'|'reduced';
export const timing=(mode:MotionMode,reduced:boolean)=>mode==='reduced'||(mode==='system'&&reduced)?{slide:0,merge:0,delay:0,spawn:0,feedback:120,reduced:true}:mode==='fast'?{slide:180,merge:180,delay:80,spawn:140,feedback:240,reduced:false}:{slide:360,merge:300,delay:160,spawn:200,feedback:380,reduced:false};
const Context=createContext({mode:'system' as MotionMode,systemReduced:false,setMode:(_m:MotionMode)=>{}});
export function MotionProvider({children}:{children:ReactNode}){
 const [mode,setMode]=useState<MotionMode>(()=>{try{const m=localStorage.getItem('2048-motion');return ['system','full','fast','reduced'].includes(m??'')?m as MotionMode:'system';}catch{return 'system';}}),[systemReduced,setSystemReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setSystemReduced(q.matches);q.addEventListener('change',change);return()=>q.removeEventListener('change',change);},[]);
 return <Context.Provider value={{mode,systemReduced,setMode:m=>{setMode(m);try{localStorage.setItem('2048-motion',m);}catch{/* Storage unavailable. */}}}}>{children}</Context.Provider>;
}
export const useMotionPreferences=()=>useContext(Context);
export function MotionSettings(){const {mode,setMode,systemReduced}=useMotionPreferences(),t=timing(mode,systemReduced);return <div className="motion-settings"><label>棋盘动画<select aria-label="棋盘动画" value={mode} onChange={e=>setMode(e.target.value as MotionMode)}><option value="system">跟随系统</option><option value="full">完整 · 舒缓滑行</option><option value="fast">快速 · 紧凑滑行</option><option value="reduced">减少动态效果</option></select></label><span role="status">{t.reduced?`当前减少动态效果${mode==='system'?'（系统偏好）':''}：不滑动。想观察汇合过程，可主动选择「完整」。`:mode==='fast'?'快速：180 ms 滑行，保留汇合与落子。':'完整：360 ms 滑行 → 汇合回弹 → 新块出现。'}<small>仅影响本页动画，不改变系统设置或算法搜索预算。</small></span></div>;}
