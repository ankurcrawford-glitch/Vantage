# Vantage bug sweep: November 25, 2026
**Scope:** code review of the AI routes after the Gemini-to-Claude move (Round Table, Strategic Intelligence, activity extraction), the counselor and Foundations conversation routes, payments and access codes, account deletion, and the shared libs (`ai`, `budget`, `rate-limit`, `grade`, `roundTableGate`).
**Method:** read the code paths and checked them against the SQL in the repo. Nothing was run against production.

---

## A. Real bugs, worst first

### A1. Round Table sends all seven Common App prompts, six of them marked "(Not yet written)"
`app/api/round-table/route.ts:308-318`. The Common App section loops over every prompt under `COMMON_APP_COLLEGE_ID`. Since the 2026-09-16 fix there are seven of them (`supabase-common-app-prompts.sql`). A student writes one Common App essay, so the panel reads six "COMMON APP PROMPT … (Not yet written)" blocks, which looks like an unfinished application. A student who drafted two prompts while deciding gets both reviewed as if both were submitted.
**Fix:** include only the Common App prompts that have content in `essayMap`. If there are several, send the one with the most recent current version, or let the student mark which one they're submitting. Say "(No Common App essay written yet)" only when none exist.

### A2. Strategic Intelligence calls every first-version essay an "early draft", however finished it is
`app/api/thinking-partner/route.ts:59-63`: `if (wordCount < 200 || versionNumber <= 1) return 'early_draft'`. On Oct 11 the Round Table was relaxed to need only **one** saved version (`lib/roundTableGate.ts:7`). Now a polished 640-word Common App essay saved once is Round-Table-ready, but per-essay feedback still opens with "The student is just getting started… what seeds are there to build on?" During ED/RD season that is the wrong frame for most seniors.
**Fix:** decide by word count against the limit, e.g. `revision` when `wordCount >= 200 && (versionNumber > 1 || (limit && wordCount >= 0.8 * limit))`.

### A3. Story Builder saves made within 60 seconds of each other are never scanned for activities
`app/api/extract-activities/route.ts:78-88`. The debounce skips a run when the last run is under 60 s old, even if the content changed. Extraction only fires from `handleSaveAnswer` (`app/story-builder/page.tsx:191`). A student who answers two questions back to back gets the second one skipped, and nothing retries it. Their newest activity never reaches the Profile suggestions until they save something again more than a minute later.
**Fix:** when the content changed but the debounce applies, either (a) don't record anything and have the client retry once after ~60 s, or (b) drop the time debounce. The hash check already stops repeat work, and the `extract-activities` rate limit (6/min) already stops loops.

### A4. Counselor FAQ answers seniors' Early Decision question as if they were freshmen
`app/api/counselor/route.js:86-90`. The canned reply ends "This becomes a real strategic decision in Application mode senior year — for now, just know the terms." The FAQ runs for every grade, and the same counselor is linked from the senior side. A senior asking "what is early decision" in November gets told to wait.
**Fix:** reword the reply so it works for any grade, or skip the FAQ layer when `effectiveGrade(profile) === 12`.

### A5. Counselor FAQ matching is too broad and swallows real questions
`app/api/counselor/route.js:98-104` uses `includes()`. "essay feedback" catches "My teacher's **essay feedback** says my ending is weak, how do I fix it?" and returns the "click Get Guidance" boilerplate instead of an answer. "how many ap" also matches "how many applications should I send". FAQ replies are also never written to `counselor_messages`, so the student's question and the canned answer disappear from history on the next visit.
**Fix:** use the FAQ only for short messages (e.g. under 12 words) or anchor the matches to the start of the message, and persist FAQ exchanges with a flag so they don't count toward the cap.

### A6. Foundations conversation runs up to three extra AI calls before replying, with no `maxDuration`
`app/api/foundations/conversation/route.js:366-392`. On every 2nd daily message it `await`s activity extraction and course extraction. On every 8th it also awaits the notes refresh, which is four sequential Haiku calls in total before the response returns. The comments say "fire-and-forget", but they block. The route doesn't export `maxDuration`, so it gets the platform default. If the function times out, the student sees an error even though their message and the reply were already saved (line 358), and a retry double-posts.
**Fix:** run the post-reply work in `after()` from `next/server` (or `waitUntil`) so the reply returns right away, and add `export const maxDuration = 60`.

### A7. Gated requests still use up the Round Table rate limit
`app/api/round-table/route.ts:105-110`. The rate limit (2/min, **5/hr**, 15/day) and budget check run before the readiness gate. A student who clicks Round Table, sees "2 of 3 ready", fixes an essay and tries again a few times can hit the hourly cap before the review ever runs. Strategic Intelligence has the same pattern with its Story Builder gate (`thinking-partner/route.ts:155-204`), but its limits are loose enough that it matters less.
**Fix:** move `checkRateLimit` and `checkBudget` to just before `callClaude`, after the gate.

