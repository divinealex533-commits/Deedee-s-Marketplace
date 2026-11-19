'use client';

import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { saveAnnouncement, saveReferralConfig, updateAdminName } from '@/app/actions/admin';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';
import type { Announcement, ReferralConfig } from '@/lib/settings';

const TONES = {
  accent: { label: 'Purple', cls: 'from-accent to-[#8B5CF6]' },
  green: { label: 'Green', cls: 'from-[#0E7C4A] to-[#10A36A]' },
  amber: { label: 'Orange', cls: 'from-[#B45309] to-[#D97706]' },
} as const;

export function AnnouncementForm({ initial }: { initial: Announcement }) {
  const { state, pending, onSubmit } = useActionForm(saveAnnouncement);
  const [text, setText] = useState(initial.text);
  const [tone, setTone] = useState<Announcement['tone']>(initial.tone);
  const [enabled, setEnabled] = useState(initial.enabled);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Live preview */}
      <div className={`flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2 text-center text-sm font-medium text-white ${TONES[tone].cls} ${enabled ? '' : 'opacity-50'}`}>
        <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
        {text || 'Your announcement will look like this'}
      </div>

      <div>
        <label htmlFor="ann-text" className="label">Message</label>
        <input id="ann-text" name="text" maxLength={160} value={text} onChange={(e) => setText(e.target.value)} placeholder="🔥 Fresh TikTok accounts just dropped" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ann-link" className="label">Link (optional)</label>
          <input id="ann-link" name="link" defaultValue={initial.link} placeholder="/signup or https://…" className="input" />
        </div>
        <fieldset>
          <legend className="label">Colour</legend>
          <input type="hidden" name="tone" value={tone} />
          <div className="flex gap-2">
            {(Object.keys(TONES) as Announcement['tone'][]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tone === t}
                onClick={() => setTone(t)}
                className={`flex-1 rounded-xl bg-gradient-to-r py-3 text-sm font-semibold text-white ring-offset-2 ring-offset-panel transition ${TONES[t].cls} ${tone === t ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
              >
                {TONES[t].label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-soft">
        <input type="checkbox" name="enabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-[18px] w-[18px] accent-accent" />
        Show on the site
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Saving…">Save announcement</SubmitButton>
    </form>
  );
}

export function NameForm({ initial }: { initial: string }) {
  const { state, pending, onSubmit } = useActionForm(updateAdminName);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <label htmlFor="admin-name" className="sr-only">Display name</label>
        <input id="admin-name" name="name" defaultValue={initial} maxLength={60} className="input min-w-0 flex-1" />
        <SubmitButton pending={pending} pendingText="Saving…">Save</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function ReferralForm({ initial }: { initial: ReferralConfig }) {
  const { state, pending, onSubmit } = useActionForm(saveReferralConfig);
  const [pct, setPct] = useState(initial.percent);
  const [max, setMax] = useState(initial.maxBonus);
  const example = Math.min((10000 * pct) / 100, max || Infinity);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ref-pct" className="label">Reward (%)</label>
          <input id="ref-pct" name="percent" type="number" min={0} max={50} step="0.5" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="input" />
        </div>
        <div>
          <label htmlFor="ref-max" className="label">Max bonus (₦)</label>
          <input id="ref-max" name="maxBonus" type="number" min={0} step={100} value={max} onChange={(e) => setMax(Number(e.target.value))} className="input" />
        </div>
        <div>
          <label htmlFor="ref-min" className="label">Min deposit (₦)</label>
          <input id="ref-min" name="minDeposit" type="number" min={0} step={100} defaultValue={initial.minDeposit} className="input" />
        </div>
      </div>
      <p className="rounded-xl bg-panel2 px-4 py-3 text-sm text-soft">
        Example: a friend’s first deposit of ₦10,000 earns the referrer <strong className="text-white">₦{example.toLocaleString()}</strong>.
      </p>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-soft">
        <input type="checkbox" name="enabled" defaultChecked={initial.enabled} className="h-[18px] w-[18px] accent-accent" />
        Referral rewards are on
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Saving…">Save referral rewards</SubmitButton>
    </form>
  );
}
