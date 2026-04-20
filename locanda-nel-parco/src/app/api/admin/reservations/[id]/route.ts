import { NextRequest, NextResponse } from 'next/server';
import { getReservation, updateReservationStatus } from '@/lib/db';
import { sendCancellationEmail } from '@/lib/email';
import type { ReservationStatus } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { status } = await request.json() as { status: ReservationStatus };
  const allowed: ReservationStatus[] = ['confirmed', 'cancelled', 'no_show'];

  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
  }

  const reservation = await getReservation(params.id);
  if (!reservation) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
  }

  await updateReservationStatus(params.id, status);

  if (status === 'cancelled') {
    try {
      await sendCancellationEmail({ ...reservation, status: 'cancelled' });
    } catch (e) {
      console.error('Email cancellazione fallita:', e);
    }
  }

  return NextResponse.json({ success: true });
}
