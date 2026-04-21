'use client';

import { useState, useEffect } from 'react';
import type { Reservation, Config } from '@/types';

const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

function formatDateShort(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MESI[m - 1]} ${y}`;
}

function StatusBadge({ status }: { status: Reservation['status'] }) {
  const map = {
    confirmed: { label: 'Confermata', cls: 'badge-confirmed' },
    cancelled:  { label: 'Cancellata', cls: 'badge-cancelled' },
    no_show:    { label: 'No show',    cls: 'badge-no_show' },
  };
  const { label, cls } = map[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function AdminDashboard({
  reservations: initialReservations,
  config,
  today,
}: {
  reservations: Reservation[];
  config: Config;
  today: string;
}) {
  const [reservations, setReservations] = useState(initialReservations);
  const [filterDate, setFilterDate] = useState(today);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Fetch fresco al mount per bypassare la Router Cache di Next.js
  useEffect(() => {
    fetch('/api/admin/reservations')
      .then(r => r.json())
      .then(d => { if (d.reservations) setReservations(d.reservations); })
      .catch(() => {});
  }, []);

  const filtered = reservations.filter(r =>
    filterDate ? r.date === filterDate : true,
  );

  const todayReservations = reservations.filter(r => r.date === today && r.status === 'confirmed');
  const pranzoToday = todayReservations.filter(r => parseInt(r.time.split(':')[0], 10) < 15);
  const cenaToday   = todayReservations.filter(r => parseInt(r.time.split(':')[0], 10) >= 15);
  const pranzoGuests = pranzoToday.reduce((s, r) => s + r.guests, 0);
  const cenaGuests   = cenaToday.reduce((s, r) => s + r.guests, 0);
  const pranzoAvail  = (config.max_seats_pranzo || 0) - pranzoGuests;
  const cenaAvail    = (config.max_seats_cena   || 0) - cenaGuests;

  const next7Guests = reservations
    .filter(r => r.date >= today && r.date <= addDays(today, 7) && r.status === 'confirmed')
    .reduce((s, r) => s + r.guests, 0);

  async function updateStatus(id: string, status: Reservation['status']) {
    setUpdatingId(id);
    setActionError('');
    try {
      const r = await fetch(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (r.ok) {
        setReservations(prev => prev.map(res => res.id === id ? { ...res, status } : res));
      } else {
        const data = await r.json();
        setActionError(data.error || 'Errore nel cambio di stato');
      }
    } catch {
      setActionError('Errore di rete');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-serif mb-6" style={{ color: 'var(--forest)' }}>
        Dashboard · {formatDateShort(today)}
      </h1>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Pranzo oggi */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Pranzo oggi</div>
          <div className="text-3xl font-serif font-bold" style={{ color: 'var(--forest)' }}>{pranzoGuests}</div>
          <div className="text-xs text-gray-500 mt-1">
            prenotati ·{' '}
            <span style={{ color: pranzoAvail < 10 ? 'var(--terracotta)' : 'var(--sage)', fontWeight: 600 }}>
              {pranzoAvail} liberi
            </span>
            {' '}/ {config.max_seats_pranzo || '—'}
          </div>
        </div>

        {/* Cena oggi */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Cena oggi</div>
          <div className="text-3xl font-serif font-bold" style={{ color: 'var(--forest)' }}>{cenaGuests}</div>
          <div className="text-xs text-gray-500 mt-1">
            prenotati ·{' '}
            <span style={{ color: cenaAvail < 10 ? 'var(--terracotta)' : 'var(--sage)', fontWeight: 600 }}>
              {cenaAvail} liberi
            </span>
            {' '}/ {config.max_seats_cena || '—'}
          </div>
        </div>

        {/* Prossimi 7gg */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Prossimi 7 giorni</div>
          <div className="text-3xl font-serif font-bold" style={{ color: 'var(--forest)' }}>{next7Guests}</div>
          <div className="text-xs text-gray-500 mt-1">coperti prenotati</div>
        </div>
      </div>

      {/* Filtro data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Prenotazioni</h2>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Tutte le date
              </button>
            )}
          </div>
        </div>

          {actionError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 border-b border-red-100">{actionError}</p>
        )}
      {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            Nessuna prenotazione {filterDate ? 'per questa data' : ''}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Ora</th>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Coperti</th>
                  <th className="px-4 py-3 font-medium">Telefono</th>
                  <th className="px-4 py-3 font-medium">Stato</th>
                  <th className="px-4 py-3 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-700">{formatDateShort(r.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.time}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{r.name}</div>
                      <div className="text-xs text-gray-400">{r.email}</div>
                      {r.special_requests && (
                        <div className="text-xs text-amber-600 mt-0.5">"{r.special_requests}"</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--forest)' }}>
                      {r.guests}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.phone || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {r.status === 'confirmed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(r.id, 'no_show')}
                            disabled={updatingId === r.id}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
                          >
                            No show
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, 'cancelled')}
                            disabled={updatingId === r.id}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            Cancella
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return date.toISOString().split('T')[0];
}
