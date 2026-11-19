import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './db';
import { SESSION_COOKIE, signSession, verifySession } from './session';

export async function createSession(
  user: { id: string; role: 'USER' | 'ADMIN'; name: string },
  remember: boolean,
) {
  const days = remember ? 30 : 1;
  const token = await signSession({ uid: user.id, role: user.role, name: user.name }, days);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Without maxAge the cookie ends when the browser closes.
    ...(remember ? { maxAge: days * 24 * 60 * 60 } : {}),
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Loads the logged-in user from the database, or sends them to log in. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  // A deleted or banned user still holding a valid cookie: clear it.
  if (!user || user.banned) redirect('/api/auth/logout');

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/dashboard');
  return user;
}
