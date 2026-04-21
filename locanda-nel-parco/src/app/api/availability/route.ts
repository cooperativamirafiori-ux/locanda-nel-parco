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

  // Legge i posti occupati per servizio in parallelo (una query ciascuno)
  const [pranzoBooked, cenaBooked] = await Promise.all([
    getBookedSeatsForService(date, 'pranzo'),
    getBookedSeatsForService(date, 'cena'),
  ]);

  const slots = config.time_slots.map((time) => {
    const service = getService(time);
    const booked = service === 'pranzo' ? pranzoBooked : cenaBooked;
    const maxForService = service === 'pranzo'
      ? (override?.max_seats_pranzo ?? config.max_seats)
      : (override?.max_seats_cena ?? config.max_seats);
    return {
      time,
      booked,
      available: Math.max(0, maxForService - booked),
      total: maxForService,
    };
  });

  return NextResponse.json({ isClosed: false, slots, active_days: config.active_days });
}
