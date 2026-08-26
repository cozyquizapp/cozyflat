"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import GardenScene from "./GardenScene";

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
type GardenData = {dayKey:string;xp:number;candidates:GardenPlant[];collection:Array<{weekKey:string;plantKey:string;chosenBy:string;unlockedAt:string;xpAtUnlock:number;room:string;plant:GardenPlant}>;rooms:Array<{name:string;unlocked:boolean;count:number;capacity:number}>;activeRoom:string;dailyTaskGoal:number;todayTasks:number;rewardReady:boolean;chosenToday:boolean};
const icons = ["🌿", "🪴", "🌱", "☘️", "🌵", "🍃"];
const roomOrder = ["Balkon", "Wohnzimmer", "Küche", "Arbeitszimmer"];
const avatarFor = { Johannes: "/avatar-johannes.png", Sonja: "/avatar-sonja.png" } as const;
const roomMeta: Record<string, { icon: string; line: string; className: string; image: string }> = {
  Balkon: { icon: "☀", line: "Sonne, Kräuter & Sommerluft", className: "balcony", image: "/cozy-garden-room.png" },
  Wohnzimmer: { icon: "⌂", line: "Euer grünes Herzstück", className: "living", image: "/garden/rooms/garden-living.png" },
  Küche: { icon: "◇", line: "Frisches Grün zwischen Tassen & Tellern", className: "kitchen", image: "/garden/rooms/garden-kitchen.png" },
  Arbeitszimmer: { icon: "✎", line: "Ruhige Begleiter beim Arbeiten", className: "office", image: "/garden/rooms/garden-bedroom.png" },
};
const day = 86400000;
const levelNames = ["Nestling", "Anpacker:in", "Rudelprofi", "Zuhause-Held:in", "Cozy-Legende"];
const PROTOTYPE_GARDEN_MODE = true;
const GARDEN_PROTOTYPE_ROOM = "Wohnzimmer";
const choreCategoryArt: Record<string, { image: string; tone: string }> = {
  Putzen: { image: "/chore-putzen.png", tone: "sage" },
  Hausflur: { image: "/chore-putzen.png", tone: "sage" },
  Küche: { image: "/chore-kueche.png", tone: "peach" },
  Einkauf: { image: "/chore-kueche.png", tone: "peach" },
  Wäsche: { image: "/chore-waesche.png", tone: "rose" },
  Aufräumen: { image: "/chores/chore-aufraeumen.png", tone: "peach" },
  Müll: { image: "/chores/chore-muell.png", tone: "sage" },
};
const priorityLabel = (priority: number) => priority >= 3 ? "Wichtig" : priority === 2 ? "Normal" : "Optional";
const growthStage = (xp: number) => Math.min(12, 1 + [12,28,48,72,100,132,168,210,258,312,372].filter((threshold) => xp >= threshold).length);
const growthLabel = (stage: number) => ["Keimling", "Blattpaar", "Kleiner Spross", "Jungpflanze", "Neue Triebe", "Gut verwurzelt", "Wird buschig", "Kräftiges Grün", "Fast ausgewachsen", "Üppig", "Knospenzeit", "Prachtstück"][stage - 1] ?? "Prachtstück";
const growthSpriteStep = (stage: number) => Math.max(1, Math.min(5, Math.ceil(Math.min(12, stage) * 5 / 12)));
const gardenGrowthSrc = (plantKey: string, stage: number) => `/garden/stages/${plantKey}-${growthSpriteStep(stage)}.png`;

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
function getInitialPerson(): "Johannes" | "Sonja" {
  if (typeof window === "undefined") return "Johannes";
  const linkedPerson = new URLSearchParams(location.search).get("person");
  if (linkedPerson === "Sonja" || linkedPerson === "Johannes") {
    localStorage.setItem("cozyflat-person", linkedPerson);
    return linkedPerson;
  }
  const savedPerson = localStorage.getItem("cozyflat-person");
  if (savedPerson === "Sonja" || savedPerson === "Johannes") return savedPerson;
  return "Johannes";
}

