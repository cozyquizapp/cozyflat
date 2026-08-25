import { NextRequest, NextResponse } from 'next/server';
import { addPlant, listPlants, removePlant, waterPlant } from '../../../db/store';
import { env } from 'cloudflare:workers';

function personName(value: FormDataEntryValue | string | null | undefined) {
  return value === 'Sonja' || value === 'Sie' ? 'Sonja' : 'Johannes';
}

export async function GET() { return NextResponse.json(await listPlants()); }
export async function POST(request:NextRequest) {
  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await request.formData(); const file = form.get('image'); let imageKey:string|null = null;
    if (file instanceof File && file.size) { imageKey = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'')}`; await env.IMAGES.put(imageKey, file.stream(), { httpMetadata:{contentType:file.type || 'image/jpeg'} }); }
    await addPlant(String(form.get('name')||'').trim().slice(0,60),String(form.get('room')||'').trim().slice(0,60),Math.max(1,Math.min(90,Number(form.get('interval'))||7)),personName(form.get('person')),imageKey);
    return NextResponse.json(await listPlants());
  }
  const body = await request.json() as { action?:string; id?:number; name?:string; room?:string; intervalDays?:number; person?:string };
  if (body.action === 'water' && body.id) await waterPlant(body.id, personName(body.person));
  else if (body.action === 'delete' && body.id) await removePlant(body.id);
  else if (body.name?.trim() && body.room?.trim()) await addPlant(body.name.trim().slice(0,60), body.room.trim().slice(0,60), Math.max(1, Math.min(90, Number(body.intervalDays) || 7)), personName(body.person));
  else return NextResponse.json({error:'Ungültige Eingabe'}, {status:400});
  return NextResponse.json(await listPlants());
}
