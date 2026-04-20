-- Esegui questo script nell'editor SQL di Supabase
-- (Supabase Dashboard → SQL Editor → New query)

-- Tabella configurazione (riga unica)
CREATE TABLE IF NOT EXISTS config (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  max_seats         INTEGER NOT NULL DEFAULT 80,
  cancellation_hours INTEGER NOT NULL DEFAULT 24,
  time_slots        JSONB   NOT NULL DEFAULT '["12:30","13:00","13:30","19:30","20:00","20:30","21:00"]',
  active_days       JSONB   NOT NULL DEFAULT '[1,2,3,4,5,6]'
);

-- Inserisce la riga di default (la crea solo se non esiste)
INSERT INTO config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Chiusure speciali per data
CREATE TABLE IF NOT EXISTS special_closures (
  id     BIGSERIAL PRIMARY KEY,
  date   TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT ''
);

-- Prenotazioni
CREATE TABLE IF NOT EXISTS reservations (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL DEFAULT '',
  date             TEXT NOT NULL,
  time             TEXT NOT NULL,
  guests           INTEGER NOT NULL,
  special_requests TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'confirmed',
  reminder_sent    INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL
);

-- Indici per query frequenti
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- Lista d'attesa
CREATE TABLE IF NOT EXISTS waitlist (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL DEFAULT '',
  date             TEXT NOT NULL,
  time             TEXT NOT NULL,
  guests           INTEGER NOT NULL,
  special_requests TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'waiting',
  created_at       TEXT NOT NULL
);
