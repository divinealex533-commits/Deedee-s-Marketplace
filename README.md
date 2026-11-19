# DeeDee’s Marketplace

A marketplace for premium digital accounts. Customers sign up, fund a wallet by bank transfer (with a receipt screenshot you approve) and buy accounts instantly. You manage everything from an admin dashboard.

**Built with:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · Prisma · PostgreSQL

## What’s inside

**Public website**
- Landing page with live stats (real user and sales numbers from the database)
- WhatsApp (09035206681) and call (07046019436) support everywhere, plus a floating WhatsApp button
- Terms and privacy pages (edit these for your business)

**Sign up and login**
- Sign up as buyer or seller, with password strength meter and referral codes
- Login by email or phone, “keep me logged in for 30 days”
- Forgot password: customer messages you on WhatsApp; you reset it from Admin → Users (one click makes an easy password and a ready-to-send WhatsApp message)
- Rate limiting on login and sign-up to stop abuse

**Customer dashboard** (`/dashboard`)
- Wallet balance, purchases and recent activity
- Marketplace with listing photos, platform filter and search
- Product page: photo, instructions, and a **preview list of every item in stock** (full login like a phone number, or partly hidden — you choose per listing). Customers tick the exact ones they want or set a quantity, see the total, and buy up to 50 at once
- My accounts: show and copy login details, confirm “It works” or “Report a problem”
- Wallet: shows your bank accounts (9PSB, PocketApp…) with copy buttons and a personal narration code; customer uploads a receipt screenshot (auto-compressed on their phone), sees the status of each deposit, and full transaction history
- Support page with FAQ, and settings (change password, referral link)

**Admin dashboard** (`/admin`)
- **Deposits:** every receipt with the screenshot, customer, amount, sender name and narration code. Approve the amount you actually received (credits the wallet instantly) or reject with a reason the customer sees
- **Bank accounts:** add, hide or remove the accounts customers pay into
- Overview: pending deposits alert, total users, new users today vs yesterday, visitors today, people online now, orders and sales today, stock, 7-day sign-up chart, newest users, low-stock alerts, recent orders
- **Credentials pool:** create listings with a photo and instructions, choose whether customers see full or partly hidden previews, add one credential at a time or **paste/upload many at once** (`login:password` or `login:password:notes`, also `|` or tab). Duplicates are skipped. Show/hide passwords, filter, search and paginate.
- Orders: filter by status, refund to wallet or mark complete
- Users: search, add funds manually (for bank transfers), ban/unban

**Reseller API** (`/api/v1`, docs at `/docs/api`)
- Customers create API keys in Dashboard → API (shown once, stored hashed, up to 5, revocable)
- `GET /balance`, `GET /products`, `GET /products/{id}`, `POST /orders`, `GET /orders`, `GET /orders/{id}`
- Orders return the logins immediately, are paid from the wallet, and accept a `reference` so retries never charge twice
- 60 requests/minute per key

**Security**
- Passwords hashed with bcrypt
- Stored credentials encrypted with AES-256-GCM; only the buyer and admins can decrypt them
- Signed, HTTP-only session cookies; admin pages checked on every request
- A deposit can only be approved once, even if you double-click; receipts are only visible to you and the customer
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

### 3. Run it
```bash
npm install
npm run db:push     # creates the tables
npm run db:seed     # creates your admin account
npm run dev         # open http://localhost:3000
```
Log in with your admin email to reach `/admin`.

### 4. Go live on Vercel (free)
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo.
2. Add every variable from your `.env` under **Environment Variables**. Set `APP_URL` to your live address (e.g. `https://deedees.vercel.app`).
3. Deploy. To use your own domain, add it under **Settings → Domains**.

### 5. Add your bank accounts
Log in as admin → **Bank accounts** → add your 9PSB and PocketApp account numbers. Customers see them on their Wallet page straight away.

---

## Everyday use

**Adding stock:** Admin → Credentials pool → create a listing (e.g. “Instagram 5K fashion page”, ₦15,000) → choose **Add multiple** and paste one login per line:
```
page_one@mail.com:Pass1234:Recovery email is x@y.com
page_two:Secret987
```
The listing shows as in stock straight away. Each login is sold once, oldest first.

**Approving deposits:** Admin → Deposits. Open the screenshot, check your 9PSB/PocketApp app for the money (look for the customer’s narration code), then press **Approve** (change the amount first if it differs) or **Reject** with a reason.

**Payments without a screenshot:** Admin → Users → find them → enter the amount under “Add funds”.

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
src/app/api               reseller API (v1), receipt and listing images, visit counter, logout
src/lib                   database, sessions, encryption, images
```
