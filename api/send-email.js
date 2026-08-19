import { Resend } from 'resend';

// Resend API anahtarın Vercel ortam değişkenlerinden (Environment Variables) çekilecek
const resend = new Resend(process.env.RESEND_API_KEY);

// almancapratik.com'dan gelen isteklere izin ver
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://almancapratik.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Tarayıcı POST'tan önce sessizce bir "izin var mı" (OPTIONS) isteği atar.
  // Buna hemen "evet, izin var" diye cevap vermezsek asıl POST isteği hiç gitmez.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri kabul edilir.' });
  }

  const { to, subject, html } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'AlmancaPratik <noreply@almancapratik.com>',
      to: [to],
      subject: subject,
      html: html
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}