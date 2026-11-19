import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDate, naira } from '@/lib/format';
import { deleteCredential, updateListing } from '@/app/actions/admin';
import SubmitButton from '@/components/SubmitButton';
import { AddCredentialForms, CreateListingForm } from './Forms';
import RevealCell from './RevealCell';

export const metadata = { title: 'Credentials pool' };
export const dynamic = 'force-dynamic';

const PAGE = 50;

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; status?: string; page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status === 'AVAILABLE' || sp.status === 'SOLD' ? sp.status : undefined;

  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { credentials: { where: { status: 'AVAILABLE' } }, orders: true } },
    },
  });

  const where = {
    ...(sp.listing ? { listingId: sp.listing } : {}),
    ...(status ? { status } : {}),
    ...(sp.q ? { login: { contains: sp.q, mode: 'insensitive' as const } } : {}),
  };
  const [creds, total] = await Promise.all([
    prisma.credential.findMany({
      where,
      include: { listing: { select: { title: true, platform: true } }, order: { select: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE,
      take: PAGE,
    }),
    prisma.credential.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { listing: sp.listing, status, q: sp.q, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/credentials${s ? `?${s}` : ''}`;
  };
  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-2 text-sm font-medium ${active ? 'border-accent bg-accent text-white' : 'border-line2 text-soft hover:text-white'}`;

  const listingOptions = listings.map((l) => ({ id: l.id, label: `${l.platform} · ${l.title} (${naira(l.price)})` }));

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Credentials pool</h1>
        <p className="mt-1 text-muted">
          Create a listing (the product customers see), then add account logins to it. Each login is sold once, oldest first.
        </p>
      </div>

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="new-listing" className="card min-w-0 flex-[1_1_320px] p-6">
          <h2 id="new-listing" className="mb-4 text-lg font-semibold text-white">1. New listing</h2>
          <CreateListingForm />
        </section>
        <section aria-labelledby="add-creds" className="card min-w-0 flex-[2_1_440px] p-6">
          <h2 id="add-creds" className="mb-4 text-lg font-semibold text-white">2. Add credentials</h2>
          {listings.length ? (
            <AddCredentialForms listings={listingOptions} defaultListing={sp.listing} />
          ) : (
            <p className="text-muted">Create a listing first.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="listings" className="card p-6">
        <h2 id="listings" className="mb-4 text-lg font-semibold text-white">Listings</h2>
        {listings.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th scope="col">Listing</th><th scope="col">Price (₦)</th><th scope="col">In stock</th><th scope="col">Sold</th><th scope="col">Visible</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={qs({ listing: l.id, page: undefined })} className="font-medium text-white hover:text-accent-text">{l.title}</Link>
                      <div className="text-[13px] text-muted">{l.platform}</div>
                    </td>
                    <td>
                      <form action={updateListing} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={l.id} />
                        <label htmlFor={`price-${l.id}`} className="sr-only">Price for {l.title}</label>
                        <input id={`price-${l.id}`} name="price" type="number" min={1} step="any" defaultValue={l.price / 100} className="input w-28 py-2 text-sm" />
                        <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Save</SubmitButton>
                      </form>
                    </td>
                    <td className={l._count.credentials ? 'text-success' : 'text-danger'}>{l._count.credentials}</td>
                    <td className="text-soft">{l._count.orders}</td>
                    <td>
                      <form action={updateListing}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="active" value={String(!l.active)} />
                        <SubmitButton className={`badge cursor-pointer ${l.active ? 'bg-[#0F3B2C] text-success' : 'bg-line text-soft'}`} pendingText="…">
                          {l.active ? 'Live' : 'Hidden'}
                        </SubmitButton>
                      </form>
                    </td>
                    <td><Link href={qs({ listing: l.id, page: undefined })} className="text-sm font-medium text-accent-text">View pool</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-muted">No listings yet.</p>
        )}
      </section>

      <section aria-labelledby="pool" className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="pool" className="text-lg font-semibold text-white">
            Pool {sp.listing && listings.find((l) => l.id === sp.listing) ? `· ${listings.find((l) => l.id === sp.listing)!.title}` : ''}
            <span className="ml-2 text-sm font-normal text-muted">{total.toLocaleString()} credentials</span>
          </h2>
          <form className="w-full sm:w-64" role="search">
            {sp.listing && <input type="hidden" name="listing" value={sp.listing} />}
            {status && <input type="hidden" name="status" value={status} />}
            <label htmlFor="q" className="sr-only">Search logins</label>
            <input id="q" name="q" defaultValue={sp.q} placeholder="Search logins…" className="input py-2.5" />
          </form>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href={qs({ status: undefined, page: undefined })} className={pill(!status)}>All</Link>
          <Link href={qs({ status: 'AVAILABLE', page: undefined })} className={pill(status === 'AVAILABLE')}>Available</Link>
          <Link href={qs({ status: 'SOLD', page: undefined })} className={pill(status === 'SOLD')}>Sold</Link>
          {sp.listing && <Link href={qs({ listing: undefined, page: undefined })} className="px-2 py-2 text-sm text-accent-text">Clear listing filter ×</Link>}
        </div>

        {creds.length ? (
          <div className="table-wrap">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr><th scope="col">Listing</th><th scope="col">Login</th><th scope="col">Password</th><th scope="col">Status</th><th scope="col">Added</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {creds.map((c) => (
                  <tr key={c.id}>
                    <td><div className="text-white">{c.listing.title}</div><div className="text-[13px] text-muted">{c.listing.platform}</div></td>
                    <td className="break-all font-mono text-soft">{c.login}</td>
                    <td><RevealCell id={c.id} /></td>
                    <td>
                      {c.status === 'AVAILABLE' ? (
                        <span className="badge bg-[#0F3B2C] text-success">Available</span>
                      ) : (
                        <span className="badge bg-line text-soft">Sold{c.order ? ` to ${c.order.user.name}` : ''}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDate(c.createdAt)}</td>
                    <td>
                      {c.status === 'AVAILABLE' && (
                        <form action={deleteCredential}>
                          <input type="hidden" name="id" value={c.id} />
                          <SubmitButton className="btn btn-danger btn-sm" pendingText="…">Delete</SubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-muted">No credentials match.</p>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={qs({ page: String(page - 1) })} className="btn btn-ghost btn-sm">← Previous</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={qs({ page: String(page + 1) })} className="btn btn-ghost btn-sm">Next →</Link> : <span />}
          </nav>
        )}
      </section>
    </>
  );
}
