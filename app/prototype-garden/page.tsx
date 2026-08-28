"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import "./prototype-garden.css";

export type PlantKey = "orchid" | "bonsai" | "monstera" | "pilea" | "hoya" | "alocasia" | "fern" | "ficus";

export type PlantTuning = {
  foliageX: number;
  foliageY: number;
  foliageScale: number;
  potX: number;
  potY: number;
  potScale: number;
  rimReveal: number;
  foliageLayer: 1 | 2 | 3;
};

export const DEFAULT_PLANT_TUNING: Record<string, PlantTuning> = {
  "orchid-1": { foliageX: 0, foliageY: -3, foliageScale: 0.7, potX: 0, potY: 2, potScale: 1, rimReveal: 32, foliageLayer: 3 },
  "orchid-2": { foliageX: 0, foliageY: -7, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "orchid-3": { foliageX: 2, foliageY: -8, foliageScale: 0.85, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "orchid-4": { foliageX: 15, foliageY: -4, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "orchid-5": { foliageX: 24, foliageY: -5, foliageScale: 0.96, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "bonsai-1": { foliageX: 0, foliageY: 7, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 30, foliageLayer: 3 },
  "bonsai-2": { foliageX: 0, foliageY: 10, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 30, foliageLayer: 3 },
  "bonsai-3": { foliageX: 0, foliageY: 10, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 30, foliageLayer: 3 },
  "bonsai-4": { foliageX: 0, foliageY: 9, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 30, foliageLayer: 3 },
  "bonsai-5": { foliageX: 0, foliageY: 9, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 30, foliageLayer: 3 },
  "monstera-1": { foliageX: 0, foliageY: -12, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "monstera-2": { foliageX: 6, foliageY: -13, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "monstera-3": { foliageX: 8, foliageY: -13, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "monstera-4": { foliageX: 8, foliageY: -14, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "monstera-5": { foliageX: 0, foliageY: -12, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "pilea-1": { foliageX: 0, foliageY: 0, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "pilea-2": { foliageX: 0, foliageY: 0, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "pilea-3": { foliageX: 0, foliageY: 30, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "pilea-4": { foliageX: 0, foliageY: 30, foliageScale: 0.92, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "pilea-5": { foliageX: 0, foliageY: 30, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "hoya-1": { foliageX: 5, foliageY: -26, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 48, foliageLayer: 3 },
  "hoya-2": { foliageX: 8, foliageY: -30, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 48, foliageLayer: 3 },
  "hoya-3": { foliageX: 7, foliageY: -30, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 48, foliageLayer: 3 },
  "hoya-4": { foliageX: 10, foliageY: -30, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 48, foliageLayer: 3 },
  "hoya-5": { foliageX: 10, foliageY: -30, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 48, foliageLayer: 3 },
  "alocasia-1": { foliageX: 0, foliageY: -18, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "alocasia-2": { foliageX: 0, foliageY: -17, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "alocasia-3": { foliageX: 0, foliageY: -19, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "alocasia-4": { foliageX: 0, foliageY: -11, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "alocasia-5": { foliageX: 0, foliageY: -12, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "fern-1": { foliageX: 0, foliageY: 0, foliageScale: 0.65, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "fern-2": { foliageX: 0, foliageY: 0, foliageScale: 0.65, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "fern-3": { foliageX: 0, foliageY: 30, foliageScale: 0.68, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "fern-4": { foliageX: 0, foliageY: 30, foliageScale: 0.65, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "fern-5": { foliageX: 0, foliageY: 30, foliageScale: 0.77, potX: 0, potY: 0, potScale: 1, rimReveal: 37, foliageLayer: 3 },
  "ficus-1": { foliageX: 3, foliageY: -18, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "ficus-2": { foliageX: 4, foliageY: -16, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "ficus-3": { foliageX: 5, foliageY: -17, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "ficus-4": { foliageX: 6, foliageY: -17, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
  "ficus-5": { foliageX: 4, foliageY: -15, foliageScale: 1, potX: 0, potY: 0, potScale: 1, rimReveal: 29, foliageLayer: 3 },
};

export const PLANT_TUNING_STORAGE_KEY = "cozyflat-prototype-plant-tuning-v4";
const POSITIONER_CONTENT_SIZE = 228;

type Candidate = {
  key: PlantKey;
  name: string;
  line: string;
};

type ShelfPlant = Candidate & {
  slot: number;
  stage: number;
};

const CANDIDATES: Candidate[] = [
  { key: "monstera", name: "Monstera", line: "Große Blätter, viel Charakter" },
  { key: "pilea", name: "Pilea", line: "Rundes Grün für gute Laune" },
  { key: "hoya", name: "Hoya", line: "Rankt frei durch euer Regal" },
  { key: "alocasia", name: "Alocasia", line: "Dunkles Blattwerk mit starken Adern" },
  { key: "fern", name: "Farn", line: "Weich, wild und schön buschig" },
  { key: "ficus", name: "Ficus", line: "Tiefgrüne Blätter mit warmem Rot" },
];

const STARTER_PLANTS: ShelfPlant[] = [
  { key: "orchid", name: "Orchidee", line: "Blüht mit guter Pflege", slot: 1, stage: 3 },
  { key: "bonsai", name: "Bonsai", line: "Wächst langsam und beständig", slot: 2, stage: 3 },
];

const FULL_SHELF: ShelfPlant[] = [
  { ...STARTER_PLANTS[0], stage: 5 },
  { ...STARTER_PLANTS[1], stage: 4 },
  { ...CANDIDATES[0], slot: 3, stage: 3 },
  { ...CANDIDATES[1], slot: 4, stage: 3 },
  { ...CANDIDATES[2], slot: 5, stage: 2 },
  { ...CANDIDATES[3], slot: 6, stage: 4 },
  { ...CANDIDATES[4], slot: 7, stage: 3 },
  { ...CANDIDATES[5], slot: 8, stage: 3 },
];

const TASKS = [
  "Spülmaschine ausräumen",
  "Wäsche verräumen",
  "Küche kurz aufräumen",
  "Wohnzimmer saugen",
  "Papiermüll rausbringen",
];

export const plantSrc = (key: string, stage: number) => {
  if (key === "hoya") return "/prototype-garden-v2/hoya-trailing-v1.png";
  const resolvedStage = Math.max(1, Math.min(5, stage));
  if (key === "orchid" || key === "monstera") return `/prototype-garden-v2/foliage-v2/${key}-${resolvedStage}.png`;
  const stageRepairs: Record<string, Record<number, number>> = {
    pilea: { 2: 1 },
    alocasia: { 2: 1 },
    fern: { 2: 1, 4: 5 },
    ficus: { 1: 3, 2: 3, 5: 4 },
  };
  const repairedStage = stageRepairs[key]?.[resolvedStage] ?? resolvedStage;
  return `/garden/stages-trimmed/${key}-${repairedStage}.png`;
};

export function PottedPlant({ plantKey, stage, alt, compact = false, tuning }: { plantKey: string; stage: number; alt: string; compact?: boolean; tuning?: PlantTuning }) {
  const resolvedStage = Math.max(1, Math.min(5, stage));
  const [storedTuning, setStoredTuning] = useState<PlantTuning | undefined>();
  useEffect(() => {
    if (tuning) return;
    const timer=window.setTimeout(()=>{
      try {
        const stored = window.localStorage.getItem(PLANT_TUNING_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) as Record<string, PlantTuning> : {};
        setStoredTuning(parsed[`${plantKey}-${resolvedStage}`]);
      } catch {
        setStoredTuning(undefined);
      }
    },0);
    return ()=>window.clearTimeout(timer);
  }, [plantKey, resolvedStage, tuning]);
  const activeTuning = tuning ?? storedTuning ?? DEFAULT_PLANT_TUNING[`${plantKey}-${resolvedStage}`];
  const potSrc = plantKey === "bonsai"
    ? "/prototype-garden-v2/pot-bonsai-v1.png"
    : plantKey === "pilea" || plantKey === "fern" || plantKey === "hoya"
      ? "/prototype-garden-v2/pot-ivory-scallop-v1.png"
      : plantKey === "alocasia" || plantKey === "ficus"
        ? "/prototype-garden-v2/pot-forest-cylinder-v1.png"
        : "/prototype-garden-v2/pot-terracotta-v1.png";
  const tuningStyle = activeTuning ? {
    // Inside its border the editor provides an exact 228 × 228 coordinate
    // space. Container-query units preserve those proportions in every niche.
    "--foliage-x": `${activeTuning.foliageX * 100 / POSITIONER_CONTENT_SIZE}cqw`,
    "--foliage-y": `${activeTuning.foliageY * 100 / POSITIONER_CONTENT_SIZE}cqh`,
    "--foliage-tune-scale": activeTuning.foliageScale,
    "--pot-x": `${activeTuning.potX * 100 / POSITIONER_CONTENT_SIZE}cqw`,
    "--pot-y": `${activeTuning.potY * 100 / POSITIONER_CONTENT_SIZE}cqh`,
    "--pot-tune-scale": activeTuning.potScale,
    "--rim-clip-bottom": `${100 - activeTuning.rimReveal}%`,
    "--foliage-z": activeTuning.foliageLayer === 1 ? 0 : activeTuning.foliageLayer === 3 ? 5 : 2,
  } as CSSProperties : undefined;
  return <span style={tuningStyle} className={`prototype-potted-plant plant-${plantKey} stage-${resolvedStage} ${compact ? "is-compact" : ""}`}>
    <img className="prototype-plant-foliage" src={plantSrc(plantKey, stage)} alt={alt} />
    <img className="prototype-plant-pot prototype-plant-pot-base" src={potSrc} alt="" />
    <img className="prototype-plant-pot prototype-plant-pot-rim" src={potSrc} alt="" />
  </span>;
}

function playChime(kind: "task" | "collect" | "unlock" | "pet") {
  const BrowserAudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!BrowserAudioContext) return;
  const context = new BrowserAudioContext();
  const now = context.currentTime;
  const frequencies = kind === "unlock" ? [523, 659, 784] : kind === "collect" ? [659, 880] : kind === "pet" ? [440, 554] : [392, 523];
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  gain.connect(context.destination);
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(now + index * 0.055);
    oscillator.stop(now + 0.45);
  });
  window.setTimeout(() => void context.close(), 650);
}

export default function GardenPrototype() {
  const [taskCount, setTaskCount] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [wateredCount, setWateredCount] = useState(0);
  const [sunReady, setSunReady] = useState(false);
  const [watering, setWatering] = useState(false);
  const [wateringSlot, setWateringSlot] = useState<number | null>(null);
  const [plants, setPlants] = useState<ShelfPlant[]>(STARTER_PLANTS);
  const [pendingPlant, setPendingPlant] = useState<Candidate | null>(null);
  const [newPlantBoost, setNewPlantBoost] = useState(0);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [flauschiState, setFlauschiState] = useState<"idle" | "watching" | "cheering">("idle");
  const [flauschiAssistSlot, setFlauschiAssistSlot] = useState<number | null>(null);
  const [flauschiDrops, setFlauschiDrops] = useState(0);
  const [plantReaction, setPlantReaction] = useState<string | null>(null);
  const [message, setMessage] = useState("Nach dem Gießen erscheint Flauschi kurz: Antippen sammelt einen Bonus-Tropfen.");

  const dailyProgress = Math.min(taskCount, 3);
  const plantCount = plants.length;
  const rewardReady = taskCount >= 3 && wateredCount >= 3 && plantCount < 8 && !pendingPlant;
  const bonusMultiplier = 1 + Math.min(5, flauschiDrops) * 0.1;
  const nextTask = TASKS[completedTasks % TASKS.length];
  const seedSlot = [1, 2, 3, 4, 5, 6, 7, 8].find((slot) => !plants.some((plant) => plant.slot === slot));
  const seedStage = Math.min(4, 1 + wateredCount);
  const availableCandidates = useMemo(() => CANDIDATES.filter((candidate) => !plants.some((plant) => plant.key === candidate.key)), [plants]);

  const progressLabel = useMemo(() => {
    if (plantCount === 8) return "Regal komplett · jede Pflanze kann weiterwachsen";
    if (pendingPlant) return `Wählt einen Platz für ${pendingPlant.name}`;
    if (rewardReady) return "Der heutige Keim ist bereit";
    return `${plantCount} von 8 Pflanzen · ${dailyProgress}/3 bis zum nächsten Keim`;
  }, [dailyProgress, pendingPlant, plantCount, rewardReady]);

  function celebrateFlauschi(copy: string) {
    setFlauschiState("cheering");
    setMessage(copy);
    window.setTimeout(() => setFlauschiState("idle"), 950);
  }

  function completeTask() {
    if (sunReady || watering || pendingPlant) return;
    if (rewardReady) {
      setChoiceOpen(true);
      return;
    }
    setTaskCount((current) => Math.min(3, current + 1));
    setCompletedTasks((current) => current + 1);
    setSunReady(true);
    setFlauschiState("watching");
    setMessage("Aufgabe geschafft: Die Sonne scheint ins Regal. Jetzt dürft ihr gießen!");
    playChime("task");
    navigator.vibrate?.(10);
  }

  async function waterPlant(slot: number, id: string, name: string) {
    if (watering || pendingPlant) return;
    const hasGrowthEnergy = sunReady;
    setWatering(true);
    setWateringSlot(slot);
    setPlantReaction(id);
    setMessage(hasGrowthEnergy ? `${name} wächst. Gleich erscheint Flauschi kurz für einen Bonus-Tropfen.` : `${name} bekommt eine kleine Pflegerunde. Ganz ohne Punkte-Stress.`);
    playChime("collect");
    navigator.vibrate?.([8, 24, 12]);
    await new Promise((resolve) => window.setTimeout(resolve, 1100));
    setWatering(false);
    setWateringSlot(null);
    window.setTimeout(() => setPlantReaction(null), 460);

    if (!hasGrowthEnergy) {
      celebrateFlauschi(`${name} glänzt frisch gegossen. Für sichtbares Wachstum braucht es die nächste Aufgabe.`);
      return;
    }

    const nextWatered = wateredCount + 1;
    const unlockReady = taskCount >= 3 && nextWatered >= 3 && plantCount < 8;
    setWateredCount(nextWatered);
    setSunReady(false);
    setPlants((current) => current.map((plant) => plant.slot === slot ? { ...plant, stage: Math.min(5, plant.stage + 1) } : plant));
    if (!unlockReady) {
      setFlauschiAssistSlot(slot);
      window.setTimeout(() => setFlauschiAssistSlot((current) => current === slot ? null : current), 3000);
    }

    if (unlockReady) {
      setFlauschiAssistSlot(null);
      celebrateFlauschi("Dreimal gegossen! Eure neue Pflanze ist bereit.");
      playChime("unlock");
      setChoiceOpen(true);
    } else if (plantCount === 8) {
      celebrateFlauschi(`${name} ist sichtbar gewachsen. Tippt Flauschi schnell für den Glitzertropfen!`);
    } else {
      const remaining = Math.max(0, 3 - nextWatered);
      celebrateFlauschi(remaining === 1 ? "Nur noch einmal Sonne und Wasser. Jetzt schnell Flauschi antippen!" : `Noch ${remaining} Aufgaben bis zur neuen Pflanze – Flauschi jagt gerade einen Glitzertropfen!`);
    }
  }

  function choosePlant(candidate: Candidate) {
    setPendingPlant(candidate);
    setChoiceOpen(false);
    setFlauschiState("watching");
    setMessage(`${candidate.name} ist gewählt. Tippt jetzt einmal auf ihre freie Nische.`);
  }

  function placePlant(slot: number) {
    if (!pendingPlant || slot < 1 || slot > 8 || plants.some((plant) => plant.slot === slot)) return;
    setPlants((current) => [...current, { ...pendingPlant, slot, stage: Math.min(2, 1 + newPlantBoost) }]);
    setPendingPlant(null);
    setTaskCount(0);
    setWateredCount(0);
    setNewPlantBoost(0);
    celebrateFlauschi(`${pendingPlant.name} wohnt jetzt auf Platz ${slot}. Die Auswahl bleibt geschlossen.`);
    playChime("unlock");
    navigator.vibrate?.([12, 35, 18]);
  }

  function touchPlant(slot: number, id: string, name: string) {
    if (rewardReady && id === "seed") {
      setChoiceOpen(true);
      return;
    }
    void waterPlant(slot, id, name);
  }

  function petFlauschi() {
    celebrateFlauschi("Flauschi schnurrt. Vermutlich. Bei so viel Flausch ist das schwer zu hören.");
    playChime("pet");
    navigator.vibrate?.(8);
  }

  function catchFlauschiDrop() {
    if (flauschiAssistSlot === null) return;
    const targetSlot = flauschiAssistSlot;
    const nextDrops = flauschiDrops + 1;
    setFlauschiAssistSlot(null);
    setFlauschiDrops(nextDrops);
    if (nextDrops % 3 === 0) {
      const targetExists = plants.some((plant) => plant.slot === targetSlot);
      if (targetExists) {
        setPlants((current) => current.map((plant) => plant.slot === targetSlot ? { ...plant, stage: Math.min(5, plant.stage + 1) } : plant));
      } else {
        setNewPlantBoost(1);
      }
      celebrateFlauschi("Drei Glitzertropfen! Flauschi schenkt euch eine Bonus-Wachstumsstufe.");
      playChime("unlock");
    } else {
      celebrateFlauschi(`Glitzertropfen gefangen: ${nextDrops % 3}/3 bis zum Flauschbonus.`);
      playChime("pet");
    }
    navigator.vibrate?.([8, 18, 8]);
  }

  function showFullShelf() {
    setPlants(FULL_SHELF.map((plant) => ({ ...plant })));
    setTaskCount(0);
    setCompletedTasks(0);
    setWateredCount(0);
    setSunReady(false);
    setPendingPlant(null);
    setChoiceOpen(false);
    setFlauschiAssistSlot(null);
    setPlantReaction(null);
    setMessage("Acht Pflanzen, acht Wachstumsstände. Jetzt könnt ihr jede weiterpflegen.");
  }

  function resetPrototype() {
    setTaskCount(0);
    setCompletedTasks(0);
    setWateredCount(0);
    setSunReady(false);
    setWatering(false);
    setWateringSlot(null);
    setPlants(STARTER_PLANTS.map((plant) => ({ ...plant })));
    setPendingPlant(null);
    setNewPlantBoost(0);
    setChoiceOpen(false);
    setFlauschiState("idle");
    setFlauschiAssistSlot(null);
    setFlauschiDrops(0);
    setPlantReaction(null);
    setMessage("Nach dem Gießen erscheint Flauschi kurz: Antippen sammelt einen Bonus-Tropfen.");
  }

  return (
    <main className="garden-prototype-page">
      <div className="garden-prototype-phone">
        <header className="prototype-header">
          <div className="prototype-kicker">
            <span>GEMEINSAMES WOHNZIMMER</span>
            <div className="prototype-kicker-actions">
              <a href="/prototype-garden/positioner">Ausrichten</a>
              <button type="button" onClick={plantCount === 8 ? resetPrototype : showFullShelf}>{plantCount === 8 ? "Neu starten" : "8/8 zeigen"}</button>
            </div>
          </div>
          <div className="prototype-title-row">
            <div>
              <h1>Euer Grün wächst mit.</h1>
              <p>{progressLabel}</p>
            </div>
            <div className="prototype-room-count"><strong>{plantCount}/8</strong><small>Pflanzen</small></div>
          </div>
          <div className="prototype-day-strip">
            <div className="prototype-day-copy"><small>HEUTE</small><strong>{dailyProgress}/3 Aufgaben</strong></div>
            <div className="prototype-pips" aria-label={`${dailyProgress} von 3 Tagesaufgaben erledigt`}>
              {[1, 2, 3].map((step) => <i key={step} className={step <= dailyProgress ? "is-filled" : ""} />)}
            </div>
            <div className="prototype-soft-streak"><small>IM FLOW</small><strong>4 Tage</strong></div>
          </div>
          <section className="prototype-guide-card" aria-live="polite">
            <button type="button" className={`prototype-flauschi ${flauschiState}`} onClick={petFlauschi} aria-label="Flauschi streicheln"><img src="/prototype-garden-v2/flauschi-medallion-v2.png" alt="Flauschi" /></button>
            <div><small>FLAUSCHI-BONUS · {flauschiDrops % 3}/3 TROPFEN</small><p>{message}</p></div>
          </section>
        </header>

        <section className="prototype-room-wrap" aria-label="Interaktives Pflanzenzimmer mit acht Plätzen">
          <img className="prototype-room-art" src="/prototype-garden-v2/living-cabinet-v2.webp" alt="Leeres warm beleuchtetes Pflanzenregal mit acht Nischen" />
          <div className="prototype-room-overlay">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
              const plant = plants.find((candidate) => candidate.slot === slot);
              if (plant) {
                const reactionId = `plant-${slot}`;
                return <button key={slot} type="button" className={`prototype-plant-slot slot-${slot} ${plant.key === "hoya" ? "is-trailing-slot" : ""} ${plantReaction === reactionId ? "is-reacting" : ""} ${sunReady ? "is-sun-target" : ""}`} onClick={() => touchPlant(slot, reactionId, plant.name)} aria-label={`${plant.name} gießen`}>
                  <PottedPlant plantKey={plant.key} stage={plant.stage} alt={plant.name} />
                </button>;
              }
              if (!pendingPlant && seedSlot === slot && plantCount < 8) {
                return <button key={slot} type="button" className={`prototype-plant-slot slot-${slot} is-seed ${plantReaction === "seed" ? "is-reacting" : ""} ${rewardReady ? "is-ready" : ""} ${sunReady ? "is-sun-target" : ""}`} onClick={() => touchPlant(slot, "seed", "Keim")} aria-label={rewardReady ? "Neue Pflanze auswählen" : "Keim gießen"}>
                  <PottedPlant plantKey="monstera" stage={seedStage} alt="Wachsender Keim" />
                </button>;
              }
              if (pendingPlant) {
                return <button key={slot} type="button" className={`prototype-empty-slot is-placeable slot-${slot}`} onClick={() => placePlant(slot)} aria-label={`${pendingPlant.name} auf Platz ${slot} stellen`}><span>Hierhin</span></button>;
              }
              return <span key={slot} className={`prototype-empty-slot slot-${slot}`} aria-hidden="true" />;
            })}
            {sunReady && <div className="prototype-sunshine" aria-hidden="true" />}
            {watering && wateringSlot && <>
              <img className={`prototype-watering-can slot-${wateringSlot}`} src="/prototype-garden-v2/watering-can-v1.png" alt="" />
              <svg className={`prototype-water-stream slot-${wateringSlot}`} viewBox="0 0 100 110" aria-hidden="true">
                <defs>
                  <linearGradient id="prototype-water-gradient" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#effcff" />
                    <stop offset=".44" stopColor="#8dddf5" />
                    <stop offset="1" stopColor="#55b8d9" />
                  </linearGradient>
                </defs>
                <path className="prototype-water-glow" pathLength="1" d="M92 10 C 76 20 65 34 57 48 C 49 64 43 80 36 95" />
                <path className="prototype-water-core" pathLength="1" d="M92 10 C 76 20 65 34 57 48 C 49 64 43 80 36 95" />
                <circle className="prototype-water-drop drop-one" cx="43" cy="84" r="3.2" />
                <circle className="prototype-water-drop drop-two" cx="34" cy="99" r="2.4" />
              </svg>
            </>}
            {flauschiAssistSlot !== null && <>
              <img className="prototype-helper-spark" src="/prototype-garden-v2/helper-spark-v2.png" alt="" />
              <button type="button" className="prototype-flauschi-helper" onClick={catchFlauschiDrop} aria-label="Flauschis Glitzertropfen fangen">
                <img className="prototype-helper-flauschi" src="/prototype-garden-v2/flauschi-medallion-v2.png" alt="" />
                <span>+1 Tropfen</span>
              </button>
            </>}
          </div>
        </section>

        <div className="prototype-action-dock">
          <button type="button" onClick={completeTask} disabled={watering || sunReady || Boolean(pendingPlant)} className={rewardReady ? "is-reward" : sunReady ? "is-water" : ""}>
            <span>{watering ? "WASSER MARSCH" : pendingPlant ? "REGALPLATZ WÄHLEN" : sunReady ? "SONNE IM GANZEN REGAL" : rewardReady ? "NEUE PFLANZE" : taskCount >= 3 ? `TAGESFLOW x${bonusMultiplier.toFixed(1)}` : "AUFGABE ERLEDIGT"}</span>
            <strong>{watering ? "Die Pflanze wird gegossen …" : pendingPlant ? "Tippt einmal auf eine freie Nische" : sunReady ? "Tippt jetzt eine beliebige Pflanze" : rewardReady ? "Pflanze auswählen" : `${nextTask} abschließen`}</strong>
          </button>
        </div>

        {choiceOpen && <div className="prototype-choice-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setChoiceOpen(false)}>
          <section className="prototype-choice-sheet" role="dialog" aria-modal="true" aria-labelledby="prototype-choice-title">
            <small>EIN NEUER MITBEWOHNER</small>
            <h2 id="prototype-choice-title">Wer darf einziehen?</h2>
            <p>Wählt eure Wunschpflanze einmal aus. Danach bestimmt ihr nur noch ihre freie Nische.</p>
            <div className="prototype-candidates">
              {availableCandidates.slice(0, 3).map((candidate) => <button key={candidate.key} type="button" onClick={() => choosePlant(candidate)}>
                <PottedPlant plantKey={candidate.key} stage={3} alt="" compact />
                <span><strong>{candidate.name}</strong><small>{candidate.line}</small></span>
              </button>)}
            </div>
            <button className="prototype-choice-close" type="button" onClick={() => setChoiceOpen(false)}>Noch kurz überlegen</button>
          </section>
        </div>}
      </div>
    </main>
  );
}
