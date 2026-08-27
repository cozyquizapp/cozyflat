"use client";

import { useEffect, useState } from "react";

type Person = "Johannes" | "Sonja";
type CareAction = "feed" | "brush" | "play";
type FlauschiState = {
  dayKey:string;
  availableCare:number;
  todayCare:number;
  todayTasks:number;
  totalCare:number;
  level:number;
  levelProgress:number;
  levelGoal:number;
  lastAction:CareAction|null;
  lastPerson:string|null;
};

const ACTIONS:Array<{key:CareAction;icon:string;label:string;reaction:string}> = [
  {key:"feed",icon:"🍪",label:"Füttern",reaction:"Krümelalarm! Flauschi ist sehr zufrieden."},
  {key:"brush",icon:"🪮",label:"Bürsten",reaction:"Extra flauschig. Das war dringend nötig."},
  {key:"play",icon:"🧶",label:"Spielen",reaction:"Flauschi jagt den Ball mit maximalem Einsatz."},
];

export default function FlauschiNest({person,todayTasks,onGoToTasks}:{person:Person;todayTasks:number;onGoToTasks:()=>void}) {
  const [state,setState]=useState<FlauschiState|null>(null);
  const [active,setActive]=useState<CareAction|null>(null);
  const [message,setMessage]=useState("Flauschi döst und wartet auf eure nächste gemeinsame Aktion.");

  useEffect(()=>{
    let cancelled=false;
    fetch('/api/flauschi',{cache:'no-store'}).then(async(response)=>{
      if(response.ok&&!cancelled)setState(await response.json());
    }).catch(()=>undefined);
    return ()=>{cancelled=true};
  },[todayTasks]);

  async function care(action:CareAction) {
    if(!state||state.availableCare<=0||active) return;
    const previous=state;
    const totalCare=state.totalCare+1;
    setActive(action);
    setState({...state,availableCare:state.availableCare-1,todayCare:state.todayCare+1,totalCare,level:Math.floor(totalCare/state.levelGoal)+1,levelProgress:totalCare%state.levelGoal,lastAction:action,lastPerson:person});
    setMessage(ACTIONS.find((item)=>item.key===action)?.reaction??"Flauschi freut sich.");
    if('vibrate' in navigator) navigator.vibrate([18,32,26]);
    try {
      const response=await fetch('/api/flauschi',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,person})});
      if(!response.ok)throw new Error('care-failed');
      setState(await response.json());
    } catch {
      setState(previous);
      setMessage("Das hat gerade nicht gespeichert. Versuch es bitte noch einmal.");
    } finally {
      window.setTimeout(()=>setActive(null),760);
    }
  }

  const available=state?.availableCare??0;
  const total=state?.totalCare??0;
  const level=state?.level??1;
  const progress=state?.levelProgress??0;
  const goal=state?.levelGoal??6;
  const nextReward=goal-progress||goal;
  const mood=available>0?"Flauschi ist wach und bereit!":todayTasks>0?"Für heute rundum versorgt.":"Noch schläft Flauschi gemütlich.";

  return <section className={`flauschi-nest level-${Math.min(4,level)} ${active?`is-${active}`:""}`} aria-label="Flauschis Nest">
    <div className="flauschi-nest-head">
      <span><small>EIGENER WOHLFÜHLORT</small><strong>Flauschis Nest</strong></span>
      <b>Level {level}</b>
    </div>

    <div className="flauschi-room" aria-live="polite">
      <span className="flauschi-window" aria-hidden="true"><i /></span>
      <span className="flauschi-lamp" aria-hidden="true">☀</span>
      <span className="flauschi-shelf" aria-hidden="true"><i>📚</i><i>🌱</i></span>
      <span className="flauschi-rug" aria-hidden="true" />
      <span className="flauschi-cushion" aria-hidden="true" />
      <span className="flauschi-action-prop" aria-hidden="true">{active==='feed'?'🍪':active==='brush'?'✨':active==='play'?'🧶':''}</span>
      <img className="flauschi-character" src="/prototype-garden-v2/flauschi-medallion-v2.png" alt="Flauschi in seinem Nest" />
      <div className="flauschi-speech"><b>{mood}</b><span>{message}</span></div>
    </div>

    <div className="flauschi-energy">
      <span><b>{available}</b><small>{available===1?'Pflegemoment wartet':'Pflegemomente warten'}</small></span>
      <div><i style={{width:`${Math.min(100,progress/goal*100)}%`}} /><em>Noch {nextReward} bis zur nächsten Nest-Deko</em></div>
    </div>

    {available>0 ? <div className="flauschi-actions" aria-label="Flauschi versorgen">
      {ACTIONS.map((item)=><button key={item.key} type="button" onClick={()=>care(item.key)} disabled={Boolean(active)}><span>{item.icon}</span><b>{item.label}</b><small>1 Pflegemoment</small></button>)}
    </div> : <button type="button" className="flauschi-task-cta" onClick={onGoToTasks}><span>＋</span><b>Erledigt eine echte Aufgabe</b><small>Danach wartet hier eine neue Interaktion.</small></button>}

    <p className="flauschi-rule">Jede erledigte Haushaltsaufgabe schenkt genau einen Pflegemoment. Sonja und Johannes teilen sich denselben Fortschritt.</p>
  </section>;
}
