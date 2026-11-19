import { site } from '@/lib/site';

export const metadata = { title: 'Terms of service' };

// Replace this with terms written for your business. A lawyer can help you get these right.
export default function TermsPage() {
  return (
    <article className="container-x max-w-3xl py-20 text-[17px] leading-relaxed text-soft">
      <h1 className="font-display text-4xl font-bold text-white">Terms of service</h1>
      <p className="mt-6">
        These terms explain how {site.name} works. By creating an account you agree to them.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-white">Purchases</h2>
      <p className="mt-3">
        Payments are made from your wallet. After buying, check the account and confirm it works, or report a problem from your
        dashboard so our team can review it and refund you where appropriate.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-white">Your account</h2>
      <p className="mt-3">Keep your password private. We may suspend accounts used for fraud or abuse.</p>
      <h2 className="mt-10 text-xl font-semibold text-white">Contact</h2>
      <p className="mt-3">Questions? WhatsApp {site.whatsappDisplay} or call {site.phoneDisplay}.</p>
    </article>
  );
}
