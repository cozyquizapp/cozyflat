"use client";

import { useEffect, useState } from "react";
import { BrushCleaning, Cookie, MoonStar, Sparkles, ToyBrick } from "lucide-react";

type Person = "Johannes" | "Sonja";
type CareAction = "feed" | "brush" | "play";
type FlauschiState = {
  dayKey:string;
  availableCare:number;
  todayCare:number;
  todayTasks:number;
  todayActions:CareAction[];
  dailySetProgress:number;
  dailySetComplete:boolean;
  totalCare:number;
  level:number;
  levelProgress:number;
  levelGoal:number;
  lastAction:CareAction|null;
  lastPerson:string|null;
};

const ACTIONS:Array<{key:CareAction;step:string;label:string;shortLabel:string;detail:string;reactions:string[]}> = [
  {key:"feed",step:"01",label:"Snack geben",shortLabel:"Snack",detail:"kleiner Energie-Kick",reactions:["Krümelalarm! Flauschi ist sehr zufrieden.","Der Snack ist weg. Niemand hat etwas gesehen.","Flauschi macht das zufriedene Mini-Wackeln."]},
  {key:"brush",step:"02",label:"Flausch polieren",shortLabel:"Bürsten",detail:"Glanzstufe erhöhen",reactions:["Jetzt ist Flauschi offiziell wolkenweich.","Flauschgrad: beneidenswert.","Einmal durchgebürstet, dreimal aufgeplustert."]},
  {key:"play",step:"03",label:"Ballzeit",shortLabel:"Spielen",detail:"eine Runde herumkugeln",reactions:["Flauschi jagt den Ball mit maximalem Einsatz.","Der Ball verliert. Flauschi gewinnt.","Eine wilde Runde später ist Flauschi sehr stolz."]},
];

const NEST_FINDS = ["Goldener Knopf", "Blattkissen", "Glitzerball", "Mini-Gießkanne", "Fensterstern", "Pflanzensamen"];

