import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Config, Reservation, WaitlistEntry, SpecialClosure, WaitlistStatus, DailyOverride, ServiceType } from '@/types';

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<Config> {
  const { data, error } = await getSupabase().from('config').select('*').eq('id', 1).single();
  if (error) throw new Error('Errore configurazione: ' + error.message);
  return data as Config;
}

export async function updateConfig(update: Partial<Omit<Config, 'id'>>): Promise<void> {
  const { error } = await getSupabase().from('config').update(update).eq('id', 1);
  if (error) throw new Error(error.message);
}

// ─── Availability ─────────────────────────────────────────────────────────────

// pranzo: 12:00–14:59 | compleanno: 16:00–17:59 | aperitivo: 18:00–19:00 | cena: 19:30+
export function getService(time: string): ServiceType {
  const [h, m] = time.split(':').map(Number);
  if (h >= 12 && h <= 14) return 'pranzo';
  if (h >= 16 && h <= 17) return 'compleanno';
  if (h === 18 || (h === 19 && m < 30)) return 'aperitivo';
  return 'cena';
}

export async function getBookedSeatsForService(
  date: string,
  service: ServiceType,
): Promise<number> {
  const { data } = await getSupabase()
    .from('reservations')
    .select('time, guests')
    .eq('date', date)
    .eq('status', 'confirmed');
  return (data || [])
    .filter(r => getService(r.time) === service)
    .reduce((sum, r) => sum + r.guests, 0);
}

export async function isDateClosed(date: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from('special_closures')
    .select('id')
    .eq('date', date)
    .maybeSingle();
  return !!data;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export async function getReservation(id: string): Promise<Reservation | null> {
  const { data } = await getSupabase()
    .from('reservations').select('*').eq('id', id).maybeSingle();
  return data as Reservation | null;
}

export async function getAllReservations(filters?: { date?: string; status?: string }): Promise<Reservation[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = getSupabase().from('reservations').select('*');
  if (filters?.date)   query = query.eq('date', filters.date);
  if (filters?.status) query = query.eq('status', filters.status);
  query = query.order('date', { ascending: true }).order('time', { ascending: true });
  const { data } = await query;
  return (data || []) as Reservation[];
}

export async function createReservation(
  data: Omit<Reservation, 'status' | 'reminder_sent' | 'created_at'>,
): Promise<Reservation> {
  const { data: created, error } = await getSupabase()
    .from('reservations')
    .insert({ ...data, status: 'confirmed', reminder_sent: 0, created_at: new Date().toISOString() })
    .select().single();
  if (error) throw new Error(error.message);
  return created as Reservation;
}

export async function updateReservationStatus(id: string, status: Reservation['status']): Promise<void> {
  await getSupabase().from('reservations').update({ status }).eq('id', id);
}

export async function markReminderSent(id: string): Promise<void> {
  await getSupabase().from('reservations').update({ reminder_sent: 1 }).eq('id', id);
}

export async function getReservationsDueReminder(): Promise<Reservation[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const { data } = await getSupabase()
    .from('reservations')
    .select('*')
    .eq('date', tomorrowStr)
    .eq('status', 'confirmed')
    .eq('reminder_sent', 0);
  return (data || []) as Reservation[];
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function createWaitlistEntry(
  data: Omit<WaitlistEntry, 'status' | 'created_at'>,
): Promise<WaitlistEntry> {
  const { data: created, error } = await getSupabase()
    .from('waitlist')
    .insert({ ...data, status: 'waiting', created_at: new Date().toISOString() })
    .select().single();
  if (error) throw new Error(error.message);
  return created as WaitlistEntry;
}

export async function getNextWaitlistEntry(date: string, time: string): Promise<WaitlistEntry | null> {
  const { data } = await getSupabase()
    .from('waitlist')
    .select('*')
    .eq('date', date)
    .eq('time', time)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as WaitlistEntry | null;
}

export async function updateWaitlistStatus(id: string, status: WaitlistStatus): Promise<void> {
  await getSupabase().from('waitlist').update({ status }).eq('id', id);
}

// ─── Special Closures ─────────────────────────────────────────────────────────

export async function getSpecialClosures(): Promise<SpecialClosure[]> {
  const { data } = await getSupabase()
    .from('special_closures')
    .select('*')
    .order('date', { ascending: true });
  return (data || []) as SpecialClosure[];
}

export async function addSpecialClosure(date: string, reason: string): Promise<SpecialClosure> {
  const { data, error } = await getSupabase()
    .from('special_closures')
    .upsert({ date, reason })
    .select().single();
  if (error) throw new Error(error.message);
  return data as SpecialClosure;
}

export async function deleteSpecialClosure(id: number): Promise<void> {
  await getSupabase().from('special_closures').delete().eq('id', id);
}

// ─── Daily Overrides ──────────────────────────────────────────────────────────

export async function getDailyOverrides(): Promise<DailyOverride[]> {
  const { data } = await getSupabase()
    .from('daily_overrides')
    .select('*')
    .order('date', { ascending: true });
  return (data || []) as DailyOverride[];
}

export async function getDailyOverride(date: string): Promise<DailyOverride | null> {
  const { data } = await getSupabase()
    .from('daily_overrides')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  return data as DailyOverride | null;
}

export async function setDailyOverride(
  date: string,
  max_seats_pranzo: number | null,
  max_seats_cena: number | null,
  max_seats_aperitivo: number | null,
  max_seats_compleanno: number | null,
  note: string,
): Promise<DailyOverride> {
  const { data, error } = await getSupabase()
    .from('daily_overrides')
    .upsert({ date, max_seats_pranzo, max_seats_cena, max_seats_aperitivo, max_seats_compleanno, note })
    .select().single();
  if (error) throw new Error(error.message);
  return data as DailyOverride;
}

export async function deleteDailyOverride(date: string): Promise<void> {
  await getSupabase().from('daily_overrides').delete().eq('date', date);
}
