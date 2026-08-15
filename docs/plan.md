# CIRCLE — MVP Development Plan

## Context

CIRCLE is a "Human Support Infrastructure" MVP: a platform that connects **Members** (people going through rehabilitation, life transitions, or ongoing care pathways) with consistent, familiar human **Support Partners**, under the oversight of **Professional Leads** and a client **Org Admin**. The core idea is **human continuity** — the same familiar people over time — combined with an AI layer whose role is strictly limited to summarizing, surfacing signals, and preparing context ahead of an interaction. The AI **never** makes an autonomous decision. Every consequential action (approving a summary, closing a flagged review item) requires an explicit human click.

This is a professional, fast-moving MVP build — not a teaching exercise. Code should be clean and production-quality from the start, without step-by-step justification baked into every commit.

**Decisions already made and not open for renegotiation:**

- Single website (Next.js, App Router) — no mobile app, no separate microservices at this stage.
- Self-hosted PostgreSQL via Docker Compose (not a managed BaaS like Supabase) — full control over the database.
- Anthropic Claude API as the LLM provider.
- npm as the package manager.

## Tech Stack

- **Next.js 15 (App Router)** + TypeScript — Server Actions map directly onto the Capture→Approve and Decide→Resolve flows.
- **Prisma** against PostgreSQL — UUID primary keys, snake_case column mapping, explicit reviewable migrations.
- **Tailwind + shadcn/ui** for UI primitives (forms, tables, dialogs) — avoids hand-building four different role-based dashboards from scratch.
- **Auth.js (NextAuth v5)**, Credentials provider, bcrypt password hashing, JWT session carrying `{ userId, role, orgId }`.
- **Anthropic SDK** (`@anthropic-ai/sdk`) for LLM calls in the Continuity Engine (text summarization/analysis only).
- **Local Whisper** (`faster-whisper`, its own Docker container) — speech-to-text for uploaded recordings. Audio is **never** sent to Anthropic; only the resulting transcript continues on to Claude. See "Audio Upload & Transcription" below.
- **Docker Compose** — Postgres + local Whisper service. No queue/Redis needed: the Surface step runs synchronously right after Capture is approved.

## Design Direction & Feature Research

Feature and structural inspiration were drawn from an established telehealth platform (dashboards, cards, panels, top bar) — CIRCLE's overall layout follows a similar structure. What differs is the **visual polish** of those same components: more modern buttons, banners, cards, and icons (rounded corners, subtle micro-animations, soft shadows) rather than a dated corporate look.

**Color palette**: warm off-white, dominated by **blue** — conveying care, trust, and professionalism, consistent with the healthcare/care space generally (not a stark-white or dark/minimalist palette). Primary blue for CTAs/highlights, warm off-white/near-white backgrounds for content areas, a 4-color accent set (green for success/APPROVED, orange and purple for secondary highlights, red for flags and the "Get help now" banner). Implemented via Tailwind + shadcn/ui with a custom theme built for this palette, not the generic defaults.

**Typography**: **Newsreader** (serif) for headings/display text, **Inter** for body copy and UI — a deliberate pairing to read as considered/human rather than generic SaaS sans-everywhere.

**Second design pass**: a follow-up visual reference (built by a separate design agent, structurally similar to the telehealth platform above — sticky announcement bar, logo+nav grouped left, pill-shaped auth buttons, an eyebrow-label hero with a diagonal image band + testimonial overlay, a 4-card value grid, a floating persistent contact link) was adopted **for its visual system and layout only**. Its copy positioned CIRCLE around licensed clinical professionals (psychologists/social workers) and a veterans-first launch population — that positioning was **explicitly rejected**; all copy stays non-clinical and general-population, per the original plan.

**Adopted feature — Crisis / Emergency quick-access banner**: a permanent, always-visible button in the Member shell ("Get help now") linking to an organization-configured emergency resources page (hotlines, crisis lines). This is **not** an AI capability and does **not** route through the Review Queue — it is static and always available, independent of the internal flagging pipeline, because a real emergency must never depend on an internal review process. This follows the platform's config-driven principle: crisis resources are configured per organization (a JSON field), never hardcoded.

- **Schema**: add a `crisisResources Json?` field to `Organization` (a list of `{label, phone, url}`).
- **UI**: a persistent, prominent red button in the Member top bar (see `/member/dashboard` mockup below), leading to a dedicated resource page. Managed via `/admin/settings` alongside Safety Keywords.

Other researched features (clinical outcome tracking, peer community, post-interaction satisfaction surveys, a self-care content library) were evaluated and **excluded from the MVP** — candidates for a later fast-follow if needed.

## Code & Documentation Conventions

- **All code documentation is in English** (docstrings, comments, README, commit messages) — regardless of what language planning conversations happen in.
- **A short 2–3 line doc block at the top of every meaningful code file** (every non-trivial `.ts`/`.tsx` file — not trivial index files) explaining the file's **purpose** and what it does, before the imports. Example:
  ```ts
  /**
   * Server actions for the Care Circle routing model — assigning and
   * reassigning Primary/Secondary Support Partners to a Member's circle.
   * Every mutation here enforces the "exactly one active PRIMARY" invariant.
   */
  ```
- **Readable, explicit variable/function/class names** — no cryptic abbreviations (`ctx` is fine only as an established convention like React context; not `usr`/`itm`). Names should express intent, not just type (`pendingActionItems`, not `items2`).
- **Casing convention**: `PascalCase` for components/types/Prisma models, `camelCase` for functions/variables, `SCREAMING_SNAKE_CASE` for true constants (not enum values, which Prisma already renders as `SCREAMING_SNAKE`). One file = one clear primary export — don't mix several unrelated server actions in a single file.
- The folder structure (below) is already organized so each directory has one clear area of responsibility — preserve that as new files are added.

