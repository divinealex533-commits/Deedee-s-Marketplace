import Link from 'next/link';
import { BookOpen, KeyRound } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate, naira } from '@/lib/format';
import { revokeApiKey } from '@/app/actions/apikeys';
import SubmitButton from '@/components/SubmitButton';
import CopyButton from '@/components/CopyButton';
import CreateKeyForm from './CreateKeyForm';
import { SITE_URL } from '@/lib/site';

export const metadata = { title: 'API' };

export default async function ApiPage() {
  const user = await requireUser();
  const keys = await prisma.apiKey.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  const active = keys.filter((k) => !k.revokedAt);
  const base = SITE_URL;
  const example = `curl ${base}/api/v1/balance \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Reseller API</h1>
          <p className="mt-1 max-w-2xl text-muted">
            Connect your own website, app or bot. Check stock, buy and receive logins automatically. Purchases are paid from your wallet ({naira(user.balance)}).
          </p>
        </div>
        <Link href="/docs/api" className="btn btn-ghost"><BookOpen className="h-4 w-4" aria-hidden="true" /> API documentation</Link>
      </div>

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="new-key" className="card min-w-0 flex-[1_1_320px] p-6">
          <h2 id="new-key" className="mb-1 text-lg font-semibold text-white">Create a key</h2>
          <p className="mb-4 text-sm text-muted">Give it a name so you know where it’s used. Keep keys secret: anyone with a key can spend your wallet.</p>
          <CreateKeyForm />
        </section>

        <section aria-labelledby="quick" className="card min-w-0 flex-[1_1_380px] p-6">
          <h2 id="quick" className="mb-3 text-lg font-semibold text-white">Quick start</h2>
          <div className="relative rounded-xl border border-line2 bg-ink p-4">
            <pre className="overflow-x-auto pr-10 font-mono text-[13px] leading-relaxed text-soft"><code>{example}</code></pre>
            <div className="absolute right-2 top-2"><CopyButton value={example} label="Example" /></div>
          </div>
          <p className="mt-3 text-sm text-muted">Replace YOUR_API_KEY with a key from the left. See the docs for products and buying.</p>
        </section>
      </div>

      <section aria-labelledby="keys" className="card p-6">
        <h2 id="keys" className="mb-4 text-lg font-semibold text-white">Your keys <span className="ml-1 text-sm font-normal text-muted">{active.length} active</span></h2>
        {keys.length ? (
          <ul className="space-y-3">
            {keys.map((k) => (
              <li key={k.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-line2 bg-panel2 p-4 ${k.revokedAt ? 'opacity-50' : ''}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-text"><KeyRound className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{k.name}</div>
                  <div className="font-mono text-[13px] text-muted">{k.prefix}••••••••••••</div>
                </div>
                <div className="text-[13px] text-muted">
                  <div>Created {formatDate(k.createdAt)}</div>
                  <div>{k.revokedAt ? `Revoked ${formatDate(k.revokedAt)}` : k.lastUsedAt ? `Last used ${formatDate(k.lastUsedAt)}` : 'Never used'}</div>
                </div>
                {!k.revokedAt && (
                  <form action={revokeApiKey}>
                    <input type="hidden" name="id" value={k.id} />
                    <SubmitButton className="btn btn-danger btn-sm" pendingText="…">Revoke</SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-muted">No keys yet.</p>
        )}
      </section>
    </>
  );
}
