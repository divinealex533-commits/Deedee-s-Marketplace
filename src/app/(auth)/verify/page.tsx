import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { maskPhone } from '@/lib/phone';
import VerifyForm from './VerifyForm';

export const metadata = { title: 'Verify your phone' };

export default async function VerifyPage() {
  const user = await requireUser({ allowUnverified: true });
  if (user.phoneVerified || user.role === 'ADMIN') redirect('/dashboard');

  return (
    <>
      <ol className="mb-8 flex gap-2 text-sm" aria-label="Sign-up progress">
        <li className="flex items-center gap-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold">1</span>Details</li>
        <li aria-current="step" className="flex items-center gap-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold">2</span>Verify</li>
        <li className="flex items-center gap-2 text-muted"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-line text-xs font-bold">3</span>Start</li>
      </ol>
      <h1 className="font-display text-3xl font-bold text-white">Verify your phone</h1>
      <p className="mt-1.5 text-muted">
        Enter the 6-digit code we sent by SMS to <strong className="text-white">{maskPhone(user.phone)}</strong>.
      </p>
      <VerifyForm />
    </>
  );
}
