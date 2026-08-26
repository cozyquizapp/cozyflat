"use client";

import { useState, type CSSProperties } from "react";

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

type DisplayPlant = GardenScenePlant;

function normalizePlantKey(raw: string) {
  const key = raw.toLowerCase().trim();
  if (["aloka", "aloecasia", "alocazea"].includes(key)) return "alocasia";
  return key;
}

const branchLeaves = [
  { side: "left", y: 15, width: 35, angle: -20, min: 1 },
  { side: "right", y: 20, width: 37, angle: 17, min: 1 },
  { side: "left", y: 38, width: 42, angle: -13, min: 3 },
  { side: "right", y: 43, width: 42, angle: 11, min: 3 },
  { side: "left", y: 61, width: 38, angle: -8, min: 6 },
  { side: "right", y: 66, width: 39, angle: 7, min: 7 },
  { side: "left", y: 82, width: 32, angle: -5, min: 9 },
  { side: "right", y: 86, width: 33, angle: 4, min: 10 },
];

function BranchPlant({ stage, variant }: { stage: number; variant: string }) {
  return (
    <span className={`css-plant-art css-branch-plant ${variant}`} aria-hidden="true">
      <span className="css-main-stem" />
      {branchLeaves.map((leaf, index) => (
        <span
          key={index}
          className={`css-leaf ${leaf.side} ${stage >= leaf.min ? "is-grown" : ""}`}
          style={{
            "--leaf-y": `${leaf.y}px`,
            "--leaf-w": `${leaf.width}px`,
            "--leaf-angle": `${leaf.angle}deg`,
          } as CSSProperties}
        />
      ))}
      {variant === "orchid" && stage >= 3 && <span className="css-orchid-bloom" />}
    </span>
  );
}

function CalatheaPlant({ stage }: { stage: number }) {
  const leaves = [
    { x: -5, y: 43, angle: -24, leafAngle: -26, min: 1 },
    { x: 5, y: 45, angle: 24, leafAngle: 26, min: 1 },
    { x: -4, y: 61, angle: -12, leafAngle: -15, min: 3 },
    { x: 4, y: 64, angle: 12, leafAngle: 15, min: 5 },
    { x: -2, y: 78, angle: -5, leafAngle: -8, min: 7 },
    { x: 2, y: 82, angle: 6, leafAngle: 8, min: 9 },
    { x: 0, y: 92, angle: 0, leafAngle: 0, min: 11 },
  ];
  return (
    <span className="css-plant-art css-calathea" aria-hidden="true">
      {leaves.map((leaf, index) => (
        <i
          key={index}
          className={stage >= leaf.min ? "is-grown" : ""}
          style={{
            "--calathea-x": `${leaf.x}px`,
            "--calathea-y": `${leaf.y}px`,
            "--calathea-angle": `${leaf.angle}deg`,
            "--calathea-leaf-angle": `${leaf.leafAngle}deg`,
          } as CSSProperties}
        />
      ))}
    </span>
  );
}

function PileaPlant({ stage }: { stage: number }) {
  const coins = [
    { x: -30, y: 25, size: 25, rotate: -38, min: 1 },
    { x: 29, y: 30, size: 26, rotate: 38, min: 2 },
    { x: -23, y: 55, size: 24, rotate: -24, min: 4 },
    { x: 23, y: 63, size: 25, rotate: 25, min: 6 },
    { x: 0, y: 82, size: 23, rotate: 0, min: 8 },
  ];
  return (
    <span className="css-plant-art css-pilea" aria-hidden="true">
      <span className="css-main-stem" />
      {coins.map((coin, index) => (
        <span
          key={index}
          className={`css-pilea-branch ${stage >= coin.min ? "is-grown" : ""}`}
          style={{
            "--coin-x": `${coin.x}px`,
            "--coin-y": `${coin.y}px`,
            "--coin-s": `${coin.size}px`,
            "--coin-angle": `${coin.rotate}deg`,
          } as CSSProperties}
        >
          <i />
        </span>
      ))}
    </span>
  );
}

function SnakePlant({ stage }: { stage: number }) {
  return (
    <span className="css-plant-art css-snake" aria-hidden="true">
      {Array.from({ length: Math.max(3, Math.min(8, Math.ceil(stage / 2) + 2)) }, (_, index) => (
        <i key={index} style={{ "--blade": index } as CSSProperties} />
      ))}
    </span>
  );
}

function PlantArtwork({ plant }: { plant: DisplayPlant }) {
  const key = normalizePlantKey(plant.key);
  if (key === "calathea") return <CalatheaPlant stage={plant.stage} />;
  if (key === "pilea") return <PileaPlant stage={plant.stage} />;
  if (key === "snake") return <SnakePlant stage={plant.stage} />;
  return <BranchPlant stage={plant.stage} variant={key} />;
}

function PlantNiche({ plant }: { plant: DisplayPlant }) {
  const key = normalizePlantKey(plant.key);
  const tone = key === "pilea" ? "sand" : "terracotta";
  return (
    <div className={`css-garden-niche plant-${key}`}>
      <span className="css-niche-name">{plant.name.toUpperCase()}</span>
      <div className="css-plant-fixture">
        <span className="css-plant-shadow" aria-hidden="true" />
        <span className="css-pot-body-layer"><span className={`css-pot-body ${tone}`} /></span>
        <span className="css-soil-layer"><span className="css-pot-soil" /></span>
        <span className="css-art-layer"><PlantArtwork plant={plant} /></span>
        <span className="css-rim-layer"><span className={`css-pot-front ${tone}`} /></span>
      </div>
    </div>
  );
}

