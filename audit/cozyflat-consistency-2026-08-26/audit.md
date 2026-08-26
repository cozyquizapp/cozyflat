# CozyFlat – Designkonsistenz-Audit

Stand: 26. August 2026  
Zielgerät: iPhone-Viewport 393 × 852 CSS-Pixel

## Allgemeiner Zustand

Vor dem Pass: **solide Einzelansichten, aber kein durchgängiges System**. Aufgaben und Pflanzen waren visuell am weitesten, Heute war persönlicher, der Garten deutlich spielerischer und Formulare wirkten wie ein eigener Verwaltungsbereich.

Nach dem Pass: **ein zusammenhängendes, warmes CozyFlat-System**. Die vier Hauptansichten teilen jetzt dieselben Oberflächen, Radien, Schatten, Abstände, Headerlogik, mobilen Bedienelemente und Fokuszustände. Der Garten bleibt bewusst der spielerische Höhepunkt.

## Warum es inkonsistent war

1. Zehn ursprünglich nacheinander importierte CSS-Dateien überschrieben mehrfach dieselben Basiskomponenten (`hero`, `summary`, `mobile-nav`, `room-zone`, `modal`, `level-hub`).
2. Neue Features wurden jeweils lokal gestaltet, ohne einen verbindlichen Satz gemeinsamer Tokens für Flächen, Radien, Schatten, Fokus und mobile Abstände.
3. Aufgaben und Pflanzen hatten Bildsprache, Heute und Formulare hauptsächlich neutrale Flächen; der Garten besaß wiederum eine eigene, deutlich stärkere Materialität.
4. Der App-Name wurde mobil ausgeblendet und mehrere Controls waren visuell verständlich, aber für Screenreader nicht eindeutig benannt.
5. Die öffentliche Domain zeigte beim Audit noch einen älteren Gartenstand als die lokale Codebasis. Deshalb wurde ausschließlich der verifizierte lokale Stand überarbeitet; Veröffentlichung ist ein separater Schritt.

## Erfasste Ansichten

1. Heute – Hero, Flauschi, Zusammenfassung und Tagesauswahl (`12-local-iphone-before.png`, `22-local-today-after-fixed.png`)
2. Aufgaben – Bereichskopf, Tagesaufgaben und Kategorien (`13-local-tasks-before.png`, `23-local-tasks-after-fixed.png`)
3. Pflanzen – Bereichskopf und Raumkarten (`14-local-plants-before.png`, `18-local-plants-after.png`)
4. Garten – Pflanzenzimmer und Keimfortschritt (`15-local-garden-before.png`, `19-local-garden-after.png`)
5. Aufgabenformular – initialer und langer Scrollzustand (`09-task-modal.png`, `20-local-modal-after.png`)
6. Öffentliche Referenz – aktuelle Domainzustände und aufgeklappte Karten (`01-current.png` bis `10-plant-modal.png`)

## Umgesetzter Design-Pass

1. `cozy-system.css` als bewusst letzter Designvertrag mit gemeinsamen Tokens für Flächen, Farben, Radien, Schatten und Fokus.
2. Bildgestützte, konsistente Bereichsköpfe für Aufgaben und Pflanzen; klare Verbindung zwischen Aufgaben-XP und Pflanzenzimmer.
3. Sticky App-Kopf mit sichtbarem CozyFlat-Namen und verständlicher Profilwahl.
4. Einheitliche Touch-Reaktionen, Mindestgrößen, Fokuszustände und aktive Navigation.
5. Tageskarten, Aufgabengruppen, Pflanzenräume, Fortschrittskarten und Gartenoberflächen auf dieselbe Materialität gebracht.
6. Mobile Formulare als Bottom-Sheets mit konsistenten Feldern und gut erreichbarem Schließen-Button.
7. Texte korrigiert: Singular/Plural bei Flauschis Gelegenheiten und persönliche Ansprache im Tagesstatus.

## Stärken

- Die Bildsprache der echten Aufgaben- und Raummotive bleibt erhalten und wird jetzt auch in den Bereichsköpfen genutzt.
- Heute bleibt persönlich, der Garten bleibt belohnend; trotzdem fühlen sich Navigation und Flächen gleich an.
- Die Hauptnavigation ist dauerhaft erreichbar und jede Ansicht bleibt auf dem iPhone ein klarer Fokuszustand.
- Der Garten besitzt weiterhin eine bewusst höhere visuelle Dichte, ohne wie eine andere App zu wirken.

## UX- und Accessibility-Verbesserungen

- Profilbuttons besitzen eindeutige Namen und `aria-pressed`.
- Hauptnavigation nutzt `aria-current="page"`.
- Plus-Buttons besitzen eindeutige Labels.
- Globale `:focus-visible`-Zustände, 44–48-Pixel-Touchziele und `prefers-reduced-motion` sind vereinheitlicht.
- Der zuvor am Kartenrand abgeschnittene Tageszähler bricht auf kleinen iPhones sauber in eine eigene Zeile um.

## Verbleibende Risiken und Grenzen

- Der neue Designvertrag liegt absichtlich als letzter CSS-Layer über der historischen Stylestruktur. Langfristig können die alten Dateien schrittweise konsolidiert werden; für diesen Patch wäre ein Komplettumbau unnötig riskant gewesen.
- Abschlussanimationen wurden nicht mit echten Aufgaben ausgelöst, weil das Nutzerdaten verändert hätte. Die zugehörigen Styles wurden vereinheitlicht, aber nicht datenmutierend getestet.
- Die öffentliche Domain wurde nicht aktualisiert. Der lokale Build ist erfolgreich und die Veröffentlichung benötigt eine ausdrückliche Freigabe.

## Verifikation

- `npx tsc --noEmit`: erfolgreich
- `npm run build`: erfolgreich
- `git diff --check`: erfolgreich
- Frische Browserkonsole nach Serverneustart: keine Fehler
- Visueller Vorher-/Nachher-Vergleich im identischen iPhone-Viewport durchgeführt
