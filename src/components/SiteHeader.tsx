import Link from 'next/link';
import Logo from './Logo';
import { getSession } from '@/lib/auth';

const links = [
  { href: '/#about', label: 'About' },
  { href: '/#features', label: 'Features' },
  { href: '/#how', label: 'How it works' },
  { href: '/#support', label: 'Support' },
];

export default async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <nav className="container-x flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
        <Logo />
        <div className="order-3 flex w-full flex-wrap gap-x-6 text-[15px] font-medium sm:order-none sm:w-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="py-2 text-soft hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-3">
          {session ? (
            <Link href={session.role === 'ADMIN' ? '/admin' : '/dashboard'} className="btn btn-primary">
              My dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Log in</Link>
              <Link href="/signup" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
