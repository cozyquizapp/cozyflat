'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type GateState = 'ready' | 'checking' | 'error';
type Person = 'Johannes' | 'Sonja';

function currentReturnTarget() {
  return `${window.location.pathname}${window.location.search}` || '/';
}

function personFromTarget(target: string): Person | null {
  const value = new URL(target, window.location.origin).searchParams.get('person');
  return value === 'Johannes' || value === 'Sonja' ? value : null;
}

function targetForPerson(target: string, person: Person) {
  const url = new URL(target, window.location.origin);
  url.searchParams.set('person', person);
  return `${url.pathname}${url.search}`;
}

export default function AccessGate() {
  const [state, setState] = useState<GateState>('ready');
  const [message, setMessage] = useState('');
  const [person, setPerson] = useState<Person | null>(null);

  const unlock = useCallback(async (token: string, target = currentReturnTarget(), selectedPerson = person) => {
    const cleanToken = token.trim();
    const activePerson = personFromTarget(target) ?? selectedPerson;
    if (!activePerson) {
      setState('error');
      setMessage('Bitte zuerst auswählen, wem dieses iPhone gehört.');
      return;
    }
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
      localStorage.setItem('cozyflat-person', activePerson);
      localStorage.setItem('cozyflat-profile-bound', 'v2');
      window.location.replace(targetForPerson(target, activePerson));
    } catch {
      setState('error');
      setMessage('Der Gerätecode stimmt nicht. Prüft bitte den privaten Link.');
    }
  }, [person]);

  useEffect(() => {
    const linkedPerson = personFromTarget(currentReturnTarget());
    const savedPerson = localStorage.getItem('cozyflat-person');
    setPerson(linkedPerson ?? (savedPerson === 'Johannes' || savedPerson === 'Sonja' ? savedPerson : null));
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
          <h1 id="access-title">Dieses iPhone richtig verbinden.</h1>
          <p>Wählt zuerst, wem dieses iPhone gehört. CozyFlat merkt sich danach Profil und Freischaltung sechs Monate lang.</p>
          <form onSubmit={submit}>
            <fieldset className="access-person-picker">
              <legend>Dieses CozyFlat gehört …</legend>
              <div>
                {(['Johannes', 'Sonja'] as const).map((option) => (
                  <button
                    aria-pressed={person === option}
                    className={person === option ? 'active' : ''}
                    key={option}
                    onClick={() => {
                      setPerson(option);
                      setState('ready');
                      setMessage('');
                    }}
                    type="button"
                  >
                    <img src={`/avatar-${option.toLowerCase()}.webp`} alt="" />
                    <span><b>{option}</b><small>{option === 'Sonja' ? 'Sonjas iPhone' : 'Johannes’ iPhone'}</small></span>
                    <i aria-hidden="true">{person === option ? '✓' : ''}</i>
                  </button>
                ))}
              </div>
            </fieldset>
            <label htmlFor="device-token">Privater Gerätecode</label>
            <div>
              <input id="device-token" name="token" type="password" autoComplete="one-time-code" placeholder="Code einmalig einfügen" disabled={state === 'checking'} />
              <button type="submit" disabled={state === 'checking'}>{state === 'checking' ? 'Prüfe …' : 'iPhone freischalten'}</button>
            </div>
          </form>
          {message && <p className={`access-gate-status ${state}`} role="status">{message}</p>}
          <small>Profil und Gerätecode werden nur auf diesem iPhone gespeichert.</small>
        </div>
      </section>
    </main>
  );
}
