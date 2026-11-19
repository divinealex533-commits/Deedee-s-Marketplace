import Link from 'next/link';
import SignupForm from './SignupForm';

export const metadata = { title: 'Create an account' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Create your free account</h1>
      <p className="mt-1.5 text-muted">
        Already have one? <Link href="/login" className="font-semibold text-accent-text">Log in</Link>
      </p>
      <SignupForm referral={ref ?? ''} />
    </>
  );
}
