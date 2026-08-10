# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Staff of Colegio Lord Byron (byron.edu.pe), across four roles, all authenticated via a single Google OAuth flow restricted to the school's email domain:

- **Profesor (teacher)** — reports incidents involving a student and passively tracks the ones they reported. Cannot edit or comment on an incident once submitted; no access to student files or clinical notes.
- **Psicólogo (psychologist)** — attends cases and incidents assigned to their covered grade(s); manages student files for their grade/level; records chronological case notes and signed parent-meeting records. One psychologist covers a specific level/grade (school currently has 4).
- **Jefe de psicólogos (head psychologist)** — does everything a psychologist does (attends their own cases) plus supervises the whole team, sees every incident/case school-wide, and reassigns ("deriva") a case when the assigned psychologist is unavailable. There is 1 head psychologist.
- **Administrador** — manages users, students, academic structure (years, grades, sections), and system catalogs (incident reasons, priority levels). Operates with Supabase `service_role`, server-side only, never exposed to the client.

## Product Purpose

Replaces the school psychology department's manual/scattered case tracking with a single system for managing student incidents, psychological cases, and parent meetings. Centralizes each student's history by academic year and keeps a signed, traceable record of parent meetings. Success means every incident and case is logged, routed to the right psychologist, and retrievable as part of a continuous student history — nothing lost between school years or between people.

## Positioning

Automatic case routing by psychologist-per-grade coverage, plus one auditable student history (incidents, cases, signed parent-meeting records) spanning academic years — replacing the school's manual/scattered psychology tracking.

## Operating Context

- **Case origin**: a case starts either from a teacher-reported incident (`caso_1`) or is opened directly by a psychologist without a prior incident (`caso_2`). Both are logged and linked to the student.
- **Automatic assignment**: the system assigns a case to the psychologist covering the student's grade. If that psychologist is unavailable, the head psychologist reassigns it to another psychologist; both the original and current psychologist are kept on record for traceability.
- **Cross-notifications**: the teacher is notified when the status of an incident they reported changes; the psychologist is notified when a new incident is logged for their coverage.
- **Parent meetings**: the meeting itself is scheduled in SIANET, the school's existing academic system, outside this platform. This platform only records the meeting's minutes/acta — context, psychologist observations, parent observations, agreements/commitments from each side — closed with on-screen signatures (simple canvas trace, name + timestamp, no digital certificate) from both the psychologist and the parent/guardian.
- **Student file**: full history (incidents, cases, signed meeting records) organized by academic year via a year selector, since a student's grade/section can change each year through a grade-migration process. A student's grade is not fixed — it comes from an enrollment ("matrícula") record per academic year.
- **Existing screen inventory** (from the original spec, largely already implemented in `src/app/(app)/`): teacher — incident list, report form, read-only incident detail, notifications; psychologist — dashboard with case counts/status chart, case & incident list, case detail, new follow-up note, open-direct-case form, students-by-grade list, student file, parent-meeting acta form with signature, notifications; head psychologist — adds school-wide dashboard, all incidents/cases, case reassignment, load/stat reports by psychologist/grade/month/priority; administrator — dashboard, user management, student management (manual + bulk Excel/CSV), academic-year management, grade/section management, grade migration, psychologist-per-grade configuration and catalogs.

## Capabilities and Constraints

- **Auth**: Supabase Auth, Google OAuth only, restricted to `@byron.edu.pe`. Role is assigned internally by an administrator, not derived from Google.
- **Authorization**: Postgres Row Level Security per role — teachers see only their own reported incidents; psychologists/head see incidents and cases for students in their covered grade(s) (head sees all); administrator work happens server-side with `service_role`.
- **Storage**: Supabase Storage for incident evidence attachments (photo/document).
- **Notifications**: in-app notification tray (`notificaciones` table) plus email via Resend, capped at 100 sends/day with overflow queued for the next day — both are confirmed, live capabilities.
- **Budget constraint**: very limited budget — the team prioritizes free-tier services throughout (Supabase free tier, Vercel hosting, Resend free tier).
- **Terminology** (Spanish, used throughout the product): incidencia (incident), caso (case, types `caso_1`/`caso_2`), nota de seguimiento (follow-up note), cita/acta de reunión con padres (parent-meeting record), ficha del alumno (student file), año académico (academic year), matrícula (enrollment), migración de grado (grade migration), derivar (reassign a case).
- **Undecided**: no additional constraints beyond the above have been established.

## Brand Commitments

- Product name in user-facing email: "Psicología Lord Byron". Institution: Colegio Lord Byron (byron.edu.pe).
- Existing brand assets in the repo: `logo.png`, `logo-verde.png` (green variant), `insignia.png`, `LordByronSchool_logo_2020_fondo_verde.png` — treat these as the institution's real marks, not placeholders.
- No other voice/personality commitments have been made explicit.

## Evidence on Hand

- The original product spec (`CONTEXTO.md`) documents the full data model, RLS policies, role rules, and per-role screen inventory — treat it as historical design rationale; this file is the current source of truth going forward, and supersedes it where they differ (e.g. email notifications, confirmed above).
- School logo/insignia image assets exist in the repo root and `public/` (see Brand Commitments).
- No fabricated testimonials, pricing, or customer data exist or should be introduced — this is an internal school tool, not a marketed product.

## Product Principles

1. **Nothing falls through the cracks.** Every incident and case must route to the right psychologist automatically, and stay traceable (original vs. current psychologist) when reassigned.
2. **One continuous record per student.** History persists and stays organized across academic years, even as grade/section changes.
3. **Role boundaries are load-bearing, not cosmetic.** A teacher's incident is fixed the moment it's submitted; clinical notes and student files are never exposed outside psychology staff. Design and copy should reinforce these boundaries, not obscure them.
4. **Free-tier-first.** Any new capability should default to the free tier of its service before assuming budget for a paid one.
