"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Cookie, Hand, MoonStar, Sparkles, Sun, Sunrise, Sunset, ToyBrick, X } from "lucide-react";
import FlauschiSearchGame from "./FlauschiSearchGame";

type Person = "Johannes" | "Sonja";
type CareAction = "feed" | "brush" | "play";
type FlauschiState = {
  dayKey:string;
  availableCare:number;
  careBudget:number;
  todayCare:number;
  todayTasks:number;
  todayPeople:string[];
  duoBonusUnlocked:boolean;
  todayActions:CareAction[];
  dailySetProgress:number;
  dailySetComplete:boolean;
  totalCare:number;
  level:number;
  levelProgress:number;
  levelGoal:number;
  lastAction:CareAction|null;
  lastPerson:string|null;
  searchEnergy:number;
  searchCapacity:number;
  taskSearchBonus:number;
  availableSearches:number;
  nextSearchAt:number|null;
  totalSearches:number;
  collection:Array<{itemId:string;count:number;firstFoundAt:string;lastFoundAt:string}>;
};

const ACTIONS:Array<{key:CareAction;step:string;label:string;shortLabel:string;detail:string;reactions:string[]}> = [
  {key:"feed",step:"01",label:"Snack geben",shortLabel:"Snack",detail:"kleiner Energie-Kick",reactions:["Krümelalarm! Flauschi ist sehr zufrieden.","Der Snack ist weg. Niemand hat etwas gesehen.","Flauschi macht das zufriedene Mini-Wackeln."]},
  {key:"brush",step:"02",label:"Flauschi kraulen",shortLabel:"Kraulen",detail:"Flausch entspannen",reactions:["Flauschi schmilzt fast in den Teppich.","Kraulstelle getroffen. Maximale Zufriedenheit.","Noch ein kleines bisschen links … genau da!"]},
  {key:"play",step:"03",label:"Ballzeit",shortLabel:"Spielen",detail:"eine Runde herumkugeln",reactions:["Flauschi jagt den Ball mit maximalem Einsatz.","Der Ball verliert. Flauschi gewinnt.","Eine wilde Runde später ist Flauschi sehr stolz."]},
];

const NEST_FINDS = ["Blättergirlande", "Spielkorb", "Fensterlichter", "Sternkissen", "Goldener Knopf", "Pflanzensamen"];
const LEVEL_TITLES = ["Flauschküken", "Blattfreund", "Kuschelprofi", "Nesthüter", "Cozy-Legende"];
const ACTION_ANIMATION_MS = 2400;

let flauschiAudioContext:AudioContext|null=null;

function playFlauschiSound(kind:CareAction|'level') {
  if(typeof window==='undefined')return;
  const AudioContextClass=window.AudioContext||(window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!AudioContextClass)return;
  flauschiAudioContext??=new AudioContextClass();
  const context=flauschiAudioContext;
  if(context.state==='suspended')void context.resume();
  const notes=kind==='feed'?[392,523]:kind==='brush'?[330,392]:kind==='play'?[440,587,659]:[523,659,784];
  const now=context.currentTime;
  notes.forEach((frequency,index)=>{
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type=kind==='feed'?'triangle':'sine';
    oscillator.frequency.setValueAtTime(frequency,now+index*.09);
    gain.gain.setValueAtTime(.0001,now+index*.09);
    gain.gain.exponentialRampToValueAtTime(kind==='level' ? .045 : .026,now+index*.09+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,now+index*.09+.24);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now+index*.09);
    oscillator.stop(now+index*.09+.26);
  });
}

function ActionIcon({action}:{action:CareAction}) {
  return action==='feed'?<Cookie aria-hidden="true" />:action==='brush'?<Hand aria-hidden="true" />:<ToyBrick aria-hidden="true" />;
}

