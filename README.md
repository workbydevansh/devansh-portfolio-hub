# Devansh Portfolio Hub

Devansh Portfolio Hub is a Next.js portfolio dashboard for projects, achievements, certificates, competitive programming stats, contact links, and admin-managed content.

## Features

- Public portfolio dashboard with dark glass UI.
- Public Projects, Achievements, Certificates, CP Stats, and Contact pages.
- Admin authentication with protected admin routes.
- Admin CRUD for projects, achievements, and certificates.
- Supabase Storage uploads for project images, certificates, and resume files.
- Social links and resume settings management.
- Server-side Codeforces and LeetCode stats sync.
- Vercel cron route for scheduled stats updates.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Supabase Auth, Database, and Storage
- Framer Motion
- Lucide React
- Recharts

## Access Model

- Public visitors open the Vercel link and can view portfolio data without logging in.
- Only the owner signs in at `/admin/login`.
- Supabase Row Level Security keeps portfolio tables public-read and admin-write.
- Supabase Storage buckets are public-read for portfolio assets, while uploads, updates, and deletes require an authenticated `admin` profile.
- The `profiles` table stores the owner role. Keep Supabase Auth signups disabled or invite-only for a single-owner portfolio.

## Architecture

```text
Visitor link
  -> Vercel / Next.js public routes
  -> Supabase anon key
  -> Public SELECT policies

Owner login
  -> /admin/login
  -> Supabase Auth session
  -> profiles.role = admin
  -> Admin CRUD + Storage uploads
```

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the required environment variables in `.env.local`.

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Run lint:

```bash
npm run lint
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CODEFORCES_HANDLE=boyzzz
LEETCODE_USERNAME=
CRON_SECRET=
```

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only Supabase service role key for protected sync operations.
- `CODEFORCES_HANDLE`: Codeforces handle for stats sync. Defaults to `boyzzz` if missing.
- `LEETCODE_USERNAME`: LeetCode username for stats sync.
- `CRON_SECRET`: Bearer token used to protect cron and stats sync routes.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. In Supabase Auth settings, disable public signups if you want only one owner.
5. Create one admin user manually in Supabase Auth.
6. Insert that user's id and email into the `profiles` table with role `admin`.

The SQL script creates these public-read buckets and admin-only write policies:

- `certificates`
- `project-images`
- `resume`
- `site-assets`

Example admin profile insert:

```sql
insert into public.profiles (id, email, full_name, role)
values ('AUTH_USER_ID', 'admin@example.com', 'Devansh Verma', 'admin');
```

Replace `AUTH_USER_ID` and `admin@example.com` with the actual Supabase Auth user values.

## Vercel Deployment

1. Push the project to a Git repository.
2. Import the repository into Vercel.
3. Set the framework preset to Next.js.
4. Add all required environment variables in Vercel Project Settings.
5. Deploy the project.
6. After deployment, verify the public pages and admin login route.

## Cron Setup Note

`vercel.json` configures a daily Vercel cron job:

```json
{
  "path": "/api/cron/update-stats",
  "schedule": "0 3 * * *"
}
```

Vercel will trigger `/api/cron/update-stats` daily. Set `CRON_SECRET` in Vercel environment variables so the cron and manual sync routes remain protected.

## Deployment Checklist

- Create Supabase project.
- Run `supabase/schema.sql`.
- Verify storage buckets were created by the SQL script.
- Create admin user in Supabase Auth.
- Insert admin profile row.
- Set env vars on Vercel.
- Deploy.
