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

function nextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  return dt.toISOString().split('T')[0];
}

function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  let cur = from;
  while (cur <= to) {
    dates.push(cur);
    cur = nextDay(cur);
  }
  return dates;
}

export default function ChiusurePage() {
  const router = useRouter();
  const [closures, setClosures] = useState<SpecialClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]   = useState('');
  const [reason, setReason]   = useState('');
  const [adding, setAdding]   = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError]     = useState('');

  const loadClosures = async () => {
    const r = await fetch('/api/admin/closures');
    const data = await r.json();
    setClosures(data.closures || []);
    setLoading(false);
  };

  useEffect(() => { loadClosures(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateFrom) return;
    setAdding(true);
    setError('');
    setProgress('');

    const dates = dateTo && dateTo >= dateFrom
      ? datesBetween(dateFrom, dateTo)
      : [dateFrom];

    try {
      for (let i = 0; i < dates.length; i++) {
        if (dates.length > 1) setProgress(`Aggiunta ${i + 1}/${dates.length}...`);
        const r = await fetch('/api/admin/closures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dates[i], reason }),
        });
        if (!r.ok) {
          const d = await r.json();
          setError(d.error || `Errore sulla data ${dates[i]}.`);
          break;
        }
      }
      setDateFrom('');
      setDateTo('');
      setReason('');
      setProgress('');
      loadClosures();
      router.refresh();
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

  const today = new Date().toISOString().split('T')[0];

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
                Dal giorno *
              </label>
              <input
                type="date"
                required
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                min={today}
                className="field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Al giorno (opzionale)
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                min={dateFrom || today}
                className="field"
              />
              <p className="text-xs text-gray-400 mt-1">Lascia vuoto per un solo giorno</p>
            </div>
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
          {error    && <p className="text-sm text-red-600">{error}</p>}
          {progress && <p className="text-sm text-blue-600">{progress}</p>}
          <button type="submit" disabled={adding || !dateFrom} className="btn-primary disabled:opacity-50">
            {adding ? (progress || 'Aggiunta...') : '+ Aggiungi chiusura'}
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
