'use client';

import { Flower2, House, Leaf, ListChecks, Sparkles, Trophy } from 'lucide-react';

export type MobileView = 'today'|'chores'|'plants'|'level'|'flauschi'|'profile';

export default function MobileNav({view,choreCount,rewardCount,flauschiCount,avatarSrc,onNavigate}:{view:MobileView;choreCount:number;rewardCount:number;flauschiCount:number;avatarSrc:string;onNavigate:(view:MobileView)=>void}) {
  return <nav className="mobile-nav" aria-label="Hauptnavigation">
    <button className={view==='today'?'active':''} aria-current={view==='today'?'page':undefined} onClick={()=>onNavigate('today')}><House aria-hidden="true" />Heute</button>
    <button className={view==='chores'?'active':''} aria-current={view==='chores'?'page':undefined} onClick={()=>onNavigate('chores')}><ListChecks aria-hidden="true" />{choreCount>0&&<em className="nav-badge">{Math.min(9,choreCount)}</em>}Aufgaben</button>
    <button className={view==='plants'?'active':''} aria-current={view==='plants'?'page':undefined} onClick={()=>onNavigate('plants')}><Leaf aria-hidden="true" />Pflanzen</button>
    <button className={view==='level'?'active':''} aria-current={view==='level'?'page':undefined} onClick={()=>onNavigate('level')}><Flower2 aria-hidden="true" />{rewardCount>0&&<em className="nav-badge is-reward">{Math.min(9,rewardCount)}</em>}Garten</button>
    <button className={view==='flauschi'?'active':''} aria-current={view==='flauschi'?'page':undefined} onClick={()=>onNavigate('flauschi')}><Sparkles aria-hidden="true" />{flauschiCount>0&&<em className="nav-badge is-reward">{Math.min(9,flauschiCount)}</em>}Flauschi</button>
    <button className={view==='profile'?'active':''} aria-current={view==='profile'?'page':undefined} onClick={()=>onNavigate('profile')}><Trophy aria-hidden="true" />Level<span className="mobile-nav-profile-dot" style={{backgroundImage:`url(${avatarSrc})`}} aria-hidden="true" /></button>
  </nav>;
}
