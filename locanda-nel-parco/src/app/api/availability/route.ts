import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getBookedSeatsForService, getService, isDateClosed, getDailyOverride } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
  }

  const [config, override, closed] = await Promise.all([
    getConfig(),
    getDailyOverride(date),
    isDateClosed(date),
  ]);

  if (closed) {
    return NextResponse.json({ isClosed: true, reason: 'chiusura speciale', slots: [], active_days: config.active_days });
  }

  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  if (!config.active_days.includes(dayOfWeek)) {
    return NextResponse.json({ isClosed: true, reason: 'giorno chiuso', slots: [], active_days: config.active_days });
  }

  // Legge i posti occupati per tutti e 4 i servizi in parallelo
  const [pranzoBooked, cenaBooked, aperitivoBooked, compleannoBooked] = await Promise.all([
    getBookedSeatsForService(date, 'pranzo'),
    getBookedSeatsForService(date, 'cena'),
    getBookedSeatsForService(date, 'aperitivo'),
    getBookedSeatsForService(date, 'compleanno'),
  ]);

  const bookedMap = {
    pranzo:     pranzoBooked,
    cena:       cenaBooked,
    aperitivo:  aperitivoBooked,
    compleanno: compleannoBooked,
  };

  const maxMap = {
    pranzo:     override?.max_seats_pranzo     ?? config.max_seats_pranzo,
    cena:       override?.max_seats_cena       ?? config.max_seats_cena,
    aperitivo:  override?.max_seats_aperitivo  ?? config.max_seats_aperitivo,
    compleanno: override?.max_seats_compleanno ?? config.max_seats_compleanno,
  };

  const slots = config.time_slots.map((time) => {
    const service = getService(time);
    const booked = bookedMap[service];
    const maxForService = maxMap[service];
    return {
      time,
      booked,
      available: Math.max(0, maxForService - booked),
      total: maxForService,
    };
  });

  return NextResponse.json({ isClosed: false, slots, active_days: config.active_days });
}
