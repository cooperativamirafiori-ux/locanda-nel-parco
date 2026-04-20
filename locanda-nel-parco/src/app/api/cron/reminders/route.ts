import { NextRequest, NextResponse } from 'next/server';
import { getReservationsDueReminder, markReminderSent } from '@/lib/db';
import { sendReminderEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const reservations = await getReservationsDueReminder();
  const results: { id: string; success: boolean }[] = [];

  for (const reservation of reservations) {
    try {
      await sendReminderEmail(reservation);
      await markReminderSent(reservation.id);
      results.push({ id: reservation.id, success: true });
    } catch (err) {
      console.error(`Errore reminder per ${reservation.id}:`, err);
      results.push({ id: reservation.id, success: false });
    }
  }

  return NextResponse.json({ sent: results.length, results });
}
