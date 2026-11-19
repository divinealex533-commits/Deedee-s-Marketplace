'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({ withIcon = true, ...props }: InputHTMLAttributes<HTMLInputElement> & { withIcon?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {withIcon && (
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-placeholder" aria-hidden="true" />
      )}
      <input {...props} type={show ? 'text' : 'password'} className={`input pr-14 ${withIcon ? 'input-with-icon' : ''}`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-line hover:text-white"
      >
        {show ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  );
}
