'use client';

import { useEffect, useState } from 'react';
import type { DailyOverride } from '@/types';

function formatDateIT(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function OverridesPage() {
  const [overrides, setOverrides] = useState<DailyOverride[]>([]);
  const [loading, setLoading]     = useState(true);
  const [date, setDate]           = useState('');
  const [seats, setSeats]         = useState('');
  const [note, setNote]           = useState('');
  const [adding, setAdding]       = useState(false);
  const [error, setError]         = useState('');
  const [saved, setSaved]         = useState(false);

  const load = async () => {
    const r = await fetch('/api/admin/overrides');
    const d = await r.json();
    setOverrides(d.overrides || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || seats === '') return;
    setAdding(true);
    setError('');
    setSaved(false);
    try {
      const r = await fetch('/api/admin/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, max_seats: Number(seats), note }),
      });
      const data = await r.json();
      if (r.ok) {
        setDate('');
        setSeats('');
        setNote('');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        load();
      } else {
        setError(data.error || 'Errore.');
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (dateKey: string) => {
    await fetch(`/api/admin/overrides/${dateKey}`, { method: 'DELETE' });
    load();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif mb-2" style={{ color: 'var(--forest)' }}>
        Posti per data
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Sovrascrive la capienza standard per un giorno specifico.
        Metti <strong>0</strong> per bloccare completamente le prenotazioni.
      </p>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Imposta capienza per una data</h2>
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
                min={today}
                className="field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Posti massimi *
              </label>
              <input
                type="number"
                required
                min={0}
                max={500}
                value={seats}
                onChange={e => setSeats(e.target.value)}
                placeholder="es. 40"
                className="field"
              />
              <p className="text-xs text-gray-400 mt-1">0 = giornata chiusa</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Nota (opzionale)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Evento privato, matrimonio..."
              className="field"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-700">✓ Salvato!</p>}
          <button
            type="submit"
            disabled={adding || !date || seats === ''}
            className="btn-primary disabled:opacity-50"
          >
            {adding ? 'Salvataggio...' : '+ Imposta capienza'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Date con capienza personalizzata</h2>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Caricamento...</p>
        ) : overrides.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Nessuna capienza personalizzata impostata.
          </p>
        ) : (
          <ul>
            {overrides.map(o => (
              <li
                key={o.date}
                className="flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">{formatDateIT(o.date)}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      o.max_seats === 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {o.max_seats === 0 ? 'Chiuso' : `${o.max_seats} posti`}
                    </span>
                    {o.note && <span className="text-xs text-gray-500">{o.note}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(o.date)}
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
