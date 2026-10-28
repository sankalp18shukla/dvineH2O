'use client';
import { useFormStatus } from 'react-dom';

export function SubmitButton({ children, className = 'btn btn-primary', pendingLabel = 'Sending…' }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-disabled={pending}>{pending ? pendingLabel : children}</button>;
}
