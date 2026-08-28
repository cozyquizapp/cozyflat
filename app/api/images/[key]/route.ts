import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { protectApi } from '../../../access';

export async function GET(request:Request,{params}:{params:Promise<{key:string}>}) {
  const denial=await protectApi(request); if(denial)return denial;
  const {key}=await params; const object=await env.IMAGES.get(key);
  if(!object)return new NextResponse('Nicht gefunden',{status:404});
  const headers=new Headers(); object.writeHttpMetadata(headers); headers.set('etag',object.httpEtag); headers.set('cache-control','public, max-age=31536000, immutable');
  return new NextResponse(object.body,{headers});
}
