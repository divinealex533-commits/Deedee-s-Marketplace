import AuthTabs from '@/components/AuthTabs';
import SignupSteps from '@/components/SignupSteps';
import SignupForm from './SignupForm';

export const metadata = { title: 'Create an account' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <>
      <AuthTabs active="signup" />
      <SignupSteps current={1} />
      <h1 className="font-display text-[28px] font-bold leading-tight text-white">Create your free account</h1>
      <p className="mt-1.5 text-muted">Takes less than a minute.</p>
      <SignupForm referral={ref ?? ''} />
    </>
  );
}
