import { requireUser } from '@/lib/auth';
import { maskPhone } from '@/lib/phone';
import { formatDate } from '@/lib/format';
import { prisma } from '@/lib/db';
import CopyButton from '@/components/CopyButton';
import ChangePasswordForm from './ChangePasswordForm';
import { SITE_URL } from '@/lib/site';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();
  const referrals = await prisma.user.count({ where: { referredById: user.id } });
  const link = `${SITE_URL}/signup?ref=${user.referralCode}`;

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-muted">Your profile, security and referral link.</p>
      </div>
      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="profile" className="card min-w-0 flex-[1_1_320px] p-6">
          <h2 id="profile" className="mb-4 text-lg font-semibold text-white">Profile</h2>
          <dl className="space-y-3 text-[15px]">
            {[
              ['Name', user.name],
              ['Email', user.email],
              ['Phone', maskPhone(user.phone)],
              ['Account type', user.accountType === 'SELLER' ? 'Seller' : 'Buyer'],
              ['Member since', formatDate(user.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-line pt-3 first:border-t-0 first:pt-0">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mb-2 mt-7 font-semibold text-white">Invite friends <a href="/dashboard/referrals" className="ml-2 text-sm font-medium text-accent-text">See rewards →</a></h3>
          <p className="text-sm text-muted">Share your link. {referrals} {referrals === 1 ? 'person has' : 'people have'} joined with it so far.</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-ink px-3 py-2">
            <code className="min-w-0 flex-1 truncate text-sm text-soft">{link}</code>
            <CopyButton value={link} label="Referral link" />
          </div>
        </section>
        <section aria-labelledby="security" className="card min-w-0 flex-[1_1_320px] p-6">
          <h2 id="security" className="mb-4 text-lg font-semibold text-white">Change password</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  );
}
