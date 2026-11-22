import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getAnnouncement, getReferralConfig, getTelegramConfig } from '@/lib/settings';
import ActionForm from '@/components/ActionForm';
import { saveTelegramConfig } from '@/app/actions/admin';
import { AnnouncementForm, NameForm, ReferralForm } from './Forms';

export const metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const [telegram, announcement, referral, banks, inStock, withImage] = await Promise.all([
    getTelegramConfig(),
    getAnnouncement(),
    getReferralConfig(),
    prisma.bankAccount.count({ where: { active: true } }),
    prisma.credential.count({ where: { status: 'AVAILABLE', listing: { active: true } } }),
    prisma.listing.count({ where: { active: true, imageAt: { not: null } } }),
  ]);
  const appUrl = process.env.APP_URL ?? '';

  const checklist: { done: boolean; label: string; href?: string; hint: string }[] = [
    { done: banks > 0, label: 'Add your bank accounts', href: '/admin/bank-accounts', hint: '9PSB and PocketApp details customers pay into' },
    { done: inStock > 0, label: 'Add stock to the credentials pool', href: '/admin/credentials', hint: `${inStock} item${inStock === 1 ? '' : 's'} in stock` },
    { done: withImage > 0, label: 'Add photos to your listings', href: '/admin/credentials', hint: 'Listings with photos sell better' },
    { done: admin.name !== 'Admin', label: 'Set your display name', hint: 'Shown in your admin welcome banner' },
    { done: Boolean(telegram.channel), label: 'Add your Telegram channel', hint: 'Shown in the Help button and on login/sign-up' },
    { done: announcement.enabled, label: 'Post a launch announcement', hint: 'e.g. “We’re live! New stock daily”' },
    { done: Boolean(appUrl) && !appUrl.includes('vercel.app'), label: 'Connect your own domain', hint: 'Vercel → Settings → Domains, then update APP_URL' },
  ];
  const done = checklist.filter((c) => c.done).length;

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-muted">Announcement bar, your profile, and a launch checklist.</p>
      </div>

      <section aria-labelledby="tg" className="card p-6">
        <h2 id="tg" className="text-lg font-semibold text-white">Telegram channel and bot</h2>
        <p className="mb-5 mt-1 text-sm text-muted">
          Shown in the Help button, and as a “Join our Telegram community” box on the login, sign-up and log-out screens. Paste the username or the t.me link. Leave empty to hide.
        </p>
        <ActionForm action={saveTelegramConfig} submit="Save Telegram links" buttonClass="btn btn-primary" className="max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tg-channel" className="label">Channel username</label>
            <input id="tg-channel" name="channel" defaultValue={telegram.channel} placeholder="deedeesmarketplace" className="input" />
          </div>
          <div>
            <label htmlFor="tg-bot" className="label">Bot username</label>
            <input id="tg-bot" name="bot" defaultValue={telegram.bot} placeholder="deedeesmarketbot" className="input" />
          </div>
          </div>
        </ActionForm>
      </section>

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="ann" className="card min-w-0 flex-[2_1_440px] p-6">
          <h2 id="ann" className="text-lg font-semibold text-white">Announcement bar</h2>
          <p className="mb-5 mt-1 text-sm text-muted">A thin banner at the top of the website and customer dashboards. Great for new stock, promos or downtime notices.</p>
          <AnnouncementForm initial={announcement} />
        </section>

        <section aria-labelledby="launch" className="card min-w-0 flex-[1_1_320px] p-6">
          <div className="flex items-baseline justify-between">
            <h2 id="launch" className="text-lg font-semibold text-white">Launch checklist</h2>
            <span className="text-sm text-muted">{done}/{checklist.length}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all" style={{ width: `${(done / checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-5 space-y-3">
            {checklist.map((c) => (
              <li key={c.label} className="flex gap-3">
                {c.done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="Done" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-placeholder" aria-label="Not done" />
                )}
                <div>
                  {c.href && !c.done ? (
                    <Link href={c.href} className="font-medium text-white hover:text-accent-text">{c.label} →</Link>
                  ) : (
                    <span className={`font-medium ${c.done ? 'text-muted line-through' : 'text-white'}`}>{c.label}</span>
                  )}
                  <div className="text-[13px] text-muted">{c.hint}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-5">
      <section aria-labelledby="referral" className="card min-w-0 flex-[1_1_380px] p-6">
        <h2 id="referral" className="text-lg font-semibold text-white">Referral rewards</h2>
        <p className="mb-5 mt-1 text-sm text-muted">When someone who signed up with a customer’s link gets their first deposit approved, that customer gets a bonus in their wallet.</p>
        <ReferralForm initial={referral} />
      </section>
      <section aria-labelledby="profile" className="card min-w-0 flex-[1_1_320px] self-start p-6">
        <h2 id="profile" className="mb-4 text-lg font-semibold text-white">Your display name</h2>
        <NameForm initial={admin.name} />
      </section>
      </div>
    </>
  );
}
