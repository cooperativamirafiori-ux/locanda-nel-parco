import { NextRequest, NextResponse } from 'next/server';
import { getConfig, updateConfig } from '@/lib/db';

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({ config });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { max_seats, cancellation_hours, time_slots, active_days } = body;

    if (max_seats !== undefined && (max_seats < 1 || max_seats > 500)) {
      return NextResponse.json({ error: 'Numero posti non valido' }, { status: 400 });
    }
    if (time_slots !== undefined && !Array.isArray(time_slots)) {
      return NextResponse.json({ error: 'Orari non validi' }, { status: 400 });
    }
    if (active_days !== undefined && !Array.isArray(active_days)) {
      return NextResponse.json({ error: 'Giorni non validi' }, { status: 400 });
    }

    await updateConfig({ max_seats, cancellation_hours, time_slots, active_days });
    const config = await getConfig();
    return NextResponse.json({ config });
  } catch (err) {
    console.error('Config PUT error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
