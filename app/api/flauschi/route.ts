import { NextResponse } from 'next/server';
import { careForFlauschi, getFlauschiState, searchWithFlauschi, type FlauschiAction } from '../../../db/store';
import { protectApi } from '../../access';

export async function GET(request:Request) {
  const denial=await protectApi(request); if(denial)return denial;
  return NextResponse.json(await getFlauschiState(), {headers:{'cache-control':'no-store'}});
}

export async function POST(request:Request) {
  const denial=await protectApi(request); if(denial)return denial;
  const body=await request.json() as {kind?:string;action?:FlauschiAction;person?:string;score?:number;bonusCaught?:boolean};
  const person=body.person==='Sonja'?'Sonja':'Johannes';
  if(body.kind==='search') {
    const result=await searchWithFlauschi(person,Number(body.score??0),Boolean(body.bonusCaught));
    return NextResponse.json(result,{status:result.searchResult?200:409,headers:{'cache-control':'no-store'}});
  }
  const action:FlauschiAction=body.action==='brush'||body.action==='play'?body.action:'feed';
  return NextResponse.json(await careForFlauschi(action,person), {headers:{'cache-control':'no-store'}});
}
