import AuthTabs from '@/components/AuthTabs';
import LoginForm from './LoginForm';

export const metadata = { title: 'Log in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <AuthTabs active="login" />
      <h1 className="font-display text-[28px] font-bold leading-tight text-white">Welcome back</h1>
      <p className="mt-1.5 text-muted">Log in to see your purchases and wallet.</p>
      <LoginForm next={next ?? ''} />
    </>
  );
}
