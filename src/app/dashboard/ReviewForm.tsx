'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { submitReview } from '@/app/actions/reviews';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function ReviewForm({
  listingId,
  existing,
  onDone,
}: {
  listingId: string;
  existing?: { rating: number; comment: string } | null;
  onDone?: () => void;
}) {
  const { state, pending, onSubmit } = useActionForm(submitReview);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;

  if (state?.ok) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0F3B2C]/60 px-4 py-3 text-sm text-success">
        {state.ok}
        {onDone && <button type="button" onClick={onDone} className="font-semibold text-white">Close</button>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line2 bg-ink/60 p-4">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} star${i > 1 ? 's' : ''}`}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              className="p-1"
            >
              <Star className={`h-7 w-7 transition ${i <= shown ? 'fill-warn text-warn' : 'fill-transparent text-line2'}`} aria-hidden="true" />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-soft">{LABELS[shown] || 'Tap to rate'}</span>
      </div>
      <label htmlFor={`comment-${listingId}`} className="sr-only">Your review</label>
      <textarea
        id={`comment-${listingId}`}
        name="comment"
        rows={2}
        maxLength={500}
        defaultValue={existing?.comment ?? ''}
        placeholder="What was it like? (optional)"
        className="input text-sm"
      />
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton pending={pending} className="btn btn-primary btn-sm" pendingText="Posting…">{existing ? 'Update review' : 'Post review'}</SubmitButton>
        {onDone && <button type="button" onClick={onDone} className="btn btn-ghost btn-sm">Cancel</button>}
      </div>
    </form>
  );
}
