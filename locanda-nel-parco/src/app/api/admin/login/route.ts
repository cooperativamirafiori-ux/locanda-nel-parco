import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword, setAdminCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== getAdminPassword()) {
    return NextResponse.json({ error: 'Password errata' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  return setAdminCookie(response) as NextResponse;
}
