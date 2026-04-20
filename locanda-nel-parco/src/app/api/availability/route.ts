import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getBookedSeatsForSlot, isDateClosed, getDailyOverride } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
  }

  const [config, override] = await Promise.all([getConfig(), getDailyOverride(date)]);
  const maxSeats = override ? override.max_seats : config.max_seats;

  if (await isDateClosed(date)) {
    return NextResponse.json({ isClosed: true, reason: 'chiusura speciale', slots: [] });
  }

  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  if (!config.active_days.includes(dayOfWeek)) {
    return NextResponse.json({ isClosed: true, reason: 'giorno chiuso', slots: [] });
  }

  // Se override a 0 posti → giornata chiusa per evento
  if (maxSeats === 0) {
    return NextResponse.json({ isClosed: true, reason: override?.note || 'giornata non disponibile', slots: [] });
  }

  const slots = await Promise.all(
    config.time_slots.map(async (time) => {
      const booked = await getBookedSeatsForSlot(date, time);
      return {
        time,
        booked,
        available: Math.max(0, maxSeats - booked),
        total: maxSeats,
      };
    }),
  );

  return NextResponse.json({ isClosed: false, slots, active_days: config.active_days });
}
