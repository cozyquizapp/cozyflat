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
type Stats = { streak: number; scores: Record<"Johannes" | "Sonja", PersonScore>; totalScores: Record<"Johannes" | "Sonja", PersonScore>; previousWeek: Record<"Johannes" | "Sonja", PersonScore> };
type Chore = { id:number; name:string; category:string; icon:string; intervalDays:number; points:number; lastCompletedAt:string|null; lastCompletedBy:string|null; paused:boolean };
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
  const [undoInfo, setUndoInfo] = useState<{chore:Chore;eventId:number}|null>(null);
  const [toast, setToast] = useState("");
  const [reminderGuide, setReminderGuide] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [reminderPerson, setReminderPerson] = useState<"Johannes" | "Sonja">("Johannes");
  const [showReminderCard, setShowReminderCard] = useState(false);
  const [allChoresOpen, setAllChoresOpen] = useState(false);
  const emptyScores = { Johannes: {points:0,waterings:0}, Sonja: {points:0,waterings:0} };
  const [stats, setStats] = useState<Stats>({ streak: 0, scores: emptyScores, totalScores: emptyScores, previousWeek: emptyScores });
  const [celebration, setCelebration] = useState<{ label: string; person: string; points: number; icon: string } | null>(null);
  async function refresh() {
    const [r, s, c] = await Promise.all([fetch("/api/plants"), fetch("/api/stats"), fetch("/api/chores")]);
    if (r.ok) setPlants(await r.json());
    if (s.ok) setStats(await s.json());
    if (c.ok) setChores(await c.json());
    setLoading(false);
  }
  useEffect(() => {
    const linkedPerson = new URLSearchParams(location.search).get("person");
    const savedPerson = localStorage.getItem("cozyflat-person");
    if (linkedPerson === "Sonja" || linkedPerson === "Johannes") {
      setPerson(linkedPerson);
      localStorage.setItem("cozyflat-person", linkedPerson);
    } else if (savedPerson === "Sonja" || savedPerson === "Johannes") setPerson(savedPerson);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    refresh();
    setShowReminderCard(localStorage.getItem("reminder-card-dismissed") !== "yes");
  }, []);
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
  async function finishChore(chore: Chore) {
    setChoreBusy(chore.id);
    const r = await fetch('/api/chores', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({id:chore.id,person}) });
    if (r.ok) { const result = await r.json() as {chores:Chore[];eventId:number|null}; setChores(result.chores); if (result.eventId) { setUndoInfo({chore,eventId:result.eventId}); setTimeout(() => setUndoInfo(null),5000); } }
    const s = await fetch('/api/stats'); if (s.ok) setStats(await s.json());
    setChoreBusy(null);
    setCelebration({ label: chore.name, person, points: chore.points, icon: chore.icon });
    setTimeout(() => setCelebration(null), 2400);
    setToast(`${chore.name}: erledigt. ${person} sammelt ${chore.points} XP fürs Rudel.`); setTimeout(() => setToast(''),2800);
    if ("vibrate" in navigator) navigator.vibrate(35);
  }
  async function undoChore() {
    if (!undoInfo) return;
    const r = await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'undo',id:undoInfo.chore.id,eventId:undoInfo.eventId})});
    if (r.ok) { const result = await r.json() as {chores:Chore[]}; setChores(result.chores); const s = await fetch('/api/stats'); if (s.ok) setStats(await s.json()); setCelebration(null); setToast(`${undoInfo.chore.name} ist wieder offen.`); }
    setUndoInfo(null); setTimeout(() => setToast(''),2200);
  }
  async function saveChoreForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const payload = {action:'save',id:editingChore?.id,name:data.get('name'),category:data.get('category'),icon:data.get('icon'),intervalDays:Number(data.get('intervalDays')),points:Number(data.get('points')),paused:data.get('paused') === 'on'};
    const r = await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}); if (r.ok) { const result = await r.json() as {chores:Chore[]}; setChores(result.chores); setChoreModal(false); setEditingChore(null); setToast(editingChore ? 'Hausi aktualisiert.' : 'Neues Hausi angelegt.'); setTimeout(()=>setToast(''),2200); }
  }
  const todayCount = plants.filter((p) => dateInfo(p).diff <= 0).length;
  const soonCount = plants.filter((p) => {
    const d = dateInfo(p).diff;
    return d > 0 && d <= 3;
  }).length;
  const now = new Date();
  const dueChoreCount = chores.filter((chore) => !chore.paused && (!chore.lastCompletedAt || new Date(new Date(chore.lastCompletedAt).getTime() + chore.intervalDays * day) <= now)).length;
  const dueChoresToday = chores.filter((chore) => !chore.paused && (!chore.lastCompletedAt || new Date(new Date(chore.lastCompletedAt).getTime() + chore.intervalDays * day) <= now));
  const openCount = todayCount + dueChoreCount;
  const weeklyTeamPoints = stats.scores.Johannes.points + stats.scores.Sonja.points;
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
    <main className={`shell person-${person.toLowerCase()}`}>
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
      <section className="hero" id="top">
        <div className="personal-greeting">
          <img className="greeting-avatar" src={avatarFor[person]} alt={`Porträt von ${person}`} />
          <div className="greeting-copy">
            <p className="eyebrow">{dateLabel}</p>
            <h1>
              Hallo {person}.
              <br />
              <em>
                {openCount === 0
                  ? "Alles ist versorgt."
                  : openCount === 1
                    ? todayCount === 1
                      ? "Eine Pflanze hat Durst."
                      : "Ein Hausi wartet."
                  : `${openCount} Hausis warten auf euch.`}
              </em>
            </h1>
            <p className="intro">
              Eure gemeinsamen Hausis und Pflanzen — mit kleinen
              Erfolgen, fairen Punkten und einem ziemlich zufriedenen Zuhause.
            </p>
            <div className="staubi-greeting"><img src="/staubi.png" alt="Staubi, euer Hausgeist" /><p><b>Staubi sagt:</b> {openCount ? `${openCount} kleine Hausi${openCount === 1 ? "" : "s"}, dann wird’s gemütlich.` : "Saubere Arbeit. Jetzt bitte gemütlich machen."}</p></div>
            {openCount > 0 && <a className="round-start" href="#aufgaben"><span>Los geht’s</span><b>Hausis starten →</b></a>}
          </div>
        </div>
      </section>
      <section className="summary" aria-label="Heutige Zusammenfassung">
        <div>
          <strong>{openCount}</strong>
          <span>heute offen</span>
        </div>
        <div>
          <strong>{soonCount}</strong>
          <span>demnächst</span>
        </div>
        <div className="streak">
          <span>↗</span>
          <b>
            {openCount
              ? `${person}, das Zuhause-Rudel zählt auf dich`
              : "Alles erledigt – Rudelmodus: gemütlich"}
          </b>
        </div>
      </section>
      <div className={`mobile-progress ${progressOpen ? "is-open" : ""}`} id="fortschritt">
        <button className="progress-toggle" onClick={() => setProgressOpen((open) => !open)} aria-expanded={progressOpen}><span>★ Level & Wochenmission</span><b>{weeklyTeamPoints}/{weeklyGoal} XP</b></button>
        <section className="level-hub" aria-label="Eure Level und Wochenfortschritt">
        <div className="team-quest">
          <div className="quest-heading"><span>🔥</span><div><p className="eyebrow">WOCHENMISSION</p><strong>{stats.streak} {stats.streak === 1 ? "Tag" : "Tage"} gemeinsam dran</strong></div><b>{weeklyTeamPoints}/{weeklyGoal} XP</b></div>
          <div className="quest-track" aria-label={`${weeklyProgress} Prozent der Wochenmission geschafft`}><i style={{width:`${weeklyProgress}%`}} /></div>
          <small>{weeklyProgress >= 100 ? "Mission geschafft. Das Rudel darf sich feiern!" : `Noch ${weeklyGoal - weeklyTeamPoints} XP bis zum Wochenziel.`}</small>
        </div>
        <div className="level-people">
          {(["Johannes", "Sonja"] as const).map((name) => { const level = levelFor(stats.totalScores[name].points); return <article className={person === name ? "is-active" : ""} key={name}>
            <img src={avatarFor[name]} alt="" /><div><span><b>{name}</b><em>Level {level.level}</em></span><strong>{level.title}</strong><div className="level-track"><i style={{width:`${level.progress}%`}} /></div><small>{level.current}/{level.next} XP bis Level {level.level + 1} · {stats.scores[name].points} XP diese Woche</small></div>
          </article>})}
        </div>
        </section>
      </div>
      {showWeeklyRecap && <section className="weekly-recap">
        <p className="eyebrow">SONNTAGS-RÜCKBLICK</p><h2>Das Rudel war fleißig.</h2>
        <div>{(["Johannes", "Sonja"] as const).map((name) => <article key={name}><img src={avatarFor[name]} alt="" /><span><b>{name}</b><small>{stats.scores[name].waterings} Aufgaben erledigt</small></span><strong>{stats.scores[name].points} Punkte</strong></article>)}</div>
        <p>Um Mitternacht startet eine neue Wochenmission. Eure gesammelten XP bleiben in euren Leveln erhalten.</p>
      </section>}
      <section className="chores-section" id="aufgaben">
        <div className="section-head"><div><p className="eyebrow">EURE HAUSIS</p><h2>Was sonst noch ansteht</h2><p>Alles darf auch spontan erledigt werden – Besuch wartet schließlich nicht auf den Rhythmus.</p></div><button className="add-hausi" onClick={()=>{setEditingChore(null);setChoreModal(true)}}><span>＋</span> Hausi</button></div>
        {dueChoresToday.length > 0 && <section className="today-chores" aria-labelledby="today-chores-title"><div className="today-chores-head"><div><p className="eyebrow">HEUTE WICHTIG</p><h3 id="today-chores-title">Erst mal diese {Math.min(5,dueChoresToday.length)}</h3></div><span>{dueChoresToday.length} offen</span></div><div>{dueChoresToday.slice(0,5).map((chore) => <article className="quick-chore" key={chore.id}><span className="chore-icon">{chore.icon}</span><div><b>{chore.name}</b><small>{chore.category} · +{chore.points} XP</small></div><button onClick={() => finishChore(chore)} disabled={choreBusy === chore.id}><img src={avatarFor[person]} alt="" />{choreBusy === chore.id ? '…' : `Erledigt als ${person}`}</button></article>)}</div>{dueChoresToday.length > 5 && <small className="today-more">Danach warten noch {dueChoresToday.length - 5} – eins nach dem anderen.</small>}</section>}
        <button className="all-chores-toggle" onClick={()=>setAllChoresOpen(open=>!open)} aria-expanded={allChoresOpen}><span>Alle Hausis nach Kategorie</span><b>{allChoresOpen ? 'einklappen ↑' : 'anzeigen ↓'}</b></button>
        {allChoresOpen && <div className="chore-groups">{[...new Set(chores.map((chore) => chore.category))].map((category) => {
          const categoryChores = chores.filter((chore) => chore.category === category);
          const dueChores = categoryChores.filter((chore) => !chore.paused && (!chore.lastCompletedAt || new Date(new Date(chore.lastCompletedAt).getTime() + chore.intervalDays * day) <= now));
          const laterChores = categoryChores.filter((chore) => !dueChores.includes(chore));
          const renderChore = (chore: Chore) => { const next = chore.lastCompletedAt ? new Date(new Date(chore.lastCompletedAt).getTime() + chore.intervalDays * day) : new Date(0); const isDue = !chore.lastCompletedAt || next <= now;
            return <article className={`chore-card ${isDue ? 'is-due' : ''} ${chore.paused ? 'is-paused' : ''}`} key={chore.id}><span className="chore-icon">{chore.icon}</span><div><b>{chore.name}</b><small>{chore.paused ? 'Pausiert' : isDue ? 'Jetzt fällig' : `wieder ${next.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}`} · {chore.lastCompletedBy ? `zuletzt ${chore.lastCompletedBy}` : 'noch offen'}</small></div><strong>+{chore.points}</strong><button className="edit-chore" onClick={()=>{setEditingChore(chore);setChoreModal(true)}} aria-label={`${chore.name} bearbeiten`}>✎</button><button className="finish-chore" onClick={() => finishChore(chore)} disabled={chore.paused || choreBusy === chore.id}>{chore.paused ? 'Pausiert' : choreBusy === chore.id ? '…' : <><img src={avatarFor[person]} alt="" />Erledigt</>}</button></article>;
          };
          return <section className="chore-group" key={category}><h3>{category}</h3><div>{dueChores.map(renderChore)}</div>{laterChores.length > 0 && <details className="later-chores"><summary>{laterChores.length} später fällig <span>anzeigen ↓</span></summary><div>{laterChores.map(renderChore)}</div></details>}</section>;
        })}</div>}
      </section>
      <section className="plant-section" id="pflanzen">
        <div className="section-head">
          <div>
            <p className="eyebrow">EURE PFLANZEN</p>
            <h2>Was heute ansteht</h2>
          </div>
          <button className="add-button" onClick={() => setModal(true)}>
            <span>＋</span> Pflanze
          </button>
        </div>
        {loading ? (
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
                return <section className={`room-zone ${meta.className}`} key={room}>
                  <header className="room-header">
                    <span className="room-symbol" aria-hidden="true">{meta.icon}</span>
                    <div><p>{meta.line}</p><h3>{room}</h3></div>
                    <span className={`room-count ${dueInRoom ? "has-due" : ""}`}>{dueInRoom ? `${dueInRoom} fällig` : `${roomPlants.length} versorgt`}</span>
                  </header>
                  {duePlants.length > 0 && <div className="plant-grid">{duePlants.map(renderCard)}</div>}
                  {duePlants.length === 0 && <div className="room-all-done"><span>✓</span><div><b>Hier ist alles versorgt</b><small>Bis zur nächsten Pflanzenrunde könnt ihr euch zurücklehnen.</small></div></div>}
                  {caredPlants.length > 0 && <details className="cared-plants">
                    <summary><span><b>{caredPlants.length} versorgt</b><small>{caredPlants.map((plant) => plant.name).join(" · ")}</small></span><i>anzeigen</i></summary>
                    <div className="plant-grid">{caredPlants.map(renderCard)}</div>
                  </details>}
                </section>;
              })}
          </div>
        )}
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
      {choreModal && <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget){setChoreModal(false);setEditingChore(null)}}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="chore-modal-title"><button className="close" onClick={()=>{setChoreModal(false);setEditingChore(null)}} aria-label="Schließen">×</button><p className="eyebrow">{editingChore ? 'HAUSI BEARBEITEN' : 'NEUES HAUSI'}</p><h2 id="chore-modal-title">{editingChore ? editingChore.name : 'Hausi hinzufügen'}</h2><form onSubmit={saveChoreForm} className="chore-form"><label>Name<input name="name" required maxLength={60} defaultValue={editingChore?.name ?? ''} placeholder="z. B. Kühlschrank auswischen" /></label><label>Kategorie<input name="category" required maxLength={40} defaultValue={editingChore?.category ?? 'Sonstiges'} placeholder="z. B. Küche" /></label><div className="form-pair"><label>Symbol<input name="icon" maxLength={4} defaultValue={editingChore?.icon ?? '✨'} /></label><label>XP<input name="points" type="number" min="1" max="100" defaultValue={editingChore?.points ?? 10} /></label></div><label>Wie oft?<select name="intervalDays" defaultValue={editingChore?.intervalDays ?? 7}><option value="1">Täglich</option><option value="3">Alle 3 Tage</option><option value="7">Wöchentlich</option><option value="14">Alle 2 Wochen</option><option value="28">Alle 4 Wochen</option><option value="30">Monatlich</option><option value="90">Alle 3 Monate</option></select></label><label className="pause-check"><input name="paused" type="checkbox" defaultChecked={editingChore?.paused ?? false} /> Hausi pausieren</label><button className="submit-button">{editingChore ? 'Änderungen speichern' : 'Hausi anlegen'}</button>{editingChore && <button type="button" className="danger-button" onClick={async()=>{if(confirm(`${editingChore.name} wirklich löschen?`)){const r=await fetch('/api/chores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'delete',id:editingChore.id})});if(r.ok){const result=await r.json() as {chores:Chore[]};setChores(result.chores);setChoreModal(false);setEditingChore(null)}}}}>Hausi löschen</button>}</form></section></div>}
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
        <a href="#top"><span>⌂</span>Heute</a>
        <a href="#aufgaben"><span>✓</span>Aufgaben</a>
        <a href="#pflanzen"><span>☘</span>Pflanzen</a>
        <a href="#fortschritt" onClick={() => setProgressOpen(true)}><span>★</span>Level</a>
      </nav>
    </main>
  );
}
