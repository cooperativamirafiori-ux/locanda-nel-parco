import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'locanda_admin_session';
const SESSION_VALUE = 'authenticated';

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123';
}

export function checkAdminAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE);
  return cookie?.value === SESSION_VALUE;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  return cookie?.value === SESSION_VALUE;
}

export function setAdminCookie(response: Response): Response {
  const maxAge = 60 * 60 * 24; // 24 ore
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${SESSION_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
  );
  return response;
}

export function clearAdminCookie(response: Response): Response {
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
  return response;
}
