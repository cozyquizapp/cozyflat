'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type GateState = 'ready' | 'checking' | 'error';

function currentReturnTarget() {
  return `${window.location.pathname}${window.location.search}` || '/';
}

export default function AccessGate() {
  const [state, setState] = useState<GateState>('ready');
  const [message, setMessage] = useState('');

  const unlock = useCallback(async (token: string, target = currentReturnTarget()) => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setState('error');
      setMessage('Bitte den privaten Gerätecode einfügen.');
      return;
    }
    setState('checking');
    setMessage('Dieses iPhone wird freigeschaltet …');
    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      });
      if (!response.ok) throw new Error('invalid');
      window.location.replace(target);
    } catch {
      setState('error');
      setMessage('Der Gerätecode stimmt nicht. Prüft bitte den privaten Link.');
    }
  }, []);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get('access');
    if (!token) return;
    const target = currentReturnTarget();
    window.history.replaceState(null, '', target);
    const timer = window.setTimeout(() => void unlock(token, target), 0);
    return () => window.clearTimeout(timer);
  }, [unlock]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void unlock(String(form.get('token') ?? ''));
  }

  return (
    <main className="access-gate">
      <section className="access-gate-card" aria-labelledby="access-title">
        <div className="access-gate-art" aria-hidden="true">
          <img src="/loading-mobile-clean.webp" alt="" />
          <span>Privates Zuhause</span>
        </div>
        <div className="access-gate-copy">
          <img className="access-gate-logo" src="/icon-192.png" alt="" />
          <p className="eyebrow">COZYFLAT FÜR SONJA &amp; JOHANNES</p>
          <h1 id="access-title">Einmal freischalten.<br />Dann einfach reinkommen.</h1>
          <p>Öffnet euren privaten Einladungslink auf diesem iPhone. CozyFlat merkt sich das Gerät anschließend sechs Monate lang.</p>
          <form onSubmit={submit}>
            <label htmlFor="device-token">Privater Gerätecode</label>
            <div>
              <input id="device-token" name="token" type="password" autoComplete="one-time-code" placeholder="Code einmalig einfügen" disabled={state === 'checking'} />
              <button type="submit" disabled={state === 'checking'}>{state === 'checking' ? 'Prüfe …' : 'iPhone freischalten'}</button>
            </div>
          </form>
          {message && <p className={`access-gate-status ${state}`} role="status">{message}</p>}
          <small>Der Code bleibt nicht sichtbar und muss im Alltag nicht erneut eingegeben werden.</small>
        </div>
      </section>
    </main>
  );
}
