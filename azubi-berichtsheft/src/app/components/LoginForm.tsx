"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * LoginForm component.  Renders a simple email/password form and submits
 * credentials to the backend.  On success the user is redirected to the
 * calendar page; on failure an error message is displayed.
 */
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push('/calendar');
      } else {
        const data = await res.json();
        setError(data.error || 'Login fehlgeschlagen');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? 'Einloggen…' : 'Einloggen'}
      </button>
      <p className="text-center text-sm">
        Noch keinen Account?{' '}
        <a href="/register" className="underline hover:text-primary">Registrieren</a>
      </p>
    </form>
  );
}