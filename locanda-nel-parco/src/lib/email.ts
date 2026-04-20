import nodemailer from 'nodemailer';
import type { Reservation } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

function createTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const isOffice365 = host.includes('office365') || host.includes('outlook');
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    requireTLS: isOffice365,   // obbligatorio per Office 365
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #F7F2E8; font-family: Georgia, serif; }
    .container { max-width: 560px; margin: 40px auto; background: #FAFAF5; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #1E3A2F; padding: 36px 40px; text-align: center; }
    .header h1 { color: #F7F2E8; font-size: 24px; margin: 0; letter-spacing: 1px; }
    .header p { color: #B5930A; margin: 4px 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; }
    .body { padding: 36px 40px; }
    .body p { color: #2C1810; line-height: 1.7; margin: 0 0 16px; }
    .detail-box { background: #F7F2E8; border-left: 3px solid #B5930A; border-radius: 4px; padding: 20px 24px; margin: 24px 0; }
    .detail-table { width: 100%; border-collapse: collapse; }
    .detail-table td { padding: 7px 0; border-bottom: 1px solid rgba(0,0,0,0.06); vertical-align: top; }
    .detail-table tr:last-child td { border-bottom: none; }
    .detail-label { color: #6B6B6B; font-size: 13px; white-space: nowrap; padding-right: 24px; }
    .detail-value { color: #1E3A2F; font-weight: bold; font-size: 14px; text-align: right; }
    .btn { display: inline-block; padding: 12px 28px; border-radius: 4px; text-decoration: none; font-size: 14px; margin: 8px 4px; }
    .btn-primary { background: #1E3A2F; color: #F7F2E8; }
    .btn-danger { background: #C0603A; color: #FAFAF5; }
    .footer { background: #1E3A2F; padding: 20px 40px; text-align: center; }
    .footer p { color: #8FAF9E; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Locanda nel Parco</h1>
      <p>Ristorante</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>Locanda nel Parco</p>
      <p>Per assistenza rispondi a questa email</p>
    </div>
  </div>
</body>
</html>`;

function reservationDetails(r: Reservation) {
  return `
  <div class="detail-box">
    <table class="detail-table">
      <tr>
        <td class="detail-label">Prenotazione</td>
        <td class="detail-value">#${r.id.slice(0, 8).toUpperCase()}</td>
      </tr>
      <tr>
        <td class="detail-label">Data</td>
        <td class="detail-value">${formatDate(r.date)}</td>
      </tr>
      <tr>
        <td class="detail-label">Orario</td>
        <td class="detail-value">${r.time}</td>
      </tr>
      <tr>
        <td class="detail-label">Coperti</td>
        <td class="detail-value">${r.guests} ${r.guests === 1 ? 'persona' : 'persone'}</td>
      </tr>
      ${r.special_requests ? `
      <tr>
        <td class="detail-label">Note</td>
        <td class="detail-value">${r.special_requests}</td>
      </tr>` : ''}
    </table>
  </div>`;
}

export async function sendConfirmationEmail(reservation: Reservation): Promise<void> {
  if (!process.env.SMTP_USER) return; // Skip if not configured

  const cancelUrl = `${BASE_URL}/cancella/${reservation.id}`;
  const html = emailWrapper(`
    <p>Ciao <strong>${reservation.name}</strong>,</p>
    <p>la tua prenotazione alla <strong>Locanda nel Parco</strong> è confermata. Ti aspettiamo!</p>
    ${reservationDetails(reservation)}
    <p>Hai bisogno di cancellare? Puoi farlo fino a 24 ore prima dell'orario prenotato:</p>
    <p style="text-align:center">
      <a href="${cancelUrl}" class="btn btn-danger">Cancella prenotazione</a>
    </p>
    <p style="font-size:12px;color:#888">Oppure copia questo link: ${cancelUrl}</p>
  `);

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Locanda nel Parco <noreply@locandanelparco.it>',
    to: reservation.email,
    subject: `Prenotazione confermata – ${formatDate(reservation.date)} ore ${reservation.time}`,
    html,
  });
}

export async function sendReminderEmail(reservation: Reservation): Promise<void> {
  if (!process.env.SMTP_USER) return;

  const cancelUrl = `${BASE_URL}/cancella/${reservation.id}`;
  const html = emailWrapper(`
    <p>Ciao <strong>${reservation.name}</strong>,</p>
    <p>ti ricordiamo che <strong>domani</strong> hai un tavolo riservato alla <strong>Locanda nel Parco</strong>.</p>
    ${reservationDetails(reservation)}
    <p>Se non puoi venire, ti chiediamo di cancellare il prima possibile per liberare il posto:</p>
    <p style="text-align:center">
      <a href="${cancelUrl}" class="btn btn-danger">Cancella prenotazione</a>
    </p>
  `);

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Locanda nel Parco <noreply@locandanelparco.it>',
    to: reservation.email,
    subject: `Promemoria – Domani alle ${reservation.time} alla Locanda nel Parco`,
    html,
  });
}

export async function sendCancellationEmail(reservation: Reservation): Promise<void> {
  if (!process.env.SMTP_USER) return;

  const html = emailWrapper(`
    <p>Ciao <strong>${reservation.name}</strong>,</p>
    <p>la tua prenotazione è stata <strong>cancellata</strong> con successo.</p>
    ${reservationDetails(reservation)}
    <p>Speriamo di rivederti presto alla Locanda nel Parco!</p>
    <p style="text-align:center">
      <a href="${BASE_URL}" class="btn btn-primary">Prenota di nuovo</a>
    </p>
  `);

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Locanda nel Parco <noreply@locandanelparco.it>',
    to: reservation.email,
    subject: 'Prenotazione cancellata – Locanda nel Parco',
    html,
  });
}

export async function sendWaitlistNotificationEmail(
  name: string,
  email: string,
  date: string,
  time: string,
  confirmUrl: string,
): Promise<void> {
  if (!process.env.SMTP_USER) return;

  const html = emailWrapper(`
    <p>Ciao <strong>${name}</strong>,</p>
    <p>buone notizie! Si è liberato un posto per <strong>${formatDate(date)}</strong> alle <strong>${time}</strong>.</p>
    <p>Il posto è riservato per te per le prossime <strong>2 ore</strong>. Confermalo subito:</p>
    <p style="text-align:center">
      <a href="${confirmUrl}" class="btn btn-primary">Conferma il mio posto</a>
    </p>
    <p style="font-size:12px;color:#888">Se non confermi entro 2 ore, il posto verrà assegnato al prossimo in lista.</p>
  `);

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Locanda nel Parco <noreply@locandanelparco.it>',
    to: email,
    subject: `Posto disponibile! ${formatDate(date)} ore ${time} – Locanda nel Parco`,
    html,
  });
}
