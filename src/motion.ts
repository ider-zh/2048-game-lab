import {useCallback,useEffect,useRef,useState} from 'react';
import {type Board,type TilePath,type MergeEvent,type Spawn} from './engine';
export const FEEDBACK_MS=95;
export type Motion={id:number;before:Board;after:Board;paths:TilePath[];merges:MergeEvent[];spawn:Spawn|null};
type Transaction=Omit<Motion,'id'>&{commit:()=>void};
// Commands are evaluated against the latest committed game, never against an old
// input snapshot. Only the visual landing boundary commits score/replay/state.
export function useTileMotion(){
 const [motion,setMotion]=useState<Motion|null>(null),queue=useRef<(()=>Transaction|null)[]>([]),active=useRef<(Transaction&{id:number;committed:boolean})|null>(null),serial=useRef(0),mounted=useRef(true);
 const pump=useRef(()=>{});
 pump.current=()=>{if(!mounted.current||active.current)return;while(queue.current.length){const job=queue.current.shift()!();if(!job)continue;const id=++serial.current;active.current={...job,id,committed:false};setMotion({id,before:job.before,after:job.after,paths:job.paths,merges:job.merges,spawn:job.spawn});break;}};
 const enqueue=useCallback((factory:()=>Transaction|null)=>{queue.current.push(factory);pump.current();},[]);
 const commit=useCallback((id:number)=>{const job=active.current;if(!job||job.id!==id||job.committed)return;job.committed=true;job.commit();},[]);
 const finish=useCallback((id:number)=>{if(active.current?.id!==id)return;commit(id);active.current=null;setMotion(null);queueMicrotask(()=>pump.current());},[commit]);
 const clear=useCallback(()=>{serial.current++;queue.current=[];active.current=null;setMotion(null);},[]);
 const flush=useCallback(()=>{const job=active.current;if(job&&!job.committed){job.committed=true;job.commit();}clear();},[clear]);
 const clearQueue=useCallback(()=>{queue.current=[];},[]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;serial.current++;queue.current=[];active.current=null;};},[]);
 return {motion,enqueue,commit,finish,clear,flush,clearQueue};
}
