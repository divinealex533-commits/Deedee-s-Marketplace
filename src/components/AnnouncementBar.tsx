import { Megaphone } from 'lucide-react';
import { getAnnouncement } from '@/lib/settings';
import DismissButton from './DismissButton';

const TONES = {
  accent: 'from-accent to-[#8B5CF6] text-white',
  green: 'from-[#0E7C4A] to-[#10A36A] text-white',
  amber: 'from-[#B45309] to-[#D97706] text-white',
};

/** Thin banner at the very top, set from Admin → Settings. Customers can close it. */
export default async function AnnouncementBar() {
  const a = await getAnnouncement();
  if (!a.enabled || !a.text) return null;
  const id = `ann-${a.text.length}-${a.text.slice(0, 20)}`;

  return (
    <div data-announcement={id} className={`relative bg-gradient-to-r ${TONES[a.tone] ?? TONES.accent}`}>
      <div className="container-x flex min-h-[40px] items-center justify-center gap-2 py-2 pr-10 text-center text-sm font-medium">
        <Megaphone className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
        {a.link ? (
          <a href={a.link} className="underline-offset-4 hover:underline">{a.text} →</a>
        ) : (
          <span>{a.text}</span>
        )}
      </div>
      <DismissButton id={id} />
    </div>
  );
}
