import { NextRequest, NextResponse } from 'next/server';
import { completeChore, listChores, removeChore, saveChore, undoChoreCompletion } from '../../../db/store';
export async function GET() { return NextResponse.json(await listChores(), { headers: { 'cache-control': 'no-store' } }); }
export async function POST(request: NextRequest) {
  const body = await request.json() as { action?:string; id?:number; eventId?:number; person?:string; name?:string; category?:string; icon?:string; intervalDays?:number; points?:number; paused?:boolean };
  if (body.action === 'save') { if (!body.name?.trim() || !body.category?.trim()) return NextResponse.json({error:'Name und Kategorie fehlen'}, {status:400}); await saveChore({id:body.id,name:body.name.trim().slice(0,60),category:body.category.trim().slice(0,40),icon:(body.icon||'✓').slice(0,4),intervalDays:Math.max(1,Math.min(365,Number(body.intervalDays)||7)),points:Math.max(1,Math.min(100,Number(body.points)||5)),paused:Boolean(body.paused)}); return NextResponse.json({chores:await listChores()}); }
  if (body.action === 'delete' && body.id) { await removeChore(body.id); return NextResponse.json({chores:await listChores()}); }
  if (body.action === 'undo' && body.id && body.eventId) { await undoChoreCompletion(body.id,body.eventId); return NextResponse.json({chores:await listChores()}); }
  if (!body.id) return NextResponse.json({error:'Ungültige Aufgabe'}, {status:400});
  const eventId = await completeChore(body.id, body.person === 'Sonja' ? 'Sonja' : 'Johannes');
  return NextResponse.json({chores:await listChores(),eventId});
}
