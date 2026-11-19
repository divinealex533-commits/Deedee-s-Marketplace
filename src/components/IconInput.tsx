import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

/** A text field with an icon inside it on the left. */
export default function IconInput({ icon: Icon, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-placeholder" aria-hidden="true" />
      <input {...props} className={`input input-with-icon ${className}`} />
    </div>
  );
}
