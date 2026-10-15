import {safeDecide,type Strategy,type Params} from './agents';
import {initial,move,legal} from './engine';
self.onmessage=(event)=>{const {id,type,...p}=event.data;try{
 if(type==='decide'){self.postMessage({id,result:safeDecide(p.board,p.strategy,p.params,p.agentSeed)});return;}
 if(type==='batch'){const results=[];for(let i=0;i<p.count;i++){let g=initial((p.seed+i)>>>0),steps=0,ms=0,fallbacks=0;while(legal(g.board).length&&steps<20000){const d=safeDecide(g.board,p.strategy as Strategy,p.params as Params,(0xa53a+i*100003+steps)>>>0);const dir=d.dir??legal(g.board)[0];if(d.fallback)fallbacks++;ms+=d.ms;const next=move(g,dir);if(!next.tile)throw Error('合法动作未改变棋盘');g=next.game;steps++;if(steps%100===0)self.postMessage({id,heartbeat:{game:i+1,steps}});}
 const remainingLegal=legal(g.board);results.push({seed:p.seed+i,score:g.score,max:Math.max(...g.board),steps,ms,truncated:remainingLegal.length>0,remainingLegal,stopReason:remainingLegal.length?'step-limit':'no-legal-actions',fallbacks});self.postMessage({id,progress:results.length,results:[...results]});}self.postMessage({id,done:true,results});}
 }catch(e){self.postMessage({id,error:e instanceof Error?e.message:String(e)});}};
