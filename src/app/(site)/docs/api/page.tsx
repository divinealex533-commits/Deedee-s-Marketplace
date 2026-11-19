import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, KeyRound, ShieldCheck, Timer, Zap } from 'lucide-react';
import CodeBlock from '@/components/CodeBlock';
import { site, whatsappLink } from '@/lib/site';

export const metadata = {
  title: 'API documentation',
  description: `Reseller API for ${site.name}: check your balance, list products and buy accounts automatically.`,
};

const BASE = `${process.env.APP_URL ?? 'https://your-domain.com'}/api/v1`;

type Param = { name: string; type: string; required?: boolean; text: string };
type Endpoint = {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  title: string;
  text: ReactNode;
  params?: Param[];
  paramsLabel?: string;
  request: string;
  response: string;
  extra?: { label: string; code: string };
};

const endpoints: Endpoint[] = [
  {
    id: 'balance',
    method: 'GET',
    path: '/balance',
    title: 'Get balance',
    text: 'Returns your current wallet balance in naira.',
    request: `curl ${BASE}/balance \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "success": true,
  "data": { "balance": 25000, "currency": "NGN" }
}`,
  },
  {
    id: 'list-products',
    method: 'GET',
    path: '/products',
    title: 'List products',
    text: 'Every active product with its price and how many are in stock right now.',
    paramsLabel: 'Query parameters',
    params: [
      { name: 'platform', type: 'string', text: 'Only this platform, e.g. Instagram' },
      { name: 'in_stock', type: 'boolean', text: 'true to hide sold-out products' },
    ],
    request: `curl "${BASE}/products?in_stock=true" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "success": true,
  "data": [
    {
      "id": "clx9a2b3c0001",
      "title": "Instagram 5K fashion page",
      "platform": "Instagram",
      "description": "Aged 2 years. Use a US VPN to log in.",
      "price": 15000,
      "currency": "NGN",
      "stock": 42,
      "image_url": "${process.env.APP_URL ?? 'https://your-domain.com'}/api/listings/clx9a2b3c0001/image?v=1795070000000",
      "created_at": "2026-11-19T08:00:00.000Z"
    }
  ]
}`,
  },
  {
    id: 'get-product',
    method: 'GET',
    path: '/products/{id}',
    title: 'Get a product',
    text: 'One product. Add items=true to get up to 200 available items with a preview, so you can buy specific ones by id.',
    paramsLabel: 'Query parameters',
    params: [{ name: 'items', type: 'boolean', text: 'true to include available items (id + preview)' }],
    request: `curl "${BASE}/products/clx9a2b3c0001?items=true" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "success": true,
  "data": {
    "id": "clx9a2b3c0001",
    "title": "Instagram 5K fashion page",
    "platform": "Instagram",
    "price": 15000,
    "currency": "NGN",
    "stock": 42,
    "items": [
      { "id": "clxcred0001", "preview": "fa•••@g•••.com" },
      { "id": "clxcred0002", "preview": "12402974510" }
    ]
  }
}`,
  },
  {
    id: 'create-order',
    method: 'POST',
    path: '/orders',
    title: 'Buy (create an order)',
    text: (
      <>
        Charges your wallet and returns the logins immediately. Send <code>quantity</code> to get the oldest items first, or{' '}
        <code>item_ids</code> to buy specific ones. Up to 50 per request. If anything can’t be bought, nothing is charged.
      </>
    ),
    paramsLabel: 'JSON body',
    params: [
      { name: 'product_id', type: 'string', required: true, text: 'The product to buy' },
      { name: 'quantity', type: 'integer', text: '1–50. Defaults to 1. Don’t send with item_ids' },
      { name: 'item_ids', type: 'string[]', text: 'Specific item ids from Get a product' },
      { name: 'reference', type: 'string', text: 'Your own unique id (max 64). Re-sending the same reference never charges twice' },
    ],
    request: `curl -X POST ${BASE}/orders \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_id": "clx9a2b3c0001", "quantity": 2, "reference": "my-order-1001"}'`,
    response: `{
  "success": true,
  "data": {
    "quantity": 2,
    "total": 30000,
    "balance": 5000,
    "currency": "NGN",
    "reference": "my-order-1001",
    "orders": [
      {
        "id": "clxorder0001",
        "product": { "id": "clx9a2b3c0001", "title": "Instagram 5K fashion page", "platform": "Instagram" },
        "price": 15000,
        "status": "escrow",
        "created_at": "2026-11-19T09:30:00.000Z",
        "credential": { "login": "fashionpage@gmail.com", "password": "Example#123", "notes": "Recovery: x@y.com" }
      }
    ]
  }
}`,
    extra: {
      label: 'JavaScript (Node 18+)',
      code: `const res = await fetch('${BASE}/orders', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + process.env.DEEDEES_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ product_id: 'clx9a2b3c0001', quantity: 1, reference: 'order-' + Date.now() }),
});
const json = await res.json();
if (!json.success) throw new Error(json.error.message);
console.log(json.data.orders[0].credential);`,
    },
  },
  {
    id: 'list-orders',
    method: 'GET',
    path: '/orders',
    title: 'List orders',
    text: 'Your orders, newest first, including the logins. Use next_cursor to get the next page.',
    paramsLabel: 'Query parameters',
    params: [
      { name: 'limit', type: 'integer', text: '1–100. Defaults to 20' },
      { name: 'cursor', type: 'string', text: 'The next_cursor from the previous page' },
    ],
    request: `curl "${BASE}/orders?limit=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "success": true,
  "data": {
    "orders": [ { "id": "clxorder0001", "status": "completed", "...": "..." } ],
    "next_cursor": "clxorder0001"
  }
}`,
  },
  {
    id: 'get-order',
    method: 'GET',
    path: '/orders/{id}',
    title: 'Get an order',
    text: 'One of your orders with its login. Refunded orders return credential: null.',
    request: `curl ${BASE}/orders/clxorder0001 \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "success": true,
  "data": {
    "id": "clxorder0001",
    "product": { "id": "clx9a2b3c0001", "title": "Instagram 5K fashion page", "platform": "Instagram" },
    "price": 15000,
    "status": "completed",
    "created_at": "2026-11-19T09:30:00.000Z",
    "credential": { "login": "fashionpage@gmail.com", "password": "Example#123", "notes": "" }
  }
}`,
  },
];

