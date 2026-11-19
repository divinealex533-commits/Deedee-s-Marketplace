import { site } from '@/lib/site';

export const metadata = { title: 'Privacy policy' };

// Replace this with a policy written for your business.
export default function PrivacyPage() {
  return (
    <article className="container-x max-w-3xl py-20 text-[17px] leading-relaxed text-soft">
      <h1 className="font-display text-4xl font-bold text-white">Privacy policy</h1>
      <p className="mt-6">
        {site.name} collects your name, email and phone number to run your account, and records your orders and wallet
        transactions. Passwords are stored as one-way hashes and account details you buy are encrypted.
      </p>
      <p className="mt-4">
        Payment receipts you upload are only visible to you and our admins. We don’t sell your information.
      </p>
      <p className="mt-4">To ask about or delete your data, WhatsApp {site.whatsappDisplay}.</p>
    </article>
  );
}
