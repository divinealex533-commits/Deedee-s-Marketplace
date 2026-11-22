import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { naira } from '@/lib/format';
import { PLATFORMS } from '@/lib/site';
import { getSellerConfig, sellerActive } from '@/lib/seller';
import ActionForm from '@/components/ActionForm';
import { PlatformTile } from '@/components/PlatformIcon';
import { addSellerStock, clearSellerStock, createSellerListing, editSellerListing } from '@/app/actions/seller';

export const metadata = { title: 'My listings' };
export const dynamic = 'force-dynamic';

function CategoryField({ id, categories, value }: { id: string; categories: string[]; value?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">Category</label>
      <input id={id} name="platform" list={`${id}-list`} required maxLength={40} autoComplete="off" defaultValue={value} placeholder="e.g. Instagram" className="input" />
      <datalist id={`${id}-list`}>{categories.map((c) => <option key={c} value={c} />)}</datalist>
    </div>
  );
}

export default async function SellerListingsPage() {
  const user = await requireUser();
  if (user.accountType !== 'SELLER') redirect('/dashboard/seller');
  const active = sellerActive(user);
  const cfg = await getSellerConfig();

  const [listings, used] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { credentials: { where: { status: 'AVAILABLE' } }, orders: true } } },
    }),
    prisma.listing.findMany({ where: { active: true }, distinct: ['platform'], select: { platform: true } }),
  ]);
  const categories = Array.from(new Set([...PLATFORMS, ...used.map((u) => u.platform)]));

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">My listings</h1>
        <p className="mt-1 text-muted">Create a product, then paste in the accounts you’re selling. Each one is sold once. We keep {cfg.commission}% of each sale.</p>
      </div>

      {!active && (
        <div role="alert" className="alert-error">
          Your monthly plan isn’t active, so your listings are hidden from customers. <Link href="/dashboard/seller" className="font-semibold underline">Pay your plan</Link> to open your shop.
        </div>
      )}

      {active && (
        <div className="flex flex-wrap gap-5">
          <section aria-labelledby="new" className="card min-w-0 flex-[1_1_320px] p-6">
            <h2 id="new" className="mb-4 text-lg font-semibold text-white">1. New listing</h2>
            <ActionForm action={createSellerListing} compress="image" resetOnOk submit="Create listing" pendingText="Creating…">
              <div className="grid gap-4 sm:grid-cols-2">
                <CategoryField id="new-cat" categories={categories} />
                <div>
                  <label htmlFor="new-price" className="label">Price per item (₦)</label>
                  <input id="new-price" name="price" type="number" min={100} step="any" required className="input" />
                </div>
              </div>
              <div>
                <label htmlFor="new-title" className="label">Title customers see</label>
                <input id="new-title" name="title" required maxLength={120} className="input" />
              </div>
              <div>
                <label htmlFor="new-desc" className="label">Description (optional)</label>
                <textarea id="new-desc" name="description" rows={3} maxLength={1000} className="input" placeholder="What the buyer gets and how to log in" />
              </div>
              <div>
                <label htmlFor="new-img" className="label">Photo (optional)</label>
                <input id="new-img" name="image" type="file" accept="image/*" className="input py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-line file:px-3 file:py-1.5 file:text-soft" />
              </div>
            </ActionForm>
          </section>

          <section aria-labelledby="stock" className="card min-w-0 flex-[1_1_380px] p-6">
            <h2 id="stock" className="mb-4 text-lg font-semibold text-white">2. Add stock</h2>
            {listings.length ? (
              <ActionForm action={addSellerStock} resetOnOk submit="Add to listing" pendingText="Adding…">
                <div>
                  <label htmlFor="stock-listing" className="label">Listing</label>
                  <select id="stock-listing" name="listingId" required className="input">
                    {listings.map((l) => <option key={l.id} value={l.id}>{l.title} ({naira(l.price)})</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="stock-text" className="label">Accounts, one per line</label>
                  <textarea id="stock-text" name="text" rows={7} required className="input font-mono text-sm" placeholder={'login:password\nlogin:password:notes\nlogin:password https://profile-link'} />
                  <p className="mt-1.5 text-[13px] text-muted">Format: login:password (add :notes if needed). A link on the line becomes the preview customers can open.</p>
                </div>
              </ActionForm>
            ) : (
              <p className="text-muted">Create a listing first.</p>
            )}
          </section>
        </div>
      )}

      <section aria-labelledby="mine" className="card p-6">
        <h2 id="mine" className="mb-4 text-lg font-semibold text-white">Your listings</h2>
        {listings.length ? (
          <div className="space-y-4">
            {listings.map((l) => (
              <details key={l.id} className="rounded-2xl border border-line [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 p-4">
                  <PlatformTile platform={l.platform} size={40} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{l.title}</div>
                    <div className="text-[13px] text-muted">{l.platform} · {naira(l.price)} · {l._count.credentials} in stock · {l._count.orders} sold</div>
                  </div>
                  <span className={`badge ${l.active ? 'bg-[#0F3B2C] text-success' : 'bg-line text-soft'}`}>{l.active ? 'Live' : 'Hidden'}</span>
                  <span className="text-sm text-accent-text">Edit</span>
                </summary>
                <div className="grid gap-6 border-t border-line p-4 lg:grid-cols-2">
                  <ActionForm action={editSellerListing} submit="Save changes">
                    <input type="hidden" name="id" value={l.id} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <CategoryField id={`cat-${l.id}`} categories={categories} value={l.platform} />
                      <div>
                        <label htmlFor={`price-${l.id}`} className="label">Price (₦)</label>
                        <input id={`price-${l.id}`} name="price" type="number" min={100} step="any" required defaultValue={l.price / 100} className="input" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`title-${l.id}`} className="label">Title</label>
                      <input id={`title-${l.id}`} name="title" required maxLength={120} defaultValue={l.title} className="input" />
                    </div>
                    <div>
                      <label htmlFor={`desc-${l.id}`} className="label">Description</label>
                      <textarea id={`desc-${l.id}`} name="description" rows={3} maxLength={1000} defaultValue={l.description} className="input" />
                    </div>
                    <label className="flex items-center gap-2 text-soft">
                      <input type="checkbox" name="active" defaultChecked={l.active} className="h-4 w-4" /> Show to customers
                    </label>
                  </ActionForm>
                  <div className="space-y-3">
                    <p className="text-sm text-muted">Remove all unsold items from this listing (for example if they stopped working). Sold items stay with their buyers.</p>
                    <ActionForm action={clearSellerStock} submit={`Remove ${l._count.credentials} unsold item${l._count.credentials === 1 ? '' : 's'}`} pendingText="Removing…" buttonClass="btn btn-danger w-full">
                      <input type="hidden" name="listingId" value={l.id} />
                    </ActionForm>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-muted">No listings yet.</p>
        )}
      </section>
    </>
  );
}
