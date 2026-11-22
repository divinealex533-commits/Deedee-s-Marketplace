import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getAnnouncement, getReferralConfig, getTelegramConfig } from '@/lib/settings';
import ActionForm from '@/components/ActionForm';
import { connectBot, postChannelMessage, saveTelegramConfig, setAutoPost } from '@/app/actions/admin';
import { getBotConfig } from '@/lib/telegram';
import { AnnouncementForm, NameForm, ReferralForm } from './Forms';

export const metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const [bot, telegram, announcement, referral, banks, inStock, withImage] = await Promise.all([
    getBotConfig(),
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

      <section aria-labelledby="bot" className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="bot" className="text-lg font-semibold text-white">Telegram bot</h2>
          {bot.token && bot.username
            ? <span className="badge bg-[#0F3B2C] text-success">Connected: @{bot.username}</span>
            : <span className="badge bg-line text-soft">Not connected</span>}
        </div>
        <p className="mb-5 mt-1 text-sm text-muted">
          Paste the token BotFather gave you. The bot then answers /start, /shop, /wallet, /howtobuy, /sell, /support and /channel. Keep the token secret: anyone with it controls your bot.
        </p>
        <div className="grid gap-6 lg:grid-cols-3">
          <ActionForm action={connectBot} submit={bot.token ? 'Reconnect bot' : 'Connect bot'} pendingText="Connecting…" buttonClass="btn btn-primary w-full">
            <div>
              <label htmlFor="bot-token" className="label">Bot token</label>
              <input id="bot-token" name="token" type="password" autoComplete="off" placeholder={bot.token ? 'Saved. Paste a new one to replace it' : '123456789:AA…'} className="input font-mono" />
            </div>
          </ActionForm>
          <ActionForm action={setAutoPost} submit="Save" buttonClass="btn btn-ghost w-full">
            <span className="label">New stock posts</span>
            <label className="flex items-start gap-3 text-[15px] text-soft">
              <input type="checkbox" name="autoPost" defaultChecked={bot.autoPost} className="mt-1 h-4 w-4" />
              Post in the channel automatically whenever stock is added (by you or a seller)
            </label>
          </ActionForm>
          <ActionForm action={postChannelMessage} resetOnOk submit="Post to channel" pendingText="Posting…" buttonClass="btn btn-primary w-full">
            <div>
              <label htmlFor="post-text" className="label">Post a message in your channel</label>
              <textarea id="post-text" name="text" rows={4} maxLength={3500} placeholder="e.g. Weekend deal: 10% off all Instagram pages till Sunday!" className="input" />
            </div>
            <label className="flex items-center gap-2 text-sm text-soft">
              <input type="checkbox" name="button" defaultChecked className="h-4 w-4" /> Add a “Shop now” button
            </label>
          </ActionForm>
        </div>
        <p className="mt-4 text-[13px] text-muted">For channel posts, make the bot an admin of your channel with “Post messages” turned on.</p>
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
