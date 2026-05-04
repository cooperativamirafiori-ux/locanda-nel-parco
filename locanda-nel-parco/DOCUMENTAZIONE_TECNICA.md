# Documentazione Tecnica — Locanda nel Parco

> Versione: aprile 2026  
> Progetto: sistema di prenotazione tavoli per ristorante

---

## 1. Panoramica generale

**Locanda nel Parco** è un'applicazione web per la gestione delle prenotazioni di un ristorante omonimo. Permette ai clienti di prenotare un tavolo online senza telefonate, e al ristorante di gestire tutto dal pannello amministrativo.

**A chi è destinata:**
- **Clienti del ristorante** — accedono alla homepage, scelgono data/orario, compilano i dati e ricevono una conferma via email
- **Staff/proprietà del ristorante** — accedono al pannello admin per vedere le prenotazioni, modificarle e configurare il sistema

**Cosa fa concretamente:**
- Mostra un calendario con i giorni prenotabili e gli orari disponibili
- Gestisce la capienza separatamente per pranzo e cena
- Invia email automatiche di conferma, promemoria (il giorno prima) e cancellazione
- Gestisce una lista d'attesa quando i posti sono esauriti
- Permette all'admin di chiudere giornate, modificare la capienza per data specifica, segnare i no-show, cancellare prenotazioni

---

## 2. Architettura

### Pattern generale

L'app usa il **Next.js 14 App Router** con una separazione netta tra:
- **Server Components** — caricano i dati iniziali (SSR), senza stato React
- **Client Components** — gestiscono interazione utente, stato locale, fetch aggiuntive

Il database è accessibile **solo lato server** (mai dal browser direttamente), tramite la `SUPABASE_SERVICE_ROLE_KEY` che bypassa RLS.

### Struttura cartelle

```
locanda-nel-parco/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage (calendario + form prenotazione)
│   │   ├── layout.tsx                  # Layout root (metadati HTML)
│   │   ├── globals.css                 # CSS globale + variabili colore + classi utility
│   │   ├── conferma/[id]/page.tsx      # Pagina di conferma post-prenotazione
│   │   ├── cancella/[id]/page.tsx      # Pagina di cancellazione (link in email)
│   │   ├── admin/
│   │   │   ├── layout.tsx              # Layout admin con navbar
│   │   │   ├── page.tsx                # Dashboard (server component, force-dynamic)
│   │   │   ├── AdminDashboard.tsx      # Dashboard (client component con fetch proprie)
│   │   │   ├── LogoutButton.tsx        # Bottone logout
│   │   │   ├── login/page.tsx          # Login admin
│   │   │   ├── config/page.tsx         # Configurazione ristorante
│   │   │   ├── chiusure/page.tsx       # Gestione chiusure speciali
│   │   │   └── overrides/page.tsx      # Capienza personalizzata per data
│   │   └── api/
│   │       ├── availability/route.ts   # GET disponibilità slot per data
│   │       ├── reservations/
│   │       │   ├── route.ts            # POST nuova prenotazione
│   │       │   └── [id]/route.ts       # GET/DELETE prenotazione singola
│   │       ├── waitlist/route.ts       # POST iscrizione lista d'attesa
│   │       ├── cron/reminders/route.ts # GET cron job promemoria
│   │       └── admin/
│   │           ├── login/route.ts
│   │           ├── logout/route.ts
│   │           ├── config/route.ts
│   │           ├── test-email/route.ts
│   │           ├── reservations/
│   │           │   ├── route.ts        # GET tutte le prenotazioni
│   │           │   └── [id]/route.ts   # PATCH stato prenotazione
│   │           ├── closures/
│   │           │   ├── route.ts        # GET/POST chiusure
│   │           │   └── [id]/route.ts   # DELETE chiusura
│   │           └── overrides/
│   │               ├── route.ts        # GET/POST override capienza
│   │               └── [date]/route.ts # DELETE override
│   ├── lib/
│   │   ├── db.ts                       # Tutte le funzioni di accesso al DB
│   │   ├── email.ts                    # Tutte le funzioni di invio email
│   │   └── auth.ts                     # Utilità autenticazione admin
│   ├── types/
│   │   └── index.ts                    # Tutti i tipi TypeScript del progetto
│   └── middleware.ts                   # Protezione rotte admin via cookie
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Principio di accesso ai dati

```
Browser → Next.js API Route → lib/db.ts → Supabase (PostgreSQL)
                                        ↓
                               lib/email.ts → SMTP (Microsoft 365)
