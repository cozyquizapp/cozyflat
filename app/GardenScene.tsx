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
  streak: number;
  availableMotes: number;
  taskProgress: number;
  taskGoal: number;
  rewardReady: boolean;
  onCollectMote: () => void;
  onPetFlauschi: () => void;
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

function WaterPour({ slot }: { slot: number }) {
  return <>
    <img className={`css-watering-can css-slot-${slot}`} src="/prototype-garden-v2/watering-can-v1.png" alt="" />
    <svg className={`css-water-stream css-slot-${slot}`} viewBox="0 0 100 110" aria-hidden="true">
      <defs>
        <linearGradient id="garden-water-gradient" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#effcff" />
          <stop offset=".45" stopColor="#83d9f2" />
          <stop offset="1" stopColor="#4ab5df" />
        </linearGradient>
      </defs>
      <path className="css-water-glow" pathLength="1" d="M92 8 C 78 20 66 35 57 51 C 49 67 42 84 35 101" />
      <path className="css-water-core" pathLength="1" d="M92 8 C 78 20 66 35 57 51 C 49 67 42 84 35 101" />
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

export default function GardenScene({ room, plants, streak, availableMotes, taskProgress, taskGoal, rewardReady, onCollectMote, onPetFlauschi, onOpenSeed }: GardenSceneProps) {
  const [wateringSlot, setWateringSlot] = useState<number | null>(null);
  const [reactingSlot, setReactingSlot] = useState<number | null>(null);
  const shownPlants = plants.slice(0, 8);
  const firstEmptySlot = shownPlants.length + 1;
  const progress = Math.min(taskGoal, taskProgress);
  const hasSun = availableMotes > 0;

  function waterPlant(slot: number) {
    if (wateringSlot !== null) return;
    setWateringSlot(slot);
    if ("vibrate" in navigator) navigator.vibrate(hasSun ? [18, 35, 24] : 18);
    window.setTimeout(() => setReactingSlot(slot), 560);
    window.setTimeout(() => {
      setWateringSlot(null);
      setReactingSlot(null);
      if (hasSun) onCollectMote();
    }, 1120);
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
            className={`css-shelf-slot css-slot-${slot} ${key === "hoya" ? "is-trailing" : ""} ${reactingSlot === slot ? "is-reacting" : ""}`}
            onClick={() => waterPlant(slot)}
            aria-label={`${plant.name} gießen${hasSun ? " und Sonnenenergie nutzen" : ""}`}
          >
            <PottedPlant plantKey={key} stage={visualPlantStage(plant.stage)} alt={plant.name} />
          </button>;
        })}

        {firstEmptySlot <= 8 && <SeedSlot slot={firstEmptySlot} progress={progress} goal={taskGoal} ready={rewardReady} onOpen={onOpenSeed} />}

        {hasSun && <div className="css-room-sun" aria-hidden="true"><i /><i /><i /></div>}
        {wateringSlot !== null && <WaterPour slot={wateringSlot} />}

        <button type="button" className="css-flauschi-orb-v2" onClick={onPetFlauschi} aria-label="Flauschi besuchen">
          <img src="/prototype-garden-v2/flauschi-medallion-v2.png" alt="" />
          <span>{streak ? `${streak} Tage` : "Zzz"}</span>
        </button>
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
