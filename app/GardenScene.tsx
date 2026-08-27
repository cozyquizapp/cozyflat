"use client";

import { useState } from "react";
import { PottedPlant } from "./prototype-garden/page";
import "./prototype-garden/prototype-garden.css";

export type GardenScenePlant = {
  id: string;
  key: string;
  name: string;
  stage: number;
};

type GardenSceneProps = {
  room: string;
  plants: GardenScenePlant[];
  availableMotes: number;
  taskProgress: number;
  taskGoal: number;
  rewardReady: boolean;
  onWaterPlant: (collectionKey: string) => Promise<"grown" | "mature" | "no-sun" | "error">;
  onOpenSeed: () => void;
};

const PLANT_FALLBACKS: Record<string, string> = {
  calathea: "alocasia",
  snake: "ficus",
};

function visualPlantKey(raw: string) {
  const key = raw.toLowerCase().trim();
  return PLANT_FALLBACKS[key] ?? key;
}

function visualPlantStage(stage: number) {
  return Math.max(1, Math.min(5, Math.ceil(stage * 5 / 12)));
}

function playGardenChime(kind: "water" | "grow") {
  const AudioContextClass = window.AudioContext || (window as Window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(.045,now+.02);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.42);
  gain.connect(context.destination);
  (kind === "grow" ? [523,659,784] : [392,523]).forEach((frequency,index) => {
    const oscillator=context.createOscillator();
    oscillator.type="sine";
    oscillator.frequency.value=frequency;
    oscillator.connect(gain);
    oscillator.start(now+index*.055);
    oscillator.stop(now+.46);
  });
  window.setTimeout(()=>void context.close(),650);
}

function WaterPour({ slot }: { slot: number }) {
  const mirrored=slot%2===0;
  // The mirrored can's rose sits farther outside its slot. Give that side its
  // own start point instead of mirroring the whole SVG, so the stream still
  // lands in the same pot while visibly leaving the rose.
  const path=mirrored
    ? "M108 4 C 92 16 75 32 61 49 C 50 65 41 83 35 103"
    : "M92 8 C 78 20 66 35 57 51 C 49 67 42 84 35 101";
  return <>
    <img className={`css-watering-can css-slot-${slot}`} src="/prototype-garden-v2/watering-can-v1.png" alt="" />
    <svg className={`css-water-stream css-slot-${slot} ${mirrored?'is-mirrored':''}`} viewBox="0 0 100 110" aria-hidden="true">
      <defs>
        <linearGradient id="garden-water-gradient" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#effcff" />
          <stop offset=".45" stopColor="#83d9f2" />
          <stop offset="1" stopColor="#4ab5df" />
        </linearGradient>
      </defs>
      <path className="css-water-glow" pathLength="1" d={path} />
      <path className="css-water-core" pathLength="1" d={path} />
      <circle className="css-water-drop drop-one" cx="43" cy="88" r="3.1" />
      <circle className="css-water-drop drop-two" cx="34" cy="104" r="2.3" />
    </svg>
  </>;
}

function SeedSlot({ slot, progress, goal, ready, onOpen }: { slot: number; progress: number; goal: number; ready: boolean; onOpen: () => void }) {
  const remaining = Math.max(0, goal - progress);
  const seedStage = Math.max(1, Math.min(3, progress + 1));
  return <button
    type="button"
    className={`css-shelf-slot css-slot-${slot} css-seed-slot ${ready ? "is-ready" : ""}`}
    onClick={onOpen}
    aria-label={ready ? "Neue Pflanze auswählen" : `Noch ${remaining} Aufgaben bis zur neuen Pflanze`}
  >
    <span className="css-seed-halo" aria-hidden="true" />
    <PottedPlant plantKey="monstera" stage={seedStage} alt="Wachsender Keim" />
  </button>;
}

export default function GardenScene({ room, plants, availableMotes, taskProgress, taskGoal, rewardReady, onWaterPlant, onOpenSeed }: GardenSceneProps) {
  const [wateringSlot, setWateringSlot] = useState<number | null>(null);
  const [reactingSlot, setReactingSlot] = useState<number | null>(null);
  const shownPlants = plants.slice(0, 8);
  const firstEmptySlot = shownPlants.length + 1;
  const progress = Math.min(taskGoal, taskProgress);
  const hasSun = availableMotes > 0;

  async function waterPlant(slot: number, collectionKey: string) {
    if (wateringSlot !== null) return;
    setWateringSlot(slot);
    playGardenChime("water");
    if ("vibrate" in navigator) navigator.vibrate(hasSun ? [18, 35, 24] : 18);
    window.setTimeout(() => setReactingSlot(slot), 560);
    const outcome = hasSun ? onWaterPlant(collectionKey) : Promise.resolve("no-sun" as const);
    const [result] = await Promise.all([outcome,new Promise((resolve)=>window.setTimeout(resolve,1120))]);
    setWateringSlot(null);
    setReactingSlot(null);
    if(result==="grown") playGardenChime("grow");
  }

  return (
    <div className={`garden-scene-host css-garden-scene-v2 ${hasSun ? "has-sun" : ""}`} data-testid="garden-scene">
      <img className="css-room-art" src="/prototype-garden-v2/living-cabinet-v2.png" alt="" />
      <div className="css-room-overlay">
        {shownPlants.map((plant, index) => {
          const slot = index + 1;
          const key = visualPlantKey(plant.key);
          return <button
            key={plant.id}
            type="button"
            className={`css-shelf-slot css-slot-${slot} ${key === "hoya" ? "is-trailing" : ""} ${reactingSlot === slot ? "is-reacting" : ""} ${hasSun && plant.stage < 12 ? "is-sun-target" : ""}`}
            onClick={() => void waterPlant(slot,plant.id)}
            aria-label={`${plant.name} gießen${hasSun && plant.stage < 12 ? " und wachsen lassen" : plant.stage >= 12 ? ", vollständig ausgewachsen" : ""}`}
          >
            <PottedPlant plantKey={key} stage={visualPlantStage(plant.stage)} alt={plant.name} />
          </button>;
        })}

        {firstEmptySlot <= 8 && <SeedSlot slot={firstEmptySlot} progress={progress} goal={taskGoal} ready={rewardReady} onOpen={onOpenSeed} />}

        {hasSun && <div className="css-room-sun" aria-hidden="true"><i /><i /><i /></div>}
        {wateringSlot !== null && <WaterPour slot={wateringSlot} />}

      </div>

      <div className="css-room-caption-v2">
        <span>
          <strong>Gemeinsames {room}</strong>
          <small>{hasSun ? "Sonne ist da – tippt eine Pflanze zum Gießen." : rewardReady ? "Euer neuer Keim wartet schon." : `Noch ${Math.max(0, taskGoal - progress)} ${Math.max(0, taskGoal - progress) === 1 ? "Aufgabe" : "Aufgaben"} bis zur nächsten Pflanze.`}</small>
        </span>
        <b>{plants.length}/8</b>
      </div>
    </div>
  );
}