function ActionIcon({action}:{action:CareAction}) {
  return action==='feed'?<Cookie aria-hidden="true" />:action==='brush'?<BrushCleaning aria-hidden="true" />:<ToyBrick aria-hidden="true" />;
}

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
    if(!state.dailySetComplete&&state.todayActions.includes(action)) {
      const missing=ACTIONS.filter((item)=>!state.todayActions.includes(item.key)).map((item)=>item.label.toLocaleLowerCase('de-DE'));
      setMessage(`Das hatten wir heute schon. Für das Tagesritual fehlt noch: ${missing.join(' oder ')}.`);
      if('vibrate' in navigator) navigator.vibrate(10);
      return;
    }
    const previous=state;
    const totalCare=state.totalCare+1;
    const todayActions=state.todayActions.includes(action)?state.todayActions:[...state.todayActions,action];
    const dailySetProgress=todayActions.length;
    setActive(action);
    const optimistic={...state,availableCare:state.availableCare-1,todayCare:state.todayCare+1,todayActions,dailySetProgress,dailySetComplete:dailySetProgress===3,totalCare,level:Math.floor(totalCare/state.levelGoal)+1,levelProgress:totalCare%state.levelGoal,lastAction:action,lastPerson:person};
    setState(optimistic);
    onAvailableChange?.(optimistic.availableCare);
    const actionConfig=ACTIONS.find((item)=>item.key===action);
    const reaction=actionConfig?.reactions[Math.floor(Math.random()*(actionConfig.reactions.length||1))]??"Flauschi freut sich.";
    const foundReward=totalCare%state.levelGoal===0;
    setMessage(foundReward?`Nestfund! Flauschi hat „${NEST_FINDS[(Math.floor(totalCare/state.levelGoal)-1)%NEST_FINDS.length]}“ entdeckt.`:dailySetProgress===3?"Tagesritual komplett – drei echte Aufgaben, drei schöne Momente.":reaction);
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
  const todayActions=state?.todayActions??[];
  const dailySetProgress=state?.dailySetProgress??0;
  const dailySetComplete=state?.dailySetComplete??false;
  const foundCount=Math.floor((state?.totalCare??0)/goal);
  const latestFind=foundCount>0?NEST_FINDS[(foundCount-1)%NEST_FINDS.length]:null;
  const moodKey=active?'celebrating':available>0?'curious':dailySetComplete?'happy':daypart==='night'||daypart==='evening'?'sleepy':'calm';
  const mood=active
    ? ACTIONS.find((item)=>item.key===active)?.label??"Flauschi freut sich"
    : available>0
      ? `${available} ${available===1?'Spielmoment wartet':'Spielmomente warten'}`
      : todayTasks>0
        ? "Für heute rundum versorgt"
        : "Noch schläft Flauschi gemütlich";

  const daypartLabel={morning:'Morgenlicht',day:'Sonnenplatz',evening:'Abendruhe',night:'Nachtlicht'}[daypart];

  return <section className={`flauschi-nest-v2 level-${Math.min(4,level)} mood-${moodKey} ${available>0?'has-care':''} ${dailySetComplete?'ritual-complete':''} ${active?`is-${active}`:""} ${petting?'is-petting':''}`} aria-label="Flauschis Nest">
    <header className="flauschi-nest-v2-head">
      <span><small>EUER KLEINER RÜCKKEHR-BONUS</small><strong>Flauschis Nest</strong></span>
      <b>Level {level}</b>
    </header>

    <div className="flauschi-loop-card" aria-label={`${available} ${available===1?'Spielmoment':'Spielmomente'} verfügbar`}>
      <span><b>{available}</b><small>{available===1?'Spielmoment':'Spielmomente'}</small></span>
      <div><strong>1 Aufgabe = 1 Moment mit Flauschi</strong><small>{available>0?'Tippt im Zimmer auf Snackglas, Wollkorb oder Flauschi.':'Der nächste Haken weckt Flauschi wieder auf.'}</small></div>
    </div>

    <div className="flauschi-daily-ritual" aria-label={`Tagesritual ${dailySetProgress} von 3`}>
      <span><small>HEUTIGES RITUAL</small><b>{dailySetComplete?'Komplett versorgt':`${dailySetProgress}/3 kleine Momente`}</b></span>
      <ol>{ACTIONS.map((item)=><li className={todayActions.includes(item.key)?'done':''} key={item.key}><i aria-hidden="true">{todayActions.includes(item.key)?'✓':item.step}</i><span>{item.shortLabel}</span></li>)}</ol>
    </div>

    <div className={`flauschi-room-v2 time-${daypart}`} aria-live="polite">
      <span className="flauschi-daypart">{daypartLabel}</span>
      <span className="flauschi-room-hint">{available>0?'Flauschi ist wach':'Ruhemodus'}</span>
      <span className="flauschi-mood-icon" aria-hidden="true">{available>0?<Sparkles />:<MoonStar />}</span>
      {active && <span className="flauschi-action-label">{ACTIONS.find((item)=>item.key===active)?.label}</span>}
      {active&&<span className={`flauschi-active-prop prop-${active}`} aria-hidden="true"><ActionIcon action={active} /></span>}
      <button type="button" className="flauschi-character-button" onClick={petFlauschi} aria-label={available>0?'Flauschi pflegen':'Flauschi streicheln'} disabled={Boolean(active)}><img className="flauschi-character-v2" src="/flauschi-cutout-v2.webp" alt="Flauschi auf seinem Lieblingskissen" /></button>
    </div>

    <div className="flauschi-speech-v2" role="status"><b>{mood}</b><span>{message}</span></div>

    {available>0&&<div className="flauschi-actions-v2" aria-label="Flauschi pflegen">{ACTIONS.map((item)=>{
      const alreadyDone=!dailySetComplete&&todayActions.includes(item.key);
      return <button type="button" key={item.key} onClick={()=>care(item.key)} disabled={Boolean(active)||alreadyDone}><span><ActionIcon action={item.key} /></span><b>{item.label}</b><small>{alreadyDone?'heute schon gemacht':item.detail}</small></button>;
    })}</div>}

    {available<=0 && <button type="button" className="flauschi-task-cta-v2" onClick={onGoToTasks}>
      <span>NEUER SPIELMOMENT</span><b>Eine Aufgabe erledigen</b><small>Danach könnt ihr direkt zu Flauschi zurückkehren.</small>
    </button>}

    <div className="flauschi-nest-progress">
      <span><small>NÄCHSTER NESTFUND</small><b>Noch {nextReward} {nextReward===1?'Moment':'Momente'}</b></span>
      <div aria-label={`${Math.round(Math.min(100,progress/goal*100))} Prozent bis zum nächsten Nestfund`}><i style={{width:`${Math.min(100,progress/goal*100)}%`}} /></div>
    </div>
    {latestFind&&<div className="flauschi-latest-find"><Sparkles aria-hidden="true" /><span><small>ZULETZT GEFUNDEN</small><b>{latestFind}</b></span></div>}
  </section>;
}
