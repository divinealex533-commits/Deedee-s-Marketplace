import Link from 'next/link';
import LoginForm from './LoginForm';

export const metadata = { title: 'Log in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Log in to your account</h1>
      <p className="mt-1.5 text-muted">
        New here? <Link href="/signup" className="font-semibold text-accent-text">Create an account</Link>
      </p>
      <LoginForm next={next ?? ''} />
    </>
  );
}
