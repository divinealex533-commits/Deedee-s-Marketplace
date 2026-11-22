'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { FormState } from './types';

function refresh() {
  revalidatePath('/', 'layout');
}

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

export async function createCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const name = clean(fd.get('name'), 40);
  const emoji = clean(fd.get('emoji'), 8);
  if (name.length < 2) return { error: 'Give the category a name, e.g. Texting apps.' };
  const last = await prisma.category.aggregate({ _max: { order: true } });
  try {
    await prisma.category.create({ data: { name, emoji, order: (last._max.order ?? 0) + 1 } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { error: `“${name}” already exists.` };
    throw e;
  }
  refresh();
  return { ok: `Added “${name}”. Now choose which listings go in it.` };
}

export async function updateCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const name = clean(fd.get('name'), 40);
  const emoji = clean(fd.get('emoji'), 8);
  const order = Math.max(0, Math.min(999, Math.floor(Number(fd.get('order')) || 0)));
  if (name.length < 2) return { error: 'Give the category a name.' };
  try {
    await prisma.category.update({ where: { id }, data: { name, emoji, order } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { error: `Another category is already called “${name}”.` };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return { error: 'That category no longer exists.' };
    throw e;
  }
  refresh();
  return { ok: 'Saved.' };
}

/** Deleting a category never deletes listings: they just become uncategorised. */
export async function deleteCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const c = await prisma.category.findUnique({ where: { id }, select: { name: true, _count: { select: { listings: true } } } });
  if (!c) return { error: 'That category no longer exists.' };
  await prisma.$transaction([
    prisma.listing.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
    prisma.category.delete({ where: { id } }),
  ]);
  refresh();
  const n = c._count.listings;
  return { ok: `Deleted “${c.name}”.${n ? ` Its ${n} listing${n === 1 ? ' is' : 's are'} now uncategorised (not deleted).` : ''}` };
}

/**
 * Puts every listing of the ticked platforms into this category
 * (e.g. tick Google Voice and TextNow for "Texting apps"). Unticked platforms already in it are taken out.
 */
export async function setCategoryPlatforms(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const platforms = fd.getAll('platform').map((p) => String(p)).filter(Boolean);
  const cat = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  if (!cat) return { error: 'That category no longer exists.' };
  const [added] = await prisma.$transaction([
    prisma.listing.updateMany({ where: { platform: { in: platforms } }, data: { categoryId: id } }),
    prisma.listing.updateMany({ where: { categoryId: id, platform: { notIn: platforms } }, data: { categoryId: null } }),
  ]);
  refresh();
  return { ok: platforms.length ? `${added.count} listing${added.count === 1 ? '' : 's'} now in “${cat.name}”.` : `“${cat.name}” is now empty.` };
}

/** Puts exactly the ticked listings in this category; listings unticked here are taken out of it. */
export async function setCategoryListings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const ids = fd.getAll('listing').map((v) => String(v)).filter(Boolean);
  const cat = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  if (!cat) return { error: 'That category no longer exists.' };
  await prisma.$transaction([
    prisma.listing.updateMany({ where: { id: { in: ids } }, data: { categoryId: id } }),
    prisma.listing.updateMany({ where: { categoryId: id, id: { notIn: ids } }, data: { categoryId: null } }),
  ]);
  refresh();
  return { ok: ids.length ? `${ids.length} listing${ids.length === 1 ? '' : 's'} now in “${cat.name}”.` : `“${cat.name}” is now empty.` };
}
