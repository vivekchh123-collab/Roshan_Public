import nodemailer from 'nodemailer';
import { sendWhatsApp } from './whatsapp';

// Free owner alerts: Telegram bot + Gmail. The paid WhatsApp Cloud API is used only if WHATSAPP_TOKEN is set.
async function telegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: text.slice(0, 4000), disable_web_page_preview: true }),
    });
    return r.ok;
  } catch { return false; }
}

async function email(subject: string, text: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.OWNER_EMAIL) return false;
  try {
    await nodemailer
      .createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } })
      .sendMail({ from: `Roshan Tubes Website <${process.env.GMAIL_USER}>`, to: process.env.OWNER_EMAIL, subject, text });
    return true;
  } catch { return false; }
}

export async function notifyOwner(subject: string, text: string) {
  const [tg, em, wa] = await Promise.all([
    telegram(`${subject}\n\n${text}`),
    email(subject, text),
    process.env.WHATSAPP_TOKEN ? sendWhatsApp(process.env.OWNER_WHATSAPP || '917376721717', text).then((r) => r.ok) : Promise.resolve(false),
  ]);
  return { ok: tg || em || wa, telegram: tg, email: em, whatsapp: wa };
}
