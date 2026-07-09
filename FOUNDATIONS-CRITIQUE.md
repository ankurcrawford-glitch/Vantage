# Foundations — Critical Review: Is It Actually a College Counselor?
**July 9, 2026 · Full code-path review of every page, API route, and system prompt**

## The honest verdict
Foundations today is a warm, token-efficient **interview tool** — it gets kids talking, builds a
living profile (narrative summary, discovery notes, extracted activities), and does that genuinely
well. But a counselor is someone who *knows your path and moves you along it*. Measured against
that bar, three structural failures stand out:

**1. The Counselor is blind to its own product.** The system prompt tells it to "reference their
Roadmap, Activities, Story, and Spark pages" — but the API never loads that data. It sees only a
500-word narrative summary and the last 8 chat messages. It literally cannot say "you checked off
PSAT prep — how did it go?" or "your robotics thread is strong but stalled since March."

**2. The Roadmap is a poster, not a plan.** Identical hardcoded checklist for every student.
A kid dreaming of MIT with no math past Algebra II sees the same roadmap as a kid with five APs.
No course tracking, no rigor awareness, no GPA, no adaptation — the single most important thing a
real counselor does (course selection strategy) is entirely absent.

**3. Everything is pull, nothing is push.** Real counselors call the kid in. Foundations waits.
No check-ins, no "PSAT registration closes in two weeks," no re-engagement when a student goes
quiet for a month. The relationship decays silently.

Also absent: testing strategy (which test, when, retake plan), summer planning (deadlines hit in
WINTER — kids miss them), teacher-recommendation relationship building (starts in 10th grade, not
12th), and any parent layer.

## What's genuinely good (don't break it)
Conversation's continuous profile-building loop (notes refresh every 8 turns, activity extraction
every 2), the activity confirm-flow with senior-product mirroring, Spark's non-college reflection
bank, the in-lane guardrails, and the cost discipline (Haiku + caps + FAQ layer) — this
architecture can support everything below without changing models.

## The fix list, in order of counselor-impact per unit of work

**P1 — make the counselor actually know the student (1-2 sessions)**
1. **Give Counselor + Conversation eyes.** Load into the system prompt: confirmed activities
   (name/depth/thread, ~15 rows), roadmap items checked vs. unchecked for their grade, latest
   Spark excerpt, and dream schools. ~300 extra tokens per call; transforms answer quality from
   FAQ-tier to "she knows me."
2. **Course + rigor tracking.** New table `foundations_courses` (name, level: regular/honors/AP/IB,
   grade_year, optional grade_received). Conversation already extracts activities — teach the same
   extractor to catch course mentions ("I'm taking AP Bio next year"). Feed schedule into Counselor
   + Story. This is the missing counselor primitive; everything strategic hangs off rigor.
3. **Personalized roadmap layer.** Keep the static spine, add an AI-generated "Your next 3 moves"
   block per student (regenerated monthly from profile + progress + season). A 9th grader with a
   CS thread sees "find a summer coding program — applications open January," not generic text.

**P2 — behave like a counselor across time (2-3 sessions)**
4. **Proactive check-ins.** You already have Resend + cron + the approval-gate pattern. A monthly
   Foundations email per student: what their counselor noticed, one seasonal deadline (PSAT reg,
   summer program windows), one nudge tied to their weakest thread. Quiet-student re-engagement
   after 21 days.
5. **Testing plan module.** PSAT baseline → SAT vs. ACT choice → target score derived from dream
   schools' bands (data already in colleges table) → sitting plan mapped to the real dates now on
   the Roadmap. Store scores; Counselor references them.
6. **Summer strategy.** Curated program list with application windows (research programs, governor's
   schools, jobs count too). Counselor pushes it November-February when applications are actually open.

**P3 — the relationship moat (later)**
7. Recommender tracker: from 10th grade, "which teachers know you well?" — nurture list with nudges.
8. Parent digest: opt-in monthly view-only email (fits the compliance work — parents of minors).
9. AI-generated Story next-moves (currently one hardcoded suggestion for every thread).
10. Senior handoff: when grade flips to 12, carry narrative_summary + threads into the college-list
    strategy tools so the two-year relationship pays off instead of resetting.

## One framing thought
The product's moat isn't the chat — every ed-tech company has a chatbot. It's the **longitudinal
memory**: three years of conversations, reflections, activities, and courses that no senior-year
consultant can reconstruct. Every P1/P2 item above compounds that asset; prioritize accordingly.
