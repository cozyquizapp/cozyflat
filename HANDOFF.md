# CozyFlat – Übergabe und aktueller Stand

Stand: 25. August 2026

## Links

- Produktion: https://cozyflat.cozyquiz.app
- GitHub: https://github.com/cozyquizapp/cozyflat
- Sites-Projekt: `appgprj_6a8d5ab0133c81919df4ccd4c73a6301`

## Produktidee

CozyFlat ist eine gemeinsame, für iPhones optimierte Haushalts-App für Sonja und Johannes. Hausarbeiten und Pflanzenpflege sollen sich leicht, freundlich und belohnend anfühlen. Staubi ist das Maskottchen. Er begrüßt beide, reagiert auf erledigte Aufgaben und lebt langfristig im gemeinsamen Pflanzenzimmer.

## Was aktuell öffentlich ist

Die öffentliche Version ist Sites-Version 28. Sie enthält unter anderem:

- iPhone-PWA mit Home-Screen-Icon und Apple-Touch-Icon
- persönliche Profile für Johannes und Sonja
- Tagesauswahl aus flexiblen und terminierten Hausis
- Haushaltspunkte, Wochen-XP, Level und Streaks
- Pflanzenverwaltung und Gießhistorie
- erste Garten-/Pflanzenzimmer-Rohversion
- Staubi, Avatare und mobiler Ladescreen
- Custom Domain `cozyflat.cozyquiz.app`

## Fertig im lokalen Arbeitsstand, aber noch nicht veröffentlicht

### Hausis ohne doppeltes Ausklappen

- Der äußere Schalter „Alle Hausis nach Kategorie“ wurde entfernt.
- Das innere „weitere Hausis anzeigen“ wurde entfernt.
- Ein Tipp auf eine Kategorie öffnet sofort alle Hausis dieser Kategorie.
- Putzen, Küche und Wäsche besitzen generierte Vorschaubilder.
- Der aufgeklappte Bereich übernimmt passende Sage-, Pfirsich- oder Rosétöne.

### Gemeinsame Aufgaben

- Aufgaben können als aktuelle Person oder über „Gemeinsam“ abgeschlossen werden.
- Bei „Gemeinsam“ werden Johannes und Sonja jeweils als Beteiligte gespeichert.
- Beide erhalten XP und tauchen in den persönlichen Statistiken auf.
- Gemeinsam erledigte Aufgaben werden als „Sonja & Johannes“ angezeigt.
- Rückgängig machen entfernt beide zusammengehörigen Ereignisse.

### Steigender Tagesbonus

- Erste Aktivität des Tages: kein Bonus.
- Jede weitere Aktivität: +2 XP mehr.
- Maximum: +10 Bonus-XP pro Person und Aufgabe.
- Paar-Aufgaben geben beiden die Basis-XP plus den aktuellen Bonus.
- Über der Tagesauswahl steht, wie viele Aufgaben heute geschafft wurden und wie hoch der nächste Bonus ist.

### Pflanzenzimmer-Ausbau

- Räume: Wohnzimmer, Schlafzimmer, Küche und Bad.
- Ein Raum fasst vier Wochenpflanzen.
- Ist ein Raum voll, wird der nächste freigeschaltet.
- Die wöchentliche Pflanzenwahl wird dem ausgewählten, freigeschalteten Raum zugeordnet.
- Zwei freigestellte Pflanzenillustrationen ersetzen die bisherigen Emojis.
- Pflanzen wachsen visuell in drei Stufen anhand der seit dem Einzug gesammelten XP.
- Staubi wurde für das Pflanzenzimmer freigestellt, damit kein weißer Kasten mehr sichtbar ist.
- Die Räume verwenden aktuell dasselbe illustrierte Grundzimmer mit unterschiedlichen Farbstimmungen. Eigene, vollständig generierte Raumkulissen sind noch ein Design-Upgrade.

## Noch offen

1. Den aktuellen lokalen Stand auf einem iPhone visuell prüfen und danach veröffentlichen.
2. Eigene Hintergrundbilder für Aufräumen, Müll, Einkauf und Hausflur generieren. Momentan werden verwandte vorhandene Bilder wiederverwendet.
3. Eigene Kulissen für Schlafzimmer, Küche und Bad generieren, statt das Wohnzimmer farblich abzuwandeln.
4. Weitere freigestellte Pflanzenillustrationen erstellen, damit die zwölf Pflanzen nicht nur zwei Bildtypen verwenden.
5. Abschlussanimation weiter ausbauen: XP-Kaskade, sichtbares Pflanzenwachstum und stärkere Staubi-Reaktion.
6. Optional Paar-Aufgaben als „gemeinsam gestartet“ mit laufendem Status ausbauen; derzeit ist „Gemeinsam“ eine Abschlussoption.
7. Design-QA auf einem echten iPhone durchführen, besonders Pflanzenzimmer, Kategorien und Bottom-Navigation.

## Technischer Aufbau

- Next-/Vinext-App unter `app/`
- Cloudflare D1 über Binding `DB`
- R2 über Binding `IMAGES`
- Hosting-Konfiguration in `.openai/hosting.json`
- Zentrale Datenlogik in `db/store.ts`
- Schemabeschreibung in `db/schema.ts`
- API-Routen in `app/api/`
- Pflanzenzimmer-Styling in `app/garden-game.css`
- Mobile Hausi-Oberfläche überwiegend in `app/mobile.css`

### Neue Datenbankänderung

`drizzle/0007_garden_rooms.sql` ergänzt `garden_collection.room` mit dem Standard `Wohnzimmer`.

### Tagesbonus-Logik

Der Bonus wird aus der Anzahl unterschiedlicher Aktivitätszeitpunkte des aktuellen UTC-Tages berechnet. Paar-Abschlüsse erzeugen zwei Ereignisse mit demselben Zeitstempel und zählen daher als eine gemeinsame Aktivität.

## Wichtige Produktentscheidungen

- Keine ewige Rangliste; stattdessen persönliche Level und Wochenmission.
- Flexible Hausarbeiten zählen nicht automatisch als „offen“.
- Pro Tag werden drei flexible Hausis deterministisch vorgeschlagen.
- Hausis sollen mit einem Tipp erreichbar und mit einem weiteren Tipp abschließbar sein.
- Die Bildsprache soll dem warmen, illustrierten Ladescreen entsprechen.
- Pflanzenzimmer und Staubi bilden langfristig das Minigame.
- Weitere Räume werden erst freigeschaltet, wenn der vorherige Raum voll ist.

## Empfohlener nächster Ablauf am Laptop

1. Repository klonen und Abhängigkeiten installieren.
2. `npm run build` ausführen.
3. App lokal starten und bei iPhone-Breite testen.
4. Hausi-Kategorie einmal öffnen: Es darf keine zweite Ausklappstufe geben.
5. Eine Einzelaufgabe und eine gemeinsame Aufgabe testen; Statistiken und Rückgängig-Funktion kontrollieren.
6. Mehrere Aufgaben ausführen und den steigenden Bonus prüfen.
7. Garten öffnen, Raumtabs und gesperrte Räume prüfen.
8. Erst nach erfolgreicher Prüfung eine neue Sites-Version veröffentlichen.

## Veröffentlichung

Die Custom Domain hängt am Sites-Projekt. Eine neue öffentliche Version benötigt vor dem Deployment eine ausdrückliche Bestätigung, da `cozyflat.cozyquiz.app` öffentlich erreichbar ist.

