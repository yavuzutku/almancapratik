import { Resend } from 'resend';

// Resend API anahtarın Vercel ortam değişkenlerinden (Environment Variables) çekilecek
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
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