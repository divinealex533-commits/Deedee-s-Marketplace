export const site = {
  name: 'DeeDee’s Marketplace',
  shortName: 'DeeDee’s',
  description:
    'Buy and sell premium digital accounts safely. Verified sellers, wallet payments and instant delivery.',
  whatsapp: '2349035206681',
  whatsappDisplay: '09035206681',
  phone: '+2347046019436',
  phoneDisplay: '07046019436',
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'X (Twitter)', 'YouTube', 'Snapchat', 'Telegram', 'Other'];
