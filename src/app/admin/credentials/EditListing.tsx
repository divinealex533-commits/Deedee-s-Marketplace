'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { compressField, useActionForm } from '@/components/useActionForm';
import { deleteListing, editListing } from '@/app/actions/admin';
import { PLATFORMS } from '@/lib/site';
import CategoryInput from './CategoryInput';

type L = { id: string; platform: string; title: string; description: string; price: number; active: boolean; hasImage: boolean };

/** "Edit" button that opens a pop-up to change everything about a listing, or delete it. */
export default function EditListing({ listing, categories = PLATFORMS }: { listing: L; categories?: readonly string[] }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const edit = useActionForm(editListing, { transform: compressField('image') });
  const del = useActionForm(deleteListing);
  const platforms = categories.includes(listing.platform) ? [...categories] : [listing.platform, ...categories];

  // Close shortly after a successful save/delete
  useEffect(() => {
    if (edit.state?.ok || del.state?.ok) {
      const t = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(t);
    }
  }, [edit.state, del.state]);

  const f = (n: string) => `${n}-${listing.id}`;
  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setConfirmDelete(false); }} className="btn btn-ghost btn-sm mt-1.5">
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} label={`Edit ${listing.title}`} wide>
        <h2 className="mb-4 pr-8 font-display text-xl font-bold text-white">Edit listing</h2>
        <form ref={edit.ref} onSubmit={edit.onSubmit} className="space-y-4">
          <input type="hidden" name="id" value={listing.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <CategoryInput id={f('platform')} categories={platforms} defaultValue={listing.platform} />
            <div>
              <label htmlFor={f('price')} className="label">Price (₦)</label>
              <input id={f('price')} name="price" type="number" min={1} step="any" required defaultValue={listing.price} className="input" />
            </div>
          </div>
          <div>
            <label htmlFor={f('title')} className="label">Title customers see</label>
            <input id={f('title')} name="title" required defaultValue={listing.title} className="input" />
          </div>
          <div>
            <label htmlFor={f('description')} className="label">Description</label>
            <textarea id={f('description')} name="description" rows={4} defaultValue={listing.description} className="input" />
          </div>
          <div>
            <label htmlFor={f('image')} className="label">{listing.hasImage ? 'Change photo (optional)' : 'Add a photo (optional)'}</label>
            <input id={f('image')} name="image" type="file" accept="image/*" className="input py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-line file:px-3 file:py-1.5 file:text-soft" />
            {listing.hasImage && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-soft">
                <input type="checkbox" name="removeImage" className="h-[18px] w-[18px] accent-accent" /> Remove the current photo (use the platform cover)
              </label>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-soft">
            <input type="checkbox" name="active" defaultChecked={listing.active} className="h-[18px] w-[18px] accent-accent" />
            Visible to customers (untick to hide it from the shop)
          </label>
          <FormMessage state={edit.state} />
          <SubmitButton pending={edit.pending} pendingText="Saving…" className="btn btn-primary w-full py-3">Save changes</SubmitButton>
        </form>

        <div className="mt-6 border-t border-line pt-5">
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 text-sm font-medium text-danger hover:underline">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete this listing
            </button>
          ) : (
            <form onSubmit={del.onSubmit} className="space-y-3">
              <input type="hidden" name="id" value={listing.id} />
              <p className="text-sm text-soft">Delete “{listing.title}” and its unsold stock? If it already has orders, it will be hidden instead so customers keep their order history.</p>
              <FormMessage state={del.state} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-ghost py-2.5">Cancel</button>
                <SubmitButton pending={del.pending} pendingText="Deleting…" className="btn btn-danger w-full py-2.5">Yes, delete</SubmitButton>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
