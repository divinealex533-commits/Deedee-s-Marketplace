import { NextResponse, type NextRequest } from 'next/server';
import { botReply, getBotConfig, sendMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

type Update = { message?: { chat: { id: number; type: string }; from?: { first_name?: string }; text?: string } };

// Telegram sends every message people send the bot here. The secret header proves it really is Telegram.
export async function POST(req: NextRequest) {
  const bot = await getBotConfig();
  if (!bot.token || !bot.secret || req.headers.get('x-telegram-bot-api-secret-token') !== bot.secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = (await req.json().catch(() => ({}))) as Update;
  const msg = update.message;
  // Only reply in private chats with a person (not in groups or the channel)
  if (msg?.chat.type === 'private') {
    const { html, rows } = await botReply(msg.text ?? '/start', msg.from?.first_name ?? '');
    await sendMessage(bot.token, msg.chat.id, html, rows).catch(() => null);
  }
  // Always answer 200 so Telegram doesn't keep resending the same update
  return NextResponse.json({ ok: true });
}
