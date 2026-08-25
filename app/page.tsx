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
const icons = ["🌿", "🪴", "🌱", "☘️", "🌵", "🍃"];
const roomOrder = ["Balkon", "Wohnzimmer", "Küche", "Arbeitszimmer"];
const roomMeta: Record<string, { icon: string; line: string; className: string }> = {
  Balkon: { icon: "☀", line: "Sonne, Kräuter & Sommerluft", className: "balcony" },
  Wohnzimmer: { icon: "⌂", line: "Euer grünes Herzstück", className: "living" },
  Küche: { icon: "◇", line: "Frisches Grün zwischen Tassen & Tellern", className: "kitchen" },
  Arbeitszimmer: { icon: "✎", line: "Ruhige Begleiter beim Arbeiten", className: "office" },
};
const day = 86400000;

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
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [person, setPerson] = useState<"Johannes" | "Sonja">("Johannes");
  const [busy, setBusy] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [reminderGuide, setReminderGuide] = useState(false);
  const [showReminderCard, setShowReminderCard] = useState(false);
  async function refresh() {
    const r = await fetch("/api/plants");
    if (r.ok) setPlants(await r.json());
    setLoading(false);
  }
  useEffect(() => {
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
    setBusy(null);
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
  const todayCount = plants.filter((p) => dateInfo(p).diff <= 0).length;
  const soonCount = plants.filter((p) => {
    const d = dateInfo(p).diff;
    return d > 0 && d <= 3;
  }).length;
  const now = new Date();
  const dateLabel = now
    .toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();
  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brandmark">W</span>
          <span>Gießrunde</span>
        </a>
        <div className="person-switch" aria-label="Wer benutzt die App?">
          {(["Johannes", "Sonja"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPerson(p)}
              className={person === p ? "active" : ""}
            >
              {p}
            </button>
          ))}
        </div>
      </header>
      <section className="hero" id="top">
        <p className="eyebrow">{dateLabel}</p>
        <h1>
          Hallo {person}.
          <br />
          <em>
            {todayCount === 0
              ? "Alles ist versorgt."
              : todayCount === 1
                ? "Eine Pflanze hat Durst."
                : `${todayCount} Pflanzen haben Durst.`}
          </em>
        </h1>
        <p className="intro">
          Eure gemeinsame Gießrunde — damit jede Pflanze genau dann Wasser
          bekommt, wenn sie es braucht.
        </p>
      </section>
      <section className="summary" aria-label="Heutige Zusammenfassung">
        <div>
          <strong>{todayCount}</strong>
          <span>heute fällig</span>
        </div>
        <div>
          <strong>{soonCount}</strong>
          <span>demnächst</span>
        </div>
        <div className="streak">
          <span>↗</span>
          <b>
            {todayCount
              ? `${person}, die Gießkanne wartet schon ungeduldig`
              : "Alles im grünen Bereich"}
          </b>
        </div>
      </section>
      <section className="plant-section">
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
                const dueInRoom = roomPlants.filter((plant) => dateInfo(plant).diff <= 0).length;
                return <section className={`room-zone ${meta.className}`} key={room}>
                  <header className="room-header">
                    <span className="room-symbol" aria-hidden="true">{meta.icon}</span>
                    <div><p>{meta.line}</p><h3>{room}</h3></div>
                    <span className={`room-count ${dueInRoom ? "has-due" : ""}`}>{dueInRoom ? `${dueInRoom} fällig` : `${roomPlants.length} versorgt`}</span>
                  </header>
                  <div className="plant-grid">
                    {roomPlants.map((plant, i) => {
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
                    })}
                  </div>
                </section>;
              })}
          </div>
        )}
      </section>
      {showReminderCard && <section className="reminder-card bottom-reminder">
        <button className="dismiss-reminder" onClick={() => { localStorage.setItem("reminder-card-dismissed", "yes"); setShowReminderCard(false); }} aria-label="Apple-Einrichtung ausblenden">×</button>
        <div className="reminder-symbol" aria-hidden="true">✓</div>
        <div><p className="eyebrow">APPLE ERINNERUNGEN</p><h2>Gemeinsam nichts vergessen</h2><p>Ein Kurzbefehl trägt fällige Pflanzen automatisch in eure Familienliste ein.</p></div>
        <button onClick={() => setReminderGuide(true)}>Einrichten</button>
      </section>}
      <footer>
        <span>☘</span>
        <p>
          Gemeinsam gepflegt.
          <br />
          Mit Liebe gegossen.
        </p>
        <button className="footer-reminder-link" onClick={() => setReminderGuide(true)}>Erinnerungen einrichten</button>
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
            <p className="modal-intro">Der Kurzbefehl prüft täglich eure Gießrunde. Fällige Pflanzen landen in der geteilten Liste „Familie“.</p>
            <ol className="shortcut-steps">
              <li><b>Gemeinsame Liste prüfen</b><span>Öffnet „Erinnerungen“ und stellt sicher, dass eure geteilte Liste „Familie“ heißt.</span></li>
              <li><b>Kurzbefehl erstellen</b><span>Öffnet „Kurzbefehle“, tippt auf ＋ und fügt „Inhalt von URL abrufen“ ein.</span></li>
              <li><b>Adresse einsetzen</b><span>Kopiert die Adresse unten und setzt sie als URL ein. Wählt aus dem Ergebnis den Wert „reminders“.</span></li>
              <li><b>Erinnerungen hinzufügen</b><span>Wiederholt jeden Eintrag und nutzt „Neue Erinnerung“ mit „title“ für die Liste „Familie“. Vorher nach einer offenen Erinnerung mit demselben Titel suchen, damit nichts doppelt erscheint.</span></li>
              <li><b>Täglich ausführen</b><span>Unter „Automation“ → „Tageszeit“ den Kurzbefehl jeden Morgen automatisch starten.</span></li>
            </ol>
            <button className="copy-url" onClick={async () => { await navigator.clipboard.writeText(`${location.origin}/api/reminders`); setToast('Adresse für den Kurzbefehl kopiert.'); setTimeout(() => setToast(''), 2800); }}>Adresse kopieren</button>
            <code className="shortcut-url">{typeof window !== 'undefined' ? `${location.origin}/api/reminders` : '/api/reminders'}</code>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          ✓ {toast}
        </div>
      )}
    </main>
  );
}