const errors: [number, string, string][] = [
  [401, 'missing_api_key', 'No key was sent'],
  [401, 'invalid_api_key', 'Wrong or revoked key'],
  [402, 'insufficient_balance', 'Wallet balance too low for the order'],
  [403, 'account_suspended', 'Your account is suspended'],
  [404, 'product_not_found / order_not_found', 'No such product or order'],
  [409, 'out_of_stock', 'Not enough stock, or a chosen item was just sold'],
  [409, 'duplicate_reference', 'You already used this reference (nothing charged)'],
  [422, 'validation_error', 'Something in the request is missing or wrong'],
  [429, 'rate_limited', 'More than 60 requests in a minute'],
];

const toc = [
  ['intro', 'Introduction'],
  ['auth', 'Authentication'],
  ['responses', 'Responses & errors'],
  ['limits', 'Limits'],
  ...endpoints.map((e) => [e.id, e.title] as [string, string]),
  ['statuses', 'Order statuses'],
];

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  return (
    <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${method === 'GET' ? 'bg-[#10294A] text-[#7DB8FF]' : 'bg-[#0F3B2C] text-success'}`}>
      {method}
    </span>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="relative">
      <div aria-hidden="true" className="auth-glow pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-70" />
      <div className="container-x relative flex gap-12 py-14 lg:py-20">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="On this page" className="sticky top-24 space-y-1 text-sm">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-placeholder">On this page</p>
            {toc.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block rounded-lg px-3 py-1.5 text-muted transition hover:bg-panel hover:text-white">
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 flex-1 space-y-16 text-[16px] leading-relaxed text-soft [&_code]:rounded [&_code]:bg-line [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-white [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-soft">
          {/* Intro */}
          <section id="intro" className="scroll-mt-24">
            <p className="eyebrow mb-3">Reseller API · v1</p>
            <h1 className="font-display text-[clamp(36px,5vw,56px)] font-bold leading-tight text-white">API documentation</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Sell {site.name} stock on your own website, app or Telegram bot. Check your balance, list products and buy accounts. Logins come back in the response.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: KeyRound, title: 'Create a key', text: 'Dashboard → API' },
                { icon: Zap, title: 'Call the API', text: 'JSON over HTTPS' },
                { icon: ShieldCheck, title: 'Paid from wallet', text: 'Same prices as the site' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="card flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-text"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <div><div className="font-semibold text-white">{title}</div><div className="text-sm text-muted">{text}</div></div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-white">Base URL</p>
              <CodeBlock code={BASE} label="Base URL" />
            </div>
          </section>

          {/* Auth */}
          <section id="auth" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold text-white">Authentication</h2>
            <p className="mt-3">
              Create a key in <Link href="/dashboard/api" className="font-semibold text-accent-text">Dashboard → API</Link>. Keys start with <code>dd_live_</code> and are shown only once. Send it in the <code>Authorization</code> header on every request:
            </p>
            <div className="mt-4"><CodeBlock code={'Authorization: Bearer dd_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'} label="Header" /></div>
            <p className="mt-4 rounded-2xl border border-warn/30 bg-[#3D2E0A]/50 p-4 text-[15px] text-warn">
              Anyone with your key can spend your wallet. Keep it on your server, never in website code or a public app. If it leaks, revoke it and make a new one.
            </p>
          </section>

          {/* Responses */}
          <section id="responses" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold text-white">Responses &amp; errors</h2>
            <p className="mt-3">Every response is JSON with a <code>success</code> flag. Amounts are in naira (NGN).</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <CodeBlock label="Success" code={`{\n  "success": true,\n  "data": { ... }\n}`} />
              <CodeBlock label="Error" code={`{\n  "success": false,\n  "error": {\n    "code": "insufficient_balance",\n    "message": "Your wallet balance is too low..."\n  }\n}`} />
            </div>
            <div className="table-wrap mt-6">
              <table className="data-table min-w-[560px]">
                <thead><tr><th scope="col">HTTP</th><th scope="col">Code</th><th scope="col">Meaning</th></tr></thead>
                <tbody>
                  {errors.map(([status, code, text]) => (
                    <tr key={code}>
                      <td className="font-mono text-white">{status}</td>
                      <td><code>{code}</code></td>
                      <td className="text-muted">{text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Limits */}
          <section id="limits" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold text-white">Limits</h2>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2"><Timer className="h-4 w-4 text-accent-text" aria-hidden="true" /> 60 requests per minute per key (then <code>429</code> with <code>Retry-After: 60</code>)</li>
              <li className="flex items-center gap-2"><Timer className="h-4 w-4 text-accent-text" aria-hidden="true" /> Up to 50 items per order</li>
              <li className="flex items-center gap-2"><Timer className="h-4 w-4 text-accent-text" aria-hidden="true" /> Up to 5 active keys per account</li>
            </ul>
          </section>

          {/* Endpoints */}
          {endpoints.map((e) => (
            <section key={e.id} id={e.id} className="scroll-mt-24 border-t border-line pt-12">
              <div className="flex flex-wrap items-center gap-3">
                <MethodBadge method={e.method} />
                <code className="!bg-transparent !p-0 font-mono text-lg !text-white">{e.path}</code>
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold text-white">{e.title}</h2>
              <p className="mt-3 max-w-3xl">{e.text}</p>

              {e.params && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{e.paramsLabel}</h3>
                  <div className="table-wrap">
                    <table className="data-table min-w-[520px]">
                      <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Description</th></tr></thead>
                      <tbody>
                        {e.params.map((p) => (
                          <tr key={p.name}>
                            <td>
                              <code>{p.name}</code>
                              {p.required && <span className="ml-2 text-xs font-semibold text-danger">required</span>}
                            </td>
                            <td className="font-mono text-xs text-muted">{p.type}</td>
                            <td className="text-muted">{p.text}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <CodeBlock label="Request (curl)" code={e.request} />
                <CodeBlock label="Response" code={e.response} />
              </div>
              {e.extra && <div className="mt-4"><CodeBlock label={e.extra.label} code={e.extra.code} /></div>}
            </section>
          ))}

          {/* Statuses */}
          <section id="statuses" className="scroll-mt-24 border-t border-line pt-12">
            <h2 className="font-display text-3xl font-bold text-white">Order statuses</h2>
            <div className="table-wrap mt-6">
              <table className="data-table min-w-[480px]">
                <thead><tr><th scope="col">Status</th><th scope="col">Meaning</th></tr></thead>
                <tbody>
                  <tr><td><code>escrow</code></td><td className="text-muted">Delivered. The buyer hasn’t confirmed it works yet</td></tr>
                  <tr><td><code>completed</code></td><td className="text-muted">Confirmed working</td></tr>
                  <tr><td><code>disputed</code></td><td className="text-muted">A problem was reported; our team is checking</td></tr>
                  <tr><td><code>refunded</code></td><td className="text-muted">Money returned to your wallet; the login is no longer shown</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[15px] text-muted">To report a problem with an API order, open it in your dashboard or message us on WhatsApp with the order id.</p>
          </section>

          {/* CTA */}
          <section className="relative overflow-hidden rounded-3xl border border-line2 bg-panel p-8 text-center">
            <div aria-hidden="true" className="auth-glow pointer-events-none absolute inset-0 opacity-70" />
            <div className="relative">
              <h2 className="font-display text-2xl font-bold text-white">Ready to connect?</h2>
              <p className="mt-2 text-muted">Create your key, or ask us anything about the API on WhatsApp.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/dashboard/api" className="btn btn-primary shadow-lg shadow-accent/30">Get my API key <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                <a href={whatsappLink('Hi, I have a question about the API')} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">WhatsApp {site.whatsappDisplay}</a>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
