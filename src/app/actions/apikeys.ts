'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { newApiKey } from '@/lib/api';
import type { FormState } from './types';

const MAX_KEYS = 5;

/** Creates an API key. The full key is returned once (in `ok`) and never stored. */
export async function createApiKey(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(fd.get('name') ?? '').trim().slice(0, 40) || 'My API key';

  const active = await prisma.apiKey.count({ where: { userId: user.id, revokedAt: null } });
  if (active >= MAX_KEYS) return { error: `You can have up to ${MAX_KEYS} active keys. Revoke one first.` };

  const { key, hash, prefix } = newApiKey();
  await prisma.apiKey.create({ data: { userId: user.id, name, prefix, keyHash: hash } });
  revalidatePath('/dashboard/api');
  return { ok: key };
}

export async function revokeApiKey(fd: FormData) {
  const user = await requireUser();
  await prisma.apiKey.updateMany({
    where: { id: String(fd.get('id')), userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  revalidatePath('/dashboard/api');
}
