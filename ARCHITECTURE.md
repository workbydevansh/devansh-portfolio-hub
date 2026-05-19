# Portfolio Architecture

This portfolio is designed as a public-read, owner-write system.

## Stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS
- Database: Supabase PostgreSQL
- Login: Supabase Auth
- Images and files: Supabase Storage
- Deployment: Vercel

## Public Flow

Visitors open the deployed Vercel link and browse the public pages:

- `/`
- `/projects`
- `/achievements`
- `/certificates`
- `/cp-stats`
- `/contact`

These pages use the Supabase anon key and can only read data allowed by Row Level Security.

## Owner Flow

The owner signs in at `/admin/login`. After Supabase Auth validates the email and password, the app checks the signed-in user's row in `public.profiles`.

The admin area is available only when:

- The visitor has a valid Supabase Auth session.
- `public.profiles.role` is `admin` for that user.

Admin routes:

- `/admin`
- `/admin/projects`
- `/admin/achievements`
- `/admin/certificates`
- `/admin/settings`
- `/admin/stats`

## Security Model

Supabase is the source of truth for permissions.

- Portfolio tables are public-readable.
- Inserts, updates, and deletes require an authenticated admin profile.
- Storage buckets are public-readable so portfolio assets can render from a simple link.
- Storage uploads, updates, and deletes require the same authenticated admin profile.
- Service role keys are only used in server-side stat sync code and must never be exposed to the browser.

For a single-owner setup, keep Supabase Auth signups disabled or invite-only.

## Data Model

Core public tables:

- `projects`
- `achievements`
- `achievement_links`
- `achievement_certificates`
- `certificates`
- `social_links`
- `coding_stats`
- `portfolio_settings`

Owner/admin table:

- `profiles`

Storage buckets:

- `project-images`
- `certificates`
- `resume`
- `site-assets`

## Deployment

Vercel hosts the Next.js app. Supabase hosts auth, database, and storage. Required Vercel environment variables are listed in `README.md`.
