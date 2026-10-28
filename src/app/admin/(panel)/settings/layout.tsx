import Link from 'next/link';
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav aria-label="Settings" className="mb-6 flex flex-wrap gap-2 font-sans text-sm">
        {[['/admin/settings', 'Company & store'], ['/admin/settings/pincodes', 'Serviceable pincodes'], ['/admin/settings/staff', 'Staff & roles']].map(([h, l]) => <Link key={h} href={h} className="rounded-full bg-white px-4 py-2 hover:bg-paper">{l}</Link>)}
      </nav>
      {children}
    </>
  );
}
