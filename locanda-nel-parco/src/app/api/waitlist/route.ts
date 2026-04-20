import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createWaitlistEntry, getConfig, isDateClosed } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, phone, date, time, guests, special_requests } = body;

  if (!name || !email || !date || !time || !guests) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
  }

  const config = await getConfig();

  if (await isDateClosed(date)) {
    return NextResponse.json({ error: 'Il ristorante è chiuso in questa data' }, { status: 409 });
  }

  if (!config.time_slots.includes(time)) {
    return NextResponse.json({ error: 'Orario non disponibile' }, { status: 400 });
  }

  const entry = await createWaitlistEntry({
    id: uuidv4(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: (phone || '').trim(),
    date,
    time,
    guests: Number(guests),
    special_requests: (special_requests || '').trim(),
  });

  return NextResponse.json({ entry }, { status: 201 });
}
