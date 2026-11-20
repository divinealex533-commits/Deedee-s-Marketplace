import { SiTelegram, SiWhatsapp } from 'react-icons/si';
import { site, telegramLink, whatsappLink } from '@/lib/site';

/** WhatsApp + Telegram buttons side by side. */
export default function ContactButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={whatsappLink('Hello, I need help with DeeDee’s Marketplace')} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-3 text-sm font-semibold text-white hover:opacity-90">
        <SiWhatsapp className="h-4 w-4" aria-hidden="true" /> WhatsApp
      </a>
      <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-3 py-3 text-sm font-semibold text-white hover:opacity-90">
        <SiTelegram className="h-4 w-4" aria-hidden="true" /> Telegram
      </a>
      <span className="sr-only">Support: WhatsApp {site.whatsappDisplay}, Telegram @{site.telegram}</span>
    </div>
  );
}
