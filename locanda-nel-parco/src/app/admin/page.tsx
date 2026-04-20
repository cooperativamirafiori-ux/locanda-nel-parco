import { getAllReservations, getConfig } from '@/lib/db';
import { AdminDashboard } from './AdminDashboard';

export default async function AdminPage() {
  const today = new Date().toISOString().split('T')[0];
  const [reservations, config] = await Promise.all([
    getAllReservations(),
    getConfig(),
  ]);
  return <AdminDashboard reservations={reservations} config={config} today={today} />;
}
