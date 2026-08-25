import { NextResponse } from 'next/server';
import { getWateringStats, registerVisit } from '../../../db/store';

export async function GET() {
  return NextResponse.json(await getWateringStats(), { headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: Request) {
  const body = await request.json() as {person?:string;day?:string};
  const person = body.person === 'Sonja' ? 'Sonja' : 'Johannes';
  const day = /^\d{4}-\d{2}-\d{2}$/.test(body.day ?? '') ? body.day! : new Date().toISOString().slice(0,10);
  return NextResponse.json(await registerVisit(person, day), { headers: { 'cache-control': 'no-store' } });
}
