import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getReservation } from '@/lib/db';

function formatDateIT(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function generateICS(r: { date: string; time: string; name: string }) {
  const [y, m, d] = r.date.split('-').map(Number);
  const [h, min] = r.time.split(':').map(Number);
  const start = new Date(y, m - 1, d, h, min);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  return encodeURIComponent(
    `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n` +
    `DTSTART:${fmt(start)}\nDTEND:${fmt(end)}\n` +
    `SUMMARY:Cena alla Locanda nel Parco\nLOCATION:Locanda nel Parco\n` +
    `DESCRIPTION:Prenotazione per ${r.name}\nEND:VEVENT\nEND:VCALENDAR`,
  );
}

export default async function ConfermaPage({ params }: { params: { id: string } }) {
  const reservation = await getReservation(params.id);
  if (!reservation) notFound();

  const isCancelled = reservation.status === 'cancelled';
  const icsData = generateICS(reservation);

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

      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="card text-center">
          {isCancelled ? (
            <>
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-2xl font-serif mb-2" style={{ color: 'var(--terracotta)' }}>
                Prenotazione cancellata
              </h1>
              <p className="text-sm font-sans text-gray-500 mb-6">
                Questa prenotazione è stata cancellata. Speriamo di rivederti presto!
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">✓</div>
              <h1 className="text-2xl font-serif mb-2" style={{ color: 'var(--forest)' }}>
                Prenotazione confermata!
              </h1>
              <p className="text-sm font-sans text-gray-500 mb-6">
                Ti abbiamo inviato una email di conferma a <strong>{reservation.email}</strong>.
              </p>
            </>
          )}

          <div className="text-left rounded-lg border border-amber-200 overflow-hidden mb-6">
            <div className="px-4 py-2 text-xs font-sans font-medium text-gray-500 uppercase tracking-wide"
                 style={{ background: 'var(--cream)' }}>
              Dettagli prenotazione #{reservation.id.slice(0, 8).toUpperCase()}
            </div>
            {[
              { label: 'Data', value: formatDateIT(reservation.date) },
              { label: 'Orario', value: reservation.time },
              { label: 'Coperti', value: `${reservation.guests} ${reservation.guests === 1 ? 'persona' : 'persone'}` },
              { label: 'Intestatario', value: reservation.name },
              ...(reservation.special_requests ? [{ label: 'Note', value: reservation.special_requests }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between px-4 py-3 border-b border-amber-100 last:border-0">
                <span className="text-sm font-sans text-gray-500">{label}</span>
                <span className="text-sm font-sans font-medium text-right ml-4" style={{ color: '#2C1810' }}>{value}</span>
              </div>
            ))}
          </div>

          {!isCancelled && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`data:text/calendar;charset=utf8,${icsData}`}
                download="locanda-nel-parco.ics"
                className="btn-secondary text-sm text-center"
              >
                📅 Aggiungi al calendario
              </a>
              <Link href={`/cancella/${reservation.id}`} className="btn-danger text-sm text-center">
                Cancella prenotazione
              </Link>
            </div>
          )}

          {isCancelled && (
            <Link href="/" className="btn-primary inline-block">
              Prenota di nuovo
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
