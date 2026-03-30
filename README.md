# EduMitra (Vidya) - NGO Learning Support Platform

EduMitra is a role-based mentoring platform built for NGOs to run consistent learning programs for underserved students.

It helps organizations:
- deliver structured lesson plans,
- log every session quickly,
- track student progress and learning gaps,
- match mentors to students based on relevant criteria,
- and show measurable impact in one dashboard.

---

## What This Project Includes

- **Role-based workflows**: Student, Mentor, Admin/NGO
- **Structured resources**: subject-wise lesson plans with session-start flow
- **Session logging loop**: one log writes to sessions, progress, and milestones
- **Milestone tracking**: topic-level status and progression
- **Gap alerts**: at-risk and flagged visibility
- **Matching engine**: explainable weighted scoring (not black-box ML)
- **Impact dashboards**: session and progress analytics
- **Bilingual support**: English/Hindi toggle on core UI

---

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- TanStack Query (React Query)
- Tailwind CSS + shadcn/ui
- Recharts
- i18next (English/Hindi)

### Backend
- Supabase Auth
- Supabase Postgres
- SQL migrations + RLS policies

---

## Core Data Loop

The most important loop in EduMitra:

**Mentor logs session -> Progress & milestone update -> Gap status updates -> Dashboard reflects impact**

If this loop runs reliably, all major product goals work in practice.

---

## Project Structure

```text
src/
  components/
    admin/
    mentor/
    student/
    shared/
    ui/
  context/
  integrations/supabase/
  lib/
  locales/
  pages/
supabase/
  migrations/
```

---

## Local Setup

### 1) Install prerequisites
- Node.js 18+
- npm (comes with Node)
- Supabase project (cloud)

### 2) Install dependencies
```bash
npm install
```

### 3) Configure environment
Create `.env` in project root:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
```

### 4) Apply database migrations
You can use Supabase CLI or run SQL manually in Supabase SQL Editor.

Run all files in `supabase/migrations/` in chronological order, including newer feature migrations:

- `20260330091804_...sql`
- `20260330091829_...sql`
- `20260330091850_gap_alerts_and_student_resources.sql`
- `20260330091910_learning_topics_and_milestones.sql`
- `20260330091930_students_policy_for_mentor_admin.sql`
- `20260330091940_delete_policies_students_mentors.sql`
- `20260330091950_gap_alerts_update_policy.sql`
- `20260330091960_mentors_policy_for_admin_update.sql`

### 5) Start development server
```bash
npm run dev
```

App runs at:
- `http://localhost:8080`

---

## Role Workflows

## Student
- Update learning profile (grade, subjects, baseline, location)
- View progress trends and recent sessions
- View mentor match information

## Mentor
- Update mentor profile (expertise, availability)
- Log sessions for single/multiple students
- Subject restriction in log form (only mentor expertise allowed)
- Add/remove students (based on policy and page actions)

## Admin/NGO
- Add/remove mentors
- Add/remove students
- Run and save mentor-student matching
- Track operational metrics and alerts

---

## Matching Algorithm (Current)

Current matching in `src/lib/matcher.ts` is **rule-based weighted scoring**:
- Subject overlap
- Baseline priority
- Availability bonus

This is intentionally explainable and deterministic for NGO operations and demos.

---

## Key Product Pages

- `src/pages/Index.tsx` - Landing + language toggle
- `src/pages/Dashboard.tsx` - Role-specific dashboard entry
- `src/pages/Students.tsx` - Student list, status, add/remove, quick session actions
- `src/pages/Mentors.tsx` - Mentor list, add/remove (admin)
- `src/pages/Sessions.tsx` - Session history + log
- `src/pages/Resources.tsx` - Lesson plans + start session + pin
- `src/pages/Matching.tsx` - Run and persist matches
- `src/pages/Impact.tsx` - NGO impact analytics

---

## Troubleshooting

### Data not showing in students/mentors lists
- Ensure users actually signed up with correct role (`student`, `mentor`, `admin`).
- Ensure migrations were applied in order.

### Remove buttons not working
- Ensure delete-policy migrations are applied:
  - `20260330091940_delete_policies_students_mentors.sql`

### Status updates not persisting
- Ensure gap alert update policy migration is applied:
  - `20260330091950_gap_alerts_update_policy.sql`

### Add Mentor/Add Student failing
- Check RLS migrations for update permissions:
  - `20260330091930_students_policy_for_mentor_admin.sql`
  - `20260330091960_mentors_policy_for_admin_update.sql`

---

## Additional Documentation

- Setup guide: `SETUP_GUIDE.md`
- Feature-to-problem mapping: `FEATURE_ISSUE_MAPPING.md`

## Contributors

- Kuldeep Reddy
- Chellangi Vedish