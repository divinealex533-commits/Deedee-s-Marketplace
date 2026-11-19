import Link from 'next/link';
import { site, whatsappLink } from '@/lib/site';

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="container-x flex flex-wrap justify-between gap-10 py-14">
        <div className="max-w-xs">
          <div className="font-display text-xl font-bold text-white">{site.name}</div>
          <p className="mt-2 text-[15px] text-muted">The safe marketplace for premium digital accounts.</p>
        </div>
        <div className="flex flex-wrap gap-14 text-[15px]">
          <div>
            <h3 className="mb-3 font-semibold text-white">Quick links</h3>
            <ul className="space-y-2 text-muted">
              <li><Link href="/#about" className="hover:text-white">About</Link></li>
              <li><Link href="/#features" className="hover:text-white">Features</Link></li>
              <li><Link href="/signup" className="hover:text-white">Create account</Link></li>
              <li><Link href="/login" className="hover:text-white">Log in</Link></li>
              <li><Link href="/docs/api" className="hover:text-white">API docs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Support</h3>
            <ul className="space-y-2 text-muted">
              <li><a href={whatsappLink()} className="hover:text-white">WhatsApp: {site.whatsappDisplay}</a></li>
              <li><a href={`tel:${site.phone}`} className="hover:text-white">Call: {site.phoneDisplay}</a></li>
              <li><Link href="/terms" className="hover:text-white">Terms of service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy policy</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container-x border-t border-line py-6 text-sm text-[#8A90AB]">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
