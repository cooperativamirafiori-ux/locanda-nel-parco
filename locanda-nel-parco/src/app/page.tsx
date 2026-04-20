'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { TimeSlotAvailability } from '@/types';

// ─── Calendario ───────────────────────────────────────────────────────────────

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
               'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const GIORNI_BREVE = ['Do','Lu','Ma','Me','Gi','Ve','Sa'];

function Calendar({
  selectedDate,
  onSelectDate,
  activeDays,
}: {
  selectedDate: string;
  onSelectDate: (d: string) => void;
  activeDays: number[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const canGoPrev = viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      {/* Header mese */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label="Mese precedente"
        >
          ‹
        </button>
        <span className="font-serif text-base font-medium text-forest">
          {MESI[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 transition"
          aria-label="Mese successivo"
        >
          ›
        </button>
      </div>

      {/* Intestazione giorni */}
      <div className="grid grid-cols-7 mb-1">
        {GIORNI_BREVE.map(g => (
          <div key={g} className="text-center text-xs text-gray-400 font-sans pb-2">{g}</div>
        ))}
      </div>

      {/* Celle */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const date = new Date(viewYear, viewMonth, day);
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isPast = date < today;
          const isActive = activeDays.includes(date.getDay());
          const isSelected = dateStr === selectedDate;
          const isToday = date.getTime() === today.getTime();
          const isDisabled = isPast || !isActive;

          return (
            <button
              key={idx}
              onClick={() => !isDisabled && onSelectDate(dateStr)}
              disabled={isDisabled}
              className={[
                'mx-auto w-9 h-9 rounded-full text-sm font-sans flex items-center justify-center transition-all duration-150',
                isSelected
                  ? 'bg-forest text-cream font-semibold shadow-md'
                  : isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isToday
                  ? 'border-2 border-forest text-forest hover:bg-forest/10'
                  : 'text-gray-700 hover:bg-amber-100',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Slot orario ──────────────────────────────────────────────────────────────

function SlotButton({
  slot,
  selected,
  onClick,
}: {
  slot: TimeSlotAvailability;
  selected: boolean;
  onClick: () => void;
}) {
  const isFull = slot.available === 0;
  return (
    <button
      onClick={onClick}
      disabled={isFull}
      className={[
        'px-4 py-2.5 rounded-lg text-sm font-sans border transition-all duration-150',
        selected
          ? 'bg-forest text-cream border-forest font-semibold shadow-sm'
          : isFull
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          : 'bg-white text-gray-700 border-amber-200 hover:border-forest hover:text-forest',
      ].join(' ')}
    >
      {slot.time}
      {isFull && <span className="ml-1 text-xs">(pieno)</span>}
    </button>
  );
}

// ─── Pagina principale ────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();

  // Step del form: 'date' | 'details' | 'submitting'
  const [step, setStep] = useState<'date' | 'details'>('date');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dati calendario e disponibilità
  const [activeDays, setActiveDays] = useState<number[]>([0, 2, 3, 4, 5, 6]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState<TimeSlotAvailability[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Dati form
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [error, setError] = useState('');

  // Lista d'attesa
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistSent, setWaitlistSent] = useState(false);

  // Carica i giorni attivi all'avvio
  useEffect(() => {
    fetch('/api/availability?date=' + new Date().toISOString().split('T')[0])
      .then(r => r.json())
      .then(d => { if (d.active_days) setActiveDays(d.active_days); })
      .catch(() => {});
  }, []);

  // Carica gli slot quando cambia la data
  const loadSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedTime('');
    setIsClosed(false);
    setShowWaitlist(false);
    try {
      const r = await fetch(`/api/availability?date=${date}`);
      const data = await r.json();
      if (data.active_days) setActiveDays(data.active_days);
      if (data.isClosed) {
        setIsClosed(true);
      } else {
        setSlots(data.slots || []);
      }
    } catch {
      setError('Errore nel caricamento degli orari.');
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    loadSlots(date);
    setStep('date');
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;
    setError('');
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const r = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, date: selectedDate, time: selectedTime,
          guests, special_requests: specialRequests,
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        if (r.status === 409 && data.available !== undefined) {
          setShowWaitlist(true);
        } else {
          setError(data.error || 'Errore durante la prenotazione.');
        }
        setIsSubmitting(false);
        setStep('details');
        return;
      }

      router.push(`/conferma/${data.reservation.id}`);
    } catch {
      setError('Errore di rete. Riprova.');
      setIsSubmitting(false);
      setStep('details');
    }
  };

  const handleWaitlist = async () => {
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, date: selectedDate, time: selectedTime,
          guests, special_requests: specialRequests,
        }),
      });
      setWaitlistSent(true);
    } catch {
      setError('Errore durante l\'iscrizione alla lista d\'attesa.');
    }
  };

  const selectedSlot = slots.find(s => s.time === selectedTime);
  const maxGuests = selectedSlot ? selectedSlot.available : 20;

  const formatDateIT = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header className="py-10 px-4 text-center relative" style={{ background: 'var(--forest)' }}>
        <a
          href="/admin"
          className="absolute top-4 right-4 text-xs font-sans px-3 py-1.5 rounded border transition"
          style={{ color: '#6A9080', borderColor: '#3A5A47' }}
          onMouseOver={e => (e.currentTarget.style.color = '#F7F2E8')}
          onMouseOut={e => (e.currentTarget.style.color = '#6A9080')}
        >
          Admin
        </a>
        <p className="text-xs font-sans tracking-[4px] uppercase mb-2" style={{ color: 'var(--gold)' }}>
          Ristorante
        </p>
        <h1 className="text-3xl md:text-4xl font-serif" style={{ color: 'var(--cream)' }}>
          Locanda nel Parco
        </h1>
        <p className="mt-2 text-sm font-sans" style={{ color: '#8FAF9E' }}>
          Cucina di territorio · Atmosfera autentica
        </p>
        <p className="mt-1 text-xs font-sans" style={{ color: '#6A9080' }}>
          Via Panetti 1, Torino
        </p>
      </header>

      {/* Contenuto */}
      <main className="max-w-2xl mx-auto px-4 py-10">

        {waitlistSent ? (
          /* Conferma lista d'attesa */
          <div className="card text-center">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-serif mb-2" style={{ color: 'var(--forest)' }}>
              Sei in lista d'attesa!
            </h2>
            <p className="text-sm font-sans text-gray-600">
              Ti invieremo una email a <strong>{email}</strong> non appena si libera un posto
              per il <strong>{formatDateIT(selectedDate)}</strong> alle <strong>{selectedTime}</strong>.
            </p>
            <button
              onClick={() => { setWaitlistSent(false); setShowWaitlist(false); setStep('date'); }}
              className="mt-6 btn-secondary text-sm"
            >
              Scegli un altro orario
            </button>
          </div>
        ) : step === 'details' ? (
          /* Step 2: Dati personali */
          <div className="card">
            <button
              onClick={() => setStep('date')}
              className="text-sm font-sans text-gray-500 hover:text-forest mb-6 flex items-center gap-1 transition"
            >
              ← Torna al calendario
            </button>

            <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 text-sm font-sans">
              <div className="flex items-center gap-2 text-forest font-semibold">
                <span>📅</span>
                <span>{formatDateIT(selectedDate)} · ore {selectedTime}</span>
              </div>
            </div>

            {showWaitlist ? (
              <div className="text-center py-4">
                <p className="font-serif text-lg mb-2" style={{ color: 'var(--terracotta)' }}>
                  Posti esauriti per questo orario
                </p>
                <p className="text-sm font-sans text-gray-600 mb-6">
                  Vuoi iscriverti alla lista d'attesa? Ti avviseremo via email se si libera un posto.
                </p>
                <button onClick={handleWaitlist} className="btn-primary mr-3">
                  Sì, mettimi in lista
                </button>
                <button onClick={() => { setShowWaitlist(false); setStep('date'); }} className="btn-secondary">
                  Scegli altro orario
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-serif mb-1" style={{ color: 'var(--forest)' }}>
                  I tuoi dati
                </h2>

                {/* Coperti */}
                <div>
                  <label className="block text-xs font-sans font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Numero di persone
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setGuests(g => Math.max(1, g - 1))}
                      className="w-10 h-10 rounded-full border border-amber-200 bg-white hover:bg-amber-50 text-lg transition"
                    >
                      −
                    </button>
                    <span className="text-2xl font-serif w-8 text-center" style={{ color: 'var(--forest)' }}>
                      {guests}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuests(g => Math.min(maxGuests, g + 1))}
                      className="w-10 h-10 rounded-full border border-amber-200 bg-white hover:bg-amber-50 text-lg transition"
                    >
                      +
                    </button>
                    <span className="text-xs font-sans text-gray-400">
                      (max {maxGuests} disponibili)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                      Nome e cognome *
                    </label>
                    <input
                      className="field"
                      type="text"
                      required
                      placeholder="Mario Rossi"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                      Telefono
                    </label>
                    <input
                      className="field"
                      type="tel"
                      placeholder="+39 347 ..."
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Email *
                  </label>
                  <input
                    className="field"
                    type="email"
                    required
                    placeholder="mario@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1 font-sans">La conferma verrà inviata a questo indirizzo.</p>
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Richieste speciali
                  </label>
                  <textarea
                    className="field resize-none"
                    rows={3}
                    placeholder="Allergie, occasioni speciali, seggiolone, posto esterno..."
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm font-sans text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full py-4 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Prenotazione in corso...' : 'Conferma prenotazione →'}
                </button>

                <p className="text-xs text-gray-400 font-sans text-center">
                  Potrai cancellare fino a 24 ore prima tramite il link in email.
                </p>
              </form>
            )}
          </div>
        ) : (
          /* Step 1: Seleziona data e orario */
          <div className="card">
            <h2 className="text-2xl font-serif mb-1" style={{ color: 'var(--forest)' }}>
              Prenota un tavolo
            </h2>
            <p className="text-sm font-sans text-gray-500 mb-6">
              Scegli la data e l'orario che preferisci.
            </p>

            {/* Calendario */}
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              activeDays={activeDays}
            />

            {/* Orari */}
            {selectedDate && (
              <div className="mt-6 border-t border-amber-100 pt-6">
                {loadingSlots ? (
                  <p className="text-sm font-sans text-gray-400 text-center py-4">
                    Caricamento disponibilità...
                  </p>
                ) : isClosed ? (
                  <div className="text-center py-4">
                    <p className="text-sm font-sans" style={{ color: 'var(--terracotta)' }}>
                      Il ristorante è chiuso in questa data.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Scegli un altro giorno.</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const [y, m, d] = selectedDate.split('-').map(Number);
                      return new Date(y, m - 1, d).getDay() === 2;
                    })() && (
                      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-sans text-amber-800">
                        <span className="mt-0.5">🍕</span>
                        <span>Il martedì il ristorante è aperto <strong>solo con servizio pizzeria</strong>.</span>
                      </div>
                    )}
                    <p className="text-xs font-sans font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Orari disponibili · {formatDateIT(selectedDate)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {slots.map(slot => (
                        <SlotButton
                          key={slot.time}
                          slot={slot}
                          selected={selectedTime === slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                        />
                      ))}
                    </div>

                    {selectedTime && (
                      <div className="mt-6">
                        <button
                          onClick={handleContinue}
                          className="btn-primary w-full py-3.5"
                        >
                          Continua →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!selectedDate && (
              <p className="text-sm font-sans text-gray-400 text-center mt-6 border-t border-amber-100 pt-6">
                Seleziona una data per vedere gli orari disponibili.
              </p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs font-sans text-gray-400">
        <p>Locanda nel Parco · Per informazioni chiama il ristorante</p>
      </footer>
    </div>
  );
}
