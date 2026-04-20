'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Reservation } from '@/types';

function formatDateIT(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function CancellaPage() {
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then(r => r.json())
      .then(d => setReservation(d.reservation))
      .catch(() => setError('Prenotazione non trovata.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      const r = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Errore durante la cancellazione.');
      } else {
        setCancelled(true);
      }
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <header className="py-8 px-4 text-center" style={{ background: 'var(--forest)' }}>
        <p className="text-xs font-sans tracking-[4px] uppercase mb-1" style={{ color: 'var(--gold)' }}>
          Ristorante
        </p>
        <Link href="/" className="text-2xl font-serif" style={{ color: 'var(--cream)' }}>
          Locanda nel Parco
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-10">
        <div className="card">
          {loading ? (
            <p className="text-center text-sm font-sans text-gray-400 py-8">Caricamento...</p>
          ) : cancelled ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✓</div>
              <h1 className="text-xl font-serif mb-2" style={{ color: 'var(--forest)' }}>
                Prenotazione cancellata
              </h1>
              <p className="text-sm font-sans text-gray-500 mb-6">
                Ti abbiamo inviato una conferma via email. Speriamo di rivederti presto!
              </p>
              <Link href="/" className="btn-primary inline-block">
                Prenota di nuovo
              </Link>
            </div>
          ) : !reservation ? (
            <div className="text-center">
              <p className="text-sm font-sans" style={{ color: 'var(--terracotta)' }}>
                {error || 'Prenotazione non trovata.'}
              </p>
              <Link href="/" className="btn-secondary inline-block mt-4">
                Torna alla home
              </Link>
            </div>
          ) : reservation.status === 'cancelled' ? (
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <p className="font-serif text-lg mb-2" style={{ color: 'var(--terracotta)' }}>
                Questa prenotazione è già stata cancellata.
              </p>
              <Link href="/" className="btn-primary inline-block mt-4">
                Prenota di nuovo
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-serif mb-4" style={{ color: 'var(--forest)' }}>
                Cancella prenotazione
              </h1>

              <div className="rounded-lg border border-amber-200 overflow-hidden mb-6">
                {[
                  { label: 'Data', value: formatDateIT(reservation.date) },
                  { label: 'Orario', value: reservation.time },
                  { label: 'Coperti', value: `${reservation.guests} persone` },
                  { label: 'Intestatario', value: reservation.name },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-4 py-3 border-b border-amber-100 last:border-0">
                    <span className="text-sm font-sans text-gray-500">{label}</span>
                    <span className="text-sm font-sans font-medium" style={{ color: '#2C1810' }}>{value}</span>
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm font-sans text-red-600 bg-red-50 px-4 py-3 rounded-lg mb-4">
                  {error}
                </p>
              )}

              <p className="text-sm font-sans text-gray-500 mb-5">
                Sei sicuro di voler cancellare questa prenotazione? L'operazione non è reversibile.
              </p>

              <div className="flex gap-3">
                <Link href={`/conferma/${id}`} className="btn-secondary flex-1 text-center text-sm">
                  Torna indietro
                </Link>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="btn-danger flex-1 text-sm disabled:opacity-50"
                >
                  {cancelling ? 'Cancellazione...' : 'Sì, cancella'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
