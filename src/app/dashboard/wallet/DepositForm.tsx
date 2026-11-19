'use client';

import { startTransition, useActionState, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { submitDeposit } from '@/app/actions/wallet';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';

/** Shrinks big phone screenshots to a sharp ~200–400 KB JPEG before upload. */
async function compress(file: File): Promise<Blob> {
  const MAX = 1600;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // unusual format: send as-is and let the server check it
  }
}

export default function DepositForm({ banks, defaultName }: { banks: { id: string; label: string }[]; defaultName: string }) {
  const [state, action, pending] = useActionState(submitDeposit, undefined);
  const [image, setImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setImage(null);
      setPreview(null);
    }
  }, [state]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return setFileError('Choose an image (a screenshot or photo of your receipt).');
    const small = await compress(f);
    if (small.size > 4 * 1024 * 1024) return setFileError('That image is too large. Try a screenshot instead of a photo.');
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
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label htmlFor="bankAccountId" className="label">Account you paid into</label>
          <select id="bankAccountId" name="bankAccountId" required className="input" defaultValue={banks[0]?.id}>
            {banks.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="label">Amount you sent (₦)</label>
          <input id="amount" name="amount" type="number" min={100} step={1} required placeholder="e.g. 10000" className="input" />
        </div>
        <div>
          <label htmlFor="senderName" className="label">Name on the account you paid from</label>
          <input id="senderName" name="senderName" required defaultValue={defaultName} className="input" />
        </div>
        <div>
          <label htmlFor="note" className="label">Note (optional)</label>
          <input id="note" name="note" placeholder="e.g. Sent from Opay" className="input" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="label mb-0">Receipt screenshot</span>
        {preview ? (
          <div className="relative overflow-hidden rounded-2xl border border-line2 bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your receipt" className="max-h-80 w-full object-contain" />
            <button
              type="button"
              onClick={() => { setImage(null); setPreview(null); }}
              aria-label="Remove screenshot"
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label className="flex min-h-[200px] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line2 bg-panel2 p-6 text-center hover:border-accent-text">
            <ImagePlus className="h-10 w-10 text-accent-text" aria-hidden="true" />
            <span className="font-semibold text-white">Tap to upload your receipt</span>
            <span className="text-sm text-muted">Screenshot from your bank app (JPG or PNG)</span>
            <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
          </label>
        )}
        {fileError && <p role="alert" className="alert-error">{fileError}</p>}
        <FormMessage state={state} />
        <SubmitButton pending={pending} className="btn btn-primary w-full py-3.5 text-base" pendingText="Uploading…">
          Submit for approval
        </SubmitButton>
      </div>
    </form>
  );
}
