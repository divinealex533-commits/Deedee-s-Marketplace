'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { ClipboardPaste, ExternalLink, ImagePlus, Plus, Upload, X } from 'lucide-react';
import { addBulk, addCredential, createListing, setListingImage } from '@/app/actions/admin';
import FormMessage from '@/components/FormMessage';
import PasswordInput from '@/components/PasswordInput';
import SubmitButton from '@/components/SubmitButton';
import { compressField, useActionForm } from '@/components/useActionForm';
import { PLATFORMS } from '@/lib/site';
import CategoryInput from './CategoryInput';
import CategorySelect from '@/components/CategorySelect';

export function CreateListingForm({ categories = PLATFORMS, groups = [] }: { categories?: readonly string[]; groups?: { id: string; name: string; emoji: string }[] }) {
  const { state, pending, onSubmit, ref } = useActionForm(createListing, { resetOnOk: true, transform: compressField('image') });
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryInput id="platform" categories={[...categories]} />
        <CategorySelect id="new-category" categories={groups} />
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
  // Each row is one credential; "Add another credential" opens a new row.
  const [rows, setRows] = useState<number[]>([0]);
  const [nextId, setNextId] = useState(1);
  const addRow = () => {
    setRows((r) => [...r, nextId]);
    setNextId((n) => n + 1);
    // focus the new row's login box once it renders
    setTimeout(() => (document.getElementById(`login-${nextId}`) as HTMLInputElement | null)?.focus(), 50);
  };
  const removeRow = (id: number) => setRows((r) => (r.length > 1 ? r.filter((x) => x !== id) : r));

  // After saving: keep the chosen listing, go back to one empty row.
  useEffect(() => {
    if (!state?.ok) return;
    const f = ref.current;
    f?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[name="login"],input[name="password"],textarea[name="notes"],input[name="previewUrl"]').forEach((el) => (el.value = ''));
    setRows([0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <ListingSelect listings={listings} defaultListing={defaultListing} id="single-listing" />
      {rows.map((id, i) => (
        <fieldset key={id} className="space-y-4 rounded-2xl border border-line bg-panel2/60 p-4">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-semibold text-white">Credential {i + 1}</legend>
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(id)} className="inline-flex items-center gap-1 text-sm text-danger hover:underline">
                <X className="h-4 w-4" aria-hidden="true" /> Remove
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`login-${id}`} className="label">Username, email or number</label>
              <input id={`login-${id}`} name="login" autoComplete="off" className="input" />
            </div>
            <div>
              <label htmlFor={`cred-password-${id}`} className="label">Password</label>
              <PasswordInput id={`cred-password-${id}`} name="password" autoComplete="new-password" />
            </div>
          </div>
          <div>
            <label htmlFor={`notes-${id}`} className="label">Additional details (optional)</label>
            <textarea
              id={`notes-${id}`}
              name="notes"
              rows={3}
              autoComplete="off"
              spellCheck={false}
              placeholder={'2FA / backup codes, email + email password, recovery email, cookies…'}
              className="input font-mono text-sm"
            />
            <p className="mt-1 text-[13px] text-muted">Locked like the password. Only the buyer sees it, in My orders, after you confirm their payment.</p>
          </div>
          <div>
            <label htmlFor={`preview-${id}`} className="label">Preview link or number (optional)</label>
            <input id={`preview-${id}`} name="previewUrl" type="text" autoComplete="off" placeholder="https://… or 17146765378" className="input" />
          </div>
        </fieldset>
      ))}
      <button type="button" onClick={addRow} className="btn btn-ghost w-full border-dashed">
        <Plus className="h-4 w-4" aria-hidden="true" /> Add another credential
      </button>
      <p className="text-[13px] text-muted">Customers see the preview before buying: a link opens (e.g. the profile page), a number or ID is shown as text.</p>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Uploading…">
        <Upload className="h-4 w-4" aria-hidden="true" /> Upload {rows.length > 1 ? `${rows.length} credentials` : 'credential'}
      </SubmitButton>
    </form>
  );
}

/** Splits pasted lines the same way the server does, so the admin sees each credential before uploading. */
function parseBulk(text: string) {
  const items: { login: string; password: string; notes: string; extra: string; preview: string }[] = [];
  let bad = 0;
  for (const raw of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const found = raw.match(/https?:\/\/\S+/i)?.[0] ?? '';
    const line = found ? raw.replace(found, '').replace(/[|:\t\s]+$/, '').trim() : raw;
    const sep = line.includes('|') ? '|' : line.includes('\t') ? '\t' : ':';
    const [login, password, ...rest] = line.split(sep).map((p) => p.trim());
    if (!login || !password) bad++;
    else items.push({ login, password, notes: rest.join(sep).trim(), extra: rest.join(' · '), preview: found });
  }
  return { items, bad };
}

function BulkForm({ listings, defaultListing }: { listings: { id: string; label: string }[]; defaultListing?: string }) {
  const { state, pending, onSubmit } = useActionForm(addBulk);
  const [text, setText] = useState('');
  const { items, bad } = parseBulk(text);
  const count = items.length;
  // Previews typed by hand for each split line (by position, so repeated logins can each have their own)
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const previewOf = (it: { preview: string }, i: number) => previews[i] ?? it.preview;
  const MAX_EDIT = 300;

  useEffect(() => {
    if (state?.ok) {
      setText('');
      setPreviews({});
    }
  }, [state]);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText((t) => (t ? t.trimEnd() + '\n' : '') + content);
    e.target.value = '';
  };
  const paste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText((t) => (t ? t.trimEnd() + '\n' : '') + clip);
    } catch {
      document.getElementById('bulk')?.focus();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ListingSelect listings={listings} defaultListing={defaultListing} id="bulk-listing" />
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="bulk" className="label">Paste your credentials, one per line</label>
          <div className="mb-1.5 flex gap-4">
            <button type="button" onClick={paste} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-text">
              <ClipboardPaste className="h-4 w-4" aria-hidden="true" /> Paste
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-accent-text">
              <Upload className="h-4 w-4" aria-hidden="true" /> .txt / .csv
              <input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={onFile} className="sr-only" />
            </label>
          </div>
        </div>
        <textarea
          id="bulk"
          name="text"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={'page_one@mail.com:Pass1234\n17146765378:Secret987:2FA ABCD EFGH recovery@mail.com\npage_three|Hello2026|https://tiktok.com/@page_three'}
          className="input font-mono text-sm"
        />
        <p className="mt-1.5 text-[13px] text-muted">
          Format: <span className="font-mono">login:password</span>, optionally <span className="font-mono">:extra details</span> (2FA, email…) and a link. You can also use <span className="font-mono">|</span> or paste straight from a spreadsheet. Repeats are allowed.
        </p>
      </div>

      {(count > 0 || bad > 0) && (
        <div className="rounded-2xl border border-line bg-panel2/60">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-sm">
            <span className="font-semibold text-white">{count} credential{count === 1 ? '' : 's'} ready</span>
            {bad > 0 && <span className="text-warn">{bad} line{bad === 1 ? '' : 's'} not understood (skipped)</span>}
          </div>
          <p className="border-b border-line px-4 py-2 text-[13px] text-muted">Type a preview (number or link) for any item. Customers only see the preview before buying.</p>
          <ol className="max-h-[28rem] divide-y divide-line overflow-y-auto">
            {items.slice(0, MAX_EDIT).map((it, i) => (
              <li key={`${it.login}-${i}`} className="space-y-2 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-right text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-white">{it.login}</span>
                  <span className="shrink-0 font-mono text-muted">{'•'.repeat(Math.min(it.password.length, 8))}</span>
                </div>
                {it.extra && <div className="truncate pl-9 text-[13px] text-muted">Details: {it.extra}</div>}
                <div className="flex items-center gap-2 pl-9">
                  <label htmlFor={`bp-${i}`} className="sr-only">Preview for {it.login}</label>
                  <input
                    id={`bp-${i}`}
                    value={previewOf(it, i)}
                    onChange={(e) => setPreviews((p) => ({ ...p, [i]: e.target.value }))}
                    placeholder="Preview: https://… or 17146765378"
                    autoComplete="off"
                    className="input h-10 py-2 text-sm"
                  />
                  {previewOf(it, i) && <ExternalLink className="h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />}
                </div>
              </li>
            ))}
          </ol>
          {count > MAX_EDIT && <p className="border-t border-line px-4 py-2 text-[13px] text-muted">…and {count - MAX_EDIT} more (they upload without a typed preview; you can put a link on the line itself).</p>}
        </div>
      )}

      <input
        type="hidden"
        name="rows"
        value={count ? JSON.stringify(items.map((it, i) => ({ login: it.login, password: it.password, notes: it.notes, preview: previewOf(it, i) }))) : ''}
      />
      <FormMessage state={state} />
      <SubmitButton pending={pending} disabled={!count} pendingText="Encrypting and uploading…">
        <Upload className="h-4 w-4" aria-hidden="true" /> Upload {count || ''} credential{count === 1 ? '' : 's'}
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
