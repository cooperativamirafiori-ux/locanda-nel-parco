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
    const { date, max_seats_pranzo, max_seats_cena, max_seats_aperitivo, max_seats_compleanno, note } = await request.json();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
    }
    if (
      max_seats_pranzo === undefined &&
      max_seats_cena === undefined &&
      max_seats_aperitivo === undefined &&
      max_seats_compleanno === undefined
    ) {
      return NextResponse.json({ error: 'Specifica almeno un servizio' }, { status: 400 });
    }
    const pranzo     = max_seats_pranzo     !== undefined ? Number(max_seats_pranzo)     : null;
    const cena       = max_seats_cena       !== undefined ? Number(max_seats_cena)       : null;
    const aperitivo  = max_seats_aperitivo  !== undefined ? Number(max_seats_aperitivo)  : null;
    const compleanno = max_seats_compleanno !== undefined ? Number(max_seats_compleanno) : null;

    for (const [label, val] of [['pranzo', pranzo], ['cena', cena], ['aperitivo', aperitivo], ['compleanno', compleanno]] as const) {
      if (val !== null && (val < 0 || val > 500)) {
        return NextResponse.json({ error: `Capienza ${label} non valida (0–500)` }, { status: 400 });
      }
    }
    const override = await setDailyOverride(date, pranzo, cena, aperitivo, compleanno, note || '');
    return NextResponse.json({ override }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
