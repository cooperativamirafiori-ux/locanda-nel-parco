import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Locanda nel Parco – Prenotazioni',
  description: 'Prenota il tuo tavolo alla Locanda nel Parco.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