### A8. The kill switch and budget don't cover activity extraction
`app/api/extract-activities/route.ts` never calls `checkBudget`, and `COST_PER_CALL` in `lib/budget.ts:45-48` has no entry for it. `AI_FEATURES_DISABLED=1` is documented as "instantly kill all AI features", but extraction keeps calling Claude. The admin exemption email isn't passed to `checkRateLimit` here either (line 36), unlike the other two routes.
**Fix:** add `checkBudget(userId)` after the rate limit, give `extract-activities` a cost entry, and pass `auth.email`.

### A9. Round Table cost estimate is still the Gemini figure
`lib/budget.ts:47`: `'round-table': 0.020`. The comment in `lib/ai.ts:18-20` puts a Sonnet 5.5 call at roughly 2–3¢, and `maxTokens` is now 6000 to leave room for reasoning, so heavy calls cost more. The per-user monthly cap will under-count by roughly 25–50%.
**Fix:** raise it to about `0.03`. Better: compute cost from the returned `usage` (callClaude already returns it) instead of a flat estimate.

### A10. Redeeming an access code overwrites a paying customer's Stripe record
`app/api/redeem-code/route.ts:58-70` upserts `stripe_customer_id: null` and `stripe_subscription_id: 'code:…'` over whatever was there. If a student who already paid then redeems a cohort code (a parent buys, then the school hands out a code), the Stripe customer and session id are lost, which makes refunds and receipts harder.
**Fix:** if an active row already exists, return success without writing.

---

## B. Minor, or needs checking against the live database

- **B1. Story Builder upsert may create duplicate rows.** `app/story-builder/page.tsx:170-176` calls `.upsert()` with no `onConflict`. The `discovery_answers` DDL isn't in the repo. If its primary key is a surrogate `id` rather than `(user_id, question_id)`, every edit inserts a new row. That would inflate the "6 of 12 answered" gate (`thinking-partner/route.ts:195`) and the dashboard journey strip, and send old answers to the AI. **Check:** `select user_id, question_id, count(*) from discovery_answers group by 1,2 having count(*) > 1;`. If any rows come back, add a unique constraint and `onConflict: 'user_id,question_id'`.
- **B2. Counselor error bubbles become fake assistant turns.** `app/foundations/counselor/page.jsx:124-133` adds "Something went wrong on my end…" as an `assistant` message, and the next request sends it to the model as history. When the monthly cap is hit, the student sees "your question wasn't counted" instead of the real "Monthly counselor sessions used" message. Mark the bubble `synthetic: true` and show `data.error` when the status is 429.
- **B3. Extraction JSON parsing is fragile.** `extract-activities/route.ts:160` only strips a fence at the very start. Any preamble ("Here are the activities: [...]") fails to parse, and the run is still recorded, so those answers are never retried. Extract from the first `[` to the last `]` before `JSON.parse`. The same applies to `conversation/route.js:118`.
- **B4. Round Table history GET ignores the query error.** `round-table/route.ts:80-88` would show an empty history instead of an error. Thinking-partner's GET handles it.
- **B5. Gemini leftovers.** `lib/gemini-models.ts` has no importers left. Comments in `round-table/route.ts:15-24` and `thinking-partner/route.ts:9-23` still describe Gemini model choices, and the budget env vars are still named `GEMINI_*_BUDGET_USD`. This isn't a bug, but it will mislead the next person debugging an outage.

---

## C. Checked and fine
- **Account deletion:** the Foundations tables (`foundations_activities`, `foundations_courses`, `conversation_messages`, `roadmap_progress`, `foundations_spark_entries`, `counselor_messages`, `activity_extraction_runs`) aren't in the explicit purge list, but all of them `references auth.users(id) on delete cascade`, so `auth.admin.deleteUser` removes them.
- **Junior College Prep gate** (`lib/college-prep-access.ts`): the July fix is in. It opens Jan–Jul and is locked Aug–Dec.
- **Grade rollover** (`lib/grade.ts`): the class_of derivation and the Aug 1 boundary are correct.
- **Stripe webhook:** verifies the signature and only activates paid sessions. Checkout is card-only, so there are no async payment events to miss.
- **Cron routes:** both check `CRON_SECRET`. The digest approval and unsubscribe links are HMAC-signed.
- **`lib/ai.ts`:** temperature is correctly withheld from 5.5 models, the 404 model fallback and transient retry happen in the right order, and empty responses get a clear diagnostic.
