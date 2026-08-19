import { Resend } from 'resend';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

// Firebase Admin'i sadece bir kere başlat (Vercel fonksiyonu tekrar tekrar
// çağrıldığında yeniden başlatmaya çalışıp hata vermesin diye kontrol ediyoruz)
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  });
}

const adminAuth = getAuth();

// Doğrulama/sıfırlama linkine tıklandıktan sonra kullanıcı buraya döner
const actionCodeSettings = {
  url: 'https://almancapratik.com/',
  handleCodeInApp: false,
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://almancapratik.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri kabul edilir.' });
  }

  const { type, email, name } = req.body || {};

  if (!type || !email) {
    return res.status(400).json({ error: 'type ve email zorunludur.' });
  }

  try {
    let link, subject, html;

    if (type === 'verify') {
      link = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);
      subject = 'AlmancaPratik - E-posta Doğrulama';
      html = `
        <h2>Merhaba ${name ? name : 'Kullanıcı'},</h2>
        <p>AlmancaPratik hesabını doğrulamak için aşağıdaki bağlantıya tıkla:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Bu işlemi sen talep etmediysen bu e-postayı yok sayabilirsin.</p>
      `;
    } else if (type === 'reset') {
      link = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      subject = 'AlmancaPratik - Şifre Sıfırlama';
      html = `
        <h2>Merhaba,</h2>
        <p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Bu işlemi sen talep etmediysen bu e-postayı yok sayabilirsin.</p>
      `;
    } else {
      return res.status(400).json({ error: 'Geçersiz type değeri.' });
    }

    const data = await resend.emails.send({
      from: 'AlmancaPratik <noreply@almancapratik.com>',
      to: [email],
      subject,
      html,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[auth-email] hata:', error);
    return res.status(500).json({ error: error.message });
  }
}