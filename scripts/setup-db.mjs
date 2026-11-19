// Runs during every build (e.g. on Vercel):
//  1. creates/updates the database tables to match prisma/schema.prisma
//  2. creates/updates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
// Skips quietly if DATABASE_URL isn't set yet, so the site can still build.
import { execSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  console.log('⚠  DATABASE_URL is not set: skipping database setup. Add it in Vercel → Settings → Environment Variables.');
  process.exit(0);
}

// Won't run if a change would delete data; Prisma stops with an error instead.
execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  execSync('node prisma/seed.mjs', { stdio: 'inherit' });
} else {
  console.log('ℹ  ADMIN_EMAIL / ADMIN_PASSWORD not set: skipping admin account setup.');
}