export default function FlauschiNest({person,todayTasks,onGoToTasks,onAvailableChange}:{person:Person;todayTasks:number;onGoToTasks:()=>void;onAvailableChange?:(count:number)=>void}) {
  const [state,setState]=useState<FlauschiState|null>(null);
  const [active,setActive]=useState<CareAction|null>(null);
  const [petting,setPetting]=useState(false);
  const [levelCelebration,setLevelCelebration]=useState(false);
  const [returnMoment,setReturnMoment]=useState(false);
  const [demoLevel,setDemoLevel]=useState<number|null>(null);
  const [demoDuo,setDemoDuo]=useState(false);
  const [daypart,setDaypart]=useState<'morning'|'day'|'evening'|'night'>('day');
  const [message,setMessage]=useState("Flauschi döst auf dem Lieblingskissen und wartet auf euch.");
  const [openMenu,setOpenMenu]=useState<'care'|'progress'|null>(null);

  useEffect(()=>{
    let cancelled=false;
    fetch('/api/flauschi',{cache:'no-store'}).then(async(response)=>{
      if(response.ok&&!cancelled){const next=await response.json() as FlauschiState;setState(next);onAvailableChange?.(next.availableCare);}
    }).catch(()=>undefined);
    return ()=>{cancelled=true};
  },[todayTasks,onAvailableChange]);

  useEffect(()=>{
    const updateDaypart=()=>{
      const hour=new Date().getHours();
      setDaypart(hour<6?'night':hour<11?'morning':hour<18?'day':hour<22?'evening':'night');
    };
    const timer=window.setTimeout(updateDaypart,0);
    const interval=window.setInterval(updateDaypart,60_000);
    return ()=>{window.clearTimeout(timer);window.clearInterval(interval)};
  },[]);

  useEffect(()=>{
    const storageKey=`cozyflat:flauschi:last-visit:${person}`;
    const checkReturn=()=>{
      if(document.visibilityState==='hidden')return;
      try {
        const now=Date.now();
        const previous=Number(window.localStorage.getItem(storageKey)??0);
        if(previous>0&&now-previous>=4*60*60*1000)setReturnMoment(true);
        window.localStorage.setItem(storageKey,String(now));
      } catch {
        // Private browsing can disable storage; the core care loop still works.
      }
    };
    checkReturn();
    document.addEventListener('visibilitychange',checkReturn);
    return ()=>document.removeEventListener('visibilitychange',checkReturn);
  },[person]);

  useEffect(()=>{
    if(!state||active||petting||levelCelebration)return;
    if(state.duoBonusUnlocked&&state.availableCare>0) {
      setMessage("Ihr habt heute beide angepackt – Flauschi hat einen Extra-Moment für euch aufgehoben.");
    } else if(state.availableCare>0) {
      setMessage(`${state.lastPerson??person} hat Flauschi einen neuen Spielmoment mitgebracht.`);
    } else if(returnMoment) {
      setMessage("Während ihr weg wart, hat Flauschi einen goldenen Knopf unter dem Kissen entdeckt.");
    } else if(daypart==='night') {
      setMessage("Flauschi schläft tief und träumt von Krümeln und Blattkissen.");
    } else if(daypart==='evening') {
      setMessage("Flauschi wird langsam müde und kuschelt sich auf sein Lieblingskissen.");
    } else {
      setMessage("Flauschi döst auf dem Lieblingskissen und wartet auf eure nächste echte Aufgabe.");
    }
  },[active,daypart,levelCelebration,person,petting,returnMoment,state]);

  useEffect(()=>{
    if(process.env.NODE_ENV!=='development')return;
    let resetTimer:number|undefined;
    const previewTimer=window.setTimeout(()=>{
      const params=new URLSearchParams(window.location.search);
      const requestedAction=params.get('flauschiDemo');
      const requestedLevel=Number(params.get('flauschiLevel'));
      const requestedDaypart=params.get('flauschiTime');
      const requestedCelebration=params.get('flauschiCelebrate');
      if(Number.isFinite(requestedLevel)&&requestedLevel>=1)setDemoLevel(Math.min(5,Math.round(requestedLevel)));
      if(params.get('flauschiDuo')==='1')setDemoDuo(true);
      if(requestedDaypart==='morning'||requestedDaypart==='day'||requestedDaypart==='evening'||requestedDaypart==='night')setDaypart(requestedDaypart);
      if(requestedCelebration==='1') {
        setLevelCelebration(true);
        resetTimer=window.setTimeout(()=>setLevelCelebration(false),2600);
      }
      if(requestedAction!=='feed'&&requestedAction!=='brush'&&requestedAction!=='play')return;
      setActive(requestedAction);
      setMessage(requestedAction==='feed'?'Vorschau: Flauschi verputzt den Keks.':requestedAction==='brush'?'Vorschau: Flauschi genießt die Kraulrunde.':'Vorschau: Flauschi jagt seinen Ball.');
      resetTimer=window.setTimeout(()=>setActive(null),ACTION_ANIMATION_MS);
    },0);
    return ()=>{
      window.clearTimeout(previewTimer);
      if(resetTimer!==undefined)window.clearTimeout(resetTimer);
    };
  },[]);

  useEffect(()=>{
    if(!openMenu)return;
    const previousOverflow=document.body.style.overflow;
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpenMenu(null)};
    document.body.style.overflow='hidden';
    window.addEventListener('keydown',closeOnEscape);
    return ()=>{
      document.body.style.overflow=previousOverflow;
      window.removeEventListener('keydown',closeOnEscape);
    };
  },[openMenu]);

  async function care(action:CareAction) {
    if(!state||state.availableCare<=0||active) return;
    if(!state.dailySetComplete&&state.todayActions.includes(action)) {
      const missing=ACTIONS.filter((item)=>!state.todayActions.includes(item.key)).map((item)=>item.label.toLocaleLowerCase('de-DE'));
      setMessage(`Das hatten wir heute schon. Für das Tagesritual fehlt noch: ${missing.join(' oder ')}.`);
      if('vibrate' in navigator) navigator.vibrate(10);
      return;
    }
    const previous=state;
    const animationStartedAt=Date.now();
    const totalCare=state.totalCare+1;
    const todayActions=state.todayActions.includes(action)?state.todayActions:[...state.todayActions,action];
    const dailySetProgress=todayActions.length;
    setActive(action);
    setReturnMoment(false);
    playFlauschiSound(action);
    const optimistic={...state,availableCare:state.availableCare-1,todayCare:state.todayCare+1,todayActions,dailySetProgress,dailySetComplete:dailySetProgress===3,totalCare,level:Math.floor(totalCare/state.levelGoal)+1,levelProgress:totalCare%state.levelGoal,lastAction:action,lastPerson:person};
    setState(optimistic);
    onAvailableChange?.(optimistic.availableCare);
    const actionConfig=ACTIONS.find((item)=>item.key===action);
    const reaction=actionConfig?.reactions[Math.floor(Math.random()*(actionConfig.reactions.length||1))]??"Flauschi freut sich.";
    const foundReward=totalCare%state.levelGoal===0;
    if(foundReward) {
      window.setTimeout(()=>{
        setLevelCelebration(true);
        playFlauschiSound('level');
      },900);
      window.setTimeout(()=>setLevelCelebration(false),3100);
    }
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
      const remaining=Math.max(0,ACTION_ANIMATION_MS-(Date.now()-animationStartedAt));
      window.setTimeout(()=>setActive(null),remaining);
    }
  }

  function petFlauschi() {
    if(active||petting) return;
    if(available>0){ void care('brush'); return; }
    setReturnMoment(false);
    setPetting(true);
    setMessage(`${person}, Flauschi blinzelt zufrieden und rutscht ein Stück näher.`);
    if('vibrate' in navigator) navigator.vibrate(12);
    window.setTimeout(()=>setPetting(false),850);
  }

  const available=state?.availableCare??0;
  const level=state?.level??1;
  const levelTier=demoLevel??Math.min(5,Math.max(1,level));
  const visibleLevel=demoLevel??level;
  const levelTitle=LEVEL_TITLES[levelTier-1];
  const progress=state?.levelProgress??0;
  const goal=state?.levelGoal??6;
  const nextReward=goal-progress||goal;
  const todayActions=state?.todayActions??[];
  const duoBonusUnlocked=(state?.duoBonusUnlocked??false)||demoDuo;
  const dailySetProgress=state?.dailySetProgress??0;
  const dailySetComplete=state?.dailySetComplete??false;
  const foundCount=Math.floor((state?.totalCare??0)/goal);
  const latestFind=foundCount>0?NEST_FINDS[(foundCount-1)%NEST_FINDS.length]:null;
  const moodKey=active||levelCelebration?'celebrating':available>0||returnMoment?'curious':daypart==='night'||daypart==='evening'?'sleepy':dailySetComplete?'happy':'calm';
  const mood=active
    ? ACTIONS.find((item)=>item.key===active)?.label??"Flauschi freut sich"
    : available>0
      ? `${available} ${available===1?'Spielmoment wartet':'Spielmomente warten'}`
      : todayTasks>0
        ? "Für heute rundum versorgt"
        : "Noch schläft Flauschi gemütlich";

  const daypartLabel={morning:'Morgenlicht',day:'Sonnenplatz',evening:'Goldene Stunde',night:'Mondruhe'}[daypart];
  const DaypartIcon=daypart==='morning'?Sunrise:daypart==='day'?Sun:daypart==='evening'?Sunset:MoonStar;

  return <><section className={`flauschi-nest-v2 level-${levelTier} mood-${moodKey} ${available>0?'has-care':''} ${returnMoment?'has-return':''} ${duoBonusUnlocked?'has-duo-bonus':''} ${dailySetComplete?'ritual-complete':''} ${active?`is-${active}`:""} ${petting?'is-petting':''} ${levelCelebration?'is-level-up':''}`} aria-label="Flauschis Nest">
    <header className="flauschi-nest-v2-head">
      <span><small>EUER KLEINER RÜCKKEHR-BONUS</small><strong>Flauschis Nest</strong></span>
      <b><span>Level {visibleLevel}</span><small>{levelTitle}</small></b>
    </header>

    <div className={`flauschi-room-v2 time-${daypart}`} aria-live="polite">
      <span className="flauschi-daypart">{daypartLabel}</span>
      <span className="flauschi-room-hint">{available>0?'Flauschi ist wach':returnMoment?'Kleiner Fund':'Ruhemodus'}</span>
      <span className="flauschi-time-orb" aria-hidden="true"><DaypartIcon /><i /><i /><i /></span>
      <span className="flauschi-ambient-scene" aria-hidden="true">
        {Array.from({length:8},(_,index)=><i key={index} />)}
      </span>
      <span className="flauschi-nest-decor" aria-hidden="true">
        <img className="flauschi-decor flauschi-decor-garland" src="/flauschi-decor-garland-v1.webp" alt="" />
        <img className="flauschi-decor flauschi-decor-toys" src="/flauschi-decor-toy-basket-v1.webp" alt="" />
        <img className="flauschi-decor flauschi-decor-lights" src="/flauschi-decor-window-lights-v1.webp" alt="" />
        <img className="flauschi-decor flauschi-decor-pillow" src="/flauschi-decor-star-pillow-v1.webp" alt="" />
      </span>
      {levelCelebration&&<span className="flauschi-level-burst" aria-hidden="true">{Array.from({length:12},(_,index)=><i key={index} />)}</span>}
      {(available>0||returnMoment)&&<span className="flauschi-mood-icon" aria-hidden="true"><Sparkles /></span>}
      {active && <span className="flauschi-action-label">{ACTIONS.find((item)=>item.key===active)?.label}</span>}
      {active&&<span className={`flauschi-action-stage action-${active}`} aria-hidden="true">
        {active==='feed'?<span className="flauschi-cookie-sequence">
          <img className="flauschi-cookie-state cookie-whole" src="/flauschi-cookie-whole-v1.webp" alt="" />
          <img className="flauschi-cookie-state cookie-bite" src="/flauschi-cookie-bite-v1.webp" alt="" />
          <img className="flauschi-cookie-state cookie-half" src="/flauschi-cookie-half-v1.webp" alt="" />
          <img className="flauschi-cookie-state cookie-crumbs" src="/flauschi-cookie-crumbs-v1.webp" alt="" />
        </span>:<i className="flauschi-action-object">
          <img src={active==='brush'?'/flauschi-petting-hand-v1.webp':'/flauschi-play-ball-v1.webp'} alt="" />
        </i>}
        {active==='feed'&&<span className="flauschi-crumbs"><i /><i /><i /><i /><i /></span>}
        {active==='brush'&&<span className="flauschi-pet-hearts"><i>♥</i><i>♥</i><i>♥</i></span>}
        {active==='play'&&<span className="flauschi-play-trail"><i /><i /><i /></span>}
      </span>}
      <button type="button" className="flauschi-character-button" onClick={petFlauschi} aria-label={available>0?'Flauschi kraulen':'Flauschi streicheln'} disabled={Boolean(active)}>
        <span className="flauschi-character-stack">
          <img className="flauschi-character-v2 flauschi-state-idle" src="/flauschi-idle-v2.webp" alt="Flauschi auf seinem Lieblingskissen" />
          <img className="flauschi-character-v2 flauschi-character-state flauschi-state-blink" src="/flauschi-blink-v2.webp" alt="" />
          <img className="flauschi-character-v2 flauschi-character-state flauschi-state-sleep" src="/flauschi-sleep-v1.webp" alt="" />
          <img className="flauschi-character-v2 flauschi-character-state flauschi-state-bite" src="/flauschi-bite-open-v2.webp" alt="" />
          <img className="flauschi-character-v2 flauschi-character-state flauschi-state-chew" src="/flauschi-chew-v2.webp" alt="" />
          <img className="flauschi-character-v2 flauschi-character-state flauschi-state-petted" src="/flauschi-petted-v2.webp" alt="" />
          <img className="flauschi-character-v2 flauschi-character-state flauschi-state-cheer" src="/flauschi-cheer-v1.webp" alt="" />
        </span>
      </button>
    </div>

    <div className="flauschi-now-card" role="status">
      <span aria-hidden="true">{available>0?available:'✓'}</span>
      <div><small>{available>0?'JETZT MÖGLICH':'SO GEHT ES WEITER'}</small><b>{active?mood:available>0?`${available} ${available===1?'Spielmoment wartet':'Spielmomente warten'}`:'Flauschi macht Pause'}</b><p>{active||levelCelebration?message:available>0?'Snack, Kraulen oder Ballzeit – du entscheidest.':'Eine erledigte Aufgabe schenkt einen neuen Spielmoment.'}</p></div>
      <button type="button" disabled={Boolean(active)} onClick={()=>available>0?setOpenMenu('care'):onGoToTasks()}>{available>0?'Wählen':'Aufgaben'}<ChevronRight aria-hidden="true" /></button>
    </div>

    <div className="flauschi-quick-menu">
      {state&&<FlauschiSearchGame person={person} daypart={daypart} level={visibleLevel} state={state} onStateChange={(next)=>setState(next as FlauschiState)} />}
      <button type="button" className="flauschi-overview-launch" onClick={()=>setOpenMenu('progress')}>
        <span className="flauschi-overview-icon"><Sparkles aria-hidden="true" /></span>
        <span><small>RITUAL &amp; FUNDE</small><b>{dailySetProgress}/3 heute</b></span>
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  </section>

  {openMenu&&typeof document!=='undefined'&&createPortal(<div className="flauschi-menu-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setOpenMenu(null)}}>
    <section className="flauschi-menu-sheet" role="dialog" aria-modal="true" aria-labelledby="flauschi-menu-title">
      <header><span><small>{openMenu==='care'?'JETZT MIT FLAUSCHI':'DEIN ÜBERBLICK'}</small><strong id="flauschi-menu-title">{openMenu==='care'?'Was möchtest du machen?':'Ritual & Nestfunde'}</strong></span><button type="button" onClick={()=>setOpenMenu(null)} aria-label="Menü schließen"><X /></button></header>
      {openMenu==='care'?<>
        <p className="flauschi-menu-explainer"><b>{available} {available===1?'Spielmoment ist':'Spielmomente sind'} bereit.</b> Jede erledigte Haushaltsaufgabe schenkt einen Moment. Drei verschiedene Aktionen vervollständigen das Tagesritual.</p>
        <div className="flauschi-sheet-actions" aria-label="Flauschi pflegen">{ACTIONS.map((item)=>{
          const alreadyDone=!dailySetComplete&&todayActions.includes(item.key);
          return <button type="button" key={item.key} onClick={()=>{setOpenMenu(null);void care(item.key)}} disabled={Boolean(active)||alreadyDone}><span><ActionIcon action={item.key} /></span><b>{item.label}</b><small>{alreadyDone?'Heute schon gemacht':item.detail}</small><ChevronRight aria-hidden="true" /></button>;
        })}</div>
      </>:<>
        <div className="flauschi-how-it-works"><small>SO FUNKTIONIERT ES</small><ol><li><i>1</i><span><b>Aufgabe erledigen</b><small>Sie schenkt einen Spielmoment.</small></span></li><li><i>2</i><span><b>Flauschi pflegen</b><small>Snack, Kraulen oder Spielen wählen.</small></span></li><li><i>3</i><span><b>Nest wachsen lassen</b><small>Momente schalten neue Funde frei.</small></span></li></ol></div>
        <div className="flauschi-daily-ritual" aria-label={`Tagesritual ${dailySetProgress} von 3`}><span><small>HEUTIGES RITUAL</small><b>{dailySetComplete?'Komplett versorgt':`${dailySetProgress}/3 kleine Momente`}</b></span><ol>{ACTIONS.map((item)=><li className={todayActions.includes(item.key)?'done':''} key={item.key}><i aria-hidden="true">{todayActions.includes(item.key)?'✓':item.step}</i><span>{item.shortLabel}</span></li>)}</ol></div>
        <div className="flauschi-nest-progress"><span><small>NÄCHSTER NESTFUND</small><b>Noch {nextReward} {nextReward===1?'Moment':'Momente'}</b></span><div aria-label={`${Math.round(Math.min(100,progress/goal*100))} Prozent bis zum nächsten Nestfund`}><i style={{width:`${Math.min(100,progress/goal*100)}%`}} /></div></div>
        {latestFind&&<div className="flauschi-latest-find"><Sparkles aria-hidden="true" /><span><small>ZULETZT GEFUNDEN</small><b>{latestFind}</b></span></div>}
      </>}
    </section>
  </div>,document.body)}
  </>;
}
