import Link from 'next/link';
import { KeyRound, MessageCircle, Phone } from 'lucide-react';
import { site, whatsappLink } from '@/lib/site';

export const metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <>
      <Link href="/login" className="text-sm font-semibold text-accent-text hover:text-white">← Back to log in</Link>
      <div className="mb-5 mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-text">
        <KeyRound className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="font-display text-[28px] font-bold leading-tight text-white">Forgot your password?</h1>
      <p className="mt-1.5 text-muted">
        No problem. Message us with the email or phone number on your account and we’ll send you a new password in minutes.
      </p>
      <div className="mt-7 space-y-3">
        <a
          href={whatsappLink('Hi, I forgot my password. My account email/phone is: ')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn w-full bg-whatsapp py-3.5 text-base text-white hover:brightness-110"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> Reset on WhatsApp
        </a>
        <a href={`tel:${site.phone}`} className="btn btn-ghost w-full py-3.5 text-base">
          <Phone className="h-5 w-5" aria-hidden="true" /> Call {site.phoneDisplay}
        </a>
      </div>
      <p className="mt-6 text-center text-[13px] text-muted">After logging in with the new password, change it in Settings.</p>
    </>
  );
}
