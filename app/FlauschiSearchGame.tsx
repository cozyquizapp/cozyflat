"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, PawPrint, Search, Sparkles, X } from "lucide-react";
import { NEST_FIND_MAP, NEST_FIND_META, NEST_FIND_TOTAL, nestFindImage, type NestFindRarity } from "./nest-finds";

type Person="Johannes"|"Sonja";
type Daypart='morning'|'day'|'evening'|'night';
type CollectionEntry={itemId:string;count:number;firstFoundAt:string;lastFoundAt:string};
type SearchResult={itemId:string;rarity:NestFindRarity;source:'passive'|'task';score:number;bonusCaught:boolean;isNew:boolean};
type SearchState={
  searchEnergy:number;
  searchCapacity:number;
  taskSearchBonus:number;
  availableSearches:number;
  nextSearchAt:number|null;
  totalSearches:number;
  collection:CollectionEntry[];
};

const PATH=[
  [.18,.24],[.72,.2],[.82,.54],[.55,.72],[.22,.66],[.36,.39],[.7,.46],[.46,.22],
] as const;
const GAME_MS=10_000;

function formatCountdown(nextSearchAt:number|null,now:number) {
  if(!nextSearchAt)return 'voll aufgeladen';
  const remaining=Math.max(0,nextSearchAt-now);
  const hours=Math.floor(remaining/3_600_000);
  const minutes=Math.floor((remaining%3_600_000)/60_000);
  return hours>0?`${hours} Std. ${String(minutes).padStart(2,'0')} Min.`:`${Math.max(1,minutes)} Min.`;
}

function rarityLabel(rarity:NestFindRarity) {
  return rarity==='duo'?'DUO-FUND':rarity==='rare'?'SELTEN':rarity==='uncommon'?'BESONDERS':'GEFUNDEN';
}

