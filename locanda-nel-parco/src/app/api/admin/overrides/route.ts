import { NextRequest, NextResponse } from 'next/server';
import { getDailyOverrides, setDailyOverride } from '@/lib/db';

export async function GET() {
  try {
    const overrides = await getDailyOverrides();
    return NextResponse.json({ overrides });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, max_seats_pranzo, max_seats_cena, note } = await request.json();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
    }
    if (max_seats_pranzo === undefined && max_seats_cena === undefined) {
      return NextResponse.json({ error: 'Specifica almeno un servizio' }, { status: 400 });
    }
    const pranzo = max_seats_pranzo !== undefined ? Number(max_seats_pranzo) : null;
    const cena   = max_seats_cena   !== undefined ? Number(max_seats_cena)   : null;
    if (pranzo !== null && (pranzo < 0 || pranzo > 500)) {
      return NextResponse.json({ error: 'Capienza pranzo non valida (0–500)' }, { status: 400 });
    }
    if (cena !== null && (cena < 0 || cena > 500)) {
      return NextResponse.json({ error: 'Capienza cena non valida (0–500)' }, { status: 400 });
    }
    const override = await setDailyOverride(date, pranzo, cena, note || '');
    return NextResponse.json({ override }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
