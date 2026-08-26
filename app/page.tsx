"use client";
import { FormEvent, useEffect, useState } from "react";

type Plant = {
  id: number;
  name: string;
  room: string;
  intervalDays: number;
  lastWateredAt: string;
  lastWateredBy: string;
  imageKey: string | null;
};
type PersonScore = { points: number; waterings: number };
type Stats = { streak: number; loginStreak: number; loginDays: number; todayTasks:number; nextTaskBonus:number; scores: Record<"Johannes" | "Sonja", PersonScore>; totalScores: Record<"Johannes" | "Sonja", PersonScore>; previousWeek: Record<"Johannes" | "Sonja", PersonScore> };
type Chore = { id:number; name:string; category:string; icon:string; intervalDays:number; points:number; lastCompletedAt:string|null; lastCompletedBy:string|null; paused:boolean; scheduleMode:'flexible'|'scheduled'; cadenceHours:number; priority:number; dueTime:string|null };
type GardenPlant = {key:string;name:string;emoji:string;pot:string};
type GardenData = {weekKey:string;xp:number;candidates:GardenPlant[];collection:Array<{weekKey:string;plantKey:string;chosenBy:string;unlockedAt:string;xpAtUnlock:number;room:string;plant:GardenPlant}>;rooms:Array<{name:string;unlocked:boolean;count:number;capacity:number}>;activeRoom:string;chosenThisWeek:boolean};
const icons = ["🌿", "🪴", "🌱", "☘️", "🌵", "🍃"];
const roomOrder = ["Balkon", "Wohnzimmer", "Küche", "Arbeitszimmer"];
const avatarFor = { Johannes: "/avatar-johannes.png", Sonja: "/avatar-sonja.png" } as const;
const roomMeta: Record<string, { icon: string; line: string; className: string }> = {
  Balkon: { icon: "☀", line: "Sonne, Kräuter & Sommerluft", className: "balcony" },
  Wohnzimmer: { icon: "⌂", line: "Euer grünes Herzstück", className: "living" },
  Küche: { icon: "◇", line: "Frisches Grün zwischen Tassen & Tellern", className: "kitchen" },
  Arbeitszimmer: { icon: "✎", line: "Ruhige Begleiter beim Arbeiten", className: "office" },
};
const day = 86400000;
const levelNames = ["Nestling", "Anpacker:in", "Rudelprofi", "Zuhause-Held:in", "Cozy-Legende"];
const choreCategoryArt: Record<string, { image: string; tone: string }> = {
  Putzen: { image: "/chore-putzen.png", tone: "sage" },
  Hausflur: { image: "/chore-putzen.png", tone: "sage" },
  Küche: { image: "/chore-kueche.png", tone: "peach" },
  Einkauf: { image: "/chore-kueche.png", tone: "peach" },
  Wäsche: { image: "/chore-waesche.png", tone: "rose" },
  Aufräumen: { image: "/chore-waesche.png", tone: "rose" },
  Müll: { image: "/chore-putzen.png", tone: "sage" },
};
const gardenRoomArt: Record<string, { src: string; alt: string }> = {
  Wohnzimmer: { src: "/garden/rooms/garden-living.png", alt: "Leeres Holzregal im sonnigen Wohnzimmer mit Staubis Körbchen" },
  Schlafzimmer: { src: "/garden/rooms/garden-bedroom.png", alt: "Leeres Holzregal im ruhigen Schlafzimmer mit Staubis Körbchen" },
  Küche: { src: "/garden/rooms/garden-kitchen.png", alt: "Leeres Holzregal in der warmen Küche mit Staubis Körbchen" },
  Bad: { src: "/garden/rooms/garden-bathroom.png", alt: "Leeres Holzregal im hellen Bad mit Staubis Körbchen" },
};
const growthStage = (xp: number) => Math.min(5, 1 + [24, 60, 120, 200].filter((threshold) => xp >= threshold).length);
const growthPosition = ["0%", "25%", "50%", "75%", "100%"];
const growthLabel = (stage: number) => ["Keimling", "Erste Blätter", "Jungpflanze", "Kräftig", "Blütenmoment"][stage - 1];
const gardenGrowthSrc = (plantKey: string) => `/garden/growth/growth-${plantKey}${plantKey === "monstera" ? "-v2" : ""}.png`;

function levelFor(points: number) {
  const step = 100;
  const level = Math.floor(points / step) + 1;
  const current = points % step;
  return { level, current, next: step, progress: current, title: levelNames[Math.min(level - 1, levelNames.length - 1)] };
}

function dateInfo(plant: Plant) {
  const last = new Date(plant.lastWateredAt);
  const next = new Date(last.getTime() + plant.intervalDays * day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);
  const diff = Math.round((next.getTime() - today.getTime()) / day);
  return {
    diff,
    due:
      diff < 0
        ? `${Math.abs(diff)} Tg. überfällig`
        : diff === 0
          ? "Heute"
          : diff === 1
            ? "Morgen"
            : `In ${diff} Tagen`,
    last: last.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
    next: next.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
  };
}

function choreNext(chore: Chore) {
  if (chore.scheduleMode !== 'scheduled') return null;
  if (!chore.lastCompletedAt) return new Date(0);
  return new Date(new Date(chore.lastCompletedAt).getTime() + chore.cadenceHours * 3600000);
}

