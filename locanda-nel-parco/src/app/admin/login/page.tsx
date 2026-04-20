'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('Password errata.');
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-sans tracking-[4px] uppercase mb-1" style={{ color: 'var(--gold)' }}>
            Pannello Admin
          </p>
          <h1 className="text-2xl font-serif" style={{ color: 'var(--forest)' }}>
            Locanda nel Parco
          </h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                className="field"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>
            {error && (
              <p className="text-sm font-sans text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Accesso...' : 'Accedi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
