import { ImageResponse } from 'next/og';

// The preview picture shown when someone shares the site on WhatsApp, X, Facebook, etc.
export const alt = 'DeeDee’s Marketplace: premium accounts, delivered fast';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'radial-gradient(circle at 15% 10%, #3B2A9E 0%, #0B1020 55%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: '#6246EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 32 32">
              <path d="M8 16.5l5 5 11-12" fill="none" stroke="white" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>DeeDee’s Marketplace</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>Premium accounts,</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, color: '#A897FF' }}>delivered fast.</div>
        </div>
        <div style={{ display: 'flex', gap: 36, fontSize: 30, color: '#C7CBDD' }}>
          <span>Fast delivery</span>
          <span style={{ color: '#6246EA' }}>•</span>
          <span>Refund protection</span>
          <span style={{ color: '#6246EA' }}>•</span>
          <span>24/7 WhatsApp</span>
        </div>
      </div>
    ),
    size,
  );
}
