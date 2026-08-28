"use client";

import { useEffect, useMemo, useState } from "react";
import { WaterPour, type WaterRigTuning } from "../../GardenScene";
import { DEFAULT_PLANT_TUNING, PLANT_TUNING_STORAGE_KEY, PottedPlant, type PlantKey, type PlantTuning } from "../page";
import "../prototype-garden.css";
import "./positioner.css";

const WATER_TUNING_STORAGE_KEY = "cozyflat-water-rig-tuning-v1";
const DEFAULT_WATER_TUNING: WaterRigTuning = {x:0,y:0,scale:1,waterX:0,waterY:0,waterScale:1,waterAngle:0,waterSpread:1};

const PLANTS: Array<{ key: PlantKey; label: string }> = [
  { key: "orchid", label: "Orchidee" },
  { key: "bonsai", label: "Bonsai" },
  { key: "monstera", label: "Monstera" },
  { key: "pilea", label: "Pilea" },
  { key: "hoya", label: "Hoya" },
  { key: "alocasia", label: "Alocasia" },
  { key: "fern", label: "Farn" },
  { key: "ficus", label: "Ficus" },
];

function defaultTuning(key: PlantKey, stage: number): PlantTuning {
  return DEFAULT_PLANT_TUNING[`${key}-${stage}`] ?? {
    foliageX: 0,
    foliageY: 0,
    foliageScale: 1,
    potX: 0,
    potY: 0,
    potScale: 1,
    rimReveal: key === "hoya" ? 48 : key === "bonsai" ? 30 : key === "alocasia" || key === "ficus" ? 29 : 37,
    foliageLayer: 2,
  };
}

type ControlKey = keyof PlantTuning;

const CONTROLS: Array<{ key: ControlKey; label: string; min: number; max: number; step: number; suffix: string }> = [
  { key: "foliageY", label: "Pflanze hoch / runter", min: -30, max: 30, step: 1, suffix: " px" },
  { key: "foliageX", label: "Pflanze links / rechts", min: -24, max: 24, step: 1, suffix: " px" },
  { key: "foliageScale", label: "Pflanzengröße", min: 0.65, max: 1.35, step: 0.01, suffix: "×" },
  { key: "potY", label: "Topf hoch / runter", min: -24, max: 24, step: 1, suffix: " px" },
  { key: "potX", label: "Topf links / rechts", min: -20, max: 20, step: 1, suffix: " px" },
  { key: "potScale", label: "Topfgröße", min: 0.7, max: 1.3, step: 0.01, suffix: "×" },
  { key: "rimReveal", label: "Vordere Erd-/Topfkante", min: 12, max: 55, step: 1, suffix: "%" },
];