function SeedNiche({ progress, goal, ready, pulsing, onOpen }: { progress: number; goal: number; ready: boolean; pulsing: boolean; onOpen: () => void }) {
  const stage = Math.min(goal, progress);
  const remaining = Math.max(0, goal - progress);
  return (
    <button
      type="button"
      className={`css-garden-niche css-seed-niche seed-stage-${stage} ${ready ? "is-ready" : ""} ${pulsing ? "is-pulsing" : ""}`}
      onClick={onOpen}
      aria-label={ready ? "Neue Pflanze auswählen" : `Keim ansehen. Noch ${remaining} Aufgaben bis zur neuen Pflanze`}
    >
      <span className="css-niche-name">EUER NÄCHSTER KEIM</span>
      <span className="css-seed-glow" aria-hidden="true" />
      <img className="css-seed-art" src="/garden/seedling-v1.png" alt="" />
      <span className="css-seed-progress" aria-hidden="true">
        {Array.from({ length: goal }, (_, index) => <i className={index < stage ? "is-filled" : ""} key={index} />)}
      </span>
      <span className="css-seed-copy">{ready ? "PFLANZE WÄHLEN" : stage === 0 ? "NOCH SCHLÄFT ER" : stage + 1 >= goal ? "FAST AUFGEBLÜHT" : "ER WÄCHST"}</span>
    </button>
  );
}

function EmptyNiche({ slot }: { slot: number }) {
  return (
    <div className="css-garden-niche css-empty-niche" aria-label={`Pflanzenplatz ${slot} ist noch frei`}>
      <span className="css-niche-name">PLATZ {slot}</span>
      <span className="css-empty-number" aria-hidden="true">+</span>
      <span className="css-empty-copy">NOCH FREI</span>
    </div>
  );
}

export default function GardenScene({ room, plants, streak, availableMotes, taskProgress, taskGoal, rewardReady, onCollectMote, onPetFlauschi, onOpenSeed }: GardenSceneProps) {
  const [collecting, setCollecting] = useState<number | null>(null);
  const [seedPulsing, setSeedPulsing] = useState(false);
  const [flauschiCelebrating, setFlauschiCelebrating] = useState(false);
  const shownPlants = plants.slice(0, 8);
  const firstEmptyIndex = shownPlants.length;
  const progress = Math.min(taskGoal, taskProgress);

  function collectMote(index: number) {
    if (collecting !== null) return;
    setCollecting(index);
    window.setTimeout(() => {
      onCollectMote();
      setCollecting(null);
    }, 420);
  }

  function openSeed() {
    setSeedPulsing(true);
    window.setTimeout(() => setSeedPulsing(false), 520);
    onOpenSeed();
  }

  function celebrateWithFlauschi() {
    setFlauschiCelebrating(true);
    onPetFlauschi();
    window.setTimeout(() => setFlauschiCelebrating(false), 900);
  }

  return (
    <div className="garden-scene-host css-garden-scene" data-testid="garden-scene">
      <div className="css-room-daily">
        <span>HEUTIGER KEIMFORTSCHRITT</span>
        <strong>{progress}/{taskGoal} AUFGABEN</strong>
      </div>

      {[0, 1, 2].slice(0, availableMotes).map((index) => (
        <button
          type="button"
          key={index}
          className={`css-light-mote mote-${index + 1} ${collecting === index ? "is-collecting" : ""}`}
          onClick={() => collectMote(index)}
          aria-label="Lichtfunken einsammeln"
        />
      ))}

      <div className="css-garden-cabinet">
        {Array.from({ length: 8 }, (_, index) => {
          const plant = shownPlants[index];
          if (plant) return <PlantNiche key={`${plant.id}-${index}`} plant={plant} />;
          if (index === firstEmptyIndex) return <SeedNiche key="active-seed" progress={progress} goal={taskGoal} ready={rewardReady} pulsing={seedPulsing} onOpen={openSeed} />;
          return <EmptyNiche key={`empty-${index}`} slot={index + 1} />;
        })}
      </div>

      <button type="button" className={`css-flauschi-orb ${flauschiCelebrating ? "is-celebrating" : ""}`} onClick={celebrateWithFlauschi} aria-label="Flauschi besuchen">
        <span className="css-flauschi-bed" aria-hidden="true" />
        <span className="css-flauschi" aria-hidden="true"><i /><b /></span>
        <span className="css-flauschi-sparkles" aria-hidden="true"><i /><i /><i /></span>
        <span className="css-streak-badge">{streak ? `${streak} Tage` : "Zzz"}</span>
      </button>

      <div className="css-room-caption">
        <span><strong>Gemeinsames {room}</strong><small>{rewardReady ? "Euer neuer Mitbewohner wartet schon." : `Noch ${Math.max(0, taskGoal - progress)} ${Math.max(0, taskGoal - progress) === 1 ? "Aufgabe" : "Aufgaben"} bis zur nächsten Pflanze.`}</small></span>
        <b>{plants.length}/8</b>
      </div>
    </div>
  );
}
