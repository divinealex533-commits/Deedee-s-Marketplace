'use client';

import { startTransition, useActionState, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import { submitCheckoutProof } from '@/app/actions/checkout';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { compressImage } from '@/lib/compressImage';

export default function ProofForm({ checkoutId, banks, defaultName }: { checkoutId: string; banks: { id: string; label: string }[]; defaultName: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitCheckoutProof, undefined);
  const [image, setImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');

  useEffect(() => { if (state?.ok) router.refresh(); }, [state, router]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return setFileError('Choose an image of your receipt.');
    const small = await compressImage(f);
    if (small.size > 4 * 1024 * 1024) return setFileError('That image is too large. Try a screenshot instead.');
    setImage(small);
    setPreview(URL.createObjectURL(small));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!image) return setFileError('Attach a screenshot of your transfer receipt.');
    const fd = new FormData(e.currentTarget);
    fd.set('proof', image, 'receipt.jpg');
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="checkoutId" value={checkoutId} />
      {banks.length > 1 && (
        <div>
          <label htmlFor="bankAccountId" className="label">Account you paid into</label>
          <select id="bankAccountId" name="bankAccountId" className="input" defaultValue={banks[0]?.id}>
            {banks.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
      )}
      {banks.length === 1 && <input type="hidden" name="bankAccountId" value={banks[0]!.id} />}
      <div>
        <label htmlFor="senderName" className="label">Name on the account you paid from</label>
        <input id="senderName" name="senderName" required defaultValue={defaultName} className="input" />
      </div>
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-line2 bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Your receipt" className="max-h-72 w-full object-contain" />
          <button type="button" onClick={() => { setImage(null); setPreview(null); }} aria-label="Remove screenshot" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line2 bg-panel2 p-6 text-center hover:border-accent-text">
          <ImagePlus className="h-9 w-9 text-accent-text" aria-hidden="true" />
          <span className="font-semibold text-white">Upload your transfer receipt</span>
          <span className="text-sm text-muted">Screenshot from your bank app</span>
          <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
        </label>
      )}
      {fileError && <p role="alert" className="alert-error">{fileError}</p>}
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn btn-primary w-full py-3.5 text-base" pendingText="Uploading…">I’ve paid · submit receipt</SubmitButton>
    </form>
  );
}