export default function FlauschiSearchGame({person,daypart,level,state,onStateChange}:{person:Person;daypart:Daypart;level:number;state:SearchState;onStateChange:(next:SearchState&Record<string,unknown>)=>void}) {
  const [open,setOpen]=useState(false);
  const [screen,setScreen]=useState<'intro'|'playing'|'finding'|'result'|'collection'>('intro');
  const [progress,setProgress]=useState(0);
  const [seconds,setSeconds]=useState(10);
  const [result,setResult]=useState<SearchResult|null>(null);
  const [error,setError]=useState('');
  const [now,setNow]=useState(()=>Date.now());
  const [bonusVisible,setBonusVisible]=useState(false);
  const [bonusCaught,setBonusCaught]=useState(false);
  const fieldRef=useRef<HTMLDivElement|null>(null);
  const seekerRef=useRef<HTMLDivElement|null>(null);
  const targetRef=useRef<HTMLDivElement|null>(null);
  const progressRef=useRef(0);
  const seekerPosition=useRef({x:.5,y:.78});
  const animationFrame=useRef<number|undefined>(undefined);
  const startedAt=useRef(0);
  const lastFrame=useRef(0);
  const lastPaint=useRef(0);
  const finishing=useRef(false);
  const hot=useRef(false);
  const tracking=useRef(false);
  const bonusCaughtRef=useRef(false);

  const collectionMap=useMemo(()=>new Map(state.collection.map((item)=>[item.itemId,item])),[state.collection]);
  const daypartCopy={morning:'Morgenfunde',day:'Sonnenfunde',evening:'Abendfunde',night:'Nachtfunde'}[daypart];
  const countdown=formatCountdown(state.nextSearchAt,now);

  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Date.now()),30_000);
    return ()=>window.clearInterval(timer);
  },[]);

  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return ()=>{document.body.style.overflow=previous};
  },[open]);

  function close() {
    if(animationFrame.current!==undefined)window.cancelAnimationFrame(animationFrame.current);
    setOpen(false);
    setScreen('intro');
    setResult(null);
    setError('');
  }

  async function completeSearch(scoreValue:number) {
    if(finishing.current)return;
    finishing.current=true;
    if(animationFrame.current!==undefined)window.cancelAnimationFrame(animationFrame.current);
    setScreen('finding');
    if('vibrate' in navigator)navigator.vibrate([14,28,24]);
    try {
      const response=await fetch('/api/flauschi',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind:'search',person,score:scoreValue,bonusCaught:bonusCaughtRef.current})});
      const payload=await response.json() as {state:SearchState&Record<string,unknown>;searchResult:SearchResult|null};
      if(!response.ok||!payload.searchResult)throw new Error('search-unavailable');
      setResult(payload.searchResult);
      onStateChange(payload.state);
      setScreen('result');
      if('vibrate' in navigator)navigator.vibrate(payload.searchResult.rarity==='rare'||payload.searchResult.rarity==='duo'?[18,30,18,30,42]:[18,36,24]);
    } catch {
      setError('Die Spur ist gerade entwischt. Eure Spürnase wurde nicht verbraucht.');
      setScreen('intro');
    }
  }

  function startGame() {
    if(state.availableSearches<=0)return;
    finishing.current=false;
    bonusCaughtRef.current=false;
    tracking.current=false;
    progressRef.current=0;
    seekerPosition.current={x:.5,y:.78};
    setProgress(0);
    setSeconds(10);
    setBonusCaught(false);
    setBonusVisible(false);
    setError('');
    setScreen('playing');
    if('vibrate' in navigator)navigator.vibrate(12);
  }

  useEffect(()=>{
    if(screen!=='playing')return;
    startedAt.current=performance.now();
    lastFrame.current=startedAt.current;
    lastPaint.current=0;
    const sniffRadius=58+Math.min(8,level)*2.5;
    const tick=(time:number)=>{
      const field=fieldRef.current;
      if(!field)return;
      const elapsed=time-startedAt.current;
      const delta=Math.min(48,time-lastFrame.current);
      lastFrame.current=time;
      const routePosition=elapsed/1320;
      const index=Math.floor(routePosition)%PATH.length;
      const nextIndex=(index+1)%PATH.length;
      const local=routePosition-Math.floor(routePosition);
      const eased=local<.5?2*local*local:1-Math.pow(-2*local+2,2)/2;
      const targetX=PATH[index][0]+(PATH[nextIndex][0]-PATH[index][0])*eased;
      const targetY=PATH[index][1]+(PATH[nextIndex][1]-PATH[index][1])*eased;
      if(targetRef.current) {
        targetRef.current.style.left=`${targetX*100}%`;
        targetRef.current.style.top=`${targetY*100}%`;
      }
      const rect=field.getBoundingClientRect();
      const distance=Math.hypot((seekerPosition.current.x-targetX)*rect.width,(seekerPosition.current.y-targetY)*rect.height);
      const isHot=distance<sniffRadius;
      if(isHot&&tracking.current)progressRef.current=Math.min(100,progressRef.current+delta/31);
      else progressRef.current=Math.max(0,progressRef.current-delta/170);
      if(isHot&&tracking.current&&!hot.current&&'vibrate' in navigator)navigator.vibrate(5);
      hot.current=isHot;
      const shouldShowBonus=elapsed>2900&&elapsed<6600&&!bonusCaughtRef.current;
      setBonusVisible(shouldShowBonus);
      if(shouldShowBonus&&tracking.current) {
        const bonusDistance=Math.hypot((seekerPosition.current.x-.78)*rect.width,(seekerPosition.current.y-.7)*rect.height);
        if(bonusDistance<sniffRadius*.82) {
          bonusCaughtRef.current=true;
          setBonusCaught(true);
          setBonusVisible(false);
          if('vibrate' in navigator)navigator.vibrate([8,18,12]);
        }
      }
      if(time-lastPaint.current>80) {
        lastPaint.current=time;
        setProgress(Math.round(progressRef.current));
        setSeconds(Math.max(0,Math.ceil((GAME_MS-elapsed)/1000)));
      }
      if(progressRef.current>=100||elapsed>=GAME_MS) {
        void completeSearch(Math.round(Math.min(100,progressRef.current+(bonusCaughtRef.current?12:0))));
        return;
      }
      animationFrame.current=window.requestAnimationFrame(tick);
    };
    animationFrame.current=window.requestAnimationFrame(tick);
    return ()=>{if(animationFrame.current!==undefined)window.cancelAnimationFrame(animationFrame.current)};
  // completeSearch deliberately reads current refs; restarting the screen creates a new loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen,level]);

  function moveSeeker(clientX:number,clientY:number) {
    const rect=fieldRef.current?.getBoundingClientRect();
    if(!rect)return;
    const x=Math.max(.06,Math.min(.94,(clientX-rect.left)/rect.width));
    const y=Math.max(.08,Math.min(.92,(clientY-rect.top)/rect.height));
    seekerPosition.current={x,y};
    if(seekerRef.current) {
      seekerRef.current.style.left=`${x*100}%`;
      seekerRef.current.style.top=`${y*100}%`;
    }
  }

  return <>
    <button type="button" className="flauschi-search-launch" onClick={()=>{setOpen(true);setScreen('intro')}} aria-label={`Mit Flauschi stöbern, ${state.availableSearches} Versuche verfügbar`}>
      <span className="flauschi-search-launch-icon"><Search aria-hidden="true" /></span>
      <span><small>FLAUSCHIS STÖBERSPIEL</small><b>{state.availableSearches>0?'Eine Spur wartet':`Neue Spürnase in ${countdown}`}</b></span>
      <i aria-label={`${state.searchEnergy} von ${state.searchCapacity} regenerierenden Spürnasen`}>
        {Array.from({length:state.searchCapacity},(_,index)=><PawPrint key={index} className={index<state.searchEnergy?'ready':''} aria-hidden="true" />)}
        {state.taskSearchBonus>0&&<em>+{state.taskSearchBonus}</em>}
      </i>
    </button>

    {open&&typeof document!=='undefined'&&createPortal(<div className={`flauschi-search-modal time-${daypart}`} role="dialog" aria-modal="true" aria-label="Flauschis Stöberspiel">
      <div className="flauschi-search-sheet">
        <header>
          <button type="button" onClick={close} aria-label="Stöberspiel schließen"><X /></button>
          <span><small>{daypartCopy}</small><strong>Flauschis Stöberspiel</strong></span>
          <button type="button" onClick={()=>setScreen('collection')} aria-label="Nestschatz-Sammlung öffnen"><span>{state.collection.length}</span><Sparkles /></button>
        </header>

        {screen==='intro'&&<main className="flauschi-search-intro">
          <div className="flauschi-search-hero">
            <span className="flauschi-search-hero-glow" aria-hidden="true" />
            <img src="/flauschi-idle-v2.webp" alt="Flauschi ist bereit zum Stöbern" />
            <i><Search aria-hidden="true" /></i>
          </div>
          <div className="flauschi-search-copy"><small>EINE PFOTE. EINE RASCHELSPUR.</small><h2>Findet, was sich im Teppich versteckt.</h2><p>Zieht Flauschi mit dem Finger zum wandernden Licht. Je länger ihr dranbleibt, desto seltener kann der Fund werden.</p></div>
          <div className="flauschi-search-energy">
            <span>{Array.from({length:state.searchCapacity},(_,index)=><i className={index<state.searchEnergy?'ready':''} key={index}><PawPrint /></i>)}</span>
            <b>{state.searchEnergy}/{state.searchCapacity} Spürnasen</b>
            <small><Clock3 /> {state.searchEnergy>=state.searchCapacity?'Alle bereit':`Nächste in ${countdown}`}{state.taskSearchBonus>0&&` · +${state.taskSearchBonus} aus Aufgaben`}</small>
          </div>
          {error&&<p className="flauschi-search-error">{error}</p>}
          <button className="flauschi-search-start" type="button" onClick={startGame} disabled={state.availableSearches<=0}><span>{state.availableSearches>0?'Spur aufnehmen':'Flauschi macht Pause'}</span><small>{state.availableSearches>0?'10 Sekunden · jeder Versuch findet etwas':'Später wartet eine neue Spürnase'}</small></button>
          <button className="flauschi-collection-link" type="button" onClick={()=>setScreen('collection')}>Nestschätze ansehen <b>{state.collection.length}/{NEST_FIND_TOTAL}</b></button>
        </main>}

        {screen==='playing'&&<main className="flauschi-search-playing">
          <div className="flauschi-search-game-hud"><span><small>SPÜRANZEIGE</small><b>{progress}%</b></span><div><i style={{width:`${progress}%`}} /></div><strong>{seconds}</strong></div>
          <div ref={fieldRef} className={`flauschi-search-field ${hot.current?'is-hot':''}`} onPointerDown={(event)=>{tracking.current=true;event.currentTarget.setPointerCapture(event.pointerId);moveSeeker(event.clientX,event.clientY)}} onPointerMove={(event)=>{if(event.currentTarget.hasPointerCapture(event.pointerId))moveSeeker(event.clientX,event.clientY)}} onPointerUp={(event)=>{tracking.current=false;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}} onPointerCancel={()=>{tracking.current=false}}>
            <span className="flauschi-search-rug-lines" aria-hidden="true" />
            <div ref={targetRef} className="flauschi-moving-trace" aria-hidden="true"><i /><Sparkles /></div>
            {bonusVisible&&<button type="button" className="flauschi-golden-glimmer" style={{left:'78%',top:'70%'}} onPointerDown={(event)=>{event.stopPropagation();bonusCaughtRef.current=true;setBonusCaught(true);setBonusVisible(false)}} aria-label="Goldfunken einsammeln"><Sparkles /></button>}
            {bonusCaught&&<span className="flauschi-bonus-caught">GOLDFUNKE!</span>}
            <div ref={seekerRef} className="flauschi-sniff-zone" style={{left:'50%',top:'78%',width:`${116+Math.min(8,level)*5}px`,height:`${116+Math.min(8,level)*5}px`}} aria-hidden="true"><span><img src="/flauschi-idle-v2.webp" alt="" /></span><i /></div>
            <p>Finger halten &amp; Flauschi dem Licht folgen</p>
          </div>
          <div className="flauschi-search-playing-foot" aria-hidden="true">
            <span><i>1</i><b>Spur halten</b></span>
            <span><i>2</i><b>Goldfunken fangen</b></span>
            <span><i>3</i><b>Fund entdecken</b></span>
          </div>
        </main>}

        {screen==='finding'&&<main className="flauschi-search-finding"><span><PawPrint /><i /><i /><i /></span><h2>Flauschi wühlt …</h2><p>Da war ganz sicher etwas unter dem Teppich.</p></main>}

        {screen==='result'&&result&&<main className={`flauschi-search-result rarity-${result.rarity}`}>
          <span className="flauschi-result-rays" aria-hidden="true" />
          <div className="flauschi-result-particles" aria-hidden="true">{Array.from({length:12},(_,index)=><i key={index} />)}</div>
          <small>{result.isNew?'NEUER NESTSCHATZ':rarityLabel(result.rarity)}</small>
          <div className="flauschi-result-image"><img src={nestFindImage(result.itemId)} alt={NEST_FIND_MAP[result.itemId]?.name??'Nestschatz'} /></div>
          <h2>{NEST_FIND_MAP[result.itemId]?.name??'Kleiner Nestschatz'}</h2>
          <p>{NEST_FIND_MAP[result.itemId]?.hint??'Flauschi hat etwas Besonderes gefunden.'}</p>
          <div className="flauschi-result-tags"><span>{rarityLabel(result.rarity)}</span><span>{result.source==='task'?'BONUS AUS AUFGABE':'SPÜRNASE'} </span>{result.bonusCaught&&<span>+ GOLDFUNKE</span>}</div>
          <button type="button" className="flauschi-search-start" onClick={()=>setScreen('intro')}><span>Ins Nest legen</span><small>{state.availableSearches>0?'Noch eine Spur ist bereit':'Sammlung erweitert'}</small></button>
        </main>}

        {screen==='collection'&&<main className="flauschi-collection">
          <div className="flauschi-collection-title"><span><small>EURE GEMEINSAME SAMMLUNG</small><h2>Nestschätze</h2></span><b>{state.collection.length}/{NEST_FIND_TOTAL}</b></div>
          <div className="flauschi-collection-grid">{NEST_FIND_META.map((item)=>{
            const found=collectionMap.get(item.id);
            return <article key={item.id} className={`${found?'found':'locked'} rarity-${item.rarity}`}><div>{found?<img src={nestFindImage(item.id)} alt="" />:<PawPrint aria-hidden="true" />}{found&&found.count>1&&<b>×{found.count}</b>}</div><span>{found?item.name:'Noch verborgen'}</span><small>{item.time==='duo'?'Nur gemeinsam':item.time==='morning'?'Morgens':item.time==='day'?'Tagsüber':item.time==='evening'?'Abends':'Nachts'}</small></article>;
          })}</div>
          <button className="flauschi-collection-back" type="button" onClick={()=>setScreen('intro')}>Zurück zum Stöbern</button>
        </main>}
      </div>
    </div>,document.body)}
  </>;
}
