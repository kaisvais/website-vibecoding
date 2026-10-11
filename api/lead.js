// Приём заявки с сайта и отправка в Telegram.
// Нужны переменные окружения в Vercel: TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
// Необязательно: TIMEZONE — часовой пояс для времени заявки (по умолчанию Asia/Almaty).

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  // Ловушка для ботов: настоящий посетитель это поле не видит и не заполняет
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const name = clean(body.name, 100);
  const phone = clean(body.phone, 40);
  const business = clean(body.business, 500);
  if (!name || phone.replace(/\D/g, '').length < 10 || !business) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }

  const time = new Date().toLocaleString('ru-RU', { timeZone: process.env.TIMEZONE || 'Asia/Almaty', dateStyle: 'short', timeStyle: 'short' });
  const text = [
    '🟠 <b>Новая заявка на разбор</b>',
    '',
    `<b>Имя:</b> ${esc(name)}`,
    `<b>Телефон:</b> ${esc(phone)}`,
    `<b>Компания:</b> ${esc(business)}`,
    '',
    `<i>${time} · ${esc(clean(req.headers.host, 100) || 'сайт')}</i>`,
  ].join('\n');

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!tg.ok) {
      console.error('Telegram error', tg.status, await tg.text());
      return res.status(502).json({ ok: false, error: 'telegram' });
    }
  } catch (err) {
    console.error('Telegram request failed', err);
    return res.status(502).json({ ok: false, error: 'telegram' });
  }

  return res.status(200).json({ ok: true });
};
