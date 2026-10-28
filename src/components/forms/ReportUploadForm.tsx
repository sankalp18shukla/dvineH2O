'use client';
import { useActionState } from 'react';
import { uploadReport } from '@/app/actions/forms';
import type { FormState } from '@/lib/validators';
import { Field, TextArea, Check, FormMessage, FieldPrefix } from './Field';
import { SubmitButton } from './SubmitButton';
import { ConsentText } from './ConsentText';

export function ReportUploadForm() {
  return <FieldPrefix.Provider value="r-"><Form /></FieldPrefix.Provider>;
}

function Form() {
  const [state, action] = useActionState<FormState, FormData>(uploadReport, undefined);
  const e = state?.errors ?? {};
  const v = (k: string) => (state?.data?.[k] as string) ?? '';
  if (state?.ok) return <div className="card p-6"><FormMessage state={state} /></div>;
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="field sm:col-span-2">
        <label htmlFor="f-report" className="label">Report file <span className="text-pulse" aria-hidden="true">*</span></label>
        <input id="f-report" name="report" type="file" accept="application/pdf,image/jpeg,image/png" required aria-invalid={!!e.report} aria-describedby="f-report-h" className="input py-3 file:mr-4 file:rounded-full file:border-0 file:bg-paper file:px-4 file:py-1.5 file:font-sans file:font-semibold" />
        {e.report ? <p className="error-text">{e.report}</p> : <p id="f-report-h" className="hint">PDF, JPG or PNG, up to 10 MB. Include every page and the test date.</p>}
      </div>
      <Field name="name" label="Name" required defaultValue={v('name')} error={e.name} />
      <Field name="phone" label="Phone" type="tel" required defaultValue={v('phone')} error={e.phone} />
      <Field name="email" label="Email" type="email" defaultValue={v('email')} error={e.email} />
      <Field name="testDate" label="Test date" type="date" defaultValue={v('testDate')} />
      <TextArea name="message" label="What would you like to understand?" rows={3} defaultValue={v('message')} className="sm:col-span-2" />
      <div className="sm:col-span-2"><Check name="consent" label={<ConsentText />} error={e.consent} /></div>
      <div className="flex flex-col gap-3 sm:col-span-2"><FormMessage state={state} /><div><SubmitButton pendingLabel="Uploading…">Send My Report</SubmitButton></div></div>
    </form>
  );
}
