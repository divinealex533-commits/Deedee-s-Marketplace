'use client';

import { addBankAccount } from '@/app/actions/admin';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function AddBankForm() {
  const { state, pending, onSubmit, ref } = useActionForm(addBankAccount, { resetOnOk: true });
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="bankName" className="label">Bank</label>
        <input id="bankName" name="bankName" list="banks" required placeholder="e.g. 9PSB" className="input" />
        <datalist id="banks">
          <option value="9PSB" />
          <option value="PocketApp (PiggyVest)" />
          <option value="Opay" />
          <option value="Moniepoint" />
          <option value="PalmPay" />
          <option value="Kuda" />
        </datalist>
      </div>
      <div>
        <label htmlFor="accountNumber" className="label">Account number</label>
        <input id="accountNumber" name="accountNumber" inputMode="numeric" pattern="\d{10}" maxLength={10} required className="input font-mono" />
      </div>
      <div>
        <label htmlFor="accountName" className="label">Account name</label>
        <input id="accountName" name="accountName" required className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Saving…">Add account</SubmitButton>
    </form>
  );
}
