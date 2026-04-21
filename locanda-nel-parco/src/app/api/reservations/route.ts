import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig, getBookedSeatsForSlot, isDateClosed, createReservation } from '@/lib/db';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, phone, date, time, guests, special_requests } = body;

  if (!name || !email || !phone || !date || !time || !guests) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
  }
  if (guests < 1 || guests > 20) {
    return NextResponse.json({ error: 'Numero di ospiti non valido' }, { status: 400 });
  }

  const config = await getConfig();

  if (await isDateClosed(date)) {
    return NextResponse.json({ error: 'Il ristorante è chiuso in questa data' }, { status: 409 });
  }

  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  if (!config.active_days.includes(dayOfWeek)) {
    return NextResponse.json({ error: 'Il ristorante è chiuso in questo giorno' }, { status: 409 });
  }

  if (!config.time_slots.includes(time)) {
    return NextResponse.json({ error: 'Orario non disponibile' }, { status: 400 });
  }

  const booked = await getBookedSeatsForSlot(date, time);
  const available = config.max_seats - booked;
  if (guests > available) {
    return NextResponse.json({ error: 'Posti insufficienti', available }, { status: 409 });
  }

  const reservation = await createReservation({
    id: uuidv4(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: (phone || '').trim(),
    date,
    time,
    guests: Number(guests),
    special_requests: (special_requests || '').trim(),
  });

  try {
    await sendConfirmationEmail(reservation);
  } catch (e) {
    console.error('Email conferma fallita:', e);
  }

  return NextResponse.json({ reservation }, { status: 201 });
}
