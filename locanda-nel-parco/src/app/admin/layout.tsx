import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen font-sans" style={{ background: '#F3F4F6' }}>
      {/* Sidebar / Top nav */}
      <nav className="w-full" style={{ background: 'var(--forest)' }}>
        <div className="max-w-5xl mx-auto px-4">
          {/* Riga 1: brand + logout */}
          <div className="flex items-center justify-between h-11 border-b border-white/10">
            <Link href="/" className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
              Locanda nel Parco
            </Link>
            <LogoutButton />
          </div>
          {/* Riga 2: link navigazione (scrollabile su mobile) */}
          <div className="flex items-center gap-5 text-sm overflow-x-auto h-10 scrollbar-none">
            <Link href="/admin" className="text-gray-300 hover:text-white transition whitespace-nowrap">Dashboard</Link>
            <Link href="/admin/config" className="text-gray-300 hover:text-white transition whitespace-nowrap">Configurazione</Link>
            <Link href="/admin/chiusure" className="text-gray-300 hover:text-white transition whitespace-nowrap">Chiusure</Link>
            <Link href="/admin/overrides" className="text-gray-300 hover:text-white transition whitespace-nowrap">Posti per data</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
