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

const ACTIONS:Array<{key:CareAction;step:string;label:string;detail:string;reaction:string}> = [
  {key:"feed",step:"01",label:"Snack geben",detail:"kleiner Energie-Kick",reaction:"Krümelalarm! Flauschi ist sehr zufrieden."},
  {key:"brush",step:"02",label:"Flausch polieren",detail:"Glanzstufe erhöhen",reaction:"Jetzt ist Flauschi offiziell wolkenweich."},
  {key:"play",step:"03",label:"Ballzeit",detail:"eine Runde herumkugeln",reaction:"Flauschi jagt den Ball mit maximalem Einsatz."},
];

export default function FlauschiNest({person,todayTasks,onGoToTasks,onAvailableChange}:{person:Person;todayTasks:number;onGoToTasks:()=>void;onAvailableChange?:(count:number)=>void}) {
  const [state,setState]=useState<FlauschiState|null>(null);
  const [active,setActive]=useState<CareAction|null>(null);
  const [petting,setPetting]=useState(false);
  const [daypart,setDaypart]=useState<'morning'|'day'|'evening'|'night'>('day');
  const [message,setMessage]=useState("Flauschi döst auf dem Lieblingskissen und wartet auf euch.");

  useEffect(()=>{
    let cancelled=false;
    fetch('/api/flauschi',{cache:'no-store'}).then(async(response)=>{
      if(response.ok&&!cancelled){const next=await response.json() as FlauschiState;setState(next);onAvailableChange?.(next.availableCare);}
    }).catch(()=>undefined);
    return ()=>{cancelled=true};
  },[todayTasks,onAvailableChange]);

  useEffect(()=>{
    const timer=window.setTimeout(()=>{
      const hour=new Date().getHours();
      setDaypart(hour<6?'night':hour<11?'morning':hour<18?'day':hour<22?'evening':'night');
    },0);
    return ()=>window.clearTimeout(timer);
  },[]);

  async function care(action:CareAction) {
    if(!state||state.availableCare<=0||active) return;
    const previous=state;
    const totalCare=state.totalCare+1;
    setActive(action);
    const optimistic={...state,availableCare:state.availableCare-1,todayCare:state.todayCare+1,totalCare,level:Math.floor(totalCare/state.levelGoal)+1,levelProgress:totalCare%state.levelGoal,lastAction:action,lastPerson:person};
    setState(optimistic);
    onAvailableChange?.(optimistic.availableCare);
    setMessage(ACTIONS.find((item)=>item.key===action)?.reaction??"Flauschi freut sich.");
    if('vibrate' in navigator) navigator.vibrate([18,32,26]);
    try {
      const response=await fetch('/api/flauschi',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,person})});
      if(!response.ok)throw new Error('care-failed');
      const next=await response.json() as FlauschiState;
      setState(next);
      onAvailableChange?.(next.availableCare);
    } catch {
      setState(previous);
      onAvailableChange?.(previous.availableCare);
      setMessage("Das hat gerade nicht gespeichert. Versuch es bitte noch einmal.");
    } finally {
      window.setTimeout(()=>setActive(null),900);
    }
  }

  function petFlauschi() {
    if(active||petting) return;
    if(available>0){ void care('brush'); return; }
    setPetting(true);
    setMessage(`${person}, Flauschi blinzelt zufrieden und rutscht ein Stück näher.`);
    if('vibrate' in navigator) navigator.vibrate(12);
    window.setTimeout(()=>setPetting(false),850);
  }

  const available=state?.availableCare??0;
  const level=state?.level??1;
  const progress=state?.levelProgress??0;
  const goal=state?.levelGoal??6;
  const nextReward=goal-progress||goal;
  const mood=active
    ? ACTIONS.find((item)=>item.key===active)?.label??"Flauschi freut sich"
    : available>0
      ? `${available} ${available===1?'Spielmoment wartet':'Spielmomente warten'}`
      : todayTasks>0
        ? "Für heute rundum versorgt"
        : "Noch schläft Flauschi gemütlich";

  const daypartLabel={morning:'Morgenlicht',day:'Sonnenplatz',evening:'Abendruhe',night:'Nachtlicht'}[daypart];

  return <section className={`flauschi-nest-v2 level-${Math.min(4,level)} ${available>0?'has-care':''} ${active?`is-${active}`:""} ${petting?'is-petting':''}`} aria-label="Flauschis Nest">
    <header className="flauschi-nest-v2-head">
      <span><small>EUER KLEINER RÜCKKEHR-BONUS</small><strong>Flauschis Nest</strong></span>
      <b>Level {level}</b>
    </header>

    <div className="flauschi-loop-card" aria-label={`${available} ${available===1?'Spielmoment':'Spielmomente'} verfügbar`}>
      <span><b>{available}</b><small>{available===1?'Spielmoment':'Spielmomente'}</small></span>
      <div><strong>1 Aufgabe = 1 Moment mit Flauschi</strong><small>{available>0?'Tippt im Zimmer auf Snackglas, Wollkorb oder Flauschi.':'Der nächste Haken weckt Flauschi wieder auf.'}</small></div>
    </div>

    <div className={`flauschi-room-v2 time-${daypart}`} aria-live="polite">
      <span className="flauschi-daypart">{daypartLabel}</span>
      {available>0&&<span className="flauschi-room-hint">Im Zimmer steckt ein Spielmoment</span>}
      {active && <span className="flauschi-action-label">{ACTIONS.find((item)=>item.key===active)?.label}</span>}
      {available>0&&<><button type="button" className="flauschi-hotspot hotspot-snack" onClick={()=>care('feed')} disabled={Boolean(active)}><b>Snackglas</b><span>geben</span></button><button type="button" className="flauschi-hotspot hotspot-yarn" onClick={()=>care('play')} disabled={Boolean(active)}><b>Wollkorb</b><span>spielen</span></button></>}
      <button type="button" className="flauschi-character-button" onClick={petFlauschi} aria-label={available>0?'Flauschi pflegen':'Flauschi streicheln'} disabled={Boolean(active)}><img className="flauschi-character-v2" src="/flauschi-cutout-v2.webp" alt="Flauschi auf seinem Lieblingskissen" /></button>
      <div className="flauschi-speech-v2"><b>{mood}</b><span>{message}</span></div>
    </div>

    {available<=0 && <button type="button" className="flauschi-task-cta-v2" onClick={onGoToTasks}>
      <span>NEUER SPIELMOMENT</span><b>Eine Aufgabe erledigen</b><small>Danach könnt ihr direkt zu Flauschi zurückkehren.</small>
    </button>}

    <div className="flauschi-nest-progress">
      <span><small>NÄCHSTER NESTFUND</small><b>Noch {nextReward} {nextReward===1?'Moment':'Momente'}</b></span>
      <div aria-label={`${Math.round(Math.min(100,progress/goal*100))} Prozent bis zum nächsten Nestfund`}><i style={{width:`${Math.min(100,progress/goal*100)}%`}} /></div>
    </div>
  </section>;
}
