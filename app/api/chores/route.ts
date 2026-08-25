import { NextRequest, NextResponse } from 'next/server';
import { completeChore, listChores } from '../../../db/store';
export async function GET() { return NextResponse.json(await listChores(), { headers: { 'cache-control': 'no-store' } }); }
export async function POST(request: NextRequest) { const body = await request.json() as { id?:number; person?:string }; if (!body.id) return NextResponse.json({error:'Ungültige Aufgabe'}, {status:400}); await completeChore(body.id, body.person === 'Sonja' ? 'Sonja' : 'Johannes'); return NextResponse.json(await listChores()); }
