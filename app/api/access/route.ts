import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  accessProtectionEnabled,
  createReminderLink,
  deviceCookieValue,
  inviteTokenIsValid,
  protectApi,
} from '../../access';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ error: 'Anfrage nicht erlaubt' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Anfrage nicht erlaubt' }, { status: 403 });
    }
  }
  const body = await request.json().catch(() => ({})) as { token?: string };
  if (!accessProtectionEnabled()) {
    return NextResponse.json({ error: 'Geräteschutz ist noch nicht aktiviert' }, { status: 503 });
  }
  if (!(await inviteTokenIsValid(String(body.token ?? '')))) {
    return NextResponse.json({ error: 'Ungültiger Gerätecode' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  }
  const response = NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  response.cookies.set(ACCESS_COOKIE, await deviceCookieValue(), {
    httpOnly: true,
    secure: true,
    // Lax keeps Home-Screen and Apple-Reminder top-level launches signed in.
    // Mutating APIs are additionally protected by an origin/fetch-site check.
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_MAX_AGE,
  });
  return response;
}

export async function GET(request: Request) {
  const denial = await protectApi(request);
  if (denial) return denial;
  const url = new URL(request.url);
  const person = url.searchParams.get('person') === 'Sonja' ? 'Sonja' : 'Johannes';
  return NextResponse.json({ url: await createReminderLink(request, person) }, { headers: { 'cache-control': 'no-store' } });
}
