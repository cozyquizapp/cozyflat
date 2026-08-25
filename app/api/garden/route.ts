import { NextResponse } from 'next/server';
import { chooseGardenPlant, getGarden } from '../../../db/store';

export async function GET() { return NextResponse.json(await getGarden(), {headers:{'cache-control':'no-store'}}); }
export async function POST(request:Request) { const body=await request.json() as {plantKey?:string;person?:string}; return NextResponse.json(await chooseGardenPlant(String(body.plantKey??''),body.person==='Sonja'?'Sonja':'Johannes'),{headers:{'cache-control':'no-store'}}); }
