import { NextRequest, NextResponse } from 'next/server';
import { getSpecialClosures, addSpecialClosure } from '@/lib/db';

export async function GET() {
  const closures = await getSpecialClosures();
  return NextResponse.json({ closures });
}

export async function POST(request: NextRequest) {
  const { date, reason } = await request.json();

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
  }

  const closure = await addSpecialClosure(date, reason || '');
  return NextResponse.json({ closure }, { status: 201 });
}
