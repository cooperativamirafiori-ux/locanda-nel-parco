import { NextRequest, NextResponse } from 'next/server';
import { getAllReservations } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || undefined;
  const status = searchParams.get('status') || undefined;
  const reservations = await getAllReservations({ date, status });
  return NextResponse.json({ reservations });
}
