# CozyFlat Aufgabenansicht – Design QA v55

- Referenz 1 (geöffnete Kategorie): `C:\Users\hornu\AppData\Local\Temp\codex-clipboard-7307366d-a6e9-4879-aef5-a1f8ea592703.png`
- Referenz 2 (geschlossene Kategorien): `C:\Users\hornu\AppData\Local\Temp\codex-clipboard-4af02907-e0b1-4125-9d9f-a7b95b1d0422.png`
- Implementierungsbilder: `design-qa-v55-chores-open.png` und `design-qa-v55-chores-closed.png`
- Kombinierter Vergleich: `design-qa-v55-comparison.png`
- Geprüfter Viewport: 393 × 852 CSS px, iPhone Hochformat
- Zustände: vollständige Kategorienliste sowie geöffnete längste Kategorie „Wäsche“

## Sichtprüfung

Die Referenzen und die lokale Implementierung wurden im kombinierten Vergleich gemeinsam beurteilt. Die vorhandene CozyFlat-Gestaltung bleibt unverändert; der Patch korrigiert ausschließlich Erreichbarkeit, Scrollverhalten und die vertikale Dichte der Aufgabenkategorien.

- Alle sieben geschlossenen Kategorien sind vollständig oberhalb der fixierten Navigation sichtbar.
- Die Karten sind inklusive Rand 80 px hoch und behalten Bild, Titel, Zähler, Plus und Pfeil in der bestehenden Hierarchie.
- Der sichtbare Plus-Button ist 34 × 34 px; eine unsichtbare Erweiterung hält die effektive Touchfläche bei 44 × 44 px.
- Zwischen der letzten Kategorie und der Navigation verbleiben bei 393 × 852 px 102 px Freiraum.
- Lange geöffnete Kategorien erzeugen wieder echten Seitenscroll: 1007 px Dokumenthöhe bei 852 px Viewporthöhe.
- Der geöffnete Kategorienkopf beginnt bei 75 px direkt unter der 66 px hohen App-Leiste. Es gibt weder die vorherige 66-px-Leerzone noch eine Überdeckung.

## Vergleichsverlauf

### Durchlauf 1 – nicht bestanden

- P0: `.shell { overflow: hidden; }` begrenzte die gesamte Aufgabenansicht auf die Viewporthöhe. Untere Karten waren nicht erreichbar.
- P1: Der Sticky-Kopf einer geöffneten Kategorie klebte innerhalb eines selbst beschneidenden Containers und erzeugte eine große Leerzone.
- P2: 88-px-Karten ließen die letzte Kategorie hinter der Navigation verschwinden.

### Durchlauf 2 – bestanden

- Die Shell gibt vertikalen Überlauf frei und begrenzt nur noch die horizontale Achse.
- Geöffnete Aufgaben- und Pflanzenbereiche geben ihren Inhalt frei; Sticky-Köpfe verankern sich unter der App-Leiste.
- Geschlossene Aufgabenkarten wurden minimal auf 78 px Mindesthöhe verdichtet.
- `onToggle` setzt geöffnete Detailansichten auf Mobilgeräten zuverlässig an den oberen Rand.
- Keine verbleibenden P0-, P1- oder P2-Befunde.

## Interaktions- und Buildprüfung

- Kategorien öffnen und schließen: geprüft.
- Längste Kategorie „Wäsche“ öffnen: geprüft; alle Inhalte sind scrollbar erreichbar.
- Geschlossene Liste: geprüft; alle Kategorien bleiben antippbar.
- Fixierte untere Navigation: bleibt sichtbar und überdeckt keine Kategorie.
- `npx tsc --noEmit`: bestanden.
- `npm run lint`: bestanden, nur 26 bereits vorhandene `<img>`-Hinweise.
- `npm run build`: bestanden.

final result: passed
