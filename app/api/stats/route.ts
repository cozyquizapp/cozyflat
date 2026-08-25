import { NextResponse } from 'next/server';
import { getWateringStats } from '../../../db/store';

export async function GET() {
  return NextResponse.json(await getWateringStats(), { headers: { 'cache-control': 'no-store' } });
}
