import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getBookedSeatsForSlot, isDateClosed } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
  }

  const config = await getConfig();

  if (await isDateClosed(date)) {
    return NextResponse.json({ isClosed: true, reason: 'chiusura speciale', slots: [] });
  }

  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  if (!config.active_days.includes(dayOfWeek)) {
    return NextResponse.json({ isClosed: true, reason: 'giorno chiuso', slots: [] });
  }

  const slots = await Promise.all(
    config.time_slots.map(async (time) => {
      const booked = await getBookedSeatsForSlot(date, time);
      return {
        time,
        booked,
        available: Math.max(0, config.max_seats - booked),
        total: config.max_seats,
      };
    }),
  );

  return NextResponse.json({ isClosed: false, slots, active_days: config.active_days });
}
