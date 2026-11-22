import { prisma } from './db';
import { naira } from './format';
import { getTelegramConfig } from './settings';
import { SITE_URL, site, tgLink, whatsappLink } from './site';

/**
 * Telegram bot. The token is saved in Admin → Settings (or the TELEGRAM_BOT_TOKEN env variable).
 * Stored in the Setting table under "telegramBot": { token, secret, autoPost }.
 * Not cached: it's only read by the webhook, the admin page and when stock is added.
 */
export type BotConfig = { token: string; secret: string; autoPost: boolean; username: string };

export async function getBotConfig(): Promise<BotConfig> {
  const fallback = { token: process.env.TELEGRAM_BOT_TOKEN ?? '', secret: process.env.TELEGRAM_WEBHOOK_SECRET ?? '', autoPost: true, username: '' };
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'telegramBot' } });
    if (!row) return fallback;
    const v = JSON.parse(row.value) as Partial<BotConfig>;
    return { ...fallback, ...v, token: v.token || fallback.token };
  } catch {
    return fallback;
  }
}

export async function saveBotConfig(c: BotConfig) {
  const value = JSON.stringify(c);
  await prisma.setting.upsert({ where: { key: 'telegramBot' }, create: { key: 'telegramBot', value }, update: { value } });
}

type Button = { text: string; url: string };

/** Calls the Telegram Bot API. Returns the parsed reply ({ ok, result, description }). */
export async function tg(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  return (await res.json()) as { ok: boolean; result?: unknown; description?: string };
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const keyboard = (rows: Button[][]) => ({ inline_keyboard: rows });

export function sendMessage(token: string, chatId: number | string, html: string, rows: Button[][] = []) {
  return tg(token, 'sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(rows.length ? { reply_markup: keyboard(rows) } : {}),
  });
}

// ── What the bot says ────────────────────────────────

export const BOT_COMMANDS = [
  { command: 'start', description: 'Welcome and main menu' },
  { command: 'shop', description: 'Open the marketplace' },
  { command: 'wallet', description: 'How to fund your wallet' },
  { command: 'howtobuy', description: 'How to buy in 4 steps' },
  { command: 'sell', description: 'Become a seller' },
  { command: 'support', description: 'Talk to a real person' },
  { command: 'channel', description: 'Join our Telegram channel' },
];

/** Builds the reply for a message sent to the bot. */
export async function botReply(text: string, firstName: string): Promise<{ html: string; rows: Button[][] }> {
  const { channel } = await getTelegramConfig();
  const cmd = text.trim().split(/[\s@]/)[0]!.toLowerCase();
  const shop: Button = { text: '🛒 Open the marketplace', url: `${SITE_URL}/dashboard/marketplace` };
  const signup: Button = { text: '✨ Create free account', url: `${SITE_URL}/signup` };
  const wa: Button = { text: '💬 WhatsApp', url: whatsappLink('Hello, I need help with DeeDee’s Marketplace') };
  const tgSupport: Button = { text: '✈️ Telegram', url: tgLink(site.telegram) };
  const joinChannel: Button[] = channel ? [{ text: '📣 Join our channel', url: tgLink(channel) }] : [];
  const menu: Button[][] = [[shop], [signup], [wa, tgSupport], ...(joinChannel.length ? [joinChannel] : [])];

  switch (cmd) {
    case '/shop':
      return {
        html: '🛒 <b>Marketplace</b>\n\nLog in to see every listing with photos, prices and a preview of each item before you buy.',
        rows: [[shop], [signup]],
      };
    case '/wallet':
      return {
        html: '💰 <b>Fund your wallet</b>\n\n1. Log in and open <b>Wallet</b>\n2. Transfer to one of the accounts shown there, from any Nigerian bank\n3. Upload a screenshot of your receipt\n\nWe confirm it and credit your wallet, usually within minutes.',
        rows: [[{ text: '💰 Open my wallet', url: `${SITE_URL}/dashboard/wallet` }], [wa]],
      };
    case '/howtobuy':
      return {
        html: '🧭 <b>How to buy in 4 steps</b>\n\n1️⃣ Create a free account\n2️⃣ Fund your wallet from your bank app\n3️⃣ Preview and pick what you want\n4️⃣ Get your login in <b>My orders</b>\n\nPaying from your wallet? Delivery is instant.',
        rows: [[signup], [shop]],
      };
    case '/sell':
      return {
        html: '🏪 <b>Sell on DeeDee’s</b>\n\nOpen your own shop, list your products and get paid to your bank account when customers buy.\n\nSign up and choose <b>Sell</b>, or switch in your dashboard.',
        rows: [[{ text: '🏪 Start selling', url: `${SITE_URL}/dashboard/seller` }]],
      };
    case '/support':
      return {
        html: `💬 <b>Talk to a real person</b>\n\nWhatsApp: ${site.whatsappDisplay}\nTelegram: @${site.telegram}\nPhone: ${site.phoneDisplay}\n\nProblem with an order? Open <b>My orders</b> and tap <b>Report a problem</b>, then message us.`,
        rows: [[wa], [tgSupport]],
      };
    case '/channel':
      return channel
        ? { html: '📣 Join our channel for new stock alerts, deals and updates.', rows: [joinChannel] }
        : { html: 'Our channel is coming soon. Meanwhile, chat with us on WhatsApp.', rows: [[wa]] };
    default:
      return {
        html: `👋 Hi ${esc(firstName || 'there')}! Welcome to <b>DeeDee’s Marketplace</b> support.\n\nHow can I help you today? Tap a button below, or open the <b>Menu</b> for more options.`,
        rows: menu,
      };
  }
}

// ── Channel posts ────────────────────────────────────

/** Posts a message to the channel. Returns an error message, or null when it was posted. */
export async function postToChannel(html: string, rows: Button[][] = []): Promise<string | null> {
  const [{ channel }, bot] = await Promise.all([getTelegramConfig(), getBotConfig()]);
  if (!bot.token) return 'Connect your bot first (paste its token in Telegram bot settings).';
  if (!channel) return 'Add your channel username first.';
  try {
    const r = await sendMessage(bot.token, `@${channel}`, html, rows);
    if (r.ok) return null;
    return /not enough rights|chat not found|member/i.test(r.description ?? '')
      ? 'The bot can’t post in the channel yet. Make the bot an admin of the channel with “Post messages” turned on.'
      : `Telegram said: ${r.description ?? 'unknown error'}`;
  } catch {
    return 'Couldn’t reach Telegram. Try again in a minute.';
  }
}

/** "New stock" post after stock is added to a listing. Never throws: adding stock must not fail because of Telegram. */
export async function announceStock(listingId: string, added: number) {
  try {
    if (added < 1) return;
    const bot = await getBotConfig();
    if (!bot.token || !bot.autoPost) return;
    const l = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, platform: true, price: true, active: true, _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
    });
    if (!l || !l.active) return;
    await postToChannel(
      `🆕 <b>New stock just dropped!</b>\n\n<b>${esc(l.title)}</b>\n📂 ${esc(l.platform)}\n💰 ${naira(l.price)} each\n📦 ${l._count.credentials} in stock\n\nPreview before you pay. Wallet orders deliver instantly.`,
      [[{ text: '🛒 Buy now', url: `${SITE_URL}/dashboard/marketplace/${listingId}` }]],
    );
  } catch {
    // ignore: the stock was added either way
  }
}
