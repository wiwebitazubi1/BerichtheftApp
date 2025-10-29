"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Registration form component.  Allows new users to create an account by
 * specifying their email, password and role.  Once registered, the user is
 * automatically logged in via the returned cookie and redirected to the
 * calendar.
 */
export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'AZUBI' | 'AUSBILDER'>('AZUBI');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });
      if (res.ok) {
        // After registration the API returns a cookie for authentication
        router.push('/calendar');
      } else {
        const data = await res.json();
        setError(data.error || 'Registrierung fehlgeschlagen');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional"
          className="w-full rounded border border-input bg-background p-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">E‑Mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border border-input bg-background p-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Passwort</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded border border-input bg-background p-2"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium">Rolle</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'AZUBI' | 'AUSBILDER')}
          className="w-full rounded border border-input bg-background p-2"
        >
          <option value="AZUBI">Azubi</option>
          <option value="AUSBILDER">Ausbilder</option>
        </select>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Registrieren…' : 'Registrieren'}
      </button>
      <p className="text-center text-sm">
        Bereits registriert?{' '}
        <a href="/login" className="underline hover:text-primary">Zum Login</a>
      </p>
    </form>
  );
}