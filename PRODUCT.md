# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Staff of the Departamento Psicopedagógico at Colegio Lord Byron (byron.edu.pe), all authenticating with an institutional Google account (`@byron.edu.pe`). Four roles, each with a distinct job:

- **Profesor (teacher):** reports incidents about students they observe and passively tracks the ones they reported. No access to clinical notes or student files.
- **Psicólogo (psychologist):** handles cases and incidents assigned to their covered grade(s), manages student files for their grade/level, records parent-meeting minutes with signatures.
- **Jefe de psicólogos (head psychologist):** does everything a psychologist does for their own caseload, plus supervises the whole team, sees every incident/case school-wide, and re-assigns (derives) a case when the assigned psychologist is unavailable.
- **Administrador:** manages users, students, academic structure (years/levels/grades/sections), and system catalogs (incident reasons, priority levels). Operates with elevated (service-role) access not exposed to other roles.

There is currently 1 head psychologist and 4 psychologists, each covering a specific level/grade — but this is a staffing fact, not a hardcoded product limit; the data model supports any number of psychologist↔grade assignments.

## Product Purpose

Centralizes case, incident, and appointment-tracking for the school's psychology department, replacing manual/scattered record-keeping (spreadsheets, paper, disconnected notes). It keeps a full per-student history organized by academic year, and creates an auditable trail of parent meetings, including signatures.

Success means: no incident or case falls through the cracks, every psychologist can instantly see a student's full history regardless of who handled past cases, and parent-meeting agreements are documented and signed rather than left to memory.

## Positioning

Not a general-purpose SIS or ticketing tool retrofitted for schools — it is purpose-built around this department's actual escalation shape: a teacher's incident report can silently become a psychologist's case, a case can be transparently re-routed to a different psychologist when the assigned one is unavailable (with both the original and current psychologist kept on record for accountability), and every case/incident/signed meeting minute rolls up into one continuous student file spanning academic years. A generic tool would lose either the escalation trail or the cross-year continuity.

This is a single-institution internal tool for Colegio Lord Byron, not a product being positioned against other schools' vendors — there is no plan to sell or adapt it for other schools, so decisions may assume this school's structure, roles, and branding as fixed.

## Operating Context

- Appointments with parents are scheduled in **SIANET**, the school's existing academic system — this platform does not schedule meetings, it only records the **minutes/acta** of a meeting that already happened, with signatures captured on-screen (canvas, no digital certificate).
- A student's grade/section is not fixed: each student has a per-academic-year enrollment (`matrícula`), since grade and section can change every year, and a "migración de grado" (grade promotion) operation runs administratively at the start of each new academic year.
- Case origin is one of two paths: (1) a teacher reports an incident, which can later be escalated into a case, or (2) a psychologist opens a case directly with no prior incident. Both are tracked as one continuous case type distinction (`caso_1` vs `caso_2`).
- A submitted incident is immutable to the reporting teacher — it cannot be edited or commented on after submission, until a psychologist opens a case from it (a defined seam where the "record of what was seen" must stay untouched, but where the psychologist may then annotate).
- Cross-role notifications exist for exactly two events today: the teacher is notified when the status of an incident they reported changes; the assigned psychologist is notified when a new incident lands in their grade. Email notifications (via Resend) mirror in-app notifications, capped at 100 sends/day with the rest queued, reflecting the free-tier budget constraint below.

## Capabilities and Constraints

- Very limited budget: every architectural choice favors free-tier services — Vercel hosting, Supabase free tier (Postgres + Auth + Storage), Resend's free email allotment (hence the 100/day send cap with queuing).
- Authorization is enforced with Postgres Row Level Security, not just UI-level checks; the administrator role is the one exception, operating through server-side `service_role` credentials never exposed to the client.
- Single sign-on method: Google OAuth restricted to the `byron.edu.pe` domain. A successful Google login does not grant a role by itself — an administrator must explicitly assign one before the account can do anything past authentication.
- Incident evidence (photos/documents) is stored in Supabase Storage; images are compressed client-side before upload to stay within free-tier storage limits.
- Scope is explicitly exclusive to Colegio Lord Byron (confirmed): no multi-tenant/multi-school ambition, so school-specific assumptions (single set of levels/grades/sections, one set of branding assets) are acceptable and not treated as technical debt.
- No accessibility requirement beyond standard good practice was identified (confirmed): no specific low-vision, low-digital-literacy, or mobile-first usage pattern was flagged for this staff population.

## Brand Commitments

- Institution: Colegio Lord Byron (byron.edu.pe). The product is branded as the school's **Departamento Psicopedagógico**, not as a standalone third-party product name.
- Existing brand assets already in use in the codebase: `logo.png` (login hero) and `insignia.png` (sidebar mark / favicon) — treat these as the real, binding marks rather than placeholders.
- All product copy is in Spanish (Peru/Latin America usage), matching the school's operating language; no bilingual requirement was established.

## Evidence on Hand

- A complete, implemented data model and RLS policy set for the domain (users, students, academic years/levels/grades/sections/enrollments, incidents, evidence, cases, follow-up notes, parent-meeting appointments with signatures, notifications) — see the project's Supabase schema and `CONTEXTO.md` for the authoritative shape.
- No sample real student/case data, testimonials, or usage metrics are available; future work must not fabricate example names, case counts, or outcomes beyond structurally plausible placeholders.

## Product Principles

1. **One continuous student record, not per-incident silos.** Every incident, case, and signed meeting minute must roll up into that student's file, browsable by academic year, regardless of how many different psychologists touched it over time.
2. **Escalation stays traceable, never silent.** When a case moves between psychologists or an incident becomes a case, the system keeps both the origin and the current owner on record — accountability over convenience.
3. **A submitted report is a record, not a draft.** Once a teacher files an incident, it is evidence; editing rights transfer forward (to the psychologist) rather than staying with the reporter indefinitely.
4. **Design for the free tier, always.** Every new capability should be evaluated against Supabase/Vercel/Resend free-tier limits before assuming a paid upgrade path.
5. **Role determines the whole surface, not just permissions.** A teacher, psychologist, head psychologist, and administrator are functionally different products sharing one login screen — each should see only the tools their job needs, not a superset with hidden restrictions.

## Accessibility & Inclusion

No product-specific accessibility requirement was established (confirmed with the team) — apply standard good practice (contrast, readable text sizes, keyboard focus) without a documented additional requirement.
