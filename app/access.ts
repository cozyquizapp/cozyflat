import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const ACCESS_COOKIE = '__Host-cozyflat-device';
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 180;

function configuredSecret() {
  try {
    const runtimeSecret = (env as unknown as Record<string, unknown>).COZYFLAT_ACCESS_TOKEN;
    if (typeof runtimeSecret === 'string' && runtimeSecret.trim()) return runtimeSecret.trim();
  } catch {
    // Local type-checking and builds do not always expose the Workers runtime.
  }
  return process.env.COZYFLAT_ACCESS_TOKEN?.trim() ?? '';
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function expectedDeviceCookie(secret = configuredSecret()) {
  return sha256(`cozyflat-device-v1:${secret}`);
}

async function expectedReminderToken(secret = configuredSecret()) {
  return sha256(`cozyflat-reminders-v1:${secret}`);
}

function cookieFromHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return '';
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) return decodeURIComponent(item.slice(separator + 1).trim());
  }
  return '';
}

export function accessProtectionEnabled() {
  return Boolean(configuredSecret());
}

export async function inviteTokenIsValid(candidate: string) {
  const secret = configuredSecret();
  if (!secret || !candidate) return false;
  const [candidateDigest, secretDigest] = await Promise.all([sha256(candidate), sha256(secret)]);
  return constantTimeEqual(candidateDigest, secretDigest);
}

export async function deviceCookieValue() {
  const secret = configuredSecret();
  return secret ? expectedDeviceCookie(secret) : '';
}

export async function browserHasAccess() {
  const secret = configuredSecret();
  if (!secret) return true;
  const cookieStore = await cookies();
  const candidate = cookieStore.get(ACCESS_COOKIE)?.value ?? '';
  return constantTimeEqual(candidate, await expectedDeviceCookie(secret));
}

export async function requestHasAccess(request: Request) {
  const secret = configuredSecret();
  if (!secret) return true;
  const candidate = cookieFromHeader(request.headers.get('cookie'), ACCESS_COOKIE);
  return constantTimeEqual(candidate, await expectedDeviceCookie(secret));
}

export async function reminderRequestHasAccess(request: Request) {
  if (await requestHasAccess(request)) return true;
  const secret = configuredSecret();
  if (!secret) return true;
  const url = new URL(request.url);
  const candidate = url.searchParams.get('access') ?? '';
  return constantTimeEqual(candidate, await expectedReminderToken(secret));
}

function sameOriginMutation(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function protectApi(request: Request) {
  if (!(await requestHasAccess(request))) {
    return NextResponse.json({ error: 'Gerät nicht freigeschaltet' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD' && !sameOriginMutation(request)) {
    return NextResponse.json({ error: 'Anfrage nicht erlaubt' }, { status: 403, headers: { 'cache-control': 'no-store' } });
  }
  return null;
}

export async function protectReminderApi(request: Request) {
  if (await reminderRequestHasAccess(request)) return null;
  return NextResponse.json({ error: 'Erinnerungslink nicht freigeschaltet' }, { status: 401, headers: { 'cache-control': 'no-store' } });
}

export async function createReminderLink(request: Request, person: 'Johannes' | 'Sonja') {
  const secret = configuredSecret();
  const url = new URL('/api/reminders', new URL(request.url).origin);
  url.searchParams.set('person', person);
  if (secret) url.searchParams.set('access', await expectedReminderToken(secret));
  return url.toString();
}
