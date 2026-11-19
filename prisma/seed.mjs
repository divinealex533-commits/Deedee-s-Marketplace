// Creates (or updates) the first admin account from ADMIN_* values in .env.
// Run with:  npm run db:seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function normalizePhone(input) {
  const d = String(input || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) return '234' + d.slice(1);
  if (d.length >= 10 && d.length <= 15) return d;
  return null;
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const phone = normalizePhone(process.env.ADMIN_PHONE) ?? '2340000000000';

  if (!email || !password || password.length < 8) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in your .env first.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', passwordHash, phoneVerified: true, banned: false },
    create: {
      name: 'Admin',
      email,
      phone,
      passwordHash,
      role: 'ADMIN',
      phoneVerified: true,
      referralCode: 'DD' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    },
  });
  console.log(`Admin ready: ${admin.email}. Log in at /login and you'll land on /admin.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
