'use client';

import { useState } from 'react';
import { MessageCircle, Star } from 'lucide-react';
import { addWhatsAppReview } from '@/app/actions/reviews';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function AddFeedbackForm({ listings }: { listings: { id: string; title: string }[] }) {
  const { state, pending, onSubmit, ref } = useActionForm(addWhatsAppReview, { resetOnOk: true });
  const [rating, setRating] = useState(5);

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="rating" value={rating} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fb-name" className="label">Customer name (as shown)</label>
          <input id="fb-name" name="authorName" required placeholder="e.g. Tunde A." className="input" />
        </div>
        <div>
          <label htmlFor="fb-listing" className="label">What they bought (optional)</label>
          <select id="fb-listing" name="listingId" className="input" defaultValue="">
            <option value="">General feedback</option>
            {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="label">Rating</legend>
        <div className="flex" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} stars`} onClick={() => setRating(i)} className="p-1">
              <Star className={`h-7 w-7 ${i <= rating ? 'fill-warn text-warn' : 'fill-transparent text-line2'}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="fb-comment" className="label">What they wrote</label>
        <textarea id="fb-comment" name="comment" required rows={3} maxLength={500} placeholder="Paste the customer’s message" className="input" />
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-soft">
        <input type="checkbox" name="consent" className="mt-0.5 h-[18px] w-[18px] accent-accent" />
        <span>This is real feedback this customer sent me, and they’re happy for it to be shown.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Adding…"><MessageCircle className="h-4 w-4" aria-hidden="true" /> Add feedback</SubmitButton>
    </form>
  );
}
