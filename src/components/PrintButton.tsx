'use client';
import { Icon } from './ui/Icon';
export function PrintButton({ label = 'Print or save as PDF' }: { label?: string }) {
  return <button onClick={() => window.print()} className="btn btn-primary btn-sm"><Icon name="print" className="size-4" /> {label}</button>;
}