export default function PlantPositioner() {
  const [plantKey, setPlantKey] = useState<PlantKey>("orchid");
  const [stage, setStage] = useState(3);
  const [saved, setSaved] = useState<Record<string, PlantTuning>>({});
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [waterSlot, setWaterSlot] = useState(1);
  const [waterTuning, setWaterTuning] = useState<WaterRigTuning>(DEFAULT_WATER_TUNING);
  const [waterCopied, setWaterCopied] = useState(false);

  useEffect(() => {
    const timer=window.setTimeout(()=>{
      try {
        const stored = window.localStorage.getItem(PLANT_TUNING_STORAGE_KEY);
        if (stored) setSaved(JSON.parse(stored) as Record<string, PlantTuning>);
        const storedWater = window.localStorage.getItem(WATER_TUNING_STORAGE_KEY);
        if (storedWater) setWaterTuning({...DEFAULT_WATER_TUNING,...JSON.parse(storedWater) as WaterRigTuning});
      } catch {
        // A fresh local tool still works when storage is unavailable.
      }
      setReady(true);
    },0);
    return ()=>window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(PLANT_TUNING_STORAGE_KEY, JSON.stringify(saved));
  }, [ready, saved]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(WATER_TUNING_STORAGE_KEY, JSON.stringify(waterTuning));
  }, [ready, waterTuning]);

  const layoutKey = `${plantKey}-${stage}`;
  const tuning = { ...defaultTuning(plantKey, stage), ...(saved[layoutKey] ?? {}) };
  const plantLabel = PLANTS.find((plant) => plant.key === plantKey)?.label ?? plantKey;
  const changedCount = useMemo(() => Object.keys(saved).length, [saved]);

  function updateTuning(key: ControlKey, value: number) {
    setSaved((current) => ({ ...current, [layoutKey]: { ...tuning, [key]: value } }));
    setCopied(false);
  }

  function resetCurrent() {
    setSaved((current) => {
      const next = { ...current };
      delete next[layoutKey];
      return next;
    });
    setCopied(false);
  }

  async function copyValues() {
    await navigator.clipboard.writeText(JSON.stringify(saved, null, 2));
    setCopied(true);
  }

  async function copyWaterValues() {
    await navigator.clipboard.writeText(JSON.stringify(waterTuning, null, 2));
    setWaterCopied(true);
  }

  function updateWaterTuning(key: keyof WaterRigTuning, value: number) {
    setWaterTuning((current)=>({...current,[key]:value}));
    setWaterCopied(false);
  }

  return <main className="positioner-page">
    <div className="positioner-phone">
      <header className="positioner-header">
        <a href="/prototype-garden">← Zurück zum Spiel</a>
        <small>PFLANZEN-WERKSTATT</small>
        <h1>Setzt jede Pflanze exakt in die Erde.</h1>
        <p>Die Werte gelten je Pflanzenart und Wachstumsstufe. Sie bleiben auf diesem Gerät gespeichert.</p>
      </header>

      <section className="positioner-preview-card">
        <div className="positioner-layer-key" aria-label="Ebenenreihenfolge">
          <span>1 Topf hinten</span><span>2 Pflanze</span><span>3 Erde vorne</span>
        </div>
        <div className="positioner-niche">
          <PottedPlant plantKey={plantKey} stage={stage} alt={`${plantLabel}, Stufe ${stage}`} tuning={tuning} />
          <i className="positioner-soil-line" aria-hidden="true" />
        </div>
        <strong>{plantLabel} · Stufe {stage}</strong>
        <small>Die gestrichelte Linie markiert den gewünschten Eintritt in die Erde.</small>
        <div className="positioner-layer-switch" role="group" aria-label="Ebene der Pflanze wählen">
          <button type="button" className={tuning.foliageLayer === 1 ? "is-active" : ""} onClick={() => updateTuning("foliageLayer", 1)}>Hinter Topf</button>
          <button type="button" className={tuning.foliageLayer === 2 ? "is-active" : ""} onClick={() => updateTuning("foliageLayer", 2)}>Zwischen</button>
          <button type="button" className={tuning.foliageLayer === 3 ? "is-active" : ""} onClick={() => updateTuning("foliageLayer", 3)}>Ganz vorne</button>
        </div>
      </section>

      <section className="positioner-pickers" aria-label="Pflanze und Wachstumsstufe wählen">
        <div className="positioner-plant-pills">
          {PLANTS.map((plant) => <button key={plant.key} type="button" className={plant.key === plantKey ? "is-active" : ""} onClick={() => setPlantKey(plant.key)}>{plant.label}</button>)}
        </div>
        <div className="positioner-stage-pills">
          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={value === stage ? "is-active" : ""} onClick={() => setStage(value)}>Stufe {value}</button>)}
        </div>
      </section>

      <section className="positioner-water-card">
        <div className="positioner-water-head"><span><small>GIESS-ANSICHT</small><strong>Kanne und Wasser fein ausrichten</strong></span><button type="button" onClick={()=>setWaterTuning(DEFAULT_WATER_TUNING)}>Reset</button></div>
        <div className="positioner-water-room garden-scene-host css-garden-scene-v2">
          <img className="css-room-art" src="/prototype-garden-v2/living-cabinet-v2.png" alt="" />
          <div className="css-room-overlay">
            <div className={`css-shelf-slot css-slot-${waterSlot}`}><PottedPlant plantKey={plantKey} stage={stage} alt={`${plantLabel}, Stufe ${stage}`} tuning={tuning} /></div>
            <WaterPour slot={waterSlot} tuning={waterTuning} />
          </div>
        </div>
        <div className="positioner-water-slots" aria-label="Regalplatz für die Gießprobe wählen">{[1,2,3,4,5,6,7,8].map((slot)=><button type="button" className={waterSlot===slot?'is-active':''} onClick={()=>setWaterSlot(slot)} key={slot}>{slot}</button>)}</div>
        <div className="positioner-controls positioner-water-controls">
          <h3>Gießkanne</h3>
          <label><span><strong>Links / rechts</strong><output>{waterTuning.x}%</output></span><input type="range" min="-12" max="12" step=".25" value={waterTuning.x} onChange={(event)=>updateWaterTuning("x",Number(event.target.value))} /></label>
          <label><span><strong>Hoch / runter</strong><output>{waterTuning.y}%</output></span><input type="range" min="-12" max="12" step=".25" value={waterTuning.y} onChange={(event)=>updateWaterTuning("y",Number(event.target.value))} /></label>
          <label><span><strong>Größe</strong><output>{waterTuning.scale}×</output></span><input type="range" min=".7" max="1.3" step=".01" value={waterTuning.scale} onChange={(event)=>updateWaterTuning("scale",Number(event.target.value))} /></label>
          <h3>Wasserstrahl</h3>
          <label><span><strong>Links / rechts</strong><output>{waterTuning.waterX}%</output></span><input type="range" min="-16" max="16" step=".25" value={waterTuning.waterX} onChange={(event)=>updateWaterTuning("waterX",Number(event.target.value))} /></label>
          <label><span><strong>Hoch / runter</strong><output>{waterTuning.waterY}%</output></span><input type="range" min="-16" max="16" step=".25" value={waterTuning.waterY} onChange={(event)=>updateWaterTuning("waterY",Number(event.target.value))} /></label>
          <label><span><strong>Größe / Länge</strong><output>{waterTuning.waterScale}×</output></span><input type="range" min=".55" max="1.45" step=".01" value={waterTuning.waterScale} onChange={(event)=>updateWaterTuning("waterScale",Number(event.target.value))} /></label>
          <label><span><strong>Winkel</strong><output>{waterTuning.waterAngle}°</output></span><input type="range" min="-28" max="28" step="1" value={waterTuning.waterAngle} onChange={(event)=>updateWaterTuning("waterAngle",Number(event.target.value))} /></label>
          <label><span><strong>Fächerbreite</strong><output>{waterTuning.waterSpread}×</output></span><input type="range" min=".25" max="1.5" step=".05" value={waterTuning.waterSpread} onChange={(event)=>updateWaterTuning("waterSpread",Number(event.target.value))} /></label>
        </div>
        <button type="button" className="positioner-copy-water" onClick={copyWaterValues}>{waterCopied?'Gießwerte kopiert ✓':'Gießwerte kopieren'}</button>
        <small>Stelle zuerst die Kanne ein und danach den Wasserfächer. Im Editor bleibt beides dauerhaft sichtbar.</small>
      </section>

      <section className="positioner-controls">
        {CONTROLS.map((control) => <label key={control.key}>
          <span><strong>{control.label}</strong><output>{tuning[control.key]}{control.suffix}</output></span>
          <input type="range" min={control.min} max={control.max} step={control.step} value={tuning[control.key]} onChange={(event) => updateTuning(control.key, Number(event.target.value))} />
        </label>)}
      </section>

      <div className="positioner-actions">
        <button type="button" onClick={resetCurrent}>Diese Stufe zurücksetzen</button>
        <button type="button" className="is-primary" onClick={copyValues}>{copied ? "Werte kopiert ✓" : `${changedCount} Einstellungen kopieren`}</button>
      </div>
    </div>
  </main>;
}
