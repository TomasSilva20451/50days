# 90 Dias — Foco Total

Personal habit tracker for 90 days.

## Stack

- **Frontend** — Single `index.html` (vanilla HTML/CSS/JS, no build step)
- **Backend** — Vercel Serverless Functions (`api/*.js`)
- **Database** — PostgreSQL (any provider: Neon, Supabase, Railway, etc.)

## Features

- 90-day progress grid — click any past/current day to mark as done
- Photo required to confirm each completed day
- 100% recap shows all confirmation photos in day order
- Reset button restarts the challenge with today as day 1
- Weekly schedule with your fixed recurring events pre-loaded
- Drag-and-drop events between days
- Add / delete events per day with color coding
- All data persisted in PostgreSQL
- Dark theme with #c8f135 accent

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "init"
gh repo create 50dias --private --push --source=.
```

### 2. Create a Postgres database

Use any of these (all have free tiers):

| Provider | URL |
|----------|-----|
| [Neon](https://neon.tech) | Free 0.5 GB |
| [Supabase](https://supabase.com) | Free 500 MB |
| [Railway](https://railway.app) | Free $5/mo credit |

Copy the **connection string** (starts with `postgresql://` or `postgres://`).

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the GitHub repo
2. In **Environment Variables**, add:
   ```
   DATABASE_URL = postgresql://user:pass@host/dbname?sslmode=require
   ```
3. Click **Deploy**

> The database tables and default events are created automatically on first page load via `/api/init`.

## Local development

```bash
npm install
npm install -g vercel
vercel dev
```

Set `DATABASE_URL` in a `.env.local` file:

```
DATABASE_URL=postgresql://...
```

## Weekly schedule (pre-loaded)

| Dia | Evento |
|-----|--------|
| Segunda | Ginásio 10h ou 17h |
| Terça | Ginásio 10h ou 17h |
| Quarta | Ténis 7h–9h · Ginásio 10h ou 17h · Universidade 18h |
| Quinta | Ginásio 10h ou 17h · Jantar com amigos/família 20h |
| Sexta | Ginásio 10h ou 17h |
| Sábado | Ténis 7h–9h · Ginásio 10h+ |
| Domingo | Ginásio 10h ou 17h |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/init` | Create tables + seed defaults (idempotent) |
| `GET` | `/api/days` | Fetch all 90 days with completion status |
| `POST` | `/api/days` | Toggle day completion; completing requires `{ day_number, photo_data }` |
| `GET` | `/api/events` | Fetch all weekly events |
| `POST` | `/api/events` | Add event `{ day_of_week, time_label, title, color }` |
| `PUT` | `/api/events` | Move event to another day `{ id, day_of_week }` |
| `DELETE` | `/api/events?id=X` | Delete event |
