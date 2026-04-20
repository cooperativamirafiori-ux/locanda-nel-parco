import { NextRequest, NextResponse } from 'next/server';
import { getReservation, updateReservationStatus } from '@/lib/db';
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
  return NextResponse.json({ success: true });
}