## UI Language & Hebrew Readiness

**Actual UI content (what end users see — not code/docs) starts English-only**, but is built from Sprint 0 so that adding Hebrew later is an addition, not a rewrite:

- Every user-facing string (headings, buttons, messages) is written through **translation keys** (`next-intl`, single `en` locale for now) — never hardcoded strings inside JSX. Adding Hebrew later means adding a `he.json` translation file, not a find-and-replace across every component.
- Styling uses Tailwind **logical properties** by default (`ps-4`/`pe-4` instead of `pl-4`/`pr-4`, etc.), so a future RTL direction doesn't break layouts.
- No need to implement actual RTL support now — just avoid hard-locking the code to LTR.

## Tooling & Code Quality (set up in Sprint 0, not bolted on at the end)

So style/type/regression issues get caught from day one instead of accumulating for a retroactive cleanup:

- **ESLint** (with `eslint-config-next`) — catches common style issues and bugs while writing code.
- **Prettier** — automatic, consistent code formatting across the whole project.
- **TypeScript `strict: true`** in `tsconfig.json` from project setup — not enabled after the fact.
- **Vitest** — unit testing framework, wired to `npm run test` starting in Sprint 0 (even before there's much to test), so every feature from Sprint 1 onward ships with a companion test, rather than tests only appearing in the final hardening sprint.

## Screen-by-Screen UI Mockup

Before writing code, this is how each role is meant to experience the system: textual wireframes plus the function list for every core screen. All screens share a common shell: a top bar with organization name, user name, role badge, and logout, plus a role-specific sidebar.

### Core Principle: One Site, Not Several Systems

**CIRCLE is a single, unified Next.js application.** There is no separate Member app vs. Partner app, etc. — everyone signs in on the same domain, through the same `/login` screen. **Internal routing** (the real `member`/`partner`/`lead`/`admin` path segments defined in the folder structure below — plain folders, not route groups: App Router route groups like `(auth)` deliberately don't add a path segment, and using `(member)`/`(partner)`/`(lead)`/`(admin)` for this actually collided, since `(member)/dashboard` and `(partner)/dashboard` both resolve to `/dashboard` — fixed during Sprint 1) is what determines which dashboard a user sees, based solely on the `User.role` stored in their session — not a separate address or domain. `proxy.ts` (Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`, exporting a `proxy` function instead of `middleware`) is the gate: after login it reads the role from the JWT session and redirects to the correct root path; if a MEMBER user manually types a URL like `/admin/...`, the proxy blocks it and sends them back to their own area. So even though it's "one site," there's no access leakage between roles.

Post-login, the Credentials Server Action redirects to `/post-login` rather than straight to `/` — the login screen's "back to home" link gets prefetched by Next.js, which can cache an unauthenticated RSC payload for `/`; landing there right after sign-in could silently reuse that stale cache instead of re-rendering as the signed-in user. `/post-login` is never linked or prefetched anywhere, so it always renders fresh, reads the session, and forwards to the real role home.

### Public Screen: Landing Page (`/`) — No Login Required

```
┌─ Top bar: CIRCLE                              [ Sign in ] ┐
├─────────────────────────────────────────────────────────┤
│              Hero: headline + subtext                      │
│              [ hero image / illustration placeholder ]      │
│                      [ Get started → /login ]                │
├─────────────────────────────────────────────────────────┤
│   About CIRCLE — a short explainer                          │
│   [ 3 feature cards: Human continuity | Non-clinical support │
│                       | Governed by professionals ]          │
├─────────────────────────────────────────────────────────┤
│   Footer: © CIRCLE                                           │
└─────────────────────────────────────────────────────────┘
```

Function: a **static page only** in Sprint 0 — no DB, no auth, no server actions. Its purpose is purely to confirm the scaffolding (Next.js + Tailwind + shadcn/ui + the white/blue theme) works end-to-end and produces a visible result quickly. The "Sign in"/"Get started" button leads to `/login` (which, at this stage, may still be non-functional — see the sprint plan).

### Shared Screen: Login (`/login`)

```
┌──────────────────────────────┐
│           CIRCLE              │
│   ┌────────────────────────┐  │
│   │ Email                  │  │
│   └────────────────────────┘  │
│   ┌────────────────────────┐  │
│   │ Password                │  │
│   └────────────────────────┘  │
│         [ Sign in ]           │
└──────────────────────────────┘
```

Function: validates credentials against `User.passwordHash`, creates a JWT session, and redirects automatically based on `role` (`/member`, `/partner`, `/lead`, `/admin`) — all within the same single application, per "Core Principle" above.

---

### Member — `/member/dashboard`

```
┌─ Sidebar ──┐┌─ Main ─────────────────────────────────────┐
│ Dashboard  ││  Welcome back, {name}          [ Get help now]│ ← red, always visible
│ My Circle  ││                                              │
│ My Context ││  ┌─ Your Circle ──────┐ ┌─ Open ────┐        │
│            ││  │ Primary: Dana P.   │ │ Commitments│        │
│            ││  │ Secondary: Tom, Lee│ │ - Call PT   │        │
│            ││  └────────────────────┘ │   by Fri   │        │
│            ││                          └────────────┘        │
│            ││  Recent context updates (read-only feed)      │
└────────────┘└──────────────────────────────────────────────┘
```

Function: shows the Member's own Circle (who is Primary/Secondary), a list of open Action Items owned by them, and a read-only feed of recent context updates (`ContextLedgerEntry` rows filtered to the visibility they're allowed to see). **"Get help now"** — a persistent top-bar button (not just on the dashboard — on every Member screen) leading to `/member/help` with org-configured crisis resources (`Organization.crisisResources`); static, no AI, no dependency on the Review Queue.

### Member — `/member/circle`

Displays the Member's own Circle members as cards (photo/name/role-in-circle/general availability) — deliberately **without** raw contact details, to avoid off-platform leakage.

### Member — `/member/context`

```
┌─ My Context Ledger ──────────────────────────────────┐
│ Filter: [All ▾]                                       │
│ ┌───────────────────────────────────────────────────┐│
│ │ GOAL     "Build daily walking routine"    [Edit]   ││
│ │ added by Dana P. · Aug 3                           ││
│ ├───────────────────────────────────────────────────┤│
│ │ PREFERENCE "Prefers morning calls"        [Edit]   ││
│ └───────────────────────────────────────────────────┘│
│ [+ Add entry]                    Sharing prefs: [⚙]   │
└────────────────────────────────────────────────────────┘
```

Function: full view of the Member's own `ContextLedgerEntry` history (including the version chain — supersedes), edits that create a new version rather than overwriting, and management of `sharingPrefs` (which categories are visible to which role).

---

### Support Partner — `/partner/dashboard`

```
┌─ Sidebar ──┐┌─ Main ────────────────────────────────────┐
│ Dashboard  ││  My caseload (4 / 15)                       │
│            ││  ┌──────────────┬───────────┬─────────────┐│
│            ││  │ Member       │ Role      │ Next action ││
│            ││  ├──────────────┼───────────┼─────────────┤│
│            ││  │ Alex R.      │ PRIMARY   │ [Prep call] ││
│            ││  │ Jordan K.    │ SECONDARY │ [Prep call] ││
│            ││  └──────────────┴───────────┴─────────────┘│
└────────────┘└─────────────────────────────────────────────┘
```

Function: lists the Members assigned to this Partner (across all their circles), caseload vs. `caseloadCap`, and a quick-access button per Member that opens their Prep Card.

### Support Partner — `/partner/prep/[memberId]` (Prepare)

```
┌─ Prep Card: Alex R. ────────────────────────────────┐
│ AI Digest (auto-generated, read-only)                │
│  "Alex mentioned anxiety about the upcoming PT        │
│   appointment. Goal: daily walking routine, on track."│
│                                                        │
│ Active goals: Build walking routine                   │
│ Open commitments:  [ ] Call PT clinic — due Fri (Alex) │
│ Recent context: (last 5 ledger entries)                │
│                                                        │
│                         [ Start Capture → ]           │
└────────────────────────────────────────────────────────┘
```

Function: an AI digest (read-only, not editable, generated by `getPrepDigest()` which aggregates context + open commitments — **never persisted as a `ContextLedgerEntry`**; it's a transient summary for display only). A button opens a new Capture screen for the upcoming interaction.

### Support Partner — `/partner/capture/[interactionId]` (Capture)

```
┌─ Capture: Alex R. — Aug 11, Call ──────────────────────┐
│ How was this interaction recorded?                       │
│   ( ) Type notes manually     (•) Upload audio recording  │
│ ┌───────────────────────────────────────────────────┐  │
│ │ (free text area) — OR —  [ 📎 Upload audio file ]   │  │
│ │ ☑ I have appropriate consent to record & upload this │  │
│ └───────────────────────────────────────────────────┘  │
│              [ Transcribe locally → generates raw notes]│
│                    [ Generate draft with AI ]            │
│ ─────────────────────────────────────────────────────── │
│ AI Draft Summary (editable)          Status: PENDING     │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Alex reported feeling positive about routine...     │  │
│ └───────────────────────────────────────────────────┘  │
│ Suggested action items:                                  │
│  [x] Call PT clinic  — owner: Alex — due: Fri  [remove]  │
│  [+ Add manually]                                         │
│                                                            │
│              [ Save draft ]     [ ✓ Approve & finalize ] │
└────────────────────────────────────────────────────────────┘
```

Function: two ways to provide raw notes — (1) manual typing, or (2) **uploading a generic audio file** (mp3/m4a/wav — from a Zoom cloud recording, a call-recording app, or a physical recorder), gated by a **required consent checkbox** before upload. Uploaded audio is transcribed **locally** via the Whisper service (`faster-whisper`, its own container) — the raw binary and its content are **never sent to Anthropic**; only the resulting transcript becomes the raw notes and continues into the same flow as manual typing. From there: `submitCapture` → a Claude call (tool-use, structured output) generates an `InteractionSummary` draft plus suggested `ActionItem[]`. The Partner edits freely, can add/remove items manually. **"Approve & finalize"** is the only button that moves status to `APPROVED`, writes a `ContextLedgerEntry`, and triggers the Surface step in the background. Until that click, nothing is final, and the screen prominently displays `Status: PENDING`.

Automatic Zoom integration (pulling a recording/transcript directly via the Zoom API/webhook, without a manual upload) stays **out of the MVP** — it requires an approved Zoom OAuth app and webhook infrastructure; flagged as a fast-follow.

---

### Professional Lead — `/lead/review-queue`

```
┌─ Sidebar ──────┐┌─ Review Queue (Open: 3) ────────────────────┐
│ Review Queue   ││ Filter: [All severities ▾]  Sort: [Newest ▾] │
│ Coaching       ││ ┌────────────────────────────────────────┐  │
│                ││ │ 🔴 CRITICAL  SAFETY_KEYWORD             │  │
│                ││ │    Member: Alex R. · via RULE_ENGINE     │  │
│                ││ │    2 hours ago              [ Open → ]  │  │
│                ││ ├────────────────────────────────────────┤  │
│                ││ │ 🟡 MEDIUM  MISSED_FOLLOW_UP              │  │
│                ││ │    Member: Jordan K. · via RULE_ENGINE   │  │
│                ││ │    1 day ago                 [ Open → ] │  │
│                ││ └────────────────────────────────────────┘  │
└────────────────┘└───────────────────────────────────────────────┘
```

Function: a queue filtered to this Lead's own cohort only (`assignedLeadId`/cohort scope), sortable by severity/time, with a colored badge per `severity`.

### Professional Lead — `/lead/review-queue/[id]`

```
┌─ Review Item: SAFETY_KEYWORD (CRITICAL) ─────────────────┐
│ Member: Alex R.   Interaction: Aug 11, Call (Support: Dana)│
│                                                              │
│ Approved summary:  "...mentioned feeling really down..."   │
│ Raw notes (full):  [ expand ▾ ]                             │
│ AI rationale (from AIInvocationLog): "keyword match: ..."   │
│                                                              │
│ Resolution note (required):                                │
│ ┌──────────────────────────────────────────────────────┐  │
│ │                                                        │  │
│ └──────────────────────────────────────────────────────┘  │
│      [ Resolve ]      [ Escalate ]      [ Override flag ]  │
└──────────────────────────────────────────────────────────────┘
```

Function: access to the full raw content, the approved summary, and the rationale that produced the flag. Three actions (`resolveReviewItem`/`escalateReviewItem`/`overrideReviewItem`) — all require a resolution note before submission is allowed, and all write an `AuditLogEntry`.

### Professional Lead — `/lead/coaching`

```
┌─ My Pod ───────────────────────────────────────────────┐
│ Partner      Caseload   Open flags   Avg resolve time    │
│ Dana P.      6/15       1            4h                  │
│ Tom S.       9/15       0            —                   │
│ Lee W.       3/15       2            1d                  │
└─────────────────────────────────────────────────────────┘
```

Function: a snapshot of the Partners in this Lead's cohort — caseload, open flags, average resolution time — for coaching purposes (read-only in the MVP, no CRUD).

---

### Org Admin — `/admin/cohorts`

```
┌─ Cohorts ────────────────────────────────────────────┐
│ [+ New cohort]                                         │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Cohort        Lead        Members   Partners      │  │
│ │ Rehab-North   Sam K.      12        4              │  │
│ │ Transitions   Noa B.      8         3              │  │
│ └──────────────────────────────────────────────────┘  │
│ [ Manage members/partners → ]   [ Invite user + ]      │
└──────────────────────────────────────────────────────────┘
```

Function: CRUD on `Cohort`, assigning a Lead to a cohort, and an invite flow for creating a new `User` with a given role.

### Org Admin — `/admin/analytics`

```
┌─ Analytics ─────────────────────────────────────────────┐
│ Cohort capacity      ▓▓▓▓▓▓▓░░░  70%                     │
│ Open review items     3 (avg age: 6h)                    │
│ SLA adherence (24h resolve target)   92%                 │
│ AI invocations (30d)   ▓▓▓▓▓▓▓▓▓▓▓▓ 1,204                 │
└──────────────────────────────────────────────────────────┘
```

Function: read-only aggregates over `Cohort`/`ReviewQueueItem`/`AIInvocationLog` — capacity vs. `caseloadCap`, queue load, SLA.

### Org Admin — `/admin/settings`

```
┌─ Safety Keywords (config-driven, per org) ───────────────┐
│ [+ Add keyword]                                            │
│  "hopeless"        severity: HIGH       [remove]           │
│  "can't go on"      severity: CRITICAL   [remove]           │
└──────────────────────────────────────────────────────────────┘
```

Function: managing `OrgSafetyKeyword` through the UI — without this, keywords would be hardcoded in the codebase; this is the config-driven principle applied concretely.

**Note**: the Admin side deliberately stays at this high-level scope for now. It will be deepened only after the client-facing flows (Member/Partner/Lead) are built and running, once it's clear which management tools and reports are actually needed in practice — not decided upfront.

## Folder Structure

```
circle/
  docker-compose.yml
  .env.example
  package.json
  tsconfig.json
  next.config.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    proxy.ts
    lib/{db.ts, env.ts}
    app/
      page.tsx                        # Public landing page — / (Sprint 0)
      layout.tsx                       # Root layout: fonts, theme, providers
      post-login/page.tsx              # Resolves role -> redirect; see Sprint 1 note below
      (auth)/login/page.tsx
      member/{dashboard,circle,context}/page.tsx
      partner/{dashboard, prep/[memberId], capture/[interactionId]}/page.tsx
      lead/{review-queue, review-queue/[id], coaching}/page.tsx
      admin/{cohorts, analytics, settings}/page.tsx
      api/auth/[...nextauth]/route.ts
      api/audio/[interactionId]/route.ts   # permission-gated audio serving, not static
    server/
      auth/{auth.config.ts, rbac.ts}
      storage/audioStorage.ts   # abstraction: local FS now, R2 in the cloud (Sprint 9)
      data/{scope.ts, users.ts, careCircles.ts, contextEntries.ts, interactions.ts, actionItems.ts, reviewQueue.ts, auditLog.ts}
      actions/{care-circle.ts, context-ledger.ts, interactions.ts, review-queue.ts, admin.ts}
      continuity-engine/
        capture.ts        # CAPTURE step
        surface.ts         # SURFACE step
        transcription/{client.ts}   # calls the local Whisper service, speech→text
        rules/{safetyKeywords.ts, missedFollowThrough.ts, boundaryBreach.ts}
        llm/{client.ts, prompts/{summarize.ts, surfaceAnalysis.ts}}
      audit/log.ts          # append-only, create() only
    components/{shared, member, partner, lead, admin}
```

## Database Schema (Prisma) — Key Principles

- **`CareCircle` is 1:1 with a Member**, and `CareCircleMembership` is the routing join table (`PRIMARY`/`SECONDARY`, `ACTIVE`/`INACTIVE`) connecting Members to Support Partners. "Exactly one active PRIMARY per circle" is enforced both at the application level and via a partial unique index (raw SQL in a migration, since Prisma's schema DSL doesn't support `WHERE` clauses on indexes).
- **Append-only is structural, not a convention**: editing a `ContextLedgerEntry` creates a new row (`supersedesId`/`isCurrent`) instead of overwriting; `AuditLogEntry` and `AIInvocationLog` are `create()`-only in the data layer, and in Sprint 8 `UPDATE`/`DELETE` privileges on those two tables are revoked at the database role level.
- **The "AI never finalizes anything" boundary lives in the enums**: `InteractionSummary.status` and `ActionItem.status` start as `PENDING_APPROVAL` and move to `APPROVED` only through a human-triggered Server Action. `ReviewQueueItem.status` starts `OPEN` and only a Lead's action moves it to `RESOLVED`/`ESCALATED`.

Core models: `Organization` (including `crisisResources Json?`), `User` (role: `MEMBER`/`SUPPORT_PARTNER`/`PROFESSIONAL_LEAD`/`ORG_ADMIN`), `MemberProfile`, `SupportPartnerProfile`, `ProfessionalLeadProfile`, `Cohort`, `CareCircle`, `CareCircleMembership`, `ContextLedgerEntry`, `Interaction`, `InteractionSummary`, `ActionItem`, `ReviewQueueItem`, `AIInvocationLog`, `AuditLogEntry`, `OrgSafetyKeyword` (config-driven, never hardcoded).

`Interaction` carries additional fields to support recording uploads: `captureMethod` (enum `TYPED`/`AUDIO_UPLOAD`), `recordingConsentConfirmed Boolean @default(false)` (must be `true` for an audio upload to be accepted), `audioFilePath String?` (a relative path to the permanently stored file — see "Audio File Storage" below; not the transcript itself, which already lives inside `rawNotes` after transcription).

### Audio File Storage (Decision: retained permanently)

Rather than the "cleaner" default (deleting the file immediately after transcription), **the original audio files are retained** so a Lead or Partner can go back and listen if there's ever doubt about a capture. The technical implications:

- **Location**: Next.js (running locally, not inside Docker) writes the file to a dedicated directory outside of git (`storage/audio/` + `.gitignore`), using a UUID-based filename — never the user's name or a raw timestamp, so the filename itself doesn't leak metadata.
- **Storage abstraction (cloud-ready from day one)**: all reads/writes of audio files go through a single module — `src/server/storage/audioStorage.ts` — exposing two functions (`saveAudioFile`, `getAudioFile`); no other code touches disk or S3 directly. The current implementation is local filesystem; when moving to the cloud (see "Cloud Deployment" below), only this file's internals are swapped for a Cloudflare R2 implementation (S3-compatible), chosen over AWS S3 because R2 has no egress fees — more cost-effective given Leads may repeatedly re-listen to recordings. Controlled by a single environment variable (`STORAGE_DRIVER=local|r2`), consistent with the platform's config-driven principle.
- **Actual flow**: the browser uploads the file to Next.js → Next.js writes it to `storage/audio/` **and** separately sends it (as bytes in an HTTP request body) to the Whisper container for transcription — the disk write and the transcription happen independently, neither blocking the other.
- **Protected access**: the file is **never served as a public static asset**. A dedicated route (`src/app/api/audio/[interactionId]/route.ts`) goes through the same `SessionScope`/`requireRole()` layer as every other piece of data — so only someone authorized to view that specific Interaction (the assigned Partner, the cohort's Lead) can listen to it, exactly as if it were a regular database field.
- **Limits**: a maximum file size (proposed 50MB — roughly an hour of standard-bitrate mp3), and allowed formats only (`mp3`/`m4a`/`wav`).
- **Privacy note**: since this is currently the single most sensitive artifact retained by the system (voice = identity), it may be worth adding at-rest encryption specifically for this directory once in real production (not the local MVP) — flagged as a note for Sprint 8/Hardening, not required for the MVP.

The full schema (with all fields, relations, and mappings) has been worked out and is ready to be copied directly into `prisma/schema.prisma` during implementation.

## Continuity Engine — Capture → Surface → Decide

- **CAPTURE**: a Partner provides raw notes in one of two ways — manual typing, or uploading an audio file (with a required consent checkbox) that is transcribed **locally** via the Whisper service (`continuity-engine/transcription/`) before continuing. From there: `submitCapture` creates an `Interaction` → a Claude call (tool-use, structured output) generates a draft summary plus Action Items (`PENDING_APPROVAL`, `AI_SUGGESTED`) + an `AIInvocationLog` entry + an `AuditLogEntry` (`actorType=AI`). The Partner edits and clicks **Approve** — only then is a final `ContextLedgerEntry` written.
- **Structural boundary**: code inside `continuity-engine/*` may only import `create*Draft` functions, never `approve*`/`resolve*` — those exist only in `server/actions/*`, behind `requireRole()`. This makes it structurally impossible for the AI to "accidentally" finalize anything.
- **SURFACE**: runs synchronously right after a Capture is approved. Deterministic rules run first (safety keywords from `OrgSafetyKeyword`, expired commitments, out-of-scope request detection), followed by an additional LLM pass for nuance. Any hit creates a `ReviewQueueItem`.
- **DECIDE**: Leads see a queue filtered to their own cohort, with the raw notes, the approved summary, and the AI's rationale. The `resolveReviewItem`/`escalateReviewItem`/`overrideReviewItem` actions all require a note and are all logged to `AuditLogEntry`.

## Data Privacy & AI Handling

CIRCLE stays with the **Anthropic Claude API** (not a self-hosted model), with appropriate safeguards, because signal-detection quality in the SURFACE step (safety keywords, boundary breaches) is critical and difficult to match with a small open-source model running on infrastructure without dedicated GPU capacity. The "local/private" consideration is addressed through usage policy and safeguards rather than by self-hosting the model:

- **Data minimization**: every API call sends only the content relevant to that specific task (interaction notes for summarization, approved content for Surface analysis) — never a blanket dump of a Member's entire history.
- **Audio never leaves local infrastructure**: recording files (the most sensitive artifact — voice equals identity) are transcribed via the local Whisper service (see "Tech Stack"); only the resulting transcript, from which the draft is generated, continues on to Claude. The raw audio file itself is never sent to any external API.
- **No training retention**: the Anthropic API (unlike the consumer Claude.ai product) does not use API call content to train models by default — this is precisely why the API tier was chosen over a consumer-facing service.
- **Application/DB-level security**: `ANTHROPIC_API_KEY` lives only in `.env` (never committed to git); every call goes over TLS. In a real production environment (beyond the local MVP), at-rest encryption for Postgres and a signed DPA/BAA with Anthropic should be considered if real organizations with patient data come on board — this is explicitly **out of scope for the current MVP**, which runs locally with seed data.
- **Full auditability is already built into the schema**: every prompt/response is stored in `AIInvocationLog` (append-only), so it's always possible to verify exactly what was sent and what came back from the API — full transparency as the substitute for "everything runs locally."
- **Built for future replacement**: starting with the Claude API to build quickly and validate quality; `continuity-engine/llm/client.ts` is the **single integration point** with the LLM (no other code calls the Anthropic SDK directly) — so if a self-hosted model (Ollama, etc.) becomes necessary later for regulatory/privacy reasons, it's an isolated change to this one file plus environment variables, not a project-wide refactor. Consistent with the config-driven principle.

## RBAC / Permissions

Auth.js handles identity only; **actual enforcement** happens at the application level — every module in `server/data/*.ts` receives a `SessionScope` and applies the appropriate `where` clause (Member → only their own data, Partner → only the circles they belong to, Lead → only their cohort). Server Actions always go through `requireRole()` and then exclusively through this data layer — never a raw `prisma.*` call directly from route/action code. This was chosen over Postgres Row-Level Security because Prisma doesn't cleanly support per-request `SET LOCAL` session variables without wrapping every query in a transaction, and this is a single application with no client ever talking to the database directly — so application-level enforcement is equally secure and considerably easier to test and maintain for an MVP.

## Detailed Sprint Plan

Intentional ordering: first, **get something real and visible working fast** (a static landing page, no DB/auth at all), then layer downward — infrastructure → real auth → the core model (Circle) → content (Context) → the most complex feature (Capture/AI) → governance (Surface/Review) → Admin last (per the decision to deepen it only once it's clear what's actually needed).

### Sprint 0 — Landing Page (visual MVP, no backend)

Goal: confirm the scaffolding works end-to-end and something real is visible in the browser quickly, before touching the database or auth at all.

1. `npx create-next-app` — Next.js 15, App Router, TypeScript, Tailwind, `src/` directory.
2. Install shadcn/ui + configure theme tokens for the white/blue palette per the agreed design direction.
3. `src/app/layout.tsx` — root layout, fonts, basic metadata.
4. `src/app/page.tsx` — the static Landing page (hero, "About CIRCLE," 3 feature cards, footer) per the mockup above. Placeholder content (temporary text/images) — not final copy.
5. `src/app/(auth)/login/page.tsx` — **form only**, not yet wired to real auth/DB (submit does nothing yet, or shows "coming soon").
   **Test**: `npm run dev`, see the full landing page in the browser, the "Sign in" button leads to `/login`, both pages are responsive and match the color palette.

**Scope note (added after initial build)**: one small piece of backend logic landed in Sprint 0 ahead of schedule — a public FAQ chat widget (`src/app/api/chat/route.ts`, `src/components/shared/chat-widget.tsx`) answering general product questions via Claude Haiku 4.5, grounded by a system prompt (`src/server/chat/system-prompt.ts`) restricted to facts about CIRCLE. Chosen deliberately over the more expensive/slower default model since this is a cheap, public, unauthenticated endpoint. Clearly labeled as AI ("Ask AI about CIRCLE" / "CIRCLE AI Assistant") with an in-panel disclaimer — it must never read as a human Support Partner, and it refuses to give personal/clinical/crisis advice, redirecting instead to Sign up/Contact. Requires `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`); without a key it degrades gracefully to a static "not connected yet" reply rather than erroring. This is a separate, narrowly-scoped concern from the real Continuity Engine (Sprint 4) — it does not touch the DB and does not imply the product's Support Partners are AI.

### Sprint 1 — Infrastructure: Real DB + Auth

Goal: turn the login screen into something that actually identifies a user and redirects by role.

1. `docker-compose.yml` + `.env.example` (Postgres only at this stage).
2. `prisma/schema.prisma` — just `Organization` + `User` (role, passwordHash) for now.
3. `prisma/seed.ts` — creates one organization + one user per role (admin, lead, partner, member) for testing.
4. `src/lib/db.ts` — Prisma client singleton. `src/lib/env.ts` — env validation with zod.
5. `src/server/auth/auth.config.ts` + `src/app/api/auth/[...nextauth]/route.ts` — Auth.js, Credentials provider, bcrypt.
6. `src/proxy.ts` — redirects unauthenticated users to `/login`; after login, redirects by role to their root path.
7. Four **empty** dashboards (`member/dashboard`, `partner/dashboard`, `lead/review-queue`, `admin/cohorts`) — just a heading + "Welcome back, {name}," so there's a redirect target.
   **Test**: `docker compose up -d`, `npx prisma migrate dev`, `npm run db:seed`, log in as each of the four seeded users and confirm the correct redirect; a MEMBER user manually navigating to `/admin/cohorts` is blocked.

**Scope notes (added after initial build)**: two real bugs surfaced during end-to-end verification, both fixed and re-verified with an automated Playwright suite covering all 4 roles (login → correct home, cross-role blocking, `/` redirect, sign-out, post-sign-out access block):
- **Route collision**: the dashboards were first built under route groups `(member)/dashboard`, `(partner)/dashboard`, etc. Route groups don't add a path segment, so all four resolved to the same `/dashboard` URL and Next.js refused to build. Fixed by using real folders (`member/`, `partner/`, `lead/`, `admin/`) instead — see the "Core Principle" section above.
- **Wrong-password error not shown**: `loginAction` was re-throwing Auth.js's `AuthError` instead of redirecting back to `/login?error=CredentialsSignin`, causing an unhandled 500 instead of the intended error message.
- **Stale post-login redirect**: signing in redirected to `/`, but the login screen's own "back to home" link gets prefetched, so the browser could reuse a cached, unauthenticated payload for `/` instead of re-rendering as the signed-in user. Fixed by redirecting to a dedicated, never-cached `/post-login` resolver page instead — see the "Core Principle" section above.

### Sprint 2 — Care Circle Model

Goal: the model everything else derives from — who is connected to whom.

1. Extend `schema.prisma`: `Cohort`, `MemberProfile`, `SupportPartnerProfile`, `ProfessionalLeadProfile`, `CareCircle`, `CareCircleMembership` + a migration including the partial unique index (raw SQL).
2. `src/server/data/careCircles.ts` — the first data-layer module (establishes the `SessionScope` pattern used everywhere else).
3. `src/server/actions/care-circle.ts` — assign/reassign a partner to a circle.
4. `/admin/cohorts` — a real form for creating a cohort and assigning partners/members (still unpolished UI).
5. `/member/circle`, `/partner/dashboard` (caseload list) — read views built on the new model.
   **Test**: create a cohort, assign 2 partners + 1 member through the admin UI, the member sees their circle, attempting to assign a second active PRIMARY fails with a clear error.

**Scope notes (added after initial build)**:
- `getSessionScope()` (`src/server/data/scope.ts`) resolves the signed-in user's role profile id (`memberProfileId`/`partnerProfileId`/`leadProfileId`) once per request; every function in `careCircles.ts` and `cohorts.ts` takes this scope and filters by it rather than trusting the caller.
- Assigning a User (of any role) to a cohort auto-creates their role profile row on first assignment (`assignUserToCohortAction`) — and for Members, their `CareCircle` too, since it's 1:1 and always needed once onboarded. There's no separate "provisioning" step.
- Admin-facing mutations (`createCohortAction`, `assignUserToCohortAction`, `assignPartnerToCircleAction`, `deactivateMembershipAction`) redirect back with `?error=` on validation failure — same pattern as `login.ts` — rather than throwing and surfacing a raw Next.js error overlay.
- Verified end-to-end with an automated Playwright script covering the full flow from the Test line above, including the duplicate-PRIMARY rejection. One real bug surfaced during that verification: the long-running dev server process still held the pre-Sprint-2 Prisma Client singleton in memory (`src/lib/db.ts`'s module-level instance persists across Turbopack route HMR), so `db.cohort` was `undefined` until the dev server was restarted after `prisma generate`. Not a code bug — a reminder that regenerating the Prisma client requires a full dev-server restart, not just a file save.

### Sprint 3 — Context Ledger

Goal: a single, protected place for a Member's ongoing context.

1. Extend the schema: `ContextLedgerEntry` (with `supersedesId`/`isCurrent`/`visibility`).
2. `src/server/data/contextEntries.ts` — queries filtered by `SessionScope` + `visibility`.
3. `src/server/actions/context-ledger.ts` — create (always a new version, never an UPDATE).
4. `/member/context` — a ledger table + manual entry creation + `sharingPrefs` management.
   **Test**: a Partner not assigned to a given Member gets an empty list when querying that Member's context (scope enforcement works at the query level, not just in the UI).

### Sprint 4 — Partner Workflow: Prepare + Capture (including audio)

Goal: the product's centerpiece feature — this is where AI enters the picture for the first time.

1. `docker-compose.yml` — add the local Whisper service (`faster-whisper`).
2. `src/server/continuity-engine/transcription/client.ts` — a wrapper around the Whisper service.
3. `src/server/continuity-engine/llm/client.ts` + `prompts/summarize.ts` — Anthropic SDK wrapper, tool-use for structured output.
4. Schema extensions: `Interaction` (with `captureMethod`/`recordingConsentConfirmed`/`audioFilePath`), `InteractionSummary`, `ActionItem`, `AIInvocationLog`.
5. `src/server/continuity-engine/capture.ts` — coordinator: input (text or transcribed audio) → Claude call → draft creation.
6. `src/server/actions/interactions.ts` — `submitCapture` (draft-only) and `approveCapture` (the sole approving action) as two fully separate actions, per the structural boundary described above.
7. `/partner/prep/[memberId]` — the Prep Card (aggregates context + open commitments).
8. `/partner/capture/[interactionId]` — the full UI: input method selection, consent checkbox, transcribe button, editable draft, Approve.
   **Test**, per scenario: manual typing ← draft ← approve; audio upload without the consent checkbox ← blocked; audio upload with consent ← transcribed locally ← draft. In every case an `AIInvocationLog`/`AuditLogEntry` is written; nothing becomes a `ContextLedgerEntry` before Approve.

### Sprint 5 — Continuity Engine: Surface

Goal: automatic (but non-decisive) detection of things that need human attention.

1. Schema extensions: `ReviewQueueItem`, `OrgSafetyKeyword`.
2. `src/server/continuity-engine/rules/{safetyKeywords,missedFollowThrough,boundaryBreach}.ts` — deterministic rules.
3. `src/server/continuity-engine/surface.ts` + `prompts/surfaceAnalysis.ts` — runs the rules, then the LLM pass, invoked automatically from within `approveCapture`.
4. `/admin/settings` — managing `OrgSafetyKeyword` (config-driven, never hardcoded).
   **Test**: a capture containing a configured keyword produces a `ReviewQueueItem` with `flagSource=RULE_ENGINE` immediately after approval; a commitment past its due date produces a `MISSED_FOLLOW_UP` flag.

### Sprint 6 — Review Queue (Decide)

Goal: closing the human-in-the-loop.

1. `src/server/data/reviewQueue.ts` + `src/server/actions/review-queue.ts` — `resolveReviewItem`/`escalateReviewItem`/`overrideReviewItem`.
2. `/lead/review-queue` — inbox filtered to the Lead's cohort.
3. `/lead/review-queue/[id]` — detail screen + action (with a required resolution note).
4. `/lead/coaching` — an overview table for the cohort's Partners (caseload, open flags).
   **Test**: a Lead resolves an item with a note ← an `AuditLogEntry` is written, the item disappears from the open queue; a MEMBER/PARTNER user attempting to access a review-queue route gets a 403.

### Sprint 7 — Admin & Analytics (intentionally limited)

Goal: basic management tools only — deepened based on real need once the client side is running.

1. `/admin/analytics` — read-only aggregates (capacity vs. `caseloadCap`, queue load, rough SLA).
2. `/admin/settings` — adds management of `Organization.crisisResources` (the "Get help now" banner).
   **Test**: the dashboard reflects live data from prior sprints.

### Sprint 8 — Hardening

1. `REVOKE UPDATE, DELETE` on `audit_log_entries`/`ai_invocation_logs` at the application's database role level.
2. Unit tests for every function in `server/data/*.ts` (fixture scope per role).
3. Consolidate `seed.ts` into a full demo scenario (org, cohort, all 4 roles, a circle, several interactions).
4. README with local setup instructions.

### Sprint 9 — Cloud Deployment

Goal: take the site off the local machine and onto a real address with a domain, **only after** the local MVP (Sprints 0-8) has proven itself.

1. Set up a **Railway** (or Render) project — three services: Next.js (web), Postgres, Whisper — mirroring the local `docker-compose.yml` exactly, just deployed in the cloud.
2. Create a **Cloudflare R2** bucket; implement `src/server/storage/audioStorage.ts` against R2 (behind the same abstraction already built in Sprint 4 — no other code changes), `STORAGE_DRIVER=r2` in the production environment.
3. Connect a custom domain + automatic SSL (built into Railway).
4. Separate production environment variables (`.env.production`, never committed) — `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NEXTAUTH_SECRET`, `STORAGE_DRIVER`.
   **Test**: the site is reachable via the domain, independent of whether the local machine is on; a full capture scenario (including audio upload) works end-to-end in the cloud environment.

## Critical Files

- `src/app/page.tsx` (Sprint 0 — Landing page)
- `src/proxy.ts` (Sprint 1 — role-based routing, single-app enforcement)
- `prisma/schema.prisma`
- `src/server/auth/rbac.ts`
- `src/server/data/scope.ts`
- `src/server/continuity-engine/capture.ts`
- `src/server/continuity-engine/surface.ts`
- `src/server/continuity-engine/transcription/client.ts`
- `docker-compose.yml`

## Verification

After Sprint 0: `docker compose up -d`, `npm run dev`, log in as the seeded admin, land on the correct dashboard. For every subsequent sprint: the manual end-to-end scenario described in that sprint's "Test" line. By Sprint 8: automated unit tests for the scope/data layer.
