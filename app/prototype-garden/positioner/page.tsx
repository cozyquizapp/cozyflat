"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PLANT_TUNING, PLANT_TUNING_STORAGE_KEY, PottedPlant, type PlantKey, type PlantTuning } from "../page";
import "../prototype-garden.css";
import "./positioner.css";

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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PLANT_TUNING_STORAGE_KEY);
      if (stored) setSaved(JSON.parse(stored) as Record<string, PlantTuning>);
    } catch {
      // A fresh local tool still works when storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(PLANT_TUNING_STORAGE_KEY, JSON.stringify(saved));
  }, [ready, saved]);

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
