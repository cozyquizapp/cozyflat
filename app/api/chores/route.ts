import { NextRequest, NextResponse } from 'next/server';
import { completeChore, listChores, removeChore, saveChore, undoChoreCompletion } from '../../../db/store';
import { protectApi } from '../../access';
export async function GET(request: Request) { const denial=await protectApi(request); if(denial)return denial; return NextResponse.json(await listChores(), { headers: { 'cache-control': 'no-store' } }); }
export async function POST(request: NextRequest) {
  const denial=await protectApi(request); if(denial)return denial;
  const body = await request.json() as { action?:string; id?:number; eventId?:number; eventIds?:number[]; person?:string; together?:boolean; name?:string; category?:string; icon?:string; intervalDays?:number; points?:number; paused?:boolean; scheduleMode?:string; cadenceHours?:number; priority?:number; dueTime?:string|null };
  if (body.action === 'save') { if (!body.name?.trim() || !body.category?.trim()) return NextResponse.json({error:'Name und Kategorie fehlen'}, {status:400}); const cadenceHours=Math.max(4,Math.min(8760,Number(body.cadenceHours)||24)); await saveChore({id:body.id,name:body.name.trim().slice(0,60),category:body.category.trim().slice(0,40),icon:(body.icon||'✓').slice(0,4),intervalDays:Math.max(1,Math.round(cadenceHours/24)),points:Math.max(1,Math.min(100,Number(body.points)||5)),paused:Boolean(body.paused),scheduleMode:body.scheduleMode==='scheduled'?'scheduled':'flexible',cadenceHours,priority:Math.max(1,Math.min(3,Number(body.priority)||2)),dueTime:/^\d{2}:\d{2}$/.test(body.dueTime||'')?body.dueTime!:null}); return NextResponse.json({chores:await listChores()}); }
  if (body.action === 'delete' && body.id) { await removeChore(body.id); return NextResponse.json({chores:await listChores()}); }
  if (body.action === 'undo' && body.id && (body.eventIds?.length || body.eventId)) { await undoChoreCompletion(body.id,body.eventIds?.length ? body.eventIds : [body.eventId!]); return NextResponse.json({chores:await listChores()}); }
  if (!body.id) return NextResponse.json({error:'Ungültige Aufgabe'}, {status:400});
  const completion = await completeChore(body.id, body.person === 'Sonja' ? 'Sonja' : 'Johannes', Boolean(body.together));
  return NextResponse.json({chores:await listChores(),completion});
}
