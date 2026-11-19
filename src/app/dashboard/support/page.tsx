import { MessageCircle, Phone } from 'lucide-react';
import { site, whatsappLink } from '@/lib/site';

export const metadata = { title: 'Support' };

const faqs = [
  ['How fast is delivery?', 'Instantly. Your login details appear under My accounts on your dashboard the moment you pay.'],
  ['What if an account doesn’t work?', 'Tap “Report a problem” on that order. Our team will check it and replace or refund it.'],
  ['How do I fund my wallet?', 'Go to Wallet, transfer to one of our bank accounts, then upload a screenshot of your receipt. We credit your wallet as soon as we confirm it, usually within minutes.'],
  ['How long does approval take?', 'Usually a few minutes during the day. If it’s taking long, message us on WhatsApp with your narration code.'],
  ['My deposit was rejected. What now?', 'Check the reason shown on your Wallet page. If you did pay, send a clearer screenshot or message us on WhatsApp.'],
  ['How do I sell my accounts?', 'Message us on WhatsApp with what you have. We’ll check the accounts and agree a price with you.'],
];

export default function SupportPage() {
  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Support</h1>
        <p className="mt-1 text-muted">We reply fast on WhatsApp, any time of day.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <a href={whatsappLink('Hello, I need help with my account')} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-6 hover:border-line2">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-whatsapp">
            <MessageCircle className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="text-lg font-semibold text-white">Chat on WhatsApp</div>
            <div className="text-muted">{site.whatsappDisplay}</div>
          </div>
        </a>
        <a href={`tel:${site.phone}`} className="card flex items-center gap-4 p-6 hover:border-line2">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent">
            <Phone className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="text-lg font-semibold text-white">Call us</div>
            <div className="text-muted">{site.phoneDisplay}</div>
          </div>
        </a>
      </div>
      <section aria-labelledby="faq" className="card p-6">
        <h2 id="faq" className="mb-2 text-lg font-semibold text-white">Common questions</h2>
        {faqs.map(([q, a]) => (
          <details key={q} className="group border-t border-line py-4 first:border-t-0">
            <summary className="cursor-pointer list-none font-medium text-white marker:hidden">
              <span className="mr-2 inline-block text-accent-text transition group-open:rotate-90">›</span>
              {q}
            </summary>
            <p className="mt-2 pl-5 text-muted">{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