```

Il browser non comunica mai direttamente con Supabase.

---

## 3. Funzionalità

### Lato cliente

#### Calendario prenotazioni (`/`)
- Calendario mensile navigabile che mostra solo i giorni aperti (configurati dall'admin)
- Giorni passati e giorni chiusi sono disabilitati visivamente
- Alla selezione di una data, vengono caricati gli orari disponibili via API
- Gli slot mostrano se ci sono ancora posti; se sono pieni mostrano "(pieno)" e sono disabilitati
- Se la data è martedì, viene mostrato un avviso "solo servizio pizzeria"

#### Form di prenotazione
- Step 1: selezione data + orario
- Step 2: inserimento dati personali (nome, telefono obbligatorio, email, numero persone, richieste speciali)
- Il numero massimo di persone selezionabile è limitato ai posti ancora disponibili per quel servizio
- Validazione lato client (HTML5) e lato server (API)

#### Lista d'attesa
- Se si tenta di prenotare e i posti sono esauriti, appare l'opzione di iscriversi alla lista d'attesa
- La lista d'attesa registra i dati dell'utente per quella data/ora
- Quando una prenotazione viene cancellata, il sistema notifica il primo in lista (funzionalità presente nel codice ma non completamente automatizzata)

#### Conferma prenotazione (`/conferma/[id]`)
- Pagina di riepilogo che mostra i dettagli della prenotazione
- Pulsante per aggiungere l'evento al calendario (genera file ICS)
- Link per cancellare la prenotazione

#### Cancellazione (`/cancella/[id]`)
- Raggiungibile tramite il link nell'email di conferma o promemoria
- Mostra i dettagli della prenotazione
- Controlla se la cancellazione è ancora consentita (entro le ore configurate)
- Dopo la cancellazione invia email di conferma cancellazione al cliente

### Lato admin

#### Dashboard (`/admin`)
- KPI in tempo reale: coperti prenotati a pranzo oggi / disponibili; coperti prenotati a cena oggi / disponibili; coperti totali prossimi 7 giorni
- Tabella prenotazioni filtrabile per data
- Per ogni prenotazione: possibilità di segnare "No show" o "Cancella" (con email automatica al cliente)
- I dati vengono fetchiati freschi via API al mount del componente per evitare problemi di cache

#### Configurazione (`/admin/config`)
- **Capienza**: posti massimi per il servizio pranzo e per il servizio cena (indipendenti)
- **Ore per cancellazione**: finestra temporale entro cui il cliente può cancellare
- **Giorni di apertura**: selezione dei giorni della settimana (lunedì–domenica)
- **Turni prenotabili**: orari disponibili per le prenotazioni (aggiungibili/rimovibili)
- **Test email**: verifica la configurazione SMTP inviando un'email di test

#### Chiusure speciali (`/admin/chiusure`)
- Aggiunta di date chiuse singole o range di date (es. chiusura estiva)
- Possibilità di aggiungere una nota (motivo della chiusura)
- Le date chiuse non compaiono nel calendario e bloccano le prenotazioni via API
- Lista delle chiusure con possibilità di rimozione

#### Capienza per data (`/admin/overrides`)
- Sovrascrive la capienza standard per una data specifica
- Configurabile separatamente per pranzo e cena
- `0` posti = servizio chiuso per quel giorno
- Campo note opzionale (es. "Evento privato")

---

## 4. Stack tecnologico

| Tecnologia | Versione | Ruolo |
|---|---|---|
| **Next.js** | 14.2.15 | Framework full-stack (App Router) |
| **React** | 18 | UI library |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 3.4 | Stili utility-first |
| **Supabase JS** | 2.43 | Client per PostgreSQL |
| **Nodemailer** | 6.9 | Invio email via SMTP |
| **uuid** | 9 | Generazione ID prenotazioni |

**Perché Next.js App Router:** permette di mescolare server e client components nello stesso progetto, semplificando la gestione del rendering e delle API route senza server separato.

**Perché Supabase:** database PostgreSQL gestito con dashboard visuale, RLS integrata, e client JavaScript ufficiale. Non richiede server di database proprio.

**Perché Nodemailer:** libreria consolidata per SMTP, compatibile con qualsiasi provider incluso Microsoft 365 con le dovute configurazioni TLS.

---

## 5. Servizi esterni e integrazioni

### Supabase (database)
- **Cosa è:** PostgreSQL as a Service
- **Uso:** storage di tutte le prenotazioni, configurazione, lista d'attesa, chiusure
- **Variabili d'ambiente:**
  - `NEXT_PUBLIC_SUPABASE_URL` — URL pubblico del progetto Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` — chiave con accesso totale (solo server-side)
- **RLS:** abilitata su tutte le tabelle. La service role key bypassa RLS, quindi l'app funziona correttamente. La chiave pubblica (anon key) non ha accesso a nulla.
- **Regione:** verificare in Supabase → Settings → General. Per conformità GDPR preferire EU (Frankfurt).

### Microsoft 365 SMTP (email)
- **Cosa è:** server SMTP della casella `locanda@cooperativamirafiori.com`
- **Uso:** invio di tutte le email transazionali (conferma, promemoria, cancellazione, notifica lista d'attesa, test)
- **Variabili d'ambiente:**
  - `SMTP_HOST` — es. `smtp.office365.com`
  - `SMTP_PORT` — `587`
  - `SMTP_USER` — indirizzo email mittente
  - `SMTP_PASS` — password della casella
  - `EMAIL_FROM` — nome e indirizzo visualizzati come mittente
- **Requisito Microsoft 365:** il parametro `SmtpClientAuthentication` deve essere abilitato per la casella specifica via Exchange Online PowerShell:
  ```powershell
  Set-CASMailbox -Identity locanda@cooperativamirafiori.com -SmtpClientAuthenticationDisabled $false
  ```
- **Configurazione codice:** in `src/lib/email.ts`, la funzione `createTransport()` rileva automaticamente se il server è Office365/Outlook e imposta `requireTLS: true`.

### Vercel (hosting e deploy)
- **Cosa è:** piattaforma di deploy per app Next.js
- **Uso:** hosting dell'applicazione in produzione
- **Comportamento critico:** le API route di Vercel sono **serverless functions** — vengono terminate subito dopo aver inviato la risposta HTTP. Qualsiasi operazione asincrona (es. invio email) deve essere completata con `await` **prima** di `return NextResponse.json(...)`, altrimenti non viene eseguita.
- **Variabili d'ambiente:** configurate in Vercel → Project Settings → Environment Variables (preferire "Project" rispetto a "Shared" per isolarle)

---

## 6. Flussi principali

### Flusso prenotazione cliente

```
1. Cliente apre la homepage
2. Il browser carica /api/availability?date=OGGI per ottenere i giorni attivi
3. Cliente seleziona una data nel calendario
4. Il browser chiama /api/availability?date=DATA-SCELTA
   → Il server controlla: chiusure speciali, giorni attivi, posti occupati per servizio
   → Restituisce gli slot con posti disponibili
5. Cliente seleziona un orario e clicca "Continua"
6. Cliente compila il form (nome, telefono, email, persone, note)
7. Il browser invia POST /api/reservations con tutti i dati
   → Validazione server: campi obbligatori, email, numero ospiti
   → Controllo chiusura, giorno attivo, orario valido
   → Calcolo posti occupati per il servizio (pranzo/cena) in quella data
   → Se non ci sono posti: risposta 409 con campo available
   → Se ci sono posti: crea la prenotazione (uuid generato lato server)
   → await sendConfirmationEmail(reservation) — email inviata PRIMA di rispondere
   → Risposta 201 con i dati della prenotazione
8. Il browser reindirizza a /conferma/[id]
9. Cliente vede il riepilogo e può aggiungere al calendario
```

### Flusso posti esauriti → lista d'attesa

```
1. POST /api/reservations → 409 con available: 0
2. Il frontend mostra il blocco "Posti esauriti" con offerta lista d'attesa
3. Cliente clicca "Sì, mettimi in lista"
4. Browser invia POST /api/waitlist con gli stessi dati
5. Il sistema salva il record in waitlist con status 'waiting'
6. Quando una prenotazione viene cancellata (dal cliente o dall'admin),
   il sistema può notificare il primo in lista via email
```

### Flusso cancellazione cliente

```
1. Cliente clicca il link nell'email di conferma: /cancella/[id]
2. La pagina carica i dati della prenotazione via GET /api/reservations/[id]
3. Controlla se la cancellazione è ancora consentita:
   data/ora prenotazione - cancellation_hours ≥ adesso
4. Se consentita: mostra il bottone "Cancella prenotazione"
5. Cliente clicca → DELETE /api/reservations/[id]
   → Aggiorna stato a 'cancelled'
   → Invia email di cancellazione al cliente
6. Pagina mostra conferma
```

### Flusso admin — cambio stato prenotazione

```
1. Admin apre /admin (dashboard)
2. Al mount, AdminDashboard fa due fetch parallele:
   - GET /api/admin/reservations → lista prenotazioni fresca
   - GET /api/admin/config → configurazione fresca
3. Admin clicca "Cancella" su una prenotazione
4. Browser invia PATCH /api/admin/reservations/[id] con { status: 'cancelled' }
5. Il server aggiorna lo stato nel DB
6. Se status === 'cancelled': await sendCancellationEmail(reservation)
7. Il server risponde con { success: true }
8. Il frontend aggiorna lo stato React locale (nessun reload della pagina)
```

### Flusso promemoria automatico (cron)

```
1. Un servizio esterno (es. Vercel Cron o GitHub Actions) chiama ogni notte:
   GET /api/cron/reminders con header Authorization: Bearer CRON_SECRET
2. La route recupera tutte le prenotazioni confermate per domani con reminder_sent = 0
3. Per ogni prenotazione: invia email di promemoria
4. Aggiorna reminder_sent = 1 per evitare duplicati
```

---

## 7. Struttura del database

### Tabella: `config`

Riga singola (id = 1) con la configurazione globale del ristorante.

| Colonna | Tipo | Descrizione |
|---|---|---|
| `id` | INTEGER | Chiave primaria (sempre 1) |
| `max_seats_pranzo` | INTEGER | Posti massimi totali per il servizio pranzo |
| `max_seats_cena` | INTEGER | Posti massimi totali per il servizio cena |
| `cancellation_hours` | INTEGER | Ore prima della prenotazione entro cui si può cancellare |
| `time_slots` | JSONB (array) | Orari prenotabili es. `["12:30","13:00","19:30","20:00"]` |
| `active_days` | JSONB (array) | Giorni aperti: `[0,2,3,4,5,6]` (0=Dom, 1=Lun, ..., 6=Sab) |

> **Nota:** Esiste anche la colonna legacy `max_seats` (non più usata dal codice attuale ma presente nel DB per storico).

### Tabella: `reservations`

| Colonna | Tipo | Descrizione |
|---|---|---|
| `id` | TEXT (UUID) | Chiave primaria, generata con `uuidv4()` |
| `name` | TEXT | Nome e cognome del cliente |
| `email` | TEXT | Email (lowercase) |
| `phone` | TEXT | Telefono |
| `date` | TEXT | Data in formato `YYYY-MM-DD` |
| `time` | TEXT | Orario in formato `HH:MM` |
| `guests` | INTEGER | Numero di persone |
| `special_requests` | TEXT | Richieste speciali (può essere vuoto) |
| `status` | TEXT | `confirmed` / `cancelled` / `no_show` |
| `reminder_sent` | INTEGER | `0` = non inviato, `1` = inviato |
| `created_at` | TEXT | Timestamp ISO 8601 di creazione |

### Tabella: `waitlist`

| Colonna | Tipo | Descrizione |
|---|---|---|
| `id` | TEXT (UUID) | Chiave primaria |
| `name` | TEXT | Nome cliente |
| `email` | TEXT | Email cliente |
| `phone` | TEXT | Telefono |
| `date` | TEXT | Data richiesta |
| `time` | TEXT | Orario richiesto |
| `guests` | INTEGER | Numero persone |
| `special_requests` | TEXT | Note |
| `status` | TEXT | `waiting` / `notified` / `booked` / `expired` |
| `created_at` | TEXT | Timestamp creazione |

### Tabella: `special_closures`

| Colonna | Tipo | Descrizione |
|---|---|---|
| `id` | INTEGER (SERIAL) | Chiave primaria |
| `date` | TEXT | Data chiusa `YYYY-MM-DD` (unica) |
| `reason` | TEXT | Motivo della chiusura |

### Tabella: `daily_overrides`

| Colonna | Tipo | Descrizione |
|---|---|---|
| `date` | TEXT | Chiave primaria, `YYYY-MM-DD` |
| `max_seats_pranzo` | INTEGER | Posti pranzo per questa data (`null` = usa default config) |
| `max_seats_cena` | INTEGER | Posti cena per questa data (`null` = usa default config) |
| `note` | TEXT | Nota (es. "Matrimonio privato") |

### Logica capienza

La capacità è calcolata **per servizio** (pranzo / cena), non per singolo slot orario:
- **Pranzo**: tutti gli orari con ora < 15:00 (es. 12:00, 12:30, 13:00, 13:30, 14:00, 14:30)
- **Cena**: tutti gli orari con ora ≥ 15:00 (es. 19:00, 19:30, 20:00, 20:30, ...)

Quando arriva una prenotazione per le 13:00, si somma il totale di tutti i coperti confermati in tutti gli orari del pranzo di quel giorno, e si confronta con `max_seats_pranzo`.

**Priorità**: `daily_overrides` ha precedenza su `config`. Se per una data esiste un override con `max_seats_pranzo = 40`, si usano 40 posti invece del default.

### SQL per creare le tabelle (da zero)

```sql
-- Configurazione
CREATE TABLE config (
  id                  INTEGER PRIMARY KEY DEFAULT 1,
  max_seats_pranzo    INTEGER NOT NULL DEFAULT 80,
  max_seats_cena      INTEGER NOT NULL DEFAULT 80,
  cancellation_hours  INTEGER NOT NULL DEFAULT 24,
  time_slots          JSONB NOT NULL DEFAULT '["12:30","13:00","13:30","19:30","20:00","20:30"]',
  active_days         JSONB NOT NULL DEFAULT '[0,2,3,4,5,6]'
);
INSERT INTO config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Prenotazioni
CREATE TABLE reservations (
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

-- Lista d'attesa
CREATE TABLE waitlist (
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

-- Chiusure speciali
CREATE TABLE special_closures (
  id     SERIAL PRIMARY KEY,
  date   TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT ''
);

-- Override giornalieri
CREATE TABLE daily_overrides (
  date             TEXT PRIMARY KEY,
  max_seats_pranzo INTEGER,
  max_seats_cena   INTEGER,
  note             TEXT NOT NULL DEFAULT ''
);

-- RLS (obbligatorio)
ALTER TABLE config           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_overrides  ENABLE ROW LEVEL SECURITY;
```

---

## 8. Configurazione e variabili d'ambiente

Tutte le variabili si impostano in Vercel → Project Settings → Environment Variables (per la produzione) e nel file `.env.local` per lo sviluppo locale.

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL pubblico del progetto Supabase (es. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chiave service role di Supabase — accesso totale al DB, solo server-side |
| `ADMIN_PASSWORD` | ✅ | Password per accedere al pannello admin |
| `SMTP_HOST` | ✅ (per email) | Host SMTP (es. `smtp.office365.com`) |
| `SMTP_PORT` | ✅ (per email) | Porta SMTP (es. `587`) |
| `SMTP_USER` | ✅ (per email) | Indirizzo email mittente |
| `SMTP_PASS` | ✅ (per email) | Password SMTP |
| `EMAIL_FROM` | ⬜ | Mittente visualizzato (default: `noreply@locandanelparco.it`) |
| `NEXT_PUBLIC_BASE_URL` | ⬜ | URL pubblico dell'app (default: `http://localhost:3000`). Usato nei link nelle email |
| `CRON_SECRET` | ⬜ | Token segreto per autenticare le chiamate al cron job dei promemoria |

> **Nota:** Se `SMTP_USER` non è impostato, le email vengono silenziosamente saltate senza errore.

---

## 9. Come avviare il progetto

### Prerequisiti
- Node.js 18+
- Account Supabase (gratuito sufficiente)
- Account email SMTP

### Setup locale

```bash
# 1. Clona il repository
git clone https://github.com/cooperativamirafiori-ux/locanda-nel-parco.git
cd locanda-nel-parco

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.local.example .env.local
# Edita .env.local con i tuoi valori

# 4. Crea le tabelle su Supabase (usa il SQL Editor nella dashboard)
# Vedi sezione 7 per il SQL completo

# 5. Avvia il server di sviluppo
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`.

### Deploy su Vercel

```bash
# Build di produzione (verifica che compili senza errori)
npm run build

# Deploy tramite Vercel CLI oppure collegando il repository GitHub a Vercel
```

Su Vercel, configurare tutte le variabili d'ambiente nella sezione "Environment Variables" del progetto.

### Configurazione promemoria automatici

Il cron job (`/api/cron/reminders`) deve essere chiamato ogni notte, preferibilmente alle 18:00–20:00 per raggiungere i clienti del giorno successivo. Opzioni:

1. **Vercel Cron** (da configurare in `vercel.json`):
   ```json
   {
     "crons": [{ "path": "/api/cron/reminders", "schedule": "0 18 * * *" }]
   }
   ```
2. **Servizio esterno** (es. cron-job.org): chiama `GET https://tuodominio.com/api/cron/reminders` con header `Authorization: Bearer VALORE_CRON_SECRET`

---

## 10. Punti critici e decisioni tecniche rilevanti

### ⚠️ Email su Vercel: usare sempre `await`

Le funzioni serverless di Vercel vengono **terminate subito dopo l'invio della risposta HTTP**. Qualsiasi operazione asincroca non completata prima di `return` viene persa.

**Sbagliato:**
```typescript
sendConfirmationEmail(reservation).catch(console.error); // non viene eseguita!
return NextResponse.json({ reservation }, { status: 201 });
```

**Corretto:**
```typescript
try {
  await sendConfirmationEmail(reservation); // completa prima di rispondere
} catch (e) {
  console.error('Email fallita:', e);
}
return NextResponse.json({ reservation }, { status: 201 });
```

Questo vale per **tutte** le API route che inviano email.

### ⚠️ Microsoft 365: SMTP Auth da abilitare esplicitamente

Microsoft 365 disabilita per default l'autenticazione SMTP base per ogni casella. Prima che l'app possa inviare email, va eseguito questo comando PowerShell con un account admin:

```powershell
Connect-ExchangeOnline -UserPrincipalName admin@dominio.com -Device
Set-CASMailbox -Identity locanda@cooperativamirafiori.com -SmtpClientAuthenticationDisabled $false
```

Inoltre il codice usa `requireTLS: true` per Office365 (rilevato automaticamente dal hostname).

### ⚠️ Cache del browser Next.js (Router Cache)

Next.js App Router mantiene una cache client-side (**Router Cache**) delle pagine visitate. `force-dynamic` sul server component impedisce la cache del **server**, ma non quella del browser.

**Soluzione adottata:** `AdminDashboard` fetcha autonomamente i dati via API al mount del componente con `useEffect`, ignorando completamente le props del server component per quanto riguarda l'aggiornamento in tempo reale.

```typescript
useEffect(() => {
  fetch('/api/admin/reservations').then(...).then(d => setReservations(d.reservations));
  fetch('/api/admin/config').then(...).then(d => setLiveConfig(d.config));
}, []);
```

### Autenticazione admin: cookie semplice

L'autenticazione admin usa un **singolo cookie di sessione** con un valore fisso (`authenticated`). Non ci sono sessioni, token JWT, o account multipli. La password è in chiaro in una variabile d'ambiente.

**Limitazioni:** chiunque conosca la password ha accesso completo. Non adatto a scenari con più utenti admin o livelli di permesso diversi.

Il middleware (`src/middleware.ts`) blocca tutte le rotte `/admin/*` e `/api/admin/*` (eccetto login/logout) se il cookie non è presente o ha valore errato.

### Configurazione: POST invece di PUT

La route di salvataggio configurazione usa `POST` invece del semanticamente corretto `PUT`. Questo è un workaround a un problema di routing su Vercel che restituiva `405 Method Not Allowed` per le richieste PUT a quella specifica route. La funzionalità è identica.

### Capienza per servizio, non per slot

La capacità **non** è per singolo slot orario, ma per **servizio** (pranzo o cena):
- **Pranzo**: orari con ora < 15 (12:00–14:30)
- **Cena**: orari con ora ≥ 15 (19:00–23:00)

Questo significa che se ci sono 3 slot a pranzo (12:30, 13:00, 13:30) e il massimo pranzo è 80, la **somma** di tutti i coperti di quei 3 slot non può superare 80. La funzione `getService(time)` in `db.ts` determina il servizio dall'orario.

### RLS Supabase: abilitata senza policy

Row Level Security è abilitata su tutte le tabelle, ma non ci sono policy definite. Questo significa che la chiave pubblica `anon` non può accedere a nulla (sicuro), mentre la `service_role` key usata dall'app bypassa RLS e ha accesso totale (corretto).

### UUID come ID prenotazione

L'ID della prenotazione è un UUID v4 generato lato server (`uuidv4()`). Viene usato:
- Come identificatore nella URL di cancellazione (`/cancella/[id]`)
- Come identificatore nella URL di conferma (`/conferma/[id]`)

Chiunque conosca l'UUID può accedere alla pagina di cancellazione. Non c'è autenticazione aggiuntiva — la "sicurezza" sta nell'imprevedibilità dell'UUID.

### Gestione degli stati prenotazione

```
confirmed → cancelled  (da cliente via link email, o da admin)
confirmed → no_show    (solo da admin)
cancelled → (nessun cambio di stato possibile)
no_show   → (nessun cambio di stato possibile)
```

Lo stato `no_show` è puramente informativo e non invia email al cliente.

---

*Documentazione generata in aprile 2026 — aggiornare a ogni modifica significativa dell'architettura o delle funzionalità.*
