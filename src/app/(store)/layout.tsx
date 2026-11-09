import { Footer } from '@/components/store/Footer';
import { FooterReveal } from '@/components/store/FooterReveal';
import { Reveal } from '@/components/store/Reveal';
import { PinFrames } from '@/components/store/PinFrames';
import { TagReveal } from '@/components/store/TagReveal';
import { LockupFit } from '@/components/store/LockupFit';
import { ScrollCopy } from '@/components/store/ScrollCopy';
import { Glare } from '@/components/store/Glare';
import { ChatWidget } from '@/components/store/ChatWidget';
import { CartDrawer } from '@/components/store/CartDrawer';
import { IntentPrefetch } from '@/components/store/IntentPrefetch';
import { SITE } from '@/lib/content';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only z-[60] rounded-full bg-voltage px-4 py-2 font-sans font-semibold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Skip to content</a>
      <div className="page-card">{children}</div>
      <Footer />
      <FooterReveal />
      <ChatWidget whatsapp={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || SITE.whatsapp} />
      <CartDrawer />
      <Reveal />
      <PinFrames />
      <LockupFit />
      <TagReveal />
      <ScrollCopy />
      <Glare />
      <IntentPrefetch />
    </>
  );
}
