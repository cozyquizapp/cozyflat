'use client';

import { useEffect, useRef } from 'react';

export type CompletionReward = {
  label:string;
  person:string;
  points:number;
  bonus:number;
  weeklyRemaining:number;
  weeklyUnlocked:boolean;
};

export default function RewardSheet({reward,onClose,onOpenGarden,onOpenFlauschi,onUndo}:{reward:CompletionReward;onClose:()=>void;onOpenGarden:()=>void;onOpenFlauschi:()=>void;onUndo?:()=>void}) {
  const dialogRef=useRef<HTMLElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const onCloseRef=useRef(onClose);
  useEffect(()=>{onCloseRef.current=onClose},[onClose]);
  useEffect(()=>{
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    closeRef.current?.focus();
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onCloseRef.current();return}
      if(event.key!=='Tab'||!dialogRef.current)return;
      const focusable=[...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if(!focusable.length)return;
      const first=focusable[0]; const last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    document.addEventListener('keydown',handleKey);
    return ()=>{document.removeEventListener('keydown',handleKey);previous?.focus()};
  },[]);

  return <div className="reward-sheet-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose()}}>
    <section ref={dialogRef} className="reward-sheet" role="dialog" aria-modal="true" aria-labelledby="reward-title">
      <button ref={closeRef} type="button" className="reward-sheet-close" aria-label="Belohnung schließen" onClick={onClose}>×</button>
      <div className="reward-sheet-flare" aria-hidden="true"><i/><i/><i/></div>
      <p>AUFGABE GESCHAFFT</p>
      <h2 id="reward-title">Das fühlt sich gut an.</h2>
      <span className="reward-task-name">{reward.person}: „{reward.label}“</span>
      <div className="reward-earned">
        <article><small>PERSÖNLICH</small><b>+{reward.points} XP</b>{reward.bonus>0&&<em>inkl. {reward.bonus} Bonus</em>}</article>
        <article><small>GEMEINSAM</small><b>1 Sonnenfunke</b><em>für euer Regal</em></article>
        <article><small>FLAUSCHI</small><b>1 Spielmoment</b><em>wartet im Nest</em></article>
      </div>
      <p className={`reward-weekly ${reward.weeklyUnlocked?'is-unlocked':''}`}>{reward.weeklyUnlocked?'Wochen-Abzeichen freigeschaltet – diese Woche gehört euch!':`Noch ${reward.weeklyRemaining} XP bis zu eurem Wochen-Abzeichen.`}</p>
      <div className="reward-destinations">
        <button type="button" onClick={onOpenGarden}><span>JETZT WACHSEN LASSEN</span><b>Zum Pflanzenregal</b></button>
        <button type="button" onClick={onOpenFlauschi}><span>JETZT BELOHNEN</span><b>Zu Flauschi</b></button>
      </div>
      <div className="reward-sheet-footer"><button type="button" onClick={onClose}>Später</button>{onUndo&&<button type="button" onClick={onUndo}>Rückgängig</button>}</div>
    </section>
  </div>;
}
