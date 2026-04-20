'use client';

import { useEffect, useState } from 'react';
import type { Config } from '@/types';

const GIORNI_SETTIMANA = [
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
  { value: 0, label: 'Domenica' },
];

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [newSlot, setNewSlot] = useState('');

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(d => setConfig(d.config))
      .catch(() => setError('Errore nel caricamento.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const r = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const text = await r.text();
      let data: { config?: Config; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        setError(`Risposta non valida (HTTP ${r.status}): ${text.slice(0, 200)}`);
        return;
      }
      if (r.ok) {
        setConfig(data.config!);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Errore nel salvataggio.');
      }
    } catch (err) {
      setError('Errore fetch: ' + String(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    if (!config) return;
    const days = config.active_days.includes(day)
      ? config.active_days.filter(d => d !== day)
      : [...config.active_days, day].sort();
    setConfig({ ...config, active_days: days });
  };

  const addSlot = () => {
    if (!config || !newSlot.match(/^\d{2}:\d{2}$/)) return;
    if (config.time_slots.includes(newSlot)) return;
    const sorted = [...config.time_slots, newSlot].sort();
    setConfig({ ...config, time_slots: sorted });
    setNewSlot('');
  };

  const removeSlot = (slot: string) => {
    if (!config) return;
    setConfig({ ...config, time_slots: config.time_slots.filter(s => s !== slot) });
  };

  if (loading) return <p className="text-sm text-gray-400 py-10 text-center">Caricamento...</p>;
  if (!config) return <p className="text-sm text-red-500 py-10 text-center">{error}</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif mb-6" style={{ color: 'var(--forest)' }}>
        Configurazione
      </h1>

      <div className="space-y-6">
        {/* Posti massimi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Capienza</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Posti massimi per turno
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={config.max_seats}
                onChange={e => setConfig({ ...config, max_seats: Number(e.target.value) })}
                className="field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Ore per cancellazione
              </label>
              <input
                type="number"
                min={0}
                max={72}
                value={config.cancellation_hours}
                onChange={e => setConfig({ ...config, cancellation_hours: Number(e.target.value) })}
                className="field"
              />
              <p className="text-xs text-gray-400 mt-1">
                Il cliente può cancellare entro {config.cancellation_hours}h dall'orario prenotato.
              </p>
            </div>
          </div>
        </div>

        {/* Giorni attivi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Giorni di apertura</h2>
          <div className="flex flex-wrap gap-3">
            {GIORNI_SETTIMANA.map(({ value, label }) => {
              const active = config.active_days.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleDay(value)}
                  className={[
                    'px-4 py-2 rounded-full text-sm border transition',
                    active
                      ? 'border-forest text-cream font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300',
                  ].join(' ')}
                  style={active ? { background: 'var(--forest)', borderColor: 'var(--forest)' } : {}}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orari */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Turni prenotabili</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {config.time_slots.map(slot => (
              <div
                key={slot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-sm text-gray-700"
              >
                {slot}
                <button
                  onClick={() => removeSlot(slot)}
                  className="text-gray-400 hover:text-red-500 transition ml-1 leading-none"
                  aria-label={`Rimuovi ${slot}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={newSlot}
              onChange={e => setNewSlot(e.target.value)}
              className="field w-32"
            />
            <button
              onClick={addSlot}
              disabled={!newSlot}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              + Aggiungi
            </button>
          </div>
        </div>

        {/* Salva */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg">
            ✓ Configurazione salvata!
          </p>
        )}
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </div>
    </div>
  );
}
