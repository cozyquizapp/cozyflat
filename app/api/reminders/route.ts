import { NextResponse } from 'next/server';
import { listPlants } from '../../../db/store';

export async function GET() {
  const plants = await listPlants();
  const today = new Date(); today.setHours(0,0,0,0);
  const reminders = plants.flatMap((plant) => {
    const due = new Date(new Date(plant.lastWateredAt).getTime() + plant.intervalDays * 86400000); due.setHours(0,0,0,0);
    if (due.getTime() > today.getTime()) return [];
    return [{
      id: `giessrunde-${plant.id}-${plant.lastWateredAt.slice(0,10)}`,
      title: `${plant.name} gießen`,
      notes: `Standort: ${plant.room}\nDanach in der Gießrunde als gegossen markieren.\nKennung: giessrunde-${plant.id}`,
      dueDate: new Date().toISOString().slice(0,10),
      list: 'Familie',
      appUrl: 'https://giessrunde-zuhause.hqv8s9bhsp.chatgpt.site/',
    }];
  });
  return NextResponse.json({ reminders, checkedAt: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } });
}
