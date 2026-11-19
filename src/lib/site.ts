/** Your live address. Set APP_URL in Vercel to override. */
export const SITE_URL = (process.env.APP_URL || 'https://www.deedeesmarketplace.org').replace(/\/$/, '');

export const site = {
  name: 'DeeDee’s Marketplace',
  url: SITE_URL,
  shortName: 'DeeDee’s',
  description:
    'Buy premium social media accounts safely. Pay by bank transfer or wallet, with fast delivery to your dashboard.',
  whatsapp: '2349035206681',
  whatsappDisplay: '09035206681',
  phone: '+2347046019436',
  phoneDisplay: '07046019436',
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const PLATFORMS = [
  'Instagram', 'TikTok', 'Facebook', 'X (Twitter)', 'YouTube', 'Snapchat', 'Telegram', 'WhatsApp',
  'Discord', 'Threads', 'Reddit', 'Pinterest', 'Twitch', 'Netflix', 'Spotify', 'Gmail', 'Google Voice', 'Other',
];
