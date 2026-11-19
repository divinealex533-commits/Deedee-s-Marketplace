import type { IconType } from 'react-icons';
import {
  SiDiscord, SiFacebook, SiGmail, SiGoogle, SiInstagram, SiNetflix, SiPinterest, SiReddit, SiSnapchat,
  SiSpotify, SiTelegram, SiThreads, SiTiktok, SiTwitch, SiWhatsapp, SiX, SiYoutube,
} from 'react-icons/si';
import { BadgeCheck } from 'lucide-react';

/** Brand look for each platform: icon, icon colour, and a background gradient. */
export type PlatformStyle = { Icon: IconType | typeof BadgeCheck; color: string; bg: string; glow: string };

const STYLES: [RegExp, PlatformStyle][] = [
  [/insta|^ig$/i, { Icon: SiInstagram, color: '#fff', bg: 'linear-gradient(135deg,#F58529 0%,#DD2A7B 45%,#8134AF 75%,#515BD4 100%)', glow: '#DD2A7B' }],
  [/tik ?tok/i, { Icon: SiTiktok, color: '#fff', bg: 'linear-gradient(135deg,#111 0%,#000 55%,#1a1a1a 100%)', glow: '#25F4EE' }],
  [/face ?book|^fb$/i, { Icon: SiFacebook, color: '#fff', bg: 'linear-gradient(135deg,#1877F2 0%,#0B5ED7 100%)', glow: '#1877F2' }],
  [/twitter|^x\b|\(x\)/i, { Icon: SiX, color: '#fff', bg: 'linear-gradient(135deg,#1c1c1c 0%,#000 100%)', glow: '#9CA3AF' }],
  [/you ?tube/i, { Icon: SiYoutube, color: '#fff', bg: 'linear-gradient(135deg,#FF0000 0%,#C40000 100%)', glow: '#FF0000' }],
  [/snap/i, { Icon: SiSnapchat, color: '#111', bg: 'linear-gradient(135deg,#FFFC00 0%,#F5D90A 100%)', glow: '#FFFC00' }],
  [/telegram/i, { Icon: SiTelegram, color: '#fff', bg: 'linear-gradient(135deg,#2AABEE 0%,#229ED9 100%)', glow: '#2AABEE' }],
  [/whats ?app/i, { Icon: SiWhatsapp, color: '#fff', bg: 'linear-gradient(135deg,#25D366 0%,#128C7E 100%)', glow: '#25D366' }],
  [/discord/i, { Icon: SiDiscord, color: '#fff', bg: 'linear-gradient(135deg,#5865F2 0%,#4752C4 100%)', glow: '#5865F2' }],
  [/threads/i, { Icon: SiThreads, color: '#fff', bg: 'linear-gradient(135deg,#1c1c1c 0%,#000 100%)', glow: '#9CA3AF' }],
  [/reddit/i, { Icon: SiReddit, color: '#fff', bg: 'linear-gradient(135deg,#FF4500 0%,#E03D00 100%)', glow: '#FF4500' }],
  [/pinterest/i, { Icon: SiPinterest, color: '#fff', bg: 'linear-gradient(135deg,#E60023 0%,#B8001C 100%)', glow: '#E60023' }],
  [/twitch/i, { Icon: SiTwitch, color: '#fff', bg: 'linear-gradient(135deg,#9146FF 0%,#772CE8 100%)', glow: '#9146FF' }],
  [/netflix/i, { Icon: SiNetflix, color: '#E50914', bg: 'linear-gradient(135deg,#141414 0%,#000 100%)', glow: '#E50914' }],
  [/spotify/i, { Icon: SiSpotify, color: '#fff', bg: 'linear-gradient(135deg,#1DB954 0%,#168D40 100%)', glow: '#1DB954' }],
  [/gmail|e-?mail/i, { Icon: SiGmail, color: '#fff', bg: 'linear-gradient(135deg,#EA4335 0%,#C5221F 100%)', glow: '#EA4335' }],
  [/google/i, { Icon: SiGoogle, color: '#fff', bg: 'linear-gradient(135deg,#4285F4 0%,#3367D6 100%)', glow: '#4285F4' }],
];

const FALLBACK: PlatformStyle = { Icon: BadgeCheck, color: '#fff', bg: 'linear-gradient(135deg,#6246EA 0%,#4A30C9 100%)', glow: '#6246EA' };

export function platformStyle(platform: string): PlatformStyle {
  return STYLES.find(([re]) => re.test(platform))?.[1] ?? FALLBACK;
}

/** Rounded square with the platform's real icon on its brand colours. */
export function PlatformTile({ platform, size = 40, className = '' }: { platform: string; size?: number; className?: string }) {
  const s = platformStyle(platform);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[28%] shadow-lg shadow-black/30 ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size, background: s.bg }}
      aria-hidden="true"
    >
      <s.Icon style={{ width: size * 0.52, height: size * 0.52, color: s.color }} />
    </span>
  );
}

/** Small pill: real icon + platform name. */
export function PlatformBadge({ platform, className = '' }: { platform: string; className?: string }) {
  const s = platformStyle(platform);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink/75 py-1 pl-1 pr-2.5 text-xs font-semibold text-white backdrop-blur-md ${className}`}>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ background: s.bg }} aria-hidden="true">
        <s.Icon style={{ width: 11, height: 11, color: s.color }} />
      </span>
      {platform}
    </span>
  );
}
