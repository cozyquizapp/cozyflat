import { NextResponse } from 'next/server';
import { chooseGardenPlant, getGarden, waterGardenPlant } from '../../../db/store';
import { protectApi } from '../../access';

export async function GET(request:Request) { const denial=await protectApi(request); if(denial)return denial; return NextResponse.json(await getGarden(), {headers:{'cache-control':'no-store'}}); }
export async function POST(request:Request) {
  const denial=await protectApi(request); if(denial)return denial;
  const body=await request.json() as {action?:string;collectionKey?:string;plantKey?:string;person?:string;room?:string};
  const person=body.person==='Sonja'?'Sonja':'Johannes';
  if(body.action==='water') return NextResponse.json(await waterGardenPlant(String(body.collectionKey??''),person),{headers:{'cache-control':'no-store'}});
  return NextResponse.json(await chooseGardenPlant(String(body.plantKey??''),person,String(body.room??'Wohnzimmer')),{headers:{'cache-control':'no-store'}});
}
