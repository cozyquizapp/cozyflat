"use client";

import { PottedPlant, type PlantKey } from "../page";
import "../prototype-garden.css";
import "./stage-lab.css";

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

export default function PlantStageLab() {
  return <main className="stage-lab-page">
    <header>
      <small>INTERNE KOMPOSITIONSKONTROLLE</small>
      <h1>8 Pflanzen × 5 Stufen</h1>
      <p>Jede Pflanzenbasis muss mittig im sichtbaren Erdrand enden.</p>
    </header>
    <section className="stage-lab-grid" aria-label="Alle Pflanzen und Wachstumsstufen">
      {PLANTS.flatMap((plant) => [1, 2, 3, 4, 5].map((stage) => <article className="stage-lab-card" key={`${plant.key}-${stage}`}>
        <div className="stage-lab-niche">
          <PottedPlant plantKey={plant.key} stage={stage} alt={`${plant.label}, Stufe ${stage}`} />
        </div>
        <strong>{plant.label}</strong><span>Stufe {stage}</span>
      </article>))}
    </section>
  </main>;
}
