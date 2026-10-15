import {analyzeLesson} from './teaching';
self.onmessage=e=>{const {id,board,strategy,params,seed}=e.data;try{self.postMessage({id,result:analyzeLesson(board,strategy,params,seed)});}catch(error){self.postMessage({id,error:String(error)});}};
