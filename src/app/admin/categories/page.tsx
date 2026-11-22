import { prisma } from '@/lib/db';
import ActionForm from '@/components/ActionForm';
import CategoryTile from '@/components/CategoryTile';
import { PlatformTile } from '@/components/PlatformIcon';
import { createCategory, deleteCategory, setCategoryListings, updateCategory } from '@/app/actions/categories';

export const metadata = { title: 'Categories' };
export const dynamic = 'force-dynamic';

const EMOJIS = ['💬', '📱', '📧', '🎬', '🎵', '🎮', '📸', '👥', '🌍', '🛍️'];

export default async function CategoriesPage() {
  const [categories, listings] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }], include: { _count: { select: { listings: true } } } }),
    prisma.listing.findMany({ orderBy: [{ platform: 'asc' }, { title: 'asc' }], select: { id: true, title: true, platform: true, active: true, categoryId: true } }),
  ]);
  const nameOf = new Map(categories.map((c) => [c.id, c.name]));
  const uncategorised = listings.filter((l) => !l.categoryId).length;

  // Listings grouped by platform, so the checklist reads Facebook…, Google Voice…, TextPlus…
  const byPlatform = new Map<string, typeof listings>();
  for (const l of listings) byPlatform.set(l.platform, [...(byPlatform.get(l.platform) ?? []), l]);

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Categories</h1>
        <p className="mt-1 text-muted">
          Group listings for customers, e.g. put Google Voice and TextNow in “Texting apps”. Categories show as filters in the marketplace and on the homepage.
        </p>
      </div>

      <section aria-labelledby="new-cat" className="card max-w-xl p-6">
        <h2 id="new-cat" className="mb-4 text-lg font-semibold text-white">Add a category</h2>
        <ActionForm action={createCategory} resetOnOk submit="Add category" pendingText="Adding…" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div>
              <label htmlFor="cat-name" className="label">Name</label>
              <input id="cat-name" name="name" required maxLength={40} placeholder="e.g. Texting apps" className="input" />
            </div>
            <div>
              <label htmlFor="cat-emoji" className="label">Icon (optional)</label>
              <input id="cat-emoji" name="emoji" maxLength={8} list="emoji-list" placeholder="💬" className="input text-center text-xl" />
              <datalist id="emoji-list">{EMOJIS.map((e) => <option key={e} value={e} />)}</datalist>
            </div>
          </div>
        </ActionForm>
      </section>

      {uncategorised > 0 && categories.length > 0 && (
        <p className="alert-error">
          {uncategorised} listing{uncategorised === 1 ? ' is' : 's are'} not in any category yet. Customers see {uncategorised === 1 ? 'it' : 'them'} under the platform name. Tick them in a category below.
        </p>
      )}

      {categories.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {categories.map((c) => (
            <section key={c.id} aria-label={c.name} className="card space-y-5 p-6">
              <div className="flex items-center gap-3">
                <CategoryTile name={c.name} emoji={c.emoji} size={44} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-white">{c.name}</h2>
                  <p className="text-sm text-muted">{c._count.listings} listing{c._count.listings === 1 ? '' : 's'}</p>
                </div>
              </div>

              <ActionForm action={setCategoryListings} submit="Save what’s in this category" buttonClass="btn btn-primary w-full">
                <input type="hidden" name="id" value={c.id} />
                <fieldset>
                  <legend className="label">Tick the listings that go in this category</legend>
                  {listings.length ? (
                    <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                      {[...byPlatform].map(([platform, items]) => (
                        <div key={platform}>
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-soft">
                            <PlatformTile platform={platform} size={22} /> {platform}
                          </div>
                          <div className="space-y-2">
                            {items.map((l) => {
                              const other = l.categoryId && l.categoryId !== c.id ? nameOf.get(l.categoryId) : null;
                              return (
                                <label key={l.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-soft has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                                  <input type="checkbox" name="listing" value={l.id} defaultChecked={l.categoryId === c.id} className="h-4 w-4 shrink-0" />
                                  <span className="min-w-0">
                                    <span className="block truncate text-white">{l.title}</span>
                                    <span className="block text-[12px] text-muted">
                                      {other ? `Now in ${other}` : 'No category'}{l.active ? '' : ' · hidden'}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No listings yet.</p>
                  )}
                </fieldset>
              </ActionForm>

              <details className="rounded-xl border border-line [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-accent-text">Rename, reorder or delete</summary>
                <div className="space-y-4 border-t border-line p-4">
                  <ActionForm action={updateCategory} submit="Save" buttonClass="btn btn-ghost w-full">
                    <input type="hidden" name="id" value={c.id} />
                    <div className="grid grid-cols-[1fr_80px_80px] gap-3">
                      <div>
                        <label htmlFor={`n-${c.id}`} className="label">Name</label>
                        <input id={`n-${c.id}`} name="name" required maxLength={40} defaultValue={c.name} className="input" />
                      </div>
                      <div>
                        <label htmlFor={`e-${c.id}`} className="label">Icon</label>
                        <input id={`e-${c.id}`} name="emoji" maxLength={8} list="emoji-list" defaultValue={c.emoji} className="input text-center text-xl" />
                      </div>
                      <div>
                        <label htmlFor={`o-${c.id}`} className="label">Order</label>
                        <input id={`o-${c.id}`} name="order" type="number" min={0} max={999} defaultValue={c.order} className="input" />
                      </div>
                    </div>
                  </ActionForm>
                  <ActionForm action={deleteCategory} submit="Delete category" pendingText="Deleting…" buttonClass="btn btn-danger w-full">
                    <input type="hidden" name="id" value={c.id} />
                    <p className="text-[13px] text-muted">Listings in it are not deleted; they just become uncategorised.</p>
                  </ActionForm>
                </div>
              </details>
            </section>
          ))}
        </div>
      ) : (
        <p className="card p-6 text-muted">No categories yet. Until you add some, customers see listings grouped by platform.</p>
      )}
    </>
  );
}
