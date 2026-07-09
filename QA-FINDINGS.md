# Vantage QA — Student-Perspective Test Findings
**Date:** July 9, 2026 · Tested as: 9th/10th grader (Foundations) and senior (College Prep)
**Method:** full code-path trace of both journeys + live checks on my-vantage.app

---

## A. Real bugs (fix these)

### A1. Spark page loses students' writing — worst finding
`app/foundations/spark/page.jsx` is a stub: the save button only flips local state ("Saved ✓") but **nothing is written to the database**. A 9th grader writes a personal reflection, sees "Saved," and it's gone on refresh. The monthly prompt is hardcoded to "June 2026" (already stale) and the archive is permanently empty. Spark is linked in the Foundations nav, so kids WILL hit this.
**Fix:** wire to Supabase (marked TODO in file), or remove Spark from `FoundationsNav` until it's wired.

### A2. Junior "College Prep opens in January" gate never gates
`lib/college-prep-access.ts`: `new Date().getMonth() >= 0` is always true (months are 0–11). Juniors get College Prep year-round; the lock message never shows. Intended behavior per commit: locked Aug–Dec, open from January.
**Fix:** `return new Date().getMonth() <= 6;` (Jan–Jul open; Aug–Dec locked).

### A3. Counselor usage meter shows fake numbers
`app/foundations/counselor/page.jsx` — the "used this month" count is a hardcoded demo value (marked TODO). Kids see a made-up quota.
**Fix:** fetch real count from `counselor_messages`, or hide the meter.

### A4. Younger students can use senior tools via direct URL
`/dashboard` correctly bounces grades 9–11 back to Foundations, but `/colleges`, `/common-app`, `/story-builder`, `/applications` have **no grade guard** — only a login check. A 10th grader who gets the URL (from a senior friend, or a shared link) lands in the full senior experience.
**Fix:** apply the same grade check the dashboard uses (or a shared layout guard).

### A5. Orphaned `/onboarding` page still live
Nothing links to it anymore (replaced by Story Builder + profile flow) but the route still renders the old 12-question flow and writes via the old path. Confusing dead limb if anyone lands there from an old bookmark.
**Fix:** replace with `permanentRedirect('/story-builder')` (same pattern already used for `/discovery` and `/personal-statement`).

---

## B. Look-and-feel consistency (your "same look" ask)

### B1. Two slightly different brand palettes
The senior side and Foundations side use near-miss colors — visible when a junior toggles between them, and it makes the platform feel like two products:

| Token | Senior side | Foundations side |
|---|---|---|
| Navy background | `#0B1320` | `#0B1426` |
| Gold accent | `#C9A977` | `#C5A56A` |
| Cream text | `#E8DDC9` | `#E8E6E1` |

Also: the Foundations theme constants (`const C = {...}`) are **copy-pasted into ~10 files**. Centralize into one `lib/theme.js` and import — then a single change fixes all pages.
**Fonts are consistent** (Cormorant Garamond + Montserrat everywhere) — good.

### B2. ~~Foundations side has no footer~~ — CORRECTED
The footer is rendered globally via `app/layout.tsx`, so Terms/Privacy appear on Foundations pages too. Original finding was wrong. (A Support mailto link has since been added to the footer as the student help channel.)

### B3. Logo renders "VANTAGE ." with a floating period
Visible on live landing/login/signup — the period sits detached with a gap. Small, but it's the logo.

### B4. Brand voice mismatch for younger students (judgment call)
Landing/login copy is adult-luxury: "Client Access," "Begin Assessment," "Private counsel for elite college admissions." The Foundations experience inside is warm and student-friendly, but a 14-year-old (or their parent) choosing the product sees only the hedge-fund tone. Consider a landing section speaking to 9th–11th graders / parents.

---

## C. Verified working (code-level)
- Signup → gateway fork: remembered grade routes silently (9–11 → Compass, 12 → dashboard); unknown grade shows two-door chooser. Solid.
- All other Foundations pages (compass, conversation, counselor, story, activities, roadmap, welcome, start) are wired to real APIs — Spark is the only stub.
- `/discovery` and `/personal-statement` correctly 301 to their renamed routes.
- FoundationsNav guards: seniors bounced to dashboard, no-grade users sent to grade picker; College Prep hidden from 9/10.
- No dead internal links found (the `/foundations` refs are active-state matchers, not links).
- Landing, signup, login pages render cleanly on desktop; deploy at my-vantage.app reflects the latest merged code.

## D. Not yet tested (needs a logged-in account)
Authed click-throughs: chat quality/latency, activities autosave, roadmap interactions, story flow, college search, essay editor, checkout. I can't create accounts or enter passwords — log a **test account** into the Chrome tab I'm using and I'll run both personas end-to-end.

## E. Carried over from compliance review (you said later — listed so they're not lost)
AI disclosure in chat UIs, crisis resources (988), parent checkbox at checkout, DPAs, birth-date age gate. See `SECURITY-COMPLIANCE-REVIEW.md`.
