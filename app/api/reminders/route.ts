import { NextRequest, NextResponse } from 'next/server';
import { listChores, listPlants } from '../../../db/store';
import { protectReminderApi } from '../../access';

export async function GET(request: NextRequest) {
  const denial=await protectReminderApi(request); if(denial)return denial;
  const requestedPerson = request.nextUrl.searchParams.get('person');
  const person = requestedPerson === 'Sonja' ? 'Sonja' : 'Johannes';
  const [plants, chores] = await Promise.all([listPlants(), listChores()]);
  const today = new Date(); today.setHours(0,0,0,0);
  const nudges = [
    'Sonja & Johannes: Diese Pflanze hat Durst. Sehr. Die Gießkanne kennt den Weg.',
    'Kurze Familienansage: Bitte Wasser marsch – Ausreden sind heute leider ausverkauft.',
    'Eilmeldung aus dem Blumentopf: Ich hätte jetzt gern Wasser. Danke, ihr zwei!',
    'Sonja oder Johannes – wer zuerst gießt, gewinnt Ruhm, Ehre und eine zufriedene Pflanze.',
    'Freundliche Erinnerung mit Nachdruck: Gießen. Jetzt. Die Blätter beobachten euch schon.',
  ];
  const plantReminders = plants.flatMap((plant) => {
    const due = new Date(new Date(plant.lastWateredAt).getTime() + plant.intervalDays * 86400000); due.setHours(0,0,0,0);
    if (due.getTime() > today.getTime()) return [];
    return [{
      id: `giessrunde-${plant.id}-${plant.lastWateredAt.slice(0,10)}`,
      title: `💧 ${person}, ${plant.name} braucht dich!`,
      notes: `${nudges[plant.id % nudges.length]}\n\nDiese Erinnerung gehört zu: ${person}\nStandort: ${plant.room}\nDanach bitte in CozyFlat als gegossen markieren – dein Profil ist beim Öffnen bereits ausgewählt.\nKennung: cozyflat-${plant.id}`,
      dueDate: new Date().toISOString().slice(0,10),
      list: 'Familie',
      appUrl: `https://giessrunde-zuhause.hqv8s9bhsp.chatgpt.site/?person=${encodeURIComponent(person)}`,
    }];
  });
  const choreNudges = ['Flauschi hat nachgezählt: Diese Aufgabe steht wirklich heute an.','Kleine Zuhause-Ansage: Eine geplante Aufgabe wartet – XP liegen schon bereit.','Gemütlichkeit in Sicht. Diese geplante Aufgabe fehlt noch. Na los!'];
  const choreReminders = chores.flatMap((chore) => {
    if (chore.paused || chore.scheduleMode !== 'scheduled') return [];
    const due = chore.lastCompletedAt ? new Date(new Date(chore.lastCompletedAt).getTime() + chore.cadenceHours * 3600000) : new Date(0);
    if (due.getTime() > Date.now()) return [];
    return [{id:`hausi-${chore.id}-${chore.lastCompletedAt?.slice(0,13) ?? 'offen'}`,title:`${chore.icon} ${person}, heute: ${chore.name}`,notes:`${choreNudges[chore.id % choreNudges.length]}${chore.dueTime ? `\nSpätestens bis: ${chore.dueTime} Uhr` : ''}\nPriorität: ${'!'.repeat(chore.priority)}\n\nDiese Erinnerung gehört zu: ${person}\nDanach bitte in CozyFlat abhaken – dein Profil ist beim Öffnen bereits ausgewählt.`,dueDate:new Date().toISOString().slice(0,10),list:'Familie',appUrl:`https://giessrunde-zuhause.hqv8s9bhsp.chatgpt.site/?person=${encodeURIComponent(person)}#aufgaben`}];
  });
  return NextResponse.json({ reminders: [...choreReminders, ...plantReminders], checkedAt: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } });
}
