# DeeDee’s Marketplace

A marketplace for premium digital accounts. Customers sign up, verify their phone, fund a wallet with Paystack and buy accounts instantly. You manage everything from an admin dashboard.

**Built with:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Paystack · Termii SMS

## What’s inside

**Public website**
- Landing page with live stats (real user and sales numbers from the database)
- WhatsApp (09035206681) and call (07046019436) support everywhere, plus a floating WhatsApp button
- Terms and privacy pages (edit these for your business)

**Sign up and login**
- Sign up as buyer or seller, with password strength meter and referral codes
- Phone verification by SMS code (6 digits, 10-minute expiry, 5 tries)
- Login by email or phone, “keep me logged in for 30 days”
- Forgot password by SMS code
- Rate limiting on login, sign-up and SMS to stop abuse

**Customer dashboard** (`/dashboard`)
- Wallet balance, purchases and recent activity
- Marketplace with platform filter and search; “Buy now” pays from the wallet and delivers the login instantly
- My accounts: show and copy login details, confirm “It works” or “Report a problem”
- Wallet: top up through Paystack (card, transfer, USSD), full transaction history
- Support page with FAQ, and settings (change password, referral link)

**Admin dashboard** (`/admin`)
- Overview: total users, new users today vs yesterday, visitors today, people online now, orders and sales today, stock, 7-day sign-up chart, newest users, low-stock alerts, recent orders
- **Credentials pool:** create listings, add one credential at a time or **paste/upload many at once** (`login:password` or `login:password:notes`, also `|` or tab). Duplicates are skipped. Show/hide passwords, filter, search and paginate.
- Orders: filter by status, refund to wallet or mark complete
- Users: search, add funds manually (for bank transfers), ban/unban

**Security**
- Passwords hashed with bcrypt
- Stored credentials encrypted with AES-256-GCM; only the buyer and admins can decrypt them
- Signed, HTTP-only session cookies; admin pages checked on every request
- Paystack payments verified on the server and by signed webhook, and credited only once
- Purchases are atomic: a buyer can never be charged without getting a login, and two buyers can never get the same login

---

## Set it up (about 20 minutes)

### 1. Get a free database
Create a free PostgreSQL database at [neon.tech](https://neon.tech) (or Supabase). Copy the connection string.

### 2. Configure
```bash
cp .env.example .env
```
Fill in `.env`:
- `DATABASE_URL`: your connection string
- `AUTH_SECRET` and `ENCRYPTION_KEY`: run `openssl rand -base64 32` twice and paste one into each. **Keep `ENCRYPTION_KEY` safe and never change it** after adding credentials, or they can’t be read.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`: your admin login
- Paystack and Termii keys (optional while testing; see below)

### 3. Run it
```bash
npm install
npm run db:push     # creates the tables
npm run db:seed     # creates your admin account
npm run dev         # open http://localhost:3000
```
Log in with your admin email to reach `/admin`.

While `TERMII_API_KEY` is empty, SMS codes are printed in the terminal instead of sent, so you can test sign-up for free.

### 4. Go live on Vercel (free)
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo.
2. Add every variable from your `.env` under **Environment Variables**. Set `APP_URL` to your live address (e.g. `https://deedees.vercel.app`).
3. Deploy. To use your own domain, add it under **Settings → Domains**.

### 5. Turn on payments (Paystack)
1. Create a business account at [paystack.com](https://paystack.com) and complete verification.
2. Copy your **Secret Key** into `PAYSTACK_SECRET_KEY` (use the test key first).
3. In Paystack → **Settings → API Keys & Webhooks**, set the Webhook URL to `https://YOUR-DOMAIN/api/paystack/webhook`.

### 6. Turn on SMS (Termii)
1. Sign up at [termii.com](https://termii.com), fund your account and register a Sender ID (e.g. `DeeDees`).
2. Fill in `TERMII_API_KEY`, `TERMII_SENDER_ID`, and `TERMII_BASE_URL` (shown in your Termii dashboard).

---

## Everyday use

**Adding stock:** Admin → Credentials pool → create a listing (e.g. “Instagram 5K fashion page”, ₦15,000) → choose **Add multiple** and paste one login per line:
```
page_one@mail.com:Pass1234:Recovery email is x@y.com
page_two:Secret987
```
The listing shows as in stock straight away. Each login is sold once, oldest first.

**Bank transfer customers:** Admin → Users → find them → enter the amount under “Add funds”.

**Problem reports:** they appear as a red alert on the admin overview. Refund returns the money to the customer’s wallet.

## Changing things
- Business name, phone numbers and platforms: `src/lib/site.ts`
- Colours: `tailwind.config.ts`
- Home page text: `src/app/(site)/page.tsx`

## Project layout
```
prisma/schema.prisma      database tables
src/app/(site)            public pages
src/app/(auth)            sign up, login, verify, forgot password
src/app/dashboard         customer dashboard
src/app/admin             admin dashboard
src/app/actions           server logic (auth, shop, wallet, admin)
src/app/api               Paystack callback/webhook, visit counter, logout
src/lib                   database, sessions, encryption, SMS, payments
```
