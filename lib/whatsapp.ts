// Sends a WhatsApp message to the owner (or an employee) through the WhatsApp Cloud API.
// If WHATSAPP_TEMPLATE_NAME is set, an approved template with ONE body variable is used
// (required when the 24-hour customer-service window is closed). Otherwise a normal text message is sent.

export function toWaNumber(n: string) {
  const d = n.replace(/\D/g, '');
  return d.length === 10 ? '91' + d : d;
}

export async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, error: 'WhatsApp is not configured' };
  const tpl = process.env.WHATSAPP_TEMPLATE_NAME;
  const payload = tpl
    ? {
        messaging_product: 'whatsapp',
        to: toWaNumber(to),
        type: 'template',
        template: {
          name: tpl,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [
            { type: 'body', parameters: [{ type: 'text', text: body.replace(/[\n\t]+/g, ' | ').slice(0, 1000) }] },
          ],
        },
      }
    : { messaging_product: 'whatsapp', to: toWaNumber(to), type: 'text', text: { body, preview_url: false } };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return { ok: false, error: `WhatsApp ${r.status}: ${(await r.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
