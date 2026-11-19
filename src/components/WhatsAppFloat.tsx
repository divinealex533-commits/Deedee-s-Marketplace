import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/site';

export default function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink('Hello, I need help with DeeDee’s Marketplace')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with support on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/40 transition hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
