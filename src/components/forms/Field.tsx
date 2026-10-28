'use client';
import { createContext, useContext, type ReactNode } from 'react';

/** Prefixes field ids so two forms on one page never share an id (labels stay tied to their own inputs). */
export const FieldPrefix = createContext('');
const useId = (name: string) => `f-${useContext(FieldPrefix)}${name}`;

type Common = { name: string; label: string; error?: string; hint?: ReactNode; className?: string; required?: boolean };

export function Field({ name, label, error, hint, className = '', required, ...rest }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId(name);
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="label">{label}{required && <span aria-hidden="true" className="text-pulse"> *</span>}</label>
      <input id={id} name={name} className="input" required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...rest} />
      {hint && !error && <p id={`${id}-h`} className="hint">{hint}</p>}
      {error && <p id={`${id}-e`} className="error-text">{error}</p>}
    </div>
  );
}

export function Select({ name, label, error, hint, className = '', required, options, placeholder, ...rest }: Common & { options: (string | { value: string; label: string })[]; placeholder?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId(name);
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="label">{label}{required && <span aria-hidden="true" className="text-pulse"> *</span>}</label>
      <select id={id} name={name} className="input" required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p id={`${id}-e`} className="error-text">{error}</p>}
    </div>
  );
}

export function TextArea({ name, label, error, hint, className = '', required, ...rest }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId(name);
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="label">{label}{required && <span aria-hidden="true" className="text-pulse"> *</span>}</label>
      <textarea id={id} name={name} className="input" required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} {...rest} />
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p id={`${id}-e`} className="error-text">{error}</p>}
    </div>
  );
}

export function Check({ name, label, error, defaultChecked, required }: { name: string; label: ReactNode; error?: string; defaultChecked?: boolean; required?: boolean }) {
  const id = useId(name);
  return (
    <div className="field">
      <div className="flex items-start gap-3">
        <input id={id} type="checkbox" name={name} className="check" defaultChecked={defaultChecked} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} />
        <label htmlFor={id} className="font-sans text-[14px] leading-snug text-muted">{label}</label>
      </div>
      {error && <p id={`${id}-e`} className="error-text">{error}</p>}
    </div>
  );
}

export function FormMessage({ state }: { state?: { ok?: boolean; message?: string } }) {
  if (!state?.message) return null;
  return (
    <div role={state.ok ? 'status' : 'alert'} className={`rounded-xl px-4 py-3 font-sans text-[15px] ${state.ok ? 'bg-[#DFF5E3] text-[#14532D]' : 'bg-[#FFE3E3] text-[#8A0E18]'}`}>
      {state.message}
    </div>
  );
}

export function Honeypot() {
  return <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>;
}
