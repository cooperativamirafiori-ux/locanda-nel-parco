import { getAllReservations, getConfig } from '@/lib/db';
import { AdminDashboard } from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [reservations, config] = await Promise.all([
      getAllReservations(),
      getConfig(),
    ]);
    return <AdminDashboard reservations={reservations} config={config} today={today} />;
  } catch (err) {
    console.error('Admin page error:', err);
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm font-sans">
        <strong>Errore nel caricamento della dashboard.</strong>
        <p className="mt-1 text-xs opacity-70">{String(err)}</p>
      </div>
    );
  }
}
