import { SiTelegram } from 'react-icons/si';
import { tgLink } from '@/lib/site';

/** "Join our Telegram community" box. Renders nothing until a channel is set in Admin → Settings. */
export default function TelegramJoin({ channel, compact = false }: { channel: string; compact?: boolean }) {
  if (!channel) return null;
  return (
    <a
      href={tgLink(channel)}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-4 rounded-2xl border border-[#229ED9]/40 bg-[#229ED9]/10 text-left transition hover:border-[#229ED9] ${compact ? 'p-3' : 'p-4'}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#229ED9]">
        <SiTelegram className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-white">Join our Telegram community</span>
        <span className="block text-[13px] text-muted">New stock, deals and updates first</span>
      </span>
      <span className="shrink-0 rounded-full bg-[#229ED9] px-3.5 py-1.5 text-sm font-semibold text-white">Join</span>
    </a>
  );
}
