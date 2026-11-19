import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { site, SITE_URL } from '@/lib/site';
import WhatsAppFloat from '@/components/WhatsAppFloat';

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  metadataBase: new URL(SITE_URL),
  openGraph: { title: site.name, description: site.description, type: 'website' },
};

export const viewport: Viewport = { themeColor: '#0B1020' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved light/dark choice before the page paints (no flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(localStorage.getItem('dd-theme')==='light'){document.documentElement.classList.add('light');var m=document.querySelector('meta[name=theme-color]');m&&m.setAttribute('content','#F5F6FB')}}catch(e){}",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body className="font-sans">
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
