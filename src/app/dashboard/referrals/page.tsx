import { Gift, MessageCircle, UserCheck, Users, Wallet } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate, naira } from '@/lib/format';
import { getReferralConfig } from '@/lib/settings';
import { site, SITE_URL } from '@/lib/site';
import CopyButton from '@/components/CopyButton';
import StatCard from '@/components/StatCard';

export const metadata = { title: 'Referrals' };

export default async function ReferralsPage() {
  const user = await requireUser();
  const [cfg, friends, bonuses] = await Promise.all([
    getReferralConfig(),
    prisma.user.findMany({
      where: { referredById: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, referralBonusPaid: true },
    }),
    prisma.transaction.findMany({ where: { userId: user.id, type: 'REFERRAL' }, orderBy: { createdAt: 'desc' } }),
  ]);
  const earned = bonuses.reduce((a, t) => a + t.amount, 0);
  const funded = friends.filter((f) => f.referralBonusPaid).length;
  const link = `${SITE_URL}/signup?ref=${user.referralCode}`;
  const shareText = `Buy premium accounts with fast delivery on ${site.name}. Sign up with my link: ${link}`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line2 bg-gradient-to-br from-[#2A1F6B] via-panel to-panel2 p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/40">
            <Gift className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold text-white sm:text-4xl">Invite friends, earn wallet credit</h1>
          {cfg.enabled ? (
            <p className="mt-2 max-w-2xl text-soft">
              Get <strong className="text-white">{cfg.percent}%</strong> of each friend’s first deposit
              {cfg.maxBonus ? <> (up to <strong className="text-white">{naira(cfg.maxBonus * 100)}</strong>)</> : null}, added to your wallet automatically
              {cfg.minDeposit ? <> when they fund {naira(cfg.minDeposit * 100)} or more</> : null}.
            </p>
          ) : (
            <p className="mt-2 max-w-2xl text-soft">Referral rewards are paused right now, but friends can still join with your link.</p>
          )}

          <div className="mt-6 flex max-w-2xl flex-wrap gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/15 bg-ink/60 px-3 py-2.5 backdrop-blur">
              <code className="min-w-0 flex-1 truncate font-mono text-sm text-white">{link}</code>
              <CopyButton value={link} label="Referral link" />
            </div>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="btn bg-whatsapp text-white hover:brightness-110">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Share on WhatsApp
            </a>
          </div>
          <p className="mt-3 text-sm text-muted">Your code: <span className="font-mono font-semibold text-white">{user.referralCode}</span></p>
        </div>
      </section>

      <section aria-label="Your referral stats" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Friends joined" value={friends.length} icon={Users} tone="blue" />
        <StatCard label="Friends who funded" value={funded} icon={UserCheck} tone="green" />
        <StatCard label="Total earned" value={naira(earned)} icon={Wallet} tone="violet" />
      </section>

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="friends" className="card min-w-0 flex-[1_1_340px] p-6">
          <h2 id="friends" className="mb-3 text-lg font-semibold text-white">Your friends</h2>
          {friends.length ? (
            <ul>
              {friends.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0">
                  <div>
                    <div className="text-white">{f.name.split(' ')[0]} {f.name.split(' ')[1]?.[0] ? `${f.name.split(' ')[1]![0]}.` : ''}</div>
                    <div className="text-[13px] text-muted">Joined {formatDate(f.createdAt)}</div>
                  </div>
                  <span className={`badge ${f.referralBonusPaid ? 'bg-[#0F3B2C] text-success' : 'bg-line text-soft'}`}>
                    {f.referralBonusPaid ? 'Rewarded' : 'Waiting for first deposit'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">No one yet. Share your link to get started.</p>
          )}
        </section>

        <section aria-labelledby="earnings" className="card min-w-0 flex-[1_1_340px] p-6">
          <h2 id="earnings" className="mb-3 text-lg font-semibold text-white">Bonuses received</h2>
          {bonuses.length ? (
            <ul>
              {bonuses.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 border-t border-line py-3 first:border-t-0">
                  <div>
                    <div className="text-white">{t.description}</div>
                    <div className="text-[13px] text-muted">{formatDate(t.createdAt)}</div>
                  </div>
                  <div className="font-semibold text-success">+{naira(t.amount)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">Bonuses appear here when friends fund their wallets.</p>
          )}
        </section>
      </div>
    </>
  );
}
