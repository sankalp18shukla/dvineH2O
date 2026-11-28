'use client';
import { useFormStatus } from 'react-dom';
import { CtaChip, ctaClass, ctaStyle, type CtaTone } from '../ui/Cta';

/**
 * Form submit. Pass `cta` for the home page's button (accent pill or Ink pill with the arrow chip);
 * otherwise `className` styles it (admin and account forms keep the plain .btn).
 */
export function SubmitButton({ children, className = 'btn btn-primary', pendingLabel = 'Sending…', cta, name, value }: {
  children: React.ReactNode; className?: string; pendingLabel?: string; cta?: { kind?: 'pill' | 'ink'; tone?: CtaTone };
  /** for forms with two buttons (e.g. Save draft / Send): the action reads which one was pressed */
  name?: string; value?: string;
}) {
  const { pending } = useFormStatus();
  const label = pending ? pendingLabel : children;
  if (cta) return (
    <button type="submit" className={ctaClass(cta.kind ?? 'pill')} style={ctaStyle(cta.tone)} disabled={pending} aria-disabled={pending}>
      <CtaChip /><span>{label}</span>
    </button>
  );
  return <button type="submit" name={name} value={value} className={className} disabled={pending} aria-disabled={pending}>{label}</button>;
}
