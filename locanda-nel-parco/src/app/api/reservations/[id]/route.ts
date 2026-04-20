import { NextRequest, NextResponse } from 'next/server';
import {
  getReservation, updateReservationStatus, getConfig,
  getNextWaitlistEntry, updateWaitlistStatus,
} from '@/lib/db';
import { sendCancellationEmail, sendWaitlistNotificationEmail } from '@/lib/email';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reservation = await getReservation(params.id);
  if (!reservation) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
  }
  return NextResponse.json({ reservation });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reservation = await getReservation(params.id);
  if (!reservation) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
  }
  if (reservation.status === 'cancelled') {
    return NextResponse.json({ error: 'Prenotazione già cancellata' }, { status: 409 });
  }

  const config = await getConfig();
  const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);
  const hoursUntil = (reservationDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < config.cancellation_hours) {
    return NextResponse.json(
      { error: `Non è più possibile cancellare (finestra di ${config.cancellation_hours}h superata)` },
      { status: 409 },
    );
  }

  await updateReservationStatus(params.id, 'cancelled');
  sendCancellationEmail(reservation).catch(console.error);

  const nextInLine = await getNextWaitlistEntry(reservation.date, reservation.time);
  if (nextInLine) {
    await updateWaitlistStatus(nextInLine.id, 'notified');
    sendWaitlistNotificationEmail(
      nextInLine.name, nextInLine.email, nextInLine.date, nextInLine.time,
      `${BASE_URL}/conferma-attesa/${nextInLine.id}`,
    ).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
