# Security Audit — April 17, 2026

Audit of all API routes and RLS policies for tenant data isolation ahead of scaling to 1,000 users. Critical items must be fixed before production.

---

## 🚨 CRITICAL — fix before shipping to 1,000 users

### 1. `userId` trusted from request body (all routes)

Every API route takes `userId` from the request body or query string and uses it to scope database queries. Combined with the service role key (which bypasses RLS), this means **any authenticated user can pass another user's UUID and access all of their data**.

Affected routes and specific issues:

- **`app/api/redeem-code/route.ts:6-8, 36`** — any user can activate a subscription for any account by passing another user's UUID.
- **`app/api/round-table/route.ts:55-56, 86`** — any user can exfiltrate another user's entire application: essays, insight answers, profile, guidance history.
- **`app/api/thinking-partner/route.ts:113, 152`** — same pattern. Cross-tenant read/write — can also INSERT into `strategic_guidance_history` for any user.
- **`app/api/checkout/route.ts:18, 26`** — can initiate a Stripe checkout whose subscription will activate on a different user's account when the webhook fires.

**Fix:** In each route, derive `userId` from a verified Supabase session using a server-side SSR client reading cookies (e.g., `supabase.auth.getUser()`). Discard any `userId` from request body/query. Recommend a shared helper `getAuthedUser(request)` so every route uses the same pattern.

### 2. `send-invitation` has no authentication at all

**`app/api/send-invitation/route.ts:8-11`** — accepts `invitationId`, `inviteeEmail`, `inviteeName`, `role`, `essayInfo`, `invitationToken`, `studentName` from the body with zero auth and zero DB verification.

Impact: anonymous callers can spam arbitrary emails from `noreply@my-vantage.app` with attacker-controlled content and arbitrary `invitationToken` in the link. This is a phishing weapon.

**Fix:** Require authenticated session. Look up the invitation row in `essay_invitations` by `invitationId` where `student_id = auth.uid()` and derive `inviteeEmail`/`invitationToken`/`role` from the row — never from the request body.

### 3. HTML injection in invitation email template

**`app/api/send-invitation/route.ts:52, 56, 67`** — `inviteeName`, `senderName`, and `collegeName` are interpolated directly into email HTML without escaping. Combined with #2 above, attackers can send HTML/phishing content from your trusted sender domain.

**Fix:** HTML-escape every user-supplied value before template interpolation.

### 4. Missing RLS on user-private tables

These tables store user-specific data but do not appear to have RLS policies in the provided SQL files:

- `discovery_answers`
- `user_stats`
- `user_ap_classes`
- `user_extracurriculars`
- `user_awards`
- `strategic_guidance_history`

If any frontend code uses the anon key to query these tables, or the tables were created without RLS enabled, they are world-readable/writable.

**Fix:** For each table, run in Supabase SQL editor:

```sql
alter table public.<table_name> enable row level security;

create policy "<table_name>_select" on public.<table_name>
  for select using (auth.uid() = user_id);

create policy "<table_name>_insert" on public.<table_name>
  for insert with check (auth.uid() = user_id);

create policy "<table_name>_update" on public.<table_name>
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "<table_name>_delete" on public.<table_name>
  for delete using (auth.uid() = user_id);
```

### 5. `essay_invitations` RLS select policy is `using (true)`

**`supabase-essay-invitations-and-permissions.sql:41-42`** — any authenticated user can read every row in `essay_invitations`, including the `invitationToken` for every other student. They could then accept an invitation via `essay_permissions_insert` and gain view/comment access to any essay.

**Fix:** Restrict select to rows where the caller is the student owner OR the invitee email:
```sql
drop policy essay_invitations_select on public.essay_invitations;
create policy essay_invitations_select on public.essay_invitations
  for select using (
    student_id = auth.uid()
    or invitee_email = (auth.jwt() ->> 'email')
  );
```
Also verify the accept-invitation code path validates the token matches the invitee, not just that the row exists.

### 6. `essay_permissions` RLS select policy is `using (true)`

**`supabase-essay-invitations-and-permissions.sql:52-53`** — any authenticated user can enumerate who has access to which essays.

**Fix:**
```sql
drop policy essay_permissions_select on public.essay_permissions;
create policy essay_permissions_select on public.essay_permissions
  for select using (
    user_id = auth.uid()
    or essay_id in (select id from essays where user_id = auth.uid())
  );
```

---

## ⚠️ Important — fix soon (within first week of 1,000-user deploy)

