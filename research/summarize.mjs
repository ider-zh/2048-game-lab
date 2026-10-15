import fs from 'node:fs';
const baseline=JSON.parse(fs.readFileSync('research/baseline-41000-20.json','utf8'));
const candidate=JSON.parse(fs.readFileSync('research/candidate-41000-20.json','utf8'));
const summary=[];
for(const [version,data] of [['baseline',baseline],['candidate',candidate]])for(const strategy of ['heuristic','expectimax']){const r=data.filter(x=>x.strategy===strategy),scores=r.map(x=>x.score).sort((a,b)=>a-b);summary.push({version,strategy,n:r.length,mean:r.reduce((a,x)=>a+x.score,0)/r.length,median:(scores[Math.floor((r.length-1)/2)]+scores[Math.floor(r.length/2)])/2,reached2048:r.filter(x=>x.max>=2048).length,reached4096:r.filter(x=>x.max>=4096).length,meanDecisionMs:r.reduce((a,x)=>a+x.meanMs*x.steps,0)/r.reduce((a,x)=>a+x.steps,0),nonterminalStops:r.filter(x=>x.remainingLegal.length||x.reason!=='terminal').length});}
console.log(JSON.stringify(summary,null,2));
if(summary.every(r=>r.n===20))fs.writeFileSync('evidence/comparison-summary.json',JSON.stringify({explorationSeeds:[9000,9001,9002,9003,9004,9100,9101,9102,9103,9104],evaluationSeeds:'41000–41019',baselineDefaults:{budget:1600,depth:2,horizon:12},candidateDefaults:{budget:6000,depth:3,horizon:12},note:'Frozen before held-out evaluation. Same environment seeds, not same spawn coordinates. Timing is hardware/load dependent.',summary},null,2));
