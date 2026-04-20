import { NextRequest, NextResponse } from 'next/server';
import { deleteSpecialClosure } from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  await deleteSpecialClosure(Number(params.id));
  return NextResponse.json({ success: true });
}
