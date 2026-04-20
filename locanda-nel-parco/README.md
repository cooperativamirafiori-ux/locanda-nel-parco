# Locanda nel Parco — App Prenotazioni

## Avvio rapido

```bash
# 1. Installa le dipendenze
npm install

# 2. Avvia in sviluppo
npm run dev
```

Apri http://localhost:3000

---

## Struttura

| Route | Descrizione |
|---|---|
| `/` | Pagina prenotazione clienti |
| `/conferma/[id]` | Conferma prenotazione + download .ics |
| `/cancella/[id]` | Cancellazione prenotazione |
| `/admin` | Dashboard prenotazioni |
| `/admin/config` | Configurazione orari, posti, giorni |
| `/admin/chiusure` | Gestione chiusure speciali |

**Password admin di default:** `admin123`  
Cambiala in `.env.local` → `ADMIN_PASSWORD=...`

---

## Configurazione email

Apri `.env.local` e compila:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tua@gmail.com
SMTP_PASS=password-app-google   # Abilita "Password per le app" in Google Account
EMAIL_FROM="Locanda nel Parco <tua@gmail.com>"
```

> Se `SMTP_USER` è vuoto, le email vengono saltate silenziosamente (utile in sviluppo).

---

## Reminder 24 ore

Crea un cron job che chiama ogni giorno alle 10:00:

```
GET https://tuosito.com/api/cron/reminders?secret=CRON_SECRET
```

Con **Vercel**, aggiungi `vercel.json`:
```json
{
  "crons": [{ "path": "/api/cron/reminders?secret=tuo-secret", "schedule": "0 10 * * *" }]
}
```

---

## Database

SQLite locale in `data/locanda.db`. Viene creato automaticamente al primo avvio.

---

## Deploy

Il progetto usa `better-sqlite3` (file locale). Per deploy:
- **VPS/Server dedicato**: funziona out-of-the-box con `npm start`
- **Vercel**: richiede migrazione a un DB esterno (Turso, PlanetScale, Supabase)
