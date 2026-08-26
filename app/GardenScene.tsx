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
  onCollectMote: () => void;
  onPetStaubi: () => void;
};

type DisplayPlant = GardenScenePlant & { preview?: boolean };

const previewPlants: DisplayPlant[] = [
  { id: "preview-orchid", key: "orchid", name: "Olli Orchidee", stage: 3, preview: true },
  { id: "preview-pilea", key: "pilea", name: "Polly Pilea", stage: 5, preview: true },
  { id: "preview-cactus", key: "cactus", name: "Kalle Kaktus", stage: 4, preview: true },
];

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
      {variant === "orchid" && stage >= 10 && <span className="css-orchid-bloom" />}
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

function CactusPlant({ stage }: { stage: number }) {
  return (
    <span className={`css-plant-art css-cactus stage-${Math.min(12, stage)}`} aria-hidden="true">
      <span className="css-cactus-main" />
      <span className="css-cactus-arm left" />
      <span className="css-cactus-arm right" />
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
  if (key === "cactus") return <CactusPlant stage={plant.stage} />;
  if (key === "pilea") return <PileaPlant stage={plant.stage} />;
  if (key === "snake") return <SnakePlant stage={plant.stage} />;
  return <BranchPlant stage={plant.stage} variant={key} />;
}

function PlantNiche({ plant, locked }: { plant: DisplayPlant; locked: boolean }) {
  const key = normalizePlantKey(plant.key);
  const tone = key === "pilea" ? "sand" : "terracotta";
  return (
    <div className={`css-garden-niche plant-${key} ${locked ? "is-preview" : ""}`}>
      <span className="css-niche-name">{plant.name.toUpperCase()}</span>
      <div className="css-plant-fixture">
        <span className="css-plant-shadow" aria-hidden="true" />
        <span className="css-pot-body-layer"><span className={`css-pot-body ${tone}`} /></span>
        <span className="css-soil-layer"><span className="css-pot-soil" /></span>
        <span className="css-art-layer"><PlantArtwork plant={plant} /></span>
        <span className="css-rim-layer"><span className={`css-pot-front ${tone}`} /></span>
      </div>
      {locked && <span className="css-preview-label">VORSCHAU</span>}
    </div>
  );
}

export default function GardenScene({ room, plants, streak, availableMotes, onCollectMote, onPetStaubi }: GardenSceneProps) {
  const [collecting, setCollecting] = useState<number | null>(null);
  const displayPlants: DisplayPlant[] = [0, 1, 2].map((index) => plants[index] ?? previewPlants[index]);

  function collectMote(index: number) {
    if (collecting !== null) return;
    setCollecting(index);
    window.setTimeout(() => {
      onCollectMote();
      setCollecting(null);
    }, 420);
  }

  return (
    <div className="garden-scene-host css-garden-scene" data-testid="garden-scene">
      <div className="css-room-daily">
        <span>LICHTFUNKEN AUS AUFGABEN</span>
        <strong>{availableMotes ? `${availableMotes} warten` : "Noch keiner"}</strong>
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
        {displayPlants.map((plant, index) => (
          <PlantNiche key={`${plant.id}-${index}`} plant={plant} locked={!plants[index]} />
        ))}
        <button type="button" className="css-garden-niche css-flauschi-niche" onClick={onPetStaubi} aria-label="Flauschi besuchen">
          <span className="css-niche-name">FLAUSCHI</span>
          <span className="css-flauschi-bed" aria-hidden="true" />
          <span className="css-flauschi" aria-hidden="true"><i /><b /></span>
          <span className="css-streak-badge">{streak ? `Serie ${streak}` : "Zzz"}</span>
        </button>
      </div>

      <div className="css-room-caption">
        <span><strong>{room}</strong><small>Aufgaben erledigen. Funken sammeln. Pflanzen wachsen lassen.</small></span>
        <b>{plants.length}/4</b>
      </div>
    </div>
  );
}
