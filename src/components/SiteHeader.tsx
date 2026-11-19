import Link from 'next/link';
import { Menu } from 'lucide-react';
import Logo from './Logo';
import { getSession } from '@/lib/auth';

const links = [
  { href: '/#stock', label: 'Marketplace' },
  { href: '/#features', label: 'Features' },
  { href: '/#how', label: 'How it works' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#support', label: 'Support' },
];

export default async function SiteHeader() {
  const session = await getSession();
  const dash = session?.role === 'ADMIN' ? '/admin' : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/75 backdrop-blur-xl">
      <nav aria-label="Main" className="container-x flex h-[68px] items-center justify-between gap-6">
        <Logo />

        <div className="hidden items-center gap-1 text-[15px] font-medium md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-soft transition hover:bg-panel hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <Link href={dash} className="btn btn-primary">My dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn hidden text-soft hover:text-white sm:inline-flex">Log in</Link>
              <Link href="/signup" className="btn btn-primary shadow-lg shadow-accent/30">Get started</Link>
            </>
          )}

          {/* Mobile menu (no JavaScript needed) */}
          <details className="group relative md:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-line2 text-soft marker:hidden [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-14 w-56 rounded-2xl border border-line2 bg-panel p-2 shadow-2xl shadow-black/50">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 text-[15px] text-soft hover:bg-line hover:text-white">
                  {l.label}
                </Link>
              ))}
              {!session && (
                <Link href="/login" className="mt-1 block rounded-xl border-t border-line px-4 py-3 text-[15px] font-semibold text-white hover:bg-line">
                  Log in
                </Link>
              )}
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
