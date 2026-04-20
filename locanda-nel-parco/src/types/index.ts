export type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show';
export type WaitlistStatus = 'waiting' | 'notified' | 'booked' | 'expired';

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  guests: number;
  special_requests: string;
  status: ReservationStatus;
  reminder_sent: number; // 0 | 1
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  special_requests: string;
  status: WaitlistStatus;
  created_at: string;
}

export interface Config {
  id: number;
  max_seats: number;
  cancellation_hours: number;
  time_slots: string[];   // ['12:30', '13:00', ...]
  active_days: number[];  // 0=Dom, 1=Lun, ..., 6=Sab
}

export interface DailyOverride {
  date: string;      // YYYY-MM-DD
  max_seats: number;
  note: string;
}

export interface SpecialClosure {
  id: number;
  date: string;
  reason: string;
}

export interface TimeSlotAvailability {
  time: string;
  booked: number;
  available: number;
  total: number;
}
