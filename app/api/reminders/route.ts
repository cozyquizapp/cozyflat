import { NextResponse } from 'next/server';
import { listPlants } from '../../../db/store';

export async function GET() {
  const plants = await listPlants();
  const today = new Date(); today.setHours(0,0,0,0);
  const nudges = [
    'Sonja & Johannes: Diese Pflanze hat Durst. Sehr. Die Gießkanne kennt den Weg.',
    'Kurze Familienansage: Bitte Wasser marsch – Ausreden sind heute leider ausverkauft.',
    'Eilmeldung aus dem Blumentopf: Ich hätte jetzt gern Wasser. Danke, ihr zwei!',
    'Sonja oder Johannes – wer zuerst gießt, gewinnt Ruhm, Ehre und eine zufriedene Pflanze.',
    'Freundliche Erinnerung mit Nachdruck: Gießen. Jetzt. Die Blätter beobachten euch schon.',
  ];
  const reminders = plants.flatMap((plant) => {
    const due = new Date(new Date(plant.lastWateredAt).getTime() + plant.intervalDays * 86400000); due.setHours(0,0,0,0);
    if (due.getTime() > today.getTime()) return [];
    return [{
      id: `giessrunde-${plant.id}-${plant.lastWateredAt.slice(0,10)}`,
      title: `💧 ${plant.name} gießen – los geht’s, ihr zwei!`,
      notes: `${nudges[plant.id % nudges.length]}\n\nStandort: ${plant.room}\nDanach bitte in der Gießrunde als gegossen markieren.\nKennung: giessrunde-${plant.id}`,
      dueDate: new Date().toISOString().slice(0,10),
      list: 'Familie',
      appUrl: 'https://giessrunde-zuhause.hqv8s9bhsp.chatgpt.site/',
    }];
  });
  return NextResponse.json({ reminders, checkedAt: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } });
}