export default function Home() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [person, setPerson] = useState<"Johannes" | "Sonja">(getInitialPerson);
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
  const [gardenMotes, setGardenMotes] = useState(0);
  async function refresh() {
    const [r, s, c, g] = await Promise.all([fetch("/api/plants"), fetch("/api/stats"), fetch("/api/chores"), fetch("/api/garden")]);
    if (r.ok) setPlants(await r.json());
    if (s.ok) setStats(await s.json());
    if (c.ok) setChores(await c.json());
    if (g.ok) {
      const gardenData = await g.json() as GardenData;
      setGarden(gardenData);
      setGardenRoom((current) =>
        PROTOTYPE_GARDEN_MODE
          ? GARDEN_PROTOTYPE_ROOM
          : (gardenData.rooms.some((room) => room.name === current && room.unlocked) ? current : gardenData.activeRoom),
      );
    }
    setLoading(false);
  }
  useEffect(() => {
    const splashTimer = window.setTimeout(() => setSplashVisible(false), 3000);
    if ("serviceWorker" in navigator) {
      const swScript = `/sw.js?v=2026-08-26c`;
      navigator.serviceWorker.register(swScript).then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage("SKIP_WAITING");
        }
        void registration.update().catch(() => undefined);
      }).catch(() => undefined);
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            if (!registration.active) return;
            if (!registration.active.scriptURL.includes("2026-08-26c")) {
              registration.unregister().catch(() => undefined);
            }
          });
        })
        .catch(() => undefined);
    }
    refresh();
    setShowReminderCard(localStorage.getItem("reminder-card-dismissed") !== "yes");
    return () => window.clearTimeout(splashTimer);
  }, []);
  useEffect(() => {
    const day = localDayKey(new Date()).split('-').map((part, index) => index ? part.padStart(2,'0') : part).join('-');
    fetch('/api/stats',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({person,day})}).then(async (response)=>{if(response.ok)setStats(await response.json())}).catch(()=>undefined);
  }, [person]);
  useEffect(() => {
    const storageKey = 'cozyflat-task-motes-v2';
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as {bank?:number};
      setGardenMotes(Math.max(0, Math.min(3, Number(saved.bank ?? 0))));
    } catch {
      setGardenMotes(0);
    }
  }, []);
  const awardGardenMote = useCallback(() => {
    const storageKey = 'cozyflat-task-motes-v2';
    setGardenMotes((current) => {
      const next = Math.min(3, current + 1);
      localStorage.setItem(storageKey, JSON.stringify({bank:next}));
      return next;
    });
  }, []);
  const collectGardenMote = useCallback(() => {
    const storageKey = 'cozyflat-task-motes-v2';
    setGardenMotes((current) => {
      const next = Math.max(0, current - 1);
      localStorage.setItem(storageKey, JSON.stringify({bank:next}));
      return next;
    });
    setToast('Lichtfunke gefangen. Flauschi ist beeindruckt. ✨');
    window.setTimeout(() => setToast(''), 2200);
    if ('vibrate' in navigator) navigator.vibrate(24);
  }, []);
  const petStaubi = useCallback(() => {
    setToast('Flauschi wackelt vor Freude. Das zählt als sehr wichtiger Gartenbesuch.');
    window.setTimeout(() => setToast(''), 2200);
    if ('vibrate' in navigator) navigator.vibrate([18,35,18]);
  }, []);
  const openGardenSeed = useCallback(() => {
    if (garden?.rewardReady && !garden.chosenToday) {
      document.getElementById('pflanzenwahl')?.scrollIntoView({behavior:'smooth',block:'center'});
      setToast('Euer Keim ist bereit – sucht euch eine neue Pflanze aus.');
    } else if (garden?.chosenToday) {
      setToast('Die heutige Pflanze ist schon eingezogen. Morgen wächst der nächste Keim.');
    } else {
      const remaining=Math.max(0,(garden?.dailyTaskGoal??3)-(garden?.todayTasks??0));
      setToast(`Noch ${remaining} ${remaining===1?'Aufgabe':'Aufgaben'}, dann dürft ihr eine neue Pflanze wählen.`);
    }
    window.setTimeout(() => setToast(''), 2600);
    if ('vibrate' in navigator) navigator.vibrate(18);
  }, [garden]);
  async function action(payload: object) {
    const r = await fetch("/api/plants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      setPlants(await r.json());
      return true;
    }
    return false;
  }
  async function water(plant: Plant) {
    setBusy(plant.id);
    setCelebration({ label: plant.name, person, points: 10, icon: "💧" });
    setTimeout(() => setCelebration(null), 2400);
    setToast(`${plant.name} bekommt Wasser …`);
    if ('vibrate' in navigator) navigator.vibrate(28);
    try {
      const watered = await action({ action: "water", id: plant.id, person });
      if (!watered) throw new Error('water-save-failed');
      awardGardenMote();
      const [s,g] = await Promise.all([fetch("/api/stats"),fetch("/api/garden")]);
      if (s.ok) setStats(await s.json());
      if (g.ok) setGarden(await g.json());
      setToast(`${plant.name} wurde von ${person} gegossen. Stark – der Pflanzendienst ist zufrieden.`);
    } catch {
      setCelebration(null);
      setToast(`${plant.name} konnte gerade nicht gespeichert werden. Bitte noch einmal tippen.`);
    } finally {
      setBusy(null);
      setTimeout(() => setToast(""), 2800);
    }
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
    const completionName=together?'Sonja & Johannes':person;
    setCelebration({ label: chore.name, person:completionName, points: chore.points + stats.nextTaskBonus, icon: chore.icon });
    setTimeout(() => setCelebration(null), 2400);
    setToast(`${chore.name} wird gespeichert …`);
    if ("vibrate" in navigator) navigator.vibrate([35,45,65]);
    try {
      const r = await fetch('/api/chores', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({id:chore.id,person,together}) });
      if (!r.ok) throw new Error('chore-save-failed');
      const result = await r.json() as {chores:Chore[];completion:{eventIds:number[];bonus:number;pointsEach:number;together:boolean}|null};
      setChores(result.chores);
      let awarded=chore.points; let bonus=0;
      if (result.completion) {
        awarded=result.completion.pointsEach;
        bonus=result.completion.bonus;
        setUndoInfo({chore,eventIds:result.completion.eventIds});
        setTimeout(() => setUndoInfo(null),5000);
        awardGardenMote();
      }
      setCelebration({ label: chore.name, person:completionName, points: awarded, icon: chore.icon });
      const [s,g] = await Promise.all([fetch('/api/stats'),fetch('/api/garden')]);
      if (s.ok) setStats(await s.json());
      if (g.ok) setGarden(await g.json());
      setToast(`${chore.name}: ${together?'gemeinsam ':''}erledigt. ${together?'Ihr bekommt beide':`${person} bekommt`} ${awarded} XP${bonus?` – inklusive ${bonus} Bonus-XP!`:'.'}`);
    } catch {
      setCelebration(null);
      setToast(`${chore.name} konnte gerade nicht gespeichert werden. Bitte noch einmal tippen.`);
    } finally {
      setChoreBusy(null);
      setTimeout(() => setToast(''),3200);
    }
  }
  async function undoChore() {
    if (!undoInfo) return;
    const r = await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'undo',id:undoInfo.chore.id,eventIds:undoInfo.eventIds})});
    if (r.ok) { const result = await r.json() as {chores:Chore[]}; setChores(result.chores); const s = await fetch('/api/stats'); if (s.ok) setStats(await s.json()); setCelebration(null); setToast(`${undoInfo.chore.name} ist wieder offen.`); }
    setUndoInfo(null); setTimeout(() => setToast(''),2200);
  }
  async function chooseGardenPlant(plantKey:string) {
    setGardenBusy(true);
    const targetRoom = PROTOTYPE_GARDEN_MODE ? GARDEN_PROTOTYPE_ROOM : gardenRoom;
    const response=await fetch('/api/garden',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({plantKey,person,room:targetRoom})});
    if(response.ok){
      const nextGarden=await response.json() as GardenData;
      setGarden(nextGarden);
      if (!PROTOTYPE_GARDEN_MODE) {
        const newest=nextGarden.collection.find((item)=>item.weekKey===`daily:${nextGarden.dayKey}`);
        if(newest) setGardenRoom(newest.room);
      }
      setToast(`${person} hat eure heutige Zimmerpflanze freigeschaltet. 🌱`);
      setTimeout(()=>setToast(''),2800);
    }
    setGardenBusy(false);
  }
  async function saveChoreForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const payload = {action:'save',id:editingChore?.id,name:data.get('name'),category:data.get('category'),icon:data.get('icon'),cadenceHours:Number(data.get('cadenceHours')),priority:Number(data.get('priority')),dueTime:data.get('dueTime'),scheduleMode:data.get('scheduleMode'),points:Number(data.get('points')),paused:data.get('paused') === 'on'};
    const r = await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}); if (r.ok) { const result = await r.json() as {chores:Chore[]}; setChores(result.chores); setChoreModal(false); setEditingChore(null); setToast(editingChore ? 'Aufgabe aktualisiert.' : 'Neue Aufgabe angelegt.'); setTimeout(()=>setToast(''),2200); }
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
  const activeGardenRoom = PROTOTYPE_GARDEN_MODE ? GARDEN_PROTOTYPE_ROOM : gardenRoom;
  const activeGardenItems = useMemo(() => garden?.collection.filter((item) => item.room === activeGardenRoom).slice(-8) ?? [], [garden, activeGardenRoom]);
  const gardenScenePlants = useMemo(() => activeGardenItems.map((item) => {
    const stage = growthStage(Math.max(0,(garden?.xp??0)-item.xpAtUnlock));
    return {id:item.weekKey,key:item.plantKey,name:item.plant.name,stage};
  }), [activeGardenItems, garden?.xp]);
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
        <div><span>✨ Flauschi macht CozyFlat gemütlich</span><i></i><i></i><i></i></div>
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
              aria-label={`${p} auswählen`}
              aria-pressed={person === p}
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
                      : "Eine Aufgabe wartet."
                    : todayCount > 0 && choreCountToday > 0
                      ? `${todayCount === 1 ? 'Eine Pflanze' : `${todayCount} Pflanzen`} und ${choreCountToday === 1 ? 'eine Aufgabe' : `${choreCountToday} Aufgaben`} für heute.`
                      : todayCount > 0
                        ? `${todayCount} Pflanzen möchten Wasser.`
                        : `${choreCountToday} Aufgaben für heute stehen an.`}
              </em>
            </h1>
            <div className="daily-bottom"><div className="staubi-greeting"><img src="/staubi.png" alt="Flauschi, euer Hausgeist" /><p><b>{openCount ? 'Flauschi hat schon mal geschnuppert:' : 'Flauschi rollt sich ein:'}</b> {openCount ? `${openCount} ${openCount === 1 ? 'gute Gelegenheit' : 'gute Gelegenheiten'} für XP. Welche schnappt ihr euch?` : "Nichts drängt. Das Nest ist heute offiziell freigegeben."}</p></div>{openCount > 0 && <a className="round-start" href="#aufgaben"><span>Erste Aufgabe</span><b>Auswählen <i>→</i></b></a>}</div>
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
              ? `${person}, womit möchtest du anfangen?`
              : "Alles erledigt – jetzt wird’s gemütlich"}
          </b>
        </div>
      </section>
      <div className={`mobile-progress ${progressOpen ? "is-open" : ""}`} id="fortschritt">
        <button className="progress-toggle" onClick={() => setProgressOpen((open) => !open)} aria-expanded={progressOpen}><span>★ Level & Wochenmission</span><b>{weeklyTeamPoints}/{weeklyGoal} XP</b></button>
        <section className="plant-room-game" aria-label="Euer gemeinsames Pflanzenzimmer">
          <div className="garden-game-head"><div><p className="eyebrow">EUER KLEINES PFLANZENSPIEL</p><h2>Aufräumen. Funkeln. Wachsen.</h2><p>Eine Aufgabe macht einen Lichtfunken. Drei Aufgaben wecken den nächsten Keim.</p></div><div className="garden-level-pill"><span>Raum-Level {gardenLevel}</span><b>{gardenProgress}/100 XP</b></div></div>
          {!PROTOTYPE_GARDEN_MODE && <nav className="garden-room-tabs" aria-label="Pflanzenräume">{garden?.rooms.map((room)=><button key={room.name} disabled={!room.unlocked} className={gardenRoom===room.name?'active':''} onClick={()=>room.unlocked&&setGardenRoom(room.name)}><span>{room.unlocked?room.name:'🔒 '+room.name}</span><small>{room.count}/{room.capacity}</small></button>)}</nav>}
          <div className="garden-scene-shell">
            <div className="garden-scene-title"><span><small>{activeGardenRoom.toUpperCase()}</small><b>{activeGardenItems.length ? `${activeGardenItems.length} ${activeGardenItems.length===1?'Pflanze wohnt':'Pflanzen wohnen'} hier` : 'Der erste Keim wartet auf euch'}</b></span><em>{gardenMotes ? `${gardenMotes} ${gardenMotes===1?'Funke wartet':'Funken warten'}` : 'Alles eingesammelt'}</em></div>
            <GardenScene room={activeGardenRoom} plants={gardenScenePlants} streak={stats.loginStreak} availableMotes={gardenMotes} taskProgress={garden?.todayTasks??0} taskGoal={garden?.dailyTaskGoal??3} rewardReady={Boolean(garden?.rewardReady&&!garden?.chosenToday)} onCollectMote={collectGardenMote} onPetFlauschi={petStaubi} onOpenSeed={openGardenSeed}/>
            <div className="garden-scene-tip"><span aria-hidden="true">{garden?.rewardReady&&!garden?.chosenToday?'🌱':gardenMotes?'✨':'☀️'}</span><p><b>{garden?.rewardReady&&!garden?.chosenToday?'Euer Keim ist bereit!':gardenMotes?'Da funkelt eure erledigte Aufgabe!':'Nächster Schritt: eine Aufgabe.'}</b>{garden?.rewardReady&&!garden?.chosenToday?'Tippt auf den Keim und wählt eine neue Pflanze.':gardenMotes?'Tippt den Lichtfunken an – Flauschi schaut genau zu.':'Danach erscheint hier sofort ein Lichtfunke und der Keim wächst.'}</p></div>
            <ul className="garden-scene-accessible">{gardenScenePlants.map((plant)=><li key={plant.id}>{plant.name}, Stufe {plant.stage} von 12: {growthLabel(plant.stage)}</li>)}</ul>
          </div>
          {garden?.collection.filter((item)=>item.room===activeGardenRoom).length ? <ul className="garden-collection" aria-label={`Pflanzen im ${activeGardenRoom}`}>{garden.collection.filter((item)=>item.room===activeGardenRoom).slice(-8).map((item)=>{const stage=growthStage(Math.max(0,garden.xp-item.xpAtUnlock));return <li key={item.weekKey}><span className="garden-collection-symbol" aria-hidden="true">{item.plant.emoji}</span><span><b>{item.plant.name}</b><small>Stufe {stage}/12 · {growthLabel(stage)}</small></span></li>})}</ul> : null}
          <div className="garden-track"><i style={{width:`${gardenProgress}%`}} /></div><div className="garden-meta"><b>Gemeinsam {gardenXp} XP gesammelt</b><span>Noch {100-gardenProgress} XP bis Raum-Level {gardenLevel+1}</span></div>
          {garden && !garden.chosenToday && garden.rewardReady && <div id="pflanzenwahl" className="daily-plant-reward is-ready"><span><small>HEUTIGER KEIM · {activeGardenRoom.toUpperCase()}</small><b>Welche Pflanze darf einziehen?</b></span><div>{garden.candidates.map((candidate)=><button disabled={gardenBusy} onClick={()=>chooseGardenPlant(candidate.key)} key={candidate.key}><img className="growth-sprite" src={gardenGrowthSrc(candidate.key,1)} alt=""/><b>{candidate.name}</b><small>Einziehen lassen</small></button>)}</div></div>}
          {garden?.chosenToday && <div className="next-plant"><span>✨</span><p><b>Heutige Pflanze freigeschaltet</b>Morgen könnt ihr mit drei Aufgaben den nächsten Platz begrünen.</p></div>}
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
        <div className="section-head cozy-screen-head chores-screen-head" style={{backgroundImage:'linear-gradient(90deg,rgba(247,244,231,.98) 0%,rgba(247,244,231,.9) 48%,rgba(18,48,35,.18) 100%), url(/chores/chore-aufraeumen.png)'}}><div><p className="eyebrow">EURE AUFGABEN</p><h2>Was möchtet ihr anpacken?</h2><p>Spontan oder geplant: Jede erledigte Aufgabe schenkt eurem Pflanzenzimmer einen Lichtfunken.</p></div><button className="add-hausi" onClick={()=>{setEditingChore(null);setChoreModal(true)}} aria-label="Aufgabe hinzufügen"><span aria-hidden="true">＋</span> Aufgabe</button></div>
        {todayChores.length > 0 && <section className="today-chores" aria-labelledby="today-chores-title">
          <div className="today-chores-head"><div><p className="eyebrow">HEUTE WICHTIG</p><h3 id="today-chores-title">Eure kleine Tagesauswahl</h3><small className="bonus-preview">{stats.todayTasks} von {garden?.dailyTaskGoal ?? 3} Aufgaben bis zum nächsten Keim · +{stats.nextTaskBonus} Bonus-XP</small></div><span>{todayChores.length} für heute</span></div>
          <div className="task-seed-progress" aria-label={`${Math.min(stats.todayTasks, garden?.dailyTaskGoal ?? 3)} von ${garden?.dailyTaskGoal ?? 3} Aufgaben für den heutigen Keim erledigt`}><i style={{width:`${Math.min(100, stats.todayTasks / (garden?.dailyTaskGoal ?? 3) * 100)}%`}} /></div>
          <div>{todayChores.slice(0,5).map((chore) => { const art = choreCategoryArt[chore.category] ?? { image: '/chores/chore-aufraeumen.png', tone: 'sage' }; return <article className="quick-chore" key={chore.id}><span className="quick-chore-art" style={{backgroundImage:`url(${art.image})`}} aria-hidden="true" /><div><b>{chore.name}</b><small>{chore.scheduleMode === 'flexible' ? 'Heute empfohlen' : choreTiming(chore,now)} · {priorityLabel(chore.priority)} · +{chore.points} XP</small></div><div className="completion-choices"><button onClick={() => finishChore(chore)} disabled={choreBusy === chore.id}><img src={avatarFor[person]} alt="" />{choreBusy === chore.id ? '…' : `Ich`}</button><button className="together-button" onClick={() => finishChore(chore,true)} disabled={choreBusy === chore.id}><span className="duo-avatars"><img src={avatarFor.Johannes} alt=""/><img src={avatarFor.Sonja} alt=""/></span>Gemeinsam</button></div></article>})}</div>{todayChores.length > 5 && <small className="today-more">Danach sind noch {todayChores.length - 5} fest eingeplant – eins nach dem anderen.</small>}
        </section>}
        <div className="chore-groups">{[...new Set(chores.map((chore) => chore.category))].map((category) => {
          const categoryChores = chores.filter((chore) => chore.category === category);
          const dueChores = categoryChores.filter((chore) => !chore.paused && chore.scheduleMode === 'scheduled' && choreNext(chore)! <= now);
          const laterChores = categoryChores.filter((chore) => !dueChores.includes(chore));
          const art = choreCategoryArt[category] ?? { image: '/chore-putzen.png', tone: 'sage' };
          const renderChore = (chore: Chore) => { const next = choreNext(chore); const isDue = Boolean(next && next <= now);
            return <article className={`chore-card ${isDue ? 'is-due' : ''} priority-${chore.priority} ${chore.paused ? 'is-paused' : ''}`} key={chore.id}><span className="chore-icon chore-art-thumb" style={{backgroundImage:`url(${art.image})`}} aria-hidden="true" /><div><b>{chore.name}</b><small>{choreTiming(chore,now)} · {chore.lastCompletedBy ? `zuletzt ${chore.lastCompletedBy}` : 'noch nie abgehakt'}</small></div><strong><span className={`priority-chip priority-${chore.priority}`}>{priorityLabel(chore.priority)}</span> +{chore.points} XP</strong><button className="edit-chore" onClick={()=>{setEditingChore(chore);setChoreModal(true)}} aria-label={`${chore.name} bearbeiten`}>✎</button><div className="completion-choices"><button className="finish-chore" onClick={() => finishChore(chore)} disabled={chore.paused || choreBusy === chore.id}>{chore.paused ? 'Pausiert' : choreBusy === chore.id ? '…' : <><img src={avatarFor[person]} alt="" />Ich</>}</button><button className="finish-chore together-button" onClick={() => finishChore(chore,true)} disabled={chore.paused || choreBusy === chore.id}><span className="duo-avatars"><img src={avatarFor.Johannes} alt=""/><img src={avatarFor.Sonja} alt=""/></span>Gemeinsam</button></div></article>;
          };
          return <details className={`chore-group tone-${art.tone}`} key={category}><summary className="chore-group-preview" style={{backgroundImage:`linear-gradient(90deg,rgba(18,48,35,.9) 0%,rgba(18,48,35,.58) 54%,rgba(18,48,35,.12) 100%), url(${art.image})`}}><span><small>{dueChores.length ? `${dueChores.length} jetzt wichtig` : 'Flexibel einplanbar'}</small><b>{category}</b></span><em>{categoryChores.length} {categoryChores.length === 1 ? 'Aufgabe' : 'Aufgaben'}</em><strong>⌄</strong></summary><div className="chore-group-content"><div>{[...dueChores,...laterChores].map(renderChore)}</div></div></details>;
        })}</div>
      </section>
      <section className={`plant-section plant-menu ${plantsOpen || mobileView === 'plants' ? 'is-open' : ''}`} id="pflanzen">
        <div className="section-head cozy-screen-head plants-screen-head" style={{backgroundImage:'linear-gradient(90deg,rgba(247,244,231,.98) 0%,rgba(247,244,231,.88) 50%,rgba(18,48,35,.16) 100%), url(/garden/rooms/garden-living-game-v2.png)'}}>
          <div>
            <p className="eyebrow">PFLANZENPLAN</p>
            <h2>Eure Pflanzen</h2><p>{todayCount ? `${todayCount} ${todayCount === 1 ? 'möchte' : 'möchten'} heute Wasser.` : `Alles versorgt – Zeit, das Pflanzenzimmer wachsen zu lassen.`}</p>
          </div>
          <div className="plant-menu-actions"><button className="plant-menu-toggle" onClick={()=>setPlantsOpen(open=>!open)} aria-expanded={plantsOpen}>{plantsOpen ? 'Menü schließen ↑' : 'Pflanzen öffnen ↓'}</button><button className="add-button" onClick={() => setModal(true)} aria-label="Pflanze hinzufügen"><span aria-hidden="true">＋</span> Pflanze</button></div>
        </div>
        {(plantsOpen || mobileView === 'plants') && (loading ? (
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
                const meta = roomMeta[room] ?? { icon: "☘", line: "Eure Pflanzen", className: "other", image: "/cozy-garden-room.png" };
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
                const roomPreview = roomPlants.find((plant) => plant.imageKey)?.imageKey;
                const roomPreviewImage = roomPreview ? `/api/images/${encodeURIComponent(roomPreview)}` : meta.image;
                return <details className={`room-zone ${meta.className}`} key={room}>
                  <summary className="room-header room-header-art" style={{backgroundImage:`linear-gradient(90deg,rgba(18,48,35,.88) 0%,rgba(18,48,35,.57) 56%,rgba(18,48,35,.14) 100%), url(${roomPreviewImage})`}}>
                    <span className="room-symbol" aria-hidden="true">{meta.icon}</span>
                    <div><p>{meta.line}</p><h3>{room}</h3></div>
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
        <div><p className="eyebrow">APPLE ERINNERUNGEN</p><h2>Gemeinsam nichts vergessen</h2><p>Ein Kurzbefehl trägt fällige Aufgaben und Pflanzen automatisch in eure Familienliste ein.</p></div>
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
            <p className="modal-intro">Der Kurzbefehl prüft täglich CozyFlat. Fällige Aufgaben und Pflanzen landen in der geteilten Liste „Familie“.</p>
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
      {choreModal && <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget){setChoreModal(false);setEditingChore(null)}}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="chore-modal-title"><button className="close" onClick={()=>{setChoreModal(false);setEditingChore(null)}} aria-label="Schließen">×</button><p className="eyebrow">{editingChore ? 'AUFGABE BEARBEITEN' : 'NEUE AUFGABE'}</p><h2 id="chore-modal-title">{editingChore ? editingChore.name : 'Aufgabe hinzufügen'}</h2><form onSubmit={saveChoreForm} className="chore-form"><label>Name<input name="name" required maxLength={60} defaultValue={editingChore?.name ?? ''} placeholder="z. B. Kühlschrank auswischen" /></label><label>Kategorie<input name="category" required maxLength={40} defaultValue={editingChore?.category ?? 'Sonstiges'} placeholder="z. B. Küche" /></label><div className="form-pair"><label>Symbol<input name="icon" maxLength={4} defaultValue={editingChore?.icon ?? '✨'} /></label><label>XP<input name="points" type="number" min="1" max="100" defaultValue={editingChore?.points ?? 10} /></label></div><label>Planung<select name="scheduleMode" defaultValue={editingChore?.scheduleMode ?? 'flexible'}><option value="flexible">Spontan – zählt nicht als fällig</option><option value="scheduled">Mit festem Rhythmus</option></select></label><div className="form-pair"><label>Wie oft?<select name="cadenceHours" defaultValue={editingChore?.cadenceHours ?? 24}><option value="6">Bis zu 4× täglich</option><option value="8">Bis zu 3× täglich</option><option value="12">Bis zu 2× täglich</option><option value="24">Täglich</option><option value="72">Alle 3 Tage</option><option value="168">Wöchentlich</option><option value="336">Alle 2 Wochen</option><option value="672">Alle 4 Wochen</option></select></label><label>Spätestens bis<input name="dueTime" type="time" defaultValue={editingChore?.dueTime ?? ''} /></label></div><label>Priorität<select name="priority" defaultValue={editingChore?.priority ?? 2}><option value="1">Niedrig · !</option><option value="2">Normal · !!</option><option value="3">Wichtig · !!!</option></select></label><p className="schedule-hint">Nur Aufgaben mit festem Rhythmus erscheinen als „heute geplant“. Spontane Aufgaben könnt ihr jederzeit für XP abhaken.</p><label className="pause-check"><input name="paused" type="checkbox" defaultChecked={editingChore?.paused ?? false} /> Aufgabe pausieren</label><button className="submit-button">{editingChore ? 'Änderungen speichern' : 'Aufgabe anlegen'}</button>{editingChore && <button type="button" className="danger-button" onClick={async()=>{if(confirm(`${editingChore.name} wirklich löschen?`)){const r=await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'delete',id:editingChore.id})});if(r.ok){const result=await r.json() as {chores:Chore[]};setChores(result.chores);setChoreModal(false);setEditingChore(null)}}}}>Aufgabe löschen</button>}</form></section></div>}
      {toast && (
        <div className="toast" role="status">
          ✓ {toast} {undoInfo && <button onClick={undoChore}>Rückgängig</button>}
        </div>
      )}
      {celebration && <div className="water-celebration" role="status" aria-live="polite">
        <div className="water-burst" aria-hidden="true"><img className="staubi-celebrate" src="/staubi.png" alt="" /><span>{celebration.icon}</span><i></i><i></i><i></i><i></i><i></i></div>
        <strong>Aufgabe geschafft!</strong><p>{celebration.person} hat „{celebration.label}“ erledigt. Das Zuhause atmet auf.</p><b>+{celebration.points} XP</b>
      </div>}
      <nav className="mobile-nav" aria-label="Hauptnavigation">
        <button className={mobileView==='today'?'active':''} aria-current={mobileView==='today'?'page':undefined} onClick={()=>{setMobileView('today');window.scrollTo({top:0,behavior:'smooth'})}}><span aria-hidden="true">⌂</span>Heute</button>
        <button className={mobileView==='chores'?'active':''} aria-current={mobileView==='chores'?'page':undefined} onClick={()=>{setMobileView('chores');window.scrollTo({top:0,behavior:'smooth'})}}><span aria-hidden="true">✓</span>Aufgaben</button>
        <button className={mobileView==='plants'?'active':''} aria-current={mobileView==='plants'?'page':undefined} onClick={()=>{setMobileView('plants');setPlantsOpen(true);window.scrollTo({top:0,behavior:'smooth'})}}><span aria-hidden="true">☘</span>Pflanzen</button>
        <button className={mobileView==='level'?'active':''} aria-current={mobileView==='level'?'page':undefined} onClick={()=>{setMobileView('level');setProgressOpen(true);window.scrollTo({top:0,behavior:'smooth'})}}><span aria-hidden="true">🌱</span>Garten</button>
      </nav>
    </main>
  );
}

