import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { db } from '@/lib/db';
import { enquiries, reportUploads } from '@/lib/db/schema';
import { reportReviewOf } from '@/lib/enquiries';
import { safeEqual } from '@/lib/security';
import { SITE } from '@/lib/content';

export const metadata: Metadata = { title: 'Your report review', robots: { index: false, follow: false } };

const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** B: the DVINE team's notes on a water report the customer uploaded. Private: the link carries a secret token. */
export default async function ReviewPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string }> }) {
  const { ref } = await params; const { t } = await searchParams;
  const e = await db.query.enquiries.findFirst({ where: eq(enquiries.ref, ref.toUpperCase()) });
  const { review, token } = reportReviewOf(e?.data);
  if (!e || !token || !review?.sentAt || !safeEqual(t, token)) notFound();
  const file = await db.query.reportUploads.findFirst({ where: eq(reportUploads.enquiryId, e.id) });
  const ask = `${SITE.whatsappUrl}?text=${encodeURIComponent(`Hi DVINE, I have a question about your review of my water report (${e.ref}).`)}`;
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-12">
        <p className="eyebrow">Report review · {e.ref}</p>
        <Lockup as="h1" title="*Your water report,* reviewed." tone="glacier" size="sm" className="mt-8" />
        <p className="lede mt-8 max-w-2xl">Our team has read the report you shared. Read these notes alongside your report’s own sample date, units and reference ranges.</p>
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="card p-6 sm:p-8">
            <p className="font-sans text-sm text-muted">Reviewed by {review.by.split(' ')[0]} at DVINE H2O · {date(review.sentAt)}</p>
            <div className="mt-5 font-sans text-[16px] leading-relaxed whitespace-pre-line">{review.text}</div>
          </article>
          <aside className="grid content-start gap-4">
            <div className="card p-6 font-sans">
              <dl className="grid gap-4 text-sm">
                <div><dt className="text-muted">Shared by</dt><dd className="font-semibold">{e.name}</dd></div>
                {file && <div><dt className="text-muted">Your file</dt><dd className="font-semibold break-all">{file.fileName}</dd></div>}
                {file?.testDate && <div><dt className="text-muted">Report date</dt><dd className="font-semibold">{file.testDate}</dd></div>}
                <div><dt className="text-muted">Shared on</dt><dd className="font-semibold">{date(e.createdAt.toISOString())}</dd></div>
              </dl>
            </div>
            <div className="card p-6 font-sans">
              <p className="font-semibold">Something unclear?</p>
              <p className="mt-1 text-sm text-muted">Message the team who reviewed it. Quote {e.ref}.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={ask} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><Icon name="whatsapp" className="size-4" /> Ask on WhatsApp</a>
                <Link href="/water-testing#book" className="btn btn-outline">Book a Test</Link>
              </div>
            </div>
            <p className="px-1 font-sans text-[12.5px] leading-snug text-muted">These notes explain the report you shared; they aren’t a new test. Results depend on when and how the sample was collected.</p>
          </aside>
        </div>
      </main>
    </>
  );
}
