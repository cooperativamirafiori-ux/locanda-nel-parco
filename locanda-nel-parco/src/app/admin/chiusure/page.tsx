'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SpecialClosure } from '@/types';

function formatDateIT(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function ChiusurePage() {
  const router = useRouter();
  const [closures, setClosures] = useState<SpecialClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const loadClosures = async () => {
    const r = await fetch('/api/admin/closures');
    const data = await r.json();
    setClosures(data.closures || []);
    setLoading(false);
  };

  useEffect(() => { loadClosures(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setAdding(true);
    setError('');
    try {
      const r = await fetch('/api/admin/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, reason }),
      });
      if (r.ok) {
        setDate('');
        setReason('');
        loadClosures();
        router.refresh();
      } else {
        const d = await r.json();
        setError(d.error || 'Errore.');
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/closures/${id}`, { method: 'DELETE' });
    loadClosures();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif mb-6" style={{ color: 'var(--forest)' }}>
        Chiusure speciali
      </h1>

      {/* Form aggiunta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Aggiungi chiusura</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Motivo (opzionale)
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ferie, evento privato..."
                className="field"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={adding || !date} className="btn-primary disabled:opacity-50">
            {adding ? 'Aggiunta...' : '+ Aggiungi chiusura'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Date chiuse</h2>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Caricamento...</p>
        ) : closures.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Nessuna chiusura speciale programmata.
          </p>
        ) : (
          <ul>
            {closures.map(c => (
              <li
                key={c.id}
                className="flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">{formatDateIT(c.date)}</div>
                  {c.reason && <div className="text-xs text-gray-500 mt-0.5">{c.reason}</div>}
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-red-500 hover:text-red-700 transition px-2 py-1"
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
