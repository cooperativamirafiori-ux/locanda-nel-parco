import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen font-sans" style={{ background: '#F3F4F6' }}>
      {/* Sidebar / Top nav */}
      <nav className="w-full" style={{ background: 'var(--forest)' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
              Locanda nel Parco
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-gray-300 hover:text-white transition">Dashboard</Link>
              <Link href="/admin/config" className="text-gray-300 hover:text-white transition">Configurazione</Link>
              <Link href="/admin/chiusure" className="text-gray-300 hover:text-white transition">Chiusure</Link>
              <Link href="/admin/overrides" className="text-gray-300 hover:text-white transition">Posti per data</Link>
            </div>
          </div>
          <LogoutButton />
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
