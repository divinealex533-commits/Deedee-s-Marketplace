import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <h1 className="font-display text-5xl font-bold text-white">Page not found</h1>
      <p className="max-w-md text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