- **`app/api/redeem-code/route.ts:13-20`** — single shared env-var access code, compared case-insensitively, no rate limiting. Brute-forceable. Move to a codes table with single-use semantics and add per-IP rate limiting.

- **`app/api/checkout/route.ts:13`** — `request.json().catch(() => ({}))` silently swallows malformed bodies. Return explicit 400.

- **`app/api/thinking-partner/route.ts:152`, `app/api/round-table/route.ts:86`** — no request body validation. Attacker can send 1MB `essayContent` and burn Gemini budget. Add size caps (e.g., 20k chars on `essayContent`), UUID validation on `promptId`/`collegeId`, and per-user rate limiting (Upstash Redis recommended).

- **`app/api/send-invitation/route.ts`** — once auth is added, still enforce per-student invite limits (the "5 commenters" cap implied by `student_commenters`).

- **`app/api/webhooks/stripe/route.ts:77`** — good: signature verification is correctly done. Add Stripe event idempotency (store seen `event.id`) so retries don't double-activate. Also enforce `event.livemode` matches environment.

- **`app/api/thinking-partner/route.ts:440-448`, `app/api/round-table/route.ts:371-378`** — `console.log` dumps Gemini response metadata including `rawTailPreview` (200 chars of generated guidance). In production logs this leaks pieces of student essays to anyone with log access. Redact or remove in prod (or gate behind `NODE_ENV !== 'production'`).

- **`app/api/redeem-code/route.ts:39`** — stores access code plaintext in DB (`stripe_subscription_id: 'code:<CODE>'`). If codes are cohort secrets, hash them before storing.

---

## ✅ Nice to have / defense-in-depth

- **All routes** — no `Cache-Control: no-store` on responses. Add it to any response that returns user-specific data.

- **`app/api/checkout/route.ts:14`** — `origin` taken from `Origin` header with fallback. Pin `successUrl`/`cancelUrl` to `process.env.NEXT_PUBLIC_SITE_URL` to prevent spoofing.

- **All routes** — error messages returned to client include `error.message`, which leaks internal details. Return a generic message and log the specific error server-side.

- **Centralize `getAuthedUser(request)`** — one helper used by every route. Current pattern of "body userId + service role" is structurally unsafe and will keep regressing every time a new route is added.

- **Verify `SUPABASE_SERVICE_ROLE_KEY` is server-only.** Looked correct in reviewed files (no `NEXT_PUBLIC_` prefix, only used in `app/api/*` server routes). Grep the full codebase once more to be sure no client component ever imports it.

---

## RLS coverage summary

### Tables with RLS in provided SQL
| Table | Status |
|---|---|
| `essays` | ✅ policies scoped to `auth.uid() = user_id` (select/insert/update). No delete policy — verify if intentional. |
| `essay_versions` | ✅ policies scoped via parent essay owner (all CRUD covered). |
| `user_subscriptions` | ✅ select-only policy for owner; writes via service role for webhooks. |
| `essay_invitations` | ⚠️ RLS enabled but select is `using (true)` — see Critical #5. |
| `essay_permissions` | ⚠️ RLS enabled but select is `using (true)` — see Critical #6. |
| `student_commenters` | ✅ properly scoped. |

### Tables missing RLS in provided SQL (verify / add)
- `discovery_answers`
- `user_stats`
- `user_ap_classes`
- `user_extracurriculars`
- `user_awards`
- `strategic_guidance_history`
- `colleges` — reference data, likely fine to be readable; verify no user-linked columns.
- `college_prompts` — reference data, same caveat.

Currently tenant isolation for these tables depends entirely on body-supplied `userId` scoping inside service-role routes — which is Critical #1 above. RLS is the backstop and it appears to be missing.

---

## Suggested order of operations

1. **Morning, 1–2 hours** — fix Critical #1 and #4. Create `getAuthedUser()` helper, rewrite every route to use it, drop body `userId` entirely. Enable RLS on the six missing tables.

2. **Afternoon, 30 minutes** — fix Critical #2, #3, #5, #6 (send-invitation auth + escaping, invitations/permissions RLS tightening).

3. **Next day** — work through Important list. Rate limiting is the highest-leverage one after the criticals are done.

4. **Later** — nice-to-haves as you have time.

---

## One-test integration check

After fixes, write one integration test or manual check:
1. Sign in as User A.
2. Call `/api/round-table` with `userId: <User B's UUID>`.
3. Confirm it returns 401/403, not User B's data.

If that test passes for every route, the critical tenant-isolation risk is closed.
