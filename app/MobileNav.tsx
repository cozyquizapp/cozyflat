'use client';

export type MobileView = 'today'|'chores'|'plants'|'level'|'profile';

export default function MobileNav({view,choreCount,rewardCount,avatarSrc,onNavigate}:{view:MobileView;choreCount:number;rewardCount:number;avatarSrc:string;onNavigate:(view:MobileView)=>void}) {
  return <nav className="mobile-nav" aria-label="Hauptnavigation">
    <button className={view==='today'?'active':''} aria-current={view==='today'?'page':undefined} onClick={()=>onNavigate('today')}><span aria-hidden="true">⌂</span>Heute</button>
    <button className={view==='chores'?'active':''} aria-current={view==='chores'?'page':undefined} onClick={()=>onNavigate('chores')}><span aria-hidden="true">✓</span>{choreCount>0&&<em className="nav-badge">{Math.min(9,choreCount)}</em>}Aufgaben</button>
    <button className={view==='plants'?'active':''} aria-current={view==='plants'?'page':undefined} onClick={()=>onNavigate('plants')}><span aria-hidden="true">☘</span>Pflanzen</button>
    <button className={view==='level'?'active':''} aria-current={view==='level'?'page':undefined} onClick={()=>onNavigate('level')}><span aria-hidden="true">◇</span>{rewardCount>0&&<em className="nav-badge is-reward">{Math.min(9,rewardCount)}</em>}Garten</button>
    <button className={view==='profile'?'active':''} aria-current={view==='profile'?'page':undefined} onClick={()=>onNavigate('profile')}><img className="mobile-nav-avatar" src={avatarSrc} alt="" />Level</button>
  </nav>;
}