function choreTiming(chore: Chore, now: Date) {
  if (chore.paused) return 'Pausiert';
  if (chore.scheduleMode !== 'scheduled') return 'Spontan erledigbar';
  const next = choreNext(chore)!;
  if (next <= now) return chore.dueTime ? `Heute spätestens ${chore.dueTime}` : 'Jetzt wieder dran';
  const label = next.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
  return `Wieder spätestens ${label}${chore.dueTime ? ` · ${chore.dueTime}` : ''}`;
}

function localDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function dailyFlexiblePicks(chores: Chore[], now: Date) {
  const seed = Number(localDayKey(now).replaceAll('-', ''));
  return chores
    .filter((chore) => !chore.paused && chore.scheduleMode === 'flexible')
    .map((chore) => ({ chore, rank: ((chore.id * 9301 + seed * 49297) % 233280) / 233280 - chore.priority * 0.08 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map(({ chore }) => chore);
}

export default function Home() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [person, setPerson] = useState<"Johannes" | "Sonja">("Johannes");
  const [busy, setBusy] = useState<number | null>(null);
  const [choreBusy, setChoreBusy] = useState<number | null>(null);
  const [choreModal, setChoreModal] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [undoInfo, setUndoInfo] = useState<{chore:Chore;eventIds:number[]}|null>(null);
  const [toast, setToast] = useState("");
  const [reminderGuide, setReminderGuide] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [reminderPerson, setReminderPerson] = useState<"Johannes" | "Sonja">("Johannes");
  const [showReminderCard, setShowReminderCard] = useState(false);
  const [plantsOpen, setPlantsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'today'|'chores'|'plants'|'level'>('today');
  const [splashVisible, setSplashVisible] = useState(true);
  const emptyScores = { Johannes: {points:0,waterings:0}, Sonja: {points:0,waterings:0} };
  const [stats, setStats] = useState<Stats>({ streak: 0, loginStreak: 0, loginDays: 0, todayTasks:0, nextTaskBonus:0, scores: emptyScores, totalScores: emptyScores, previousWeek: emptyScores });
  const [celebration, setCelebration] = useState<{ label: string; person: string; points: number; icon: string } | null>(null);
  const [garden, setGarden] = useState<GardenData|null>(null);
  const [gardenBusy, setGardenBusy] = useState(false);
  const [gardenRoom, setGardenRoom] = useState('Wohnzimmer');
  async function refresh() {
    const [r, s, c, g] = await Promise.all([fetch("/api/plants"), fetch("/api/stats"), fetch("/api/chores"), fetch("/api/garden")]);
    if (r.ok) setPlants(await r.json());
    if (s.ok) setStats(await s.json());
    if (c.ok) setChores(await c.json());
    if (g.ok) { const gardenData=await g.json() as GardenData; setGarden(gardenData); setGardenRoom((current)=>gardenData.rooms.some((room)=>room.name===current&&room.unlocked)?current:gardenData.activeRoom); }
    setLoading(false);
  }
  useEffect(() => {
    const splashTimer = window.setTimeout(() => setSplashVisible(false), 3000);
    const linkedPerson = new URLSearchParams(location.search).get("person");
    const savedPerson = localStorage.getItem("cozyflat-person");
    if (linkedPerson === "Sonja" || linkedPerson === "Johannes") {
      setPerson(linkedPerson);
      localStorage.setItem("cozyflat-person", linkedPerson);
    } else if (savedPerson === "Sonja" || savedPerson === "Johannes") setPerson(savedPerson);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    refresh();
    setShowReminderCard(localStorage.getItem("reminder-card-dismissed") !== "yes");
    return () => window.clearTimeout(splashTimer);
  }, []);
  useEffect(() => {
    const day = localDayKey(new Date()).split('-').map((part, index) => index ? part.padStart(2,'0') : part).join('-');
    fetch('/api/stats',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({person,day})}).then(async (response)=>{if(response.ok)setStats(await response.json())}).catch(()=>undefined);
  }, [person]);
  async function action(payload: object) {
    const r = await fetch("/api/plants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) setPlants(await r.json());
  }
  async function water(plant: Plant) {
    setBusy(plant.id);
    await action({ action: "water", id: plant.id, person });
    const s = await fetch("/api/stats"); if (s.ok) setStats(await s.json());
    setBusy(null);
    setCelebration({ label: plant.name, person, points: 10, icon: "💧" });
    setTimeout(() => setCelebration(null), 2400);
    setToast(
      `${plant.name} wurde von ${person} gegossen. Stark – der Pflanzendienst ist zufrieden.`,
    );
    setTimeout(() => setToast(""), 2800);
  }
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("person", person);
    const r = await fetch("/api/plants", { method: "POST", body: data });
    if (r.ok) setPlants(await r.json());
    setModal(false);
  }
  async function finishChore(chore: Chore, together=false) {
    setChoreBusy(chore.id);
    const r = await fetch('/api/chores', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({id:chore.id,person,together}) });
    let awarded=chore.points; let bonus=0;
    if (r.ok) { const result = await r.json() as {chores:Chore[];completion:{eventIds:number[];bonus:number;pointsEach:number;together:boolean}|null}; setChores(result.chores); if (result.completion) { awarded=result.completion.pointsEach; bonus=result.completion.bonus; setUndoInfo({chore,eventIds:result.completion.eventIds}); setTimeout(() => setUndoInfo(null),5000); } }
    const s = await fetch('/api/stats'); if (s.ok) setStats(await s.json());
    setChoreBusy(null);
    const completionName=together?'Sonja & Johannes':person;
    setCelebration({ label: chore.name, person:completionName, points: awarded, icon: chore.icon });
    setTimeout(() => setCelebration(null), 2400);
    setToast(`${chore.name}: ${together?'gemeinsam ':''}erledigt. ${together?'Ihr bekommt beide':`${person} bekommt`} ${awarded} XP${bonus?` – inklusive ${bonus} Bonus-XP!`:'.'}`); setTimeout(() => setToast(''),3200);
    if ("vibrate" in navigator) navigator.vibrate([35,45,65]);
  }
  async function undoChore() {
    if (!undoInfo) return;
    const r = await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'undo',id:undoInfo.chore.id,eventIds:undoInfo.eventIds})});
    if (r.ok) { const result = await r.json() as {chores:Chore[]}; setChores(result.chores); const s = await fetch('/api/stats'); if (s.ok) setStats(await s.json()); setCelebration(null); setToast(`${undoInfo.chore.name} ist wieder offen.`); }
    setUndoInfo(null); setTimeout(() => setToast(''),2200);
  }
  async function chooseGardenPlant(plantKey:string) {
    setGardenBusy(true);
    const response=await fetch('/api/garden',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({plantKey,person,room:gardenRoom})});
    if(response.ok){setGarden(await response.json());setToast(`${person} hat eure neue Zimmerpflanze ausgesucht. 🌱`);setTimeout(()=>setToast(''),2800)}
    setGardenBusy(false);
  }
  async function saveChoreForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const payload = {action:'save',id:editingChore?.id,name:data.get('name'),category:data.get('category'),icon:data.get('icon'),cadenceHours:Number(data.get('cadenceHours')),priority:Number(data.get('priority')),dueTime:data.get('dueTime'),scheduleMode:data.get('scheduleMode'),points:Number(data.get('points')),paused:data.get('paused') === 'on'};
    const r = await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}); if (r.ok) { const result = await r.json() as {chores:Chore[]}; setChores(result.chores); setChoreModal(false); setEditingChore(null); setToast(editingChore ? 'Hausi aktualisiert.' : 'Neues Hausi angelegt.'); setTimeout(()=>setToast(''),2200); }
  }
  const todayCount = plants.filter((p) => dateInfo(p).diff <= 0).length;
  const soonCount = plants.filter((p) => {
    const d = dateInfo(p).diff;
    return d > 0 && d <= 3;
  }).length;
  const now = new Date();
  const dueChoresToday = chores.filter((chore) => !chore.paused && chore.scheduleMode === 'scheduled' && choreNext(chore)! <= now).sort((a,b)=>b.priority-a.priority);
  const flexiblePicks = dailyFlexiblePicks(chores, now);
  const flexiblePicksOpen = flexiblePicks.filter((chore) => !chore.lastCompletedAt || localDayKey(new Date(chore.lastCompletedAt)) !== localDayKey(now));
  const todayChores = [...dueChoresToday, ...flexiblePicksOpen];
  const choreCountToday = todayChores.length;
  const openCount = todayCount + choreCountToday;
  const weeklyTeamPoints = stats.scores.Johannes.points + stats.scores.Sonja.points;
  const gardenXp = stats.totalScores.Johannes.points + stats.totalScores.Sonja.points;
  const gardenLevel = Math.floor(gardenXp / 100) + 1;
  const gardenProgress = gardenXp % 100;
  const gardenEmoji = gardenLevel >= 8 ? '🌳' : gardenLevel >= 6 ? '🌸' : gardenLevel >= 4 ? '🌿' : gardenLevel >= 2 ? '🪴' : '🌱';
  const weeklyGoal = 200;
  const weeklyProgress = Math.min(100, Math.round((weeklyTeamPoints / weeklyGoal) * 100));
  const dateLabel = now
    .toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();
  const showWeeklyRecap = now.getDay() === 0 && now.getHours() >= 18;
  return (
    <main className={`shell person-${person.toLowerCase()} view-${mobileView}`}>
      {splashVisible && <section className="app-splash" aria-label="CozyFlat wird geladen" aria-live="polite">
        <picture><source media="(max-width: 900px)" srcSet="/loading-mobile.webp" /><img src="/og.png" alt="CozyFlat – Sonja und Johannes packen gemeinsam zuhause an" /></picture>
        <div><span>✨ Staubi macht CozyFlat gemütlich</span><i></i><i></i><i></i></div>
      </section>}
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brandmark"><img src="/app-icon.png" alt="" /></span>
          <span>CozyFlat</span>
        </a>
        <div className="person-switch" aria-label="Wer benutzt die App?">
          {(["Johannes", "Sonja"] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPerson(p); localStorage.setItem("cozyflat-person", p); }}
              className={person === p ? "active" : ""}
            >
              <img src={avatarFor[p]} alt="" />
              <span>{p}</span>
            </button>
          ))}
        </div>
      </header>
      <section className="hero daily-hero" id="top">
        <div className="personal-greeting">
          <div className="greeting-copy">
            <div className="daily-kicker"><img className="greeting-avatar" src={avatarFor[person]} alt={`Porträt von ${person}`} /><span><small>{dateLabel}</small><b>Heute bei euch</b></span></div>
            <h1>
              Hallo {person},
              <em>
                {openCount === 0
                  ? "Alles ist versorgt."
                  : openCount === 1
                    ? todayCount === 1
                      ? "Eine Pflanze hat Durst."
                      : "Ein Hausi wartet."
                    : todayCount > 0 && choreCountToday > 0
                      ? `${todayCount === 1 ? 'Eine Pflanze' : `${todayCount} Pflanzen`} und ${choreCountToday === 1 ? 'ein Hausi' : `${choreCountToday} Hausis`} für heute.`
                      : todayCount > 0
                        ? `${todayCount} Pflanzen möchten Wasser.`
                        : `${choreCountToday} Hausis für heute stehen an.`}
              </em>
            </h1>
            <div className="daily-bottom"><div className="staubi-greeting"><img src="/staubi.png" alt="Staubi, euer Hausgeist" /><p><b>{openCount ? 'Staubi hat schon mal geschnuppert:' : 'Staubi rollt sich ein:'}</b> {openCount ? `${openCount} gute Gelegenheiten für XP. Welche schnappt ihr euch?` : "Nichts drängt. Das Nest ist heute offiziell freigegeben."}</p></div>{openCount > 0 && <a className="round-start" href="#aufgaben"><span>Erstes Hausi</span><b>Auswählen <i>→</i></b></a>}</div>
          </div>
        </div>
      </section>
      <section className="summary" aria-label="Heutige Zusammenfassung">
        <div>
          <strong>{openCount}</strong>
          <span>heute geplant</span>
        </div>
        <div>
          <strong>{soonCount}</strong>
          <span>demnächst</span>
        </div>
        <div className="streak">
          <span>↗</span>
          <b>
            {openCount
              ? `${person}, womit wollt ihr heute anfangen?`
              : "Alles erledigt – jetzt wird’s gemütlich"}
          </b>
        </div>
      </section>
      <div className={`mobile-progress ${progressOpen ? "is-open" : ""}`} id="fortschritt">
        <button className="progress-toggle" onClick={() => setProgressOpen((open) => !open)} aria-expanded={progressOpen}><span>★ Level & Wochenmission</span><b>{weeklyTeamPoints}/{weeklyGoal} XP</b></button>
        <section className="plant-room-game" aria-label="Euer gemeinsames Pflanzenzimmer">
          <div className="garden-game-head"><div><p className="eyebrow">STAUBIS PFLANZENZIMMER</p><h2>Euer Zuhause wächst mit.</h2><p>Jedes Hausi schenkt euren Pflanzen neue Blätter.</p></div><div className="garden-level-pill"><span>Level {gardenLevel}</span><b>{gardenProgress}/100 XP</b></div></div>
          <nav className="garden-room-tabs" aria-label="Pflanzenräume">{garden?.rooms.map((room)=><button key={room.name} disabled={!room.unlocked} className={gardenRoom===room.name?'active':''} onClick={()=>room.unlocked&&setGardenRoom(room.name)}><span>{room.unlocked?room.name:'🔒 '+room.name}</span><small>{room.count}/{room.capacity}</small></button>)}</nav>
          <div className={`plant-room-stage room-${gardenRoom.toLowerCase().replace('ü','ue')}`}>
            <img className="plant-room-bg" src={gardenRoomArt[gardenRoom]?.src ?? gardenRoomArt.Wohnzimmer.src} alt={gardenRoomArt[gardenRoom]?.alt ?? gardenRoomArt.Wohnzimmer.alt} />
            <div className="plant-shelf" aria-label={`Eure Pflanzen im ${gardenRoom}`}>{garden?.collection.filter((item)=>item.room===gardenRoom).slice(-4).map((item,index)=>{const stage=growthStage(Math.max(0,garden.xp-item.xpAtUnlock));return <article className={`collectible slot-${index} stage-${stage}`} key={item.weekKey}><span className="growth-sprite" style={{backgroundImage:`url(${gardenGrowthSrc(item.plantKey)})`,backgroundPosition:`center ${growthPosition[stage-1]}`}} role="img" aria-label={`${item.plant.name}, Wachstumsstufe ${stage} von 5: ${growthLabel(stage)}`}/></article>})}</div>
            {garden?.collection.filter((item)=>item.room===gardenRoom).length===0&&<div className="empty-room-hint"><b>Das Regal wartet auf euren ersten Einzug.</b><small>Wählt unten einen Wochenliebling für diesen Raum.</small></div>}
            <div className="staubi-home"><img src="/staubi-cutout.png" alt="Staubi liegt in seinem Körbchen und freut sich über euer Pflanzenzimmer"/><span>{stats.loginStreak ? `Serie: ${stats.loginStreak}` : 'Schläft'}</span></div>
          </div>
          {garden?.collection.filter((item)=>item.room===gardenRoom).length ? <ul className="garden-collection" aria-label={`Pflanzen im ${gardenRoom}`}>{garden.collection.filter((item)=>item.room===gardenRoom).slice(-4).map((item)=>{const stage=growthStage(Math.max(0,garden.xp-item.xpAtUnlock));return <li key={item.weekKey}><span className="growth-sprite" style={{backgroundImage:`url(${gardenGrowthSrc(item.plantKey)})`,backgroundPosition:`center ${growthPosition[stage-1]}`}}/><span><b>{item.plant.name}</b><small>Stufe {stage}/5 · {growthLabel(stage)}</small></span></li>})}</ul> : null}
          <div className="garden-track"><i style={{width:`${gardenProgress}%`}} /></div><div className="garden-meta"><b>Gemeinsam {gardenXp} XP gesammelt</b><span>Noch {100-gardenProgress} XP bis Raum-Level {gardenLevel+1}</span></div>
          {!garden?.chosenThisWeek && garden && <div className="weekly-plant-choice"><span><small>DIESE WOCHE · {gardenRoom.toUpperCase()}</small><b>Welche zieht bei euch ein?</b></span><div>{garden.candidates.map((candidate)=><button disabled={gardenBusy} onClick={()=>chooseGardenPlant(candidate.key)} key={candidate.key}><i className="growth-sprite" style={{backgroundImage:`url(${gardenGrowthSrc(candidate.key)})`,backgroundPosition:"center 0%"}}/><b>{candidate.name}</b><small>Als Keimling einziehen lassen</small></button>)}</div></div>}
          {garden?.chosenThisWeek && <div className="next-plant"><span>✨</span><p><b>Wochenpflanze gewählt</b>Nächsten Montag bringt Staubi drei neue Kandidaten mit.</p></div>}
        </section>
        <section className="level-hub" aria-label="Eure Level und Wochenfortschritt">
        <div className="team-quest">
          <div className="quest-heading"><span>🔥</span><div><p className="eyebrow">WOCHENMISSION</p><strong>{stats.streak} {stats.streak === 1 ? "Tag" : "Tage"} gemeinsam dran</strong></div><b>{weeklyTeamPoints}/{weeklyGoal} XP</b></div>
          <div className="quest-track" aria-label={`${weeklyProgress} Prozent der Wochenmission geschafft`}><i style={{width:`${weeklyProgress}%`}} /></div>
          <small>{weeklyProgress >= 100 ? "Mission geschafft. Ihr dürft euch feiern!" : `Noch ${weeklyGoal - weeklyTeamPoints} XP bis zum Wochenziel.`}</small>
        </div>
        <div className="level-people">
          {(["Johannes", "Sonja"] as const).map((name) => { const level = levelFor(stats.totalScores[name].points); return <article className={person === name ? "is-active" : ""} key={name}>
            <img src={avatarFor[name]} alt="" /><div><span><b>{name}</b><em>Level {level.level}</em></span><strong>{level.title}</strong><div className="level-track"><i style={{width:`${level.progress}%`}} /></div><small>{level.current}/{level.next} XP bis Level {level.level + 1} · {stats.scores[name].points} XP diese Woche</small></div>
          </article>})}
        </div>
        </section>
      </div>
      {showWeeklyRecap && <section className="weekly-recap">
        <p className="eyebrow">SONNTAGS-RÜCKBLICK</p><h2>Ihr wart fleißig.</h2>
        <div>{(["Johannes", "Sonja"] as const).map((name) => <article key={name}><img src={avatarFor[name]} alt="" /><span><b>{name}</b><small>{stats.scores[name].waterings} Aufgaben erledigt</small></span><strong>{stats.scores[name].points} Punkte</strong></article>)}</div>
        <p>Um Mitternacht startet eine neue Wochenmission. Eure gesammelten XP bleiben in euren Leveln erhalten.</p>
      </section>}
      <section className="chores-section" id="aufgaben">
        <div className="section-head"><div><p className="eyebrow">EURE HAUSIS</p><h2>Was sonst noch ansteht</h2><p>Alles darf auch spontan erledigt werden – Besuch wartet schließlich nicht auf den Rhythmus.</p></div><button className="add-hausi" onClick={()=>{setEditingChore(null);setChoreModal(true)}}><span>＋</span> Hausi</button></div>
        {todayChores.length > 0 && <section className="today-chores" aria-labelledby="today-chores-title"><div className="today-chores-head"><div><p className="eyebrow">HEUTE WICHTIG</p><h3 id="today-chores-title">Eure kleine Tagesauswahl</h3><small className="bonus-preview">🔥 {stats.todayTasks} heute geschafft · Nächstes Hausi +{stats.nextTaskBonus} Bonus-XP</small></div><span>{todayChores.length} für heute</span></div><div>{todayChores.slice(0,5).map((chore) => <article className="quick-chore" key={chore.id}><span className="chore-icon">{chore.icon}</span><div><b>{chore.name}</b><small>{chore.scheduleMode === 'flexible' ? 'Staubis Tagesvorschlag' : choreTiming(chore,now)} · {'!'.repeat(chore.priority)} · +{chore.points} XP</small></div><div className="completion-choices"><button onClick={() => finishChore(chore)} disabled={choreBusy === chore.id}><img src={avatarFor[person]} alt="" />{choreBusy === chore.id ? '…' : `Ich`}</button><button className="together-button" onClick={() => finishChore(chore,true)} disabled={choreBusy === chore.id}><span className="duo-avatars"><img src={avatarFor.Johannes} alt=""/><img src={avatarFor.Sonja} alt=""/></span>Gemeinsam</button></div></article>)}</div>{todayChores.length > 5 && <small className="today-more">Danach sind noch {todayChores.length - 5} fest eingeplant – eins nach dem anderen.</small>}</section>}
        <div className="chore-groups">{[...new Set(chores.map((chore) => chore.category))].map((category) => {
          const categoryChores = chores.filter((chore) => chore.category === category);
          const dueChores = categoryChores.filter((chore) => !chore.paused && chore.scheduleMode === 'scheduled' && choreNext(chore)! <= now);
          const laterChores = categoryChores.filter((chore) => !dueChores.includes(chore));
          const art = choreCategoryArt[category] ?? { image: '/chore-putzen.png', tone: 'sage' };
          const renderChore = (chore: Chore) => { const next = choreNext(chore); const isDue = Boolean(next && next <= now);
            return <article className={`chore-card ${isDue ? 'is-due' : ''} priority-${chore.priority} ${chore.paused ? 'is-paused' : ''}`} key={chore.id}><span className="chore-icon">{chore.icon}</span><div><b>{chore.name}</b><small>{choreTiming(chore,now)} · {chore.lastCompletedBy ? `zuletzt ${chore.lastCompletedBy}` : 'noch nie abgehakt'}</small></div><strong>{'!'.repeat(chore.priority)} · +{chore.points}</strong><button className="edit-chore" onClick={()=>{setEditingChore(chore);setChoreModal(true)}} aria-label={`${chore.name} bearbeiten`}>✎</button><div className="completion-choices"><button className="finish-chore" onClick={() => finishChore(chore)} disabled={chore.paused || choreBusy === chore.id}>{chore.paused ? 'Pausiert' : choreBusy === chore.id ? '…' : <><img src={avatarFor[person]} alt="" />Ich</>}</button><button className="finish-chore together-button" onClick={() => finishChore(chore,true)} disabled={chore.paused || choreBusy === chore.id}><span className="duo-avatars"><img src={avatarFor.Johannes} alt=""/><img src={avatarFor.Sonja} alt=""/></span>Gemeinsam</button></div></article>;
          };
          return <details className={`chore-group tone-${art.tone}`} key={category}><summary className="chore-group-preview" style={{backgroundImage:`linear-gradient(90deg,rgba(18,48,35,.88) 0%,rgba(18,48,35,.56) 48%,rgba(18,48,35,.08) 100%), url(${art.image})`}}><span className="chore-preview-icon">{categoryChores[0]?.icon ?? '✨'}</span><span><small>{dueChores.length ? `${dueChores.length} jetzt wichtig` : 'Flexibel einplanbar'}</small><b>{category}</b></span><em>{categoryChores.length}</em><strong>⌄</strong></summary><div className="chore-group-content"><div>{[...dueChores,...laterChores].map(renderChore)}</div></div></details>;
        })}</div>
      </section>
      <section className={`plant-section plant-menu ${plantsOpen ? 'is-open' : ''}`} id="pflanzen">
        <div className="section-head">
          <div>
            <p className="eyebrow">EURE PFLANZEN</p>
            <h2>Eure Pflanzen</h2><p>{todayCount ? `${todayCount} möchten heute Wasser.` : `${plants.length} Pflanzen sind gerade versorgt.`}</p>
          </div>
          <div className="plant-menu-actions"><button className="plant-menu-toggle" onClick={()=>setPlantsOpen(open=>!open)} aria-expanded={plantsOpen}>{plantsOpen ? 'Menü schließen ↑' : 'Pflanzen öffnen ↓'}</button><button className="add-button" onClick={() => setModal(true)}><span>＋</span> Pflanze</button></div>
        </div>
        {plantsOpen && (loading ? (
          <div className="empty">Eure Pflanzen werden geladen …</div>
        ) : plants.length === 0 ? (
          <div className="empty">
            <b>Noch keine Pflanzen.</b>
            <br />
            Legt eure erste Pflanze an.
          </div>
        ) : (
          <div className="room-list">
            {[...roomOrder, ...plants.map((p) => p.room).filter((room) => !roomOrder.includes(room))]
              .filter((room, index, all) => all.indexOf(room) === index && plants.some((p) => p.room === room))
              .map((room) => {
                const meta = roomMeta[room] ?? { icon: "☘", line: "Eure Pflanzen", className: "other" };
                const roomPlants = plants.filter((plant) => plant.room === room);
                const duePlants = roomPlants.filter((plant) => dateInfo(plant).diff <= 0);
                const caredPlants = roomPlants.filter((plant) => dateInfo(plant).diff > 0);
                const dueInRoom = duePlants.length;
                const renderCard = (plant: Plant, i: number) => {
                  const d = dateInfo(plant);
                  return <article className={`plant-card ${d.diff <= 0 ? "urgent" : ""}`} key={plant.id}>
                    <div className={`plant-icon ${plant.imageKey ? "has-photo" : ""}`}>
                      {plant.imageKey ? <img src={`/api/images/${encodeURIComponent(plant.imageKey)}`} alt={plant.name} /> : icons[i % icons.length]}
                    </div>
                    <div className="plant-copy">
                      <span className={`due ${d.diff <= 0 ? "due-now" : ""}`}>{d.diff <= 0 ? "● " : ""}{d.due}</span>
                      <h3>{plant.name}</h3>
                      <p>Zuletzt {d.last} von {plant.lastWateredBy}</p>
                      <p className="next-date">Nächstes Mal: {d.next} · alle {plant.intervalDays} Tage</p>
                    </div>
                    <div className="card-actions">
                      <button className="water-button" onClick={() => water(plant)} disabled={busy === plant.id}><span>✓</span>{busy === plant.id ? "Speichert …" : "Gegossen"}</button>
                      <button className="delete-button" onClick={async () => { if (confirm(`${plant.name} wirklich entfernen?`)) await action({ action: "delete", id: plant.id }); }} aria-label={`${plant.name} entfernen`}>Entfernen</button>
                    </div>
                  </article>;
                };
                return <details className={`room-zone ${meta.className}`} key={room}>
                  <summary className="room-header">
                    <span className="room-symbol" aria-hidden="true">{meta.icon}</span>
                    <div><p>{meta.line}</p><h3>{room}</h3></div>
                    <span className="room-previews" aria-hidden="true">{roomPlants.slice(0,3).map((plant,index)=><i key={plant.id}>{plant.imageKey ? <img src={`/api/images/${encodeURIComponent(plant.imageKey)}`} alt="" /> : icons[index % icons.length]}</i>)}</span>
                    <span className={`room-count ${dueInRoom ? "has-due" : ""}`}>{dueInRoom ? `${dueInRoom} fällig` : `${roomPlants.length} versorgt`}</span>
                    <span className="room-chevron" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="room-content">
                    {duePlants.length > 0 && <div className="plant-grid">{duePlants.map(renderCard)}</div>}
                    {duePlants.length === 0 && <div className="room-all-done"><span>✓</span><div><b>Hier ist alles versorgt</b><small>Bis zur nächsten Pflanzenrunde könnt ihr euch zurücklehnen.</small></div></div>}
                    {caredPlants.length > 0 && <details className="cared-plants">
                    <summary><span><b>{caredPlants.length} versorgt</b><small>{caredPlants.map((plant) => plant.name).join(" · ")}</small></span><i>anzeigen</i></summary>
                    <div className="plant-grid">{caredPlants.map(renderCard)}</div>
                    </details>}
                  </div>
                </details>;
              })}
          </div>
        ))}
      </section>
      {showReminderCard && <section className="reminder-card bottom-reminder">
        <button className="dismiss-reminder" onClick={() => { localStorage.setItem("reminder-card-dismissed", "yes"); setShowReminderCard(false); }} aria-label="Apple-Einrichtung ausblenden">×</button>
        <div className="reminder-symbol" aria-hidden="true">✓</div>
        <div><p className="eyebrow">APPLE ERINNERUNGEN</p><h2>Gemeinsam nichts vergessen</h2><p>Ein Kurzbefehl trägt fällige Hausis und Pflanzen automatisch in eure Familienliste ein.</p></div>
        <button onClick={() => { setReminderPerson(person); setReminderGuide(true); }}>Einrichten</button>
      </section>}
      <footer>
        <span>☘</span>
        <p>
          Gemeinsam angepackt.
          <br />
          Danach gemeinsam gemütlich.
        </p>
        <button className="footer-reminder-link" onClick={() => { setReminderPerson(person); setReminderGuide(true); }}>Erinnerungen einrichten</button>
      </footer>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="close"
              onClick={() => setModal(false)}
              aria-label="Schließen"
            >
              ×
            </button>
            <p className="eyebrow">NEUER MITBEWOHNER</p>
            <h2 id="modal-title">Pflanze hinzufügen</h2>
            <p className="modal-intro">Heute gilt als erstes Gießdatum.</p>
            <form onSubmit={add}>
              <label>
                Name
                <input
                  name="name"
                  placeholder="z. B. Fenster-Ficus"
                  required
                  autoFocus
                  maxLength={60}
                />
              </label>
              <label>
                Standort
                <input
                  name="room"
                  placeholder="z. B. Wohnzimmer"
                  required
                  maxLength={60}
                />
              </label>
              <label>
                Foto (optional)
                <input name="image" type="file" accept="image/*" />
              </label>
              <label>
                Wie oft gießen?
                <select name="interval" defaultValue="7">
                  <option value="3">Alle 3 Tage</option>
                  <option value="5">Alle 5 Tage</option>
                  <option value="7">Einmal pro Woche</option>
                  <option value="10">Alle 10 Tage</option>
                  <option value="14">Alle 2 Wochen</option>
                  <option value="21">Alle 3 Wochen</option>
                  <option value="30">Einmal im Monat</option>
                </select>
              </label>
              <button className="submit-button">Pflanze anlegen</button>
            </form>
          </section>
        </div>
      )}
      {reminderGuide && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setReminderGuide(false); }}>
          <section className="modal reminder-modal" role="dialog" aria-modal="true" aria-labelledby="reminder-title">
            <button className="close" onClick={() => setReminderGuide(false)} aria-label="Schließen">×</button>
            <p className="eyebrow">EINMALIG AUF EINEM IPHONE</p>
            <h2 id="reminder-title">Familien-Erinnerungen verbinden</h2>
            <p className="modal-intro">Der Kurzbefehl prüft täglich CozyFlat. Fällige Hausis und Pflanzen landen in der geteilten Liste „Familie“.</p>
            <fieldset className="reminder-person-picker">
              <legend>Für wen ist dieser Kurzbefehl?</legend>
              {(["Johannes", "Sonja"] as const).map((name) => <button type="button" className={reminderPerson === name ? "active" : ""} onClick={() => setReminderPerson(name)} key={name}><img src={avatarFor[name]} alt="" /><span><b>{name}</b><small>{reminderPerson === name ? "ausgewählt" : "dieses Profil wählen"}</small></span><i>✓</i></button>)}
            </fieldset>
            <ol className="shortcut-steps">
              <li><b>Gemeinsame Liste prüfen</b><span>Öffnet „Erinnerungen“ und stellt sicher, dass eure geteilte Liste „Familie“ heißt.</span></li>
              <li><b>Kurzbefehl erstellen</b><span>Öffnet „Kurzbefehle“, tippt auf ＋ und fügt „Inhalt von URL abrufen“ ein.</span></li>
              <li><b>Adresse einsetzen</b><span>Kopiert die Adresse unten und setzt sie als URL ein. Wählt aus dem Ergebnis den Wert „reminders“.</span></li>
              <li><b>Erinnerungen hinzufügen</b><span>Wiederholt jeden Eintrag und nutzt „Neue Erinnerung“ mit „title“ für die Liste „Familie“. Vorher nach einer offenen Erinnerung mit demselben Titel suchen, damit nichts doppelt erscheint.</span></li>
              <li><b>Täglich ausführen</b><span>Unter „Automation“ → „Tageszeit“ den Kurzbefehl jeden Morgen automatisch starten.</span></li>
            </ol>
            <button className="copy-url" onClick={async () => { await navigator.clipboard.writeText(`${location.origin}/api/reminders?person=${encodeURIComponent(reminderPerson)}`); setToast(`Adresse für ${reminderPerson} kopiert.`); setTimeout(() => setToast(''), 2800); }}>Adresse für {reminderPerson} kopieren</button>
            <code className="shortcut-url">{typeof window !== 'undefined' ? `${location.origin}/api/reminders?person=${encodeURIComponent(reminderPerson)}` : `/api/reminders?person=${reminderPerson}`}</code>
          </section>
        </div>
      )}
      {choreModal && <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget){setChoreModal(false);setEditingChore(null)}}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="chore-modal-title"><button className="close" onClick={()=>{setChoreModal(false);setEditingChore(null)}} aria-label="Schließen">×</button><p className="eyebrow">{editingChore ? 'HAUSI BEARBEITEN' : 'NEUES HAUSI'}</p><h2 id="chore-modal-title">{editingChore ? editingChore.name : 'Hausi hinzufügen'}</h2><form onSubmit={saveChoreForm} className="chore-form"><label>Name<input name="name" required maxLength={60} defaultValue={editingChore?.name ?? ''} placeholder="z. B. Kühlschrank auswischen" /></label><label>Kategorie<input name="category" required maxLength={40} defaultValue={editingChore?.category ?? 'Sonstiges'} placeholder="z. B. Küche" /></label><div className="form-pair"><label>Symbol<input name="icon" maxLength={4} defaultValue={editingChore?.icon ?? '✨'} /></label><label>XP<input name="points" type="number" min="1" max="100" defaultValue={editingChore?.points ?? 10} /></label></div><label>Planung<select name="scheduleMode" defaultValue={editingChore?.scheduleMode ?? 'flexible'}><option value="flexible">Spontan – zählt nicht als fällig</option><option value="scheduled">Mit festem Rhythmus</option></select></label><div className="form-pair"><label>Wie oft?<select name="cadenceHours" defaultValue={editingChore?.cadenceHours ?? 24}><option value="6">Bis zu 4× täglich</option><option value="8">Bis zu 3× täglich</option><option value="12">Bis zu 2× täglich</option><option value="24">Täglich</option><option value="72">Alle 3 Tage</option><option value="168">Wöchentlich</option><option value="336">Alle 2 Wochen</option><option value="672">Alle 4 Wochen</option></select></label><label>Spätestens bis<input name="dueTime" type="time" defaultValue={editingChore?.dueTime ?? ''} /></label></div><label>Priorität<select name="priority" defaultValue={editingChore?.priority ?? 2}><option value="1">Niedrig · !</option><option value="2">Normal · !!</option><option value="3">Wichtig · !!!</option></select></label><p className="schedule-hint">Nur Hausis mit festem Rhythmus erscheinen als „heute geplant“. Spontane Hausis könnt ihr jederzeit für XP abhaken.</p><label className="pause-check"><input name="paused" type="checkbox" defaultChecked={editingChore?.paused ?? false} /> Hausi pausieren</label><button className="submit-button">{editingChore ? 'Änderungen speichern' : 'Hausi anlegen'}</button>{editingChore && <button type="button" className="danger-button" onClick={async()=>{if(confirm(`${editingChore.name} wirklich löschen?`)){const r=await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'delete',id:editingChore.id})});if(r.ok){const result=await r.json() as {chores:Chore[]};setChores(result.chores);setChoreModal(false);setEditingChore(null)}}}}>Hausi löschen</button>}</form></section></div>}
      {toast && (
        <div className="toast" role="status">
          ✓ {toast} {undoInfo && <button onClick={undoChore}>Rückgängig</button>}
        </div>
      )}
      {celebration && <div className="water-celebration" role="status" aria-live="polite">
        <div className="water-burst" aria-hidden="true"><img className="staubi-celebrate" src="/staubi.png" alt="" /><span>{celebration.icon}</span><i></i><i></i><i></i><i></i><i></i></div>
        <strong>Hausi geschafft!</strong><p>{celebration.person} hat „{celebration.label}“ erledigt. Das Zuhause atmet auf.</p><b>+{celebration.points} XP</b>
      </div>}
      <nav className="mobile-nav" aria-label="Hauptnavigation">
        <button className={mobileView==='today'?'active':''} onClick={()=>{setMobileView('today');window.scrollTo({top:0,behavior:'smooth'})}}><span>⌂</span>Heute</button>
        <button className={mobileView==='chores'?'active':''} onClick={()=>{setMobileView('chores');window.scrollTo({top:0,behavior:'smooth'})}}><span>✓</span>Hausis</button>
        <button className={mobileView==='plants'?'active':''} onClick={()=>{setMobileView('plants');setPlantsOpen(true);window.scrollTo({top:0,behavior:'smooth'})}}><span>☘</span>Pflanzen</button>
        <button className={mobileView==='level'?'active':''} onClick={()=>{setMobileView('level');setProgressOpen(true);window.scrollTo({top:0,behavior:'smooth'})}}><span>🌱</span>Garten</button>
      </nav>
    </main>
  );
}

