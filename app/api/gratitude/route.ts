import { NextResponse } from 'next/server';
import { getGratitude, saveGratitude } from '../../../db/store';
import { protectApi } from '../../access';

function personFrom(value:unknown) {
  return value==='Sonja'?'Sonja':'Johannes';
}

export async function GET(request:Request) {
  const denial=await protectApi(request); if(denial)return denial;
  const person=personFrom(new URL(request.url).searchParams.get('person'));
  return NextResponse.json(await getGratitude(person),{headers:{'cache-control':'no-store'}});
}

export async function POST(request:Request) {
  const denial=await protectApi(request); if(denial)return denial;
  const body=await request.json() as {person?:string;text?:string};
  return NextResponse.json(await saveGratitude(personFrom(body.person),typeof body.text==='string'?body.text:''),{headers:{'cache-control':'no-store'}});
}
