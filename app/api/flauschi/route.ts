import { NextResponse } from 'next/server';
import { careForFlauschi, getFlauschiState, type FlauschiAction } from '../../../db/store';

export async function GET() {
  return NextResponse.json(await getFlauschiState(), {headers:{'cache-control':'no-store'}});
}

export async function POST(request:Request) {
  const body=await request.json() as {action?:FlauschiAction;person?:string};
  const action:FlauschiAction=body.action==='brush'||body.action==='play'?body.action:'feed';
  const person=body.person==='Sonja'?'Sonja':'Johannes';
  return NextResponse.json(await careForFlauschi(action,person), {headers:{'cache-control':'no-store'}});
}
