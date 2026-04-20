import { NextRequest, NextResponse } from 'next/server';
import { deleteDailyOverride } from '@/lib/db';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { date: string } },
) {
  try {
    await deleteDailyOverride(params.date);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
