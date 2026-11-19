'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import { addBulk, addCredential, createListing, setListingImage } from '@/app/actions/admin';
import FormMessage from '@/components/FormMessage';
import PasswordInput from '@/components/PasswordInput';
import SubmitButton from '@/components/SubmitButton';
import { compressField, useActionForm } from '@/components/useActionForm';
import { PLATFORMS } from '@/lib/site';

export function CreateListingForm() {
  const { state, pending, onSubmit, ref } = useActionForm(createListing, { resetOnOk: true, transform: compressField('image') });
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="platform" className="label">Platform</label>
          <select id="platform" name="platform" className="input" defaultValue="Instagram">
            {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="price" className="label">Price (₦)</label>
          <input id="price" name="price" type="number" min={1} step="any" required placeholder="15000" className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="title" className="label">Title customers see</label>
        <input id="title" name="title" required placeholder="e.g. 5K fashion page, aged 2 years" className="input" />
      </div>
      <div>
        <label htmlFor="description" className="label">Description (optional)</label>
        <textarea id="description" name="description" rows={3} className="input" placeholder="Followers, niche, login instructions (e.g. which VPN to use)…" />
      </div>
      <div>
        <label htmlFor="listing-image" className="label">Photo customers see (optional)</label>
        <input id="listing-image" name="image" type="file" accept="image/*" className="input py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-line file:px-3 file:py-1.5 file:text-soft" />
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-soft">
        <input type="checkbox" name="showLogin" className="mt-0.5 h-[18px] w-[18px] accent-accent" />
        <span>Show each login in full before purchase (e.g. phone numbers). Leave off to show them partly hidden.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Creating…">Create listing</SubmitButton>
    </form>
  );
}

function ListingSelect({ listings, defaultListing, id }: { listings: { id: string; label: string }[]; defaultListing?: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">Listing</label>
      <select id={id} name="listingId" required className="input" defaultValue={defaultListing ?? listings[0]?.id}>
        {listings.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
      </select>
    </div>
  );
}

function SingleForm({ listings, defaultListing }: { listings: { id: string; label: string }[]; defaultListing?: string }) {
  const { state, pending, onSubmit, ref } = useActionForm(addCredential);
  // Keep the chosen listing after saving, but clear the login fields.
  const clear = () => {
    const f = ref.current;
    if (!f) return;
    for (const name of ['login', 'password', 'notes', 'previewUrl']) {
      const el = f.elements.namedItem(name) as HTMLInputElement | null;
      if (el) el.value = '';
    }
  };
  useEffect(() => {
    if (state?.ok) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <ListingSelect listings={listings} defaultListing={defaultListing} id="single-listing" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="login" className="label">Username or email</label>
          <input id="login" name="login" required autoComplete="off" className="input" />
        </div>
        <div>
          <label htmlFor="cred-password" className="label">Password</label>
          <PasswordInput id="cred-password" name="password" required autoComplete="new-password" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="notes" className="label">Recovery email / notes (optional)</label>
          <input id="notes" name="notes" autoComplete="off" className="input" />
        </div>
        <div>
          <label htmlFor="previewUrl" className="label">Preview link (optional)</label>
          <input id="previewUrl" name="previewUrl" type="url" inputMode="url" placeholder="https://instagram.com/thepage" autoComplete="off" className="input" />
        </div>
      </div>
      <p className="-mt-1 text-[13px] text-muted">Customers can open the preview link before buying, e.g. the profile page or a screenshot.</p>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Adding…">Add credential</SubmitButton>
    </form>
  );
}

function BulkForm({ listings, defaultListing }: { listings: { id: string; label: string }[]; defaultListing?: string }) {
  const { state, pending, onSubmit } = useActionForm(addBulk);
  const [text, setText] = useState('');
  const count = text.split(/\r?\n/).filter((l) => /^[^:|\t]+[:|\t].+/.test(l.trim())).length;

  useEffect(() => {
    if (state?.ok) setText('');
  }, [state]);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText((t) => (t ? t.trimEnd() + '\n' : '') + content);
    e.target.value = '';
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ListingSelect listings={listings} defaultListing={defaultListing} id="bulk-listing" />
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="bulk" className="label">One per line: login:password or login:password:notes</label>
          <label className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-accent-text">
            <Upload className="h-4 w-4" aria-hidden="true" /> Upload .txt / .csv
            <input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={onFile} className="sr-only" />
          </label>
        </div>
        <textarea
          id="bulk"
          name="text"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={'page_one@mail.com:Pass1234:Fashion page https://instagram.com/page_one\npage_two:Secret987\npage_three|Hello2026|Food page|https://tiktok.com/@page_three'}
          className="input font-mono text-sm"
        />
        <p className="mt-1.5 text-[13px] text-muted">
          {count} valid line{count === 1 ? '' : 's'} detected. Add a link (https://…) anywhere on a line to give that item a preview link. Duplicates are skipped.
        </p>
      </div>
      <FormMessage state={state} />
      <SubmitButton pending={pending} disabled={!count} pendingText="Encrypting and saving…">
        Add {count || ''} credential{count === 1 ? '' : 's'}
      </SubmitButton>
    </form>
  );
}

export function AddCredentialForms({ listings, defaultListing }: { listings: { id: string; label: string }[]; defaultListing?: string }) {
  const [tab, setTab] = useState<'single' | 'bulk'>('single');
  const tabCls = (on: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition ${on ? 'bg-accent text-white' : 'text-soft hover:text-white'}`;
  return (
    <>
      <div role="tablist" aria-label="How to add" className="mb-5 inline-flex rounded-xl border border-line2 bg-ink p-1">
        <button type="button" role="tab" aria-selected={tab === 'single'} onClick={() => setTab('single')} className={tabCls(tab === 'single')}>Add single</button>
        <button type="button" role="tab" aria-selected={tab === 'bulk'} onClick={() => setTab('bulk')} className={tabCls(tab === 'bulk')}>Add multiple</button>
      </div>
      {tab === 'single' ? (
        <SingleForm listings={listings} defaultListing={defaultListing} />
      ) : (
        <BulkForm listings={listings} defaultListing={defaultListing} />
      )}
    </>
  );
}

/** Small "change photo" control for an existing listing. */
export function ListingImageForm({ id, hasImage }: { id: string; hasImage: boolean }) {
  const { state, pending, onSubmit } = useActionForm(setListingImage, { transform: compressField('image') });
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="btn btn-ghost btn-sm cursor-pointer">
        <ImagePlus className="h-4 w-4" aria-hidden="true" /> {hasImage ? 'Change' : 'Add photo'}
        <input
          type="file"
          name="image"
          accept="image/*"
          className="sr-only"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </label>
      {hasImage && (
        <button type="submit" name="remove" value="1" disabled={pending} className="text-xs text-danger hover:underline">Remove</button>
      )}
      {pending && <span className="text-xs text-muted">Uploading…</span>}
      {state?.error && <span role="alert" className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}
