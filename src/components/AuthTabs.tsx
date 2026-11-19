import Link from 'next/link';

/** "Log in | Sign up" switch at the top of the auth card. */
export default function AuthTabs({ active }: { active: 'login' | 'signup' }) {
  const cls = (on: boolean) =>
    `flex-1 rounded-xl py-2.5 text-center text-[15px] font-semibold transition ${on ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-soft hover:text-white'}`;
  return (
    <nav aria-label="Account" className="mb-7 flex rounded-2xl border border-line2 bg-ink/70 p-1">
      <Link href="/login" aria-current={active === 'login' ? 'page' : undefined} className={cls(active === 'login')}>Log in</Link>
      <Link href="/signup" aria-current={active === 'signup' ? 'page' : undefined} className={cls(active === 'signup')}>Sign up</Link>
    </nav>
  );
}
