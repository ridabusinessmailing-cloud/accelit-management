# Accelit Management Platform

Internal operating system for the Accelit ecommerce media buying team.

---

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Database | PostgreSQL 15                       |
| ORM      | Prisma 5                            |
| Backend  | Node.js 20 · TypeScript · Fastify   |
| Auth     | JWT (8h expiry) · bcrypt            |
| Frontend | React 18 · TypeScript · Vite 5      |
| Styling  | Tailwind CSS 3                      |
| Kanban   | @dnd-kit/core                       |

---

## Project Structure

```
accelit/
├── README.md
├── render.yaml                     # Render.com backend deployment
├── .gitignore
│
├── database/
│   ├── migrations/
│   │   ├── 001_create_enums.sql
│   │   ├── 002_create_users.sql
│   │   ├── 003_create_products.sql
│   │   ├── 004_create_tasks.sql
│   │   ├── 005_create_media_assets.sql
│   │   └── 006_create_landing_pages.sql
│   └── run_all_migrations.sql
│
├── backend/
│   ├── railway.toml                # Railway.app deployment config
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   └── seed.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── products.ts
│   │   │   ├── tasks.ts
│   │   │   └── assets.ts
│   │   └── services/
│   │       └── assetAutomation.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── railway.toml
│
└── frontend/
    ├── vercel.json                 # Vercel SPA routing + cache headers
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── types/index.ts
    │   ├── lib/
    │   │   ├── api.ts
    │   │   ├── auth.tsx
    │   │   └── utils.ts
    │   ├── hooks/useApi.ts
    │   ├── components/
    │   │   ├── layout/AppShell.tsx
    │   │   └── ui/index.tsx
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── DashboardPage.tsx
    │       ├── ProductsPage.tsx
    │       ├── ProductDetailPage.tsx
    │       └── TaskBoardPage.tsx
    ├── index.html
    ├── package.json                # "build": "vite build", type: "module"
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env.example
```

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### 1. Database

```bash
psql -U postgres -c "CREATE DATABASE accelit_db;"
psql -U postgres -d accelit_db -f database/run_all_migrations.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install                  # also runs prisma generate via postinstall
npm run db:seed              # seeds users, products, tasks
npm run dev                  # starts on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                  # starts on http://localhost:5173
```

Open **http://localhost:5173**

Default credentials (seeded):

| Name    | Email                  | Password     | Role  |
|---------|------------------------|--------------|-------|
| Rida    | rida@accelit.com       | accelit2024  | Admin |
| Oussama | oussama@accelit.com    | accelit2024  | Admin |
| Saida   | saida@accelit.com      | accelit2024  | Team  |
| Sana    | sana@accelit.com       | accelit2024  | Team  |

---

## Deployment

### Frontend → Vercel

1. Push repo to GitHub
2. In Vercel: **Add New Project** → import repo
3. Set these in Vercel project settings:

| Setting          | Value        |
|------------------|--------------|
| Root Directory   | `frontend`   |
| Build Command    | `npm run build` |
| Output Directory | `dist`       |
| Install Command  | `npm install` |

4. Add environment variable in Vercel dashboard:

```
VITE_API_URL=https://your-backend.railway.app
```

5. Deploy. `vercel.json` handles SPA routing so `/products`, `/tasks` etc. work on refresh.

---

### Backend → Railway

1. In Railway: **New Project** → **Deploy from GitHub repo**
2. Set Root Directory to `backend`
3. Railway reads `railway.toml` automatically — build and start commands are set
4. Add environment variables in Railway dashboard:

```
DATABASE_URL=postgresql://user:pass@host:5432/accelit_db
JWT_SECRET=<generate with: openssl rand -hex 64>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=3001
```

5. For the database, add a **Railway PostgreSQL** plugin — it auto-sets `DATABASE_URL`
6. After first deploy, run the seed via Railway CLI:

```bash
railway run npm run db:seed
```

---

### Backend → Render (alternative)

1. Push repo to GitHub
2. In Render dashboard: **New** → **Blueprint** → select repo
3. Render reads `render.yaml` at the repo root automatically
4. Set the three secret env vars manually in the Render dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
5. Provision a **Render PostgreSQL** database and copy its connection string into `DATABASE_URL`

---

### Database migrations on deploy

The `postinstall` script in `backend/package.json` runs `prisma generate` automatically
on every `npm install`, so the Prisma client is always up to date.

To run raw SQL migrations against a production database:

```bash
# Via Railway CLI
railway run psql $DATABASE_URL -f database/run_all_migrations.sql

# Via psql directly
psql $DATABASE_URL -f database/run_all_migrations.sql
```

Or use Prisma migrate for a managed workflow:

```bash
railway run npx prisma migrate deploy
```

---

## API Reference

| Method | Endpoint                  | Auth    | Description                       |
|--------|---------------------------|---------|-----------------------------------|
| POST   | /api/auth/login           | Public  | Returns JWT                       |
| GET    | /api/dashboard            | Any     | Stats + recent assets             |
| GET    | /api/products             | Any     | List all products                 |
| POST   | /api/products             | Admin   | Create product                    |
| GET    | /api/products/:id         | Any     | Product detail                    |
| GET    | /api/products/:id/assets  | Any     | Product asset library             |
| GET    | /api/tasks                | Any*    | Tasks (visibility-filtered)       |
| POST   | /api/tasks                | Admin   | Create task                       |
| PATCH  | /api/tasks/:id            | Any*    | Update fields / move column       |
| POST   | /api/tasks/:id/complete   | Any*    | Mark done → triggers automation   |
| GET    | /api/assets               | Any     | All assets                        |
| POST   | /api/assets               | Any     | Manual upload                     |

\* Authenticated user, subject to visibility and ownership rules.

---

## Core Automation

`POST /api/tasks/:id/complete` flow:

```
1. Fetch task
2. Validate asset link (required for creative_video / creative_image / landing_page)
3. UPDATE tasks SET status='done', asset_link=?
4. If asset_link != null AND product_id != null:
     INSERT INTO media_assets (
       product_id    = task.product_id,
       name          = task.title,
       type          = task.type,
       link          = task.asset_link,
       created_by    = task.assigned_to,   ← producer, not admin
       source_task_id = task.id
     ) ON CONFLICT (source_task_id) DO NOTHING
5. Return { task, assetCreated: boolean, asset }
```

---

## Visibility Rules

```typescript
// middleware/auth.ts — applied to every task query
if (role === 'admin') return {};           // sees everything
return { visibility: 'team' };             // team sees only 'team' tasks
```
