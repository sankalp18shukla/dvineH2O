'use client';
import { createContext, useActionState, useContext, useEffect, useRef, useState } from 'react';
import type { FormState } from '@/lib/validators';
import { FormMessage } from '../forms/Field';

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
const ErrCtx = createContext<Record<string, string>>({});
const TOAST = 'dvine-admin-toast';

/** Wraps any admin server action: inline result + a toast that survives the form re-rendering away; field errors via <AdminError name="…" />. */
export function AdminForm({ action, children, className = 'grid gap-4', reset = false, confirm }: { action: Action; children: React.ReactNode; className?: string; reset?: boolean; confirm?: string }) {
  // Toast from inside the action, so it still shows when saving makes this form unmount (e.g. "create shipment").
  const [state, run] = useActionState<FormState, FormData>(async (prev, fd) => {
    const r = await action(prev, fd);
    window.dispatchEvent(new CustomEvent(TOAST, { detail: { ok: !!r?.ok, message: r?.message ?? (r?.errors ? 'Check the highlighted fields.' : 'Saved.') } }));
    return r;
  }, undefined);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => setReady(true), []);
  useEffect(() => { if (state?.ok && reset) ref.current?.reset(); }, [state, reset]);
  return (
    <ErrCtx.Provider value={state?.errors ?? {}}>
      <form ref={ref} action={run} className={className} data-ready={ready || undefined} onSubmit={e => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
        {children}
        {state && !state.ok && (state.message || state.errors) && <div className="col-span-full"><FormMessage state={{ ok: false, message: state.message ?? 'Check the highlighted fields.' }} /></div>}
      </form>
    </ErrCtx.Provider>
  );
}

export function AdminError({ name }: { name: string }) {
  const e = useContext(ErrCtx)[name];
  return e ? <p className="error-text">{e}</p> : null;
}

export function Toaster() {
  const [t, setT] = useState<{ ok: boolean; message: string; id: number } | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const on = (e: Event) => { const d = (e as CustomEvent).detail; setT({ ...d, id: Date.now() }); clearTimeout(timer); timer = setTimeout(() => setT(null), d.ok ? 3500 : 7000); };
    window.addEventListener(TOAST, on); return () => { window.removeEventListener(TOAST, on); clearTimeout(timer); };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50">
      {t && <div key={t.id} role={t.ok ? 'status' : 'alert'} className={`pointer-events-auto max-w-sm rounded-2xl px-4 py-3 font-sans text-sm font-medium shadow-[0_20px_50px_-15px_rgba(4,22,74,.5)] ${t.ok ? 'bg-ink text-white' : 'bg-[#A1101B] text-white'}`}>{t.message}</div>}
    </div>
  );
}
