# EduMitra — Local Development Setup Guide

This guide explains how to clone the EduMitra project and connect it to **your own Supabase account** so you can run the full-stack application locally.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **npm / bun** | latest | Comes with Node.js / [bun.sh](https://bun.sh/) |
| **Git** | any | [git-scm.com](https://git-scm.com/) |
| **Supabase CLI** _(optional)_ | v1.100+ | `npm i -g supabase` |
| **Supabase account** | free tier works | [supabase.com](https://supabase.com/) |

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd edumitra
```

---

## 2. Install Dependencies

```bash
npm install
# or
bun install
```

---

## 3. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a **New Project**.
2. Choose a name, set a database password, and select a region close to your users.
3. Wait for the project to finish provisioning (1–2 minutes).

---

## 4. Run the Database Migrations

You have **two options** to set up the database schema:

### Option A — Using the Supabase CLI (recommended)

1. Log in to the CLI:
   ```bash
   supabase login
   ```

2. Link to your project (find your project ref in **Project Settings → General**):
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. Push all migrations:
   ```bash
   supabase db push
   ```

   This will execute every SQL file inside `supabase/migrations/` in order, creating all tables, functions, triggers, RLS policies, and enums.

### Option B — Manual SQL execution

If you prefer not to use the CLI, copy-paste the contents of each migration file into the **Supabase Dashboard → SQL Editor** and run them **in order**:

1. `supabase/migrations/20260330091804_*.sql` — Creates all tables, enums, functions, triggers, and base RLS policies.
2. `supabase/migrations/20260330091829_*.sql` — Tightens RLS policies with role-based checks.

---

## 5. Configure Authentication

In the Supabase Dashboard:

1. Go to **Authentication → Providers** and ensure **Email** is enabled.
2. _(Optional)_ Under **Authentication → Settings**, enable **"Confirm email"** to skip email verification during development. (In production, keep email confirmation enabled.)

> **Note:** The app signup sends `name` and `role` as user metadata. A database trigger (`handle_new_user`) automatically creates rows in `profiles`, `user_roles`, `students` (for student role), and `mentors` (for mentor role) on each new signup.

---

## 6. Set Up Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
```

**Where to find these values:**

| Variable | Location in Dashboard |
|----------|----------------------|
| `VITE_SUPABASE_URL` | **Settings → API → Project URL** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Settings → API → Project API keys → `anon` `public`** |
| `VITE_SUPABASE_PROJECT_ID` | **Settings → General → Reference ID** |

> ⚠️ **Never commit the `.env` file** to version control. It's already in `.gitignore`.

---

## 7. Update the Supabase Client (if needed)

The file `src/integrations/supabase/client.ts` reads from the environment variables automatically — **no code changes required**. Just make sure your `.env` values are correct.

---

## 8. Regenerate TypeScript Types (optional)

If you modify the database schema, regenerate types to keep TypeScript in sync:

```bash
supabase gen types typescript --project-id <your-project-ref> > src/integrations/supabase/types.ts
```

---

## 9. Start the Dev Server

```bash
npm run dev
# or
bun dev
```

The app will be available at **http://localhost:8080**.

---

## 10. Create Test Users

1. Open the app and go to `/signup`.
2. Create one account for each role:
   - **Student** (e.g., `student@test.com`)
   - **Mentor** (e.g., `mentor@test.com`)
   - **Admin** (e.g., `admin@test.com`)
3. Each signup automatically provisions the correct profile, role, and domain-specific record via the `handle_new_user` trigger.

---

## Database Schema Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles   │     │  user_roles   │     │   students   │
│──────────────│     │──────────────│     │──────────────│
│ user_id (FK) │     │ user_id (FK) │     │ user_id (FK) │
│ name         │     │ role (enum)  │     │ grade        │
│ role (enum)  │     └──────────────┘     │ subjects[]   │
│ language     │                          │ baseline_level│
└──────────────┘                          │ location     │
                                          └──────┬───────┘
┌──────────────┐                                 │
│   mentors    │     ┌──────────────┐     ┌──────┴───────┐
│──────────────│     │   sessions   │     │   progress   │
│ user_id (FK) │     │──────────────│     │──────────────│
│ expertise[]  │◄────│ mentor_id    │     │ student_id   │
│ availability[]│    │ student_id   │────►│ subject      │
└──────┬───────┘     │ date, topic  │     │ topic, score │
       │             │ notes, status│     │ assessment_  │
       │             └──────────────┘     │   date       │
       │                                  └──────────────┘
       │
┌──────┴───────┐     ┌──────────────┐
│   matches    │     │  resources   │
│──────────────│     │──────────────│
│ student_id   │     │ subject      │
│ mentor_id    │     │ topic        │
│ match_score  │     │ content (JSON│)
│ status       │     │ grade        │
└──────────────┘     └──────────────┘
```

### Key Enum

```sql
app_role: 'student' | 'mentor' | 'admin'
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `has_role(user_id, role)` | Security-definer function used in RLS policies to check user roles |
| `handle_new_user()` | Trigger function that auto-creates `profiles`, `user_roles`, `students`/`mentors` on signup |
| `update_updated_at_column()` | Trigger to auto-update the `updated_at` timestamp on profile edits |

### RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | All authenticated | Own only | Own only | ✗ |
| `students` | All authenticated | Own only | Own only | ✗ |
| `mentors` | All authenticated | Own only | Own only | ✗ |
| `sessions` | All authenticated | Mentors & Admins | Mentors & Admins | ✗ |
| `progress` | All authenticated | Mentors & Admins | ✗ | ✗ |
| `resources` | All authenticated | Admins only | ✗ | ✗ |
| `matches` | All authenticated | Admins only | Admins only | ✗ |
| `user_roles` | Own only | ✗ (trigger only) | ✗ | ✗ |

---

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin-specific dashboard components
│   ├── mentor/         # Mentor-specific dashboard components
│   ├── shared/         # Sidebar, layout, stat cards, protected routes
│   ├── student/        # Student-specific dashboard components
│   └── ui/             # shadcn/ui primitives
├── context/
│   └── AuthContext.tsx  # Global auth state (signup, login, logout, role)
├── hooks/              # Custom React hooks
├── integrations/
│   └── supabase/
│       ├── client.ts   # Auto-configured Supabase client
│       └── types.ts    # Auto-generated TypeScript types
├── lib/
│   ├── i18n.ts         # i18next config (English + Hindi)
│   ├── matcher.ts      # Smart mentor-student matching algorithm
│   ├── resourceMap.ts  # Structured learning resource library
│   └── utils.ts        # Utility functions
├── locales/
│   ├── en.json         # English translations
│   └── hi.json         # Hindi translations
├── pages/              # Route-level page components
└── main.tsx            # App entry point
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| **"Invalid API key"** | Double-check `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` — use the `anon` key, not the `service_role` key |
| **RLS errors / empty data** | Make sure you ran **both** migration files in order |
| **Signup works but no profile created** | Ensure the `on_auth_user_created` trigger exists — re-run migration 1 |
| **"relation does not exist"** | Run `supabase db push` or paste the migration SQL into the SQL Editor |
| **Types out of sync** | Regenerate with `supabase gen types typescript ...` |

---

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Routing:** React Router v6
- **State:** React Query v5 + React Context
- **Charts:** Recharts
- **i18n:** i18next (English + Hindi)
- **Backend:** Supabase (Auth + PostgreSQL + RLS)

---

## License

This project is open for educational and NGO use.
