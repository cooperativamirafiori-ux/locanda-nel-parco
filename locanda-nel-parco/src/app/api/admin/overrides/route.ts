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
    const { date, max_seats, note } = await request.json();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
    }
    if (max_seats === undefined || max_seats < 0 || max_seats > 500) {
      return NextResponse.json({ error: 'Capienza non valida (0–500)' }, { status: 400 });
    }
    const override = await setDailyOverride(date, Number(max_seats), note || '');
    return NextResponse.json({ override }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
