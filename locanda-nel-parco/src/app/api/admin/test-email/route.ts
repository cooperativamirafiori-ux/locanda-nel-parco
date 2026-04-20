import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  const { to } = await request.json();
  if (!to) return NextResponse.json({ error: 'Destinatario mancante' }, { status: 400 });

  if (!process.env.SMTP_USER) {
    return NextResponse.json({ error: 'SMTP_USER non configurato' }, { status: 500 });
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const isOffice365 = host.includes('office365') || host.includes('outlook');

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    requireTLS: isOffice365,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: true },
  });

  try {
    await transporter.verify();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: 'Test email – Locanda nel Parco',
      html: '<p>Email di test inviata correttamente da <strong>Locanda nel Parco</strong>. ✅</p>',
    });
    return NextResponse.json({ ok: true, message: `Email inviata a ${to}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Test email error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
