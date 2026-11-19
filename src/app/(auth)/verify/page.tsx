import { redirect } from 'next/navigation';
import { MessageSquareText } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { maskPhone } from '@/lib/phone';
import SignupSteps from '@/components/SignupSteps';
import VerifyForm from './VerifyForm';

export const metadata = { title: 'Verify your phone' };

export default async function VerifyPage() {
  const user = await requireUser({ allowUnverified: true });
  if (user.phoneVerified || user.role === 'ADMIN') redirect('/dashboard');

  return (
    <>
      <SignupSteps current={2} />
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-text">
        <MessageSquareText className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="font-display text-[28px] font-bold leading-tight text-white">Check your phone</h1>
      <p className="mt-1.5 text-muted">
        We sent a 6-digit code to <strong className="text-white">{maskPhone(user.phone)}</strong>.
      </p>
      <VerifyForm />
    </>
  );
}
