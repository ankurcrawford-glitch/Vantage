# Vantage Foundations — integration handoff

---

## NEW: Conversation tab (added later)

A persistent get-to-know-you discovery conversation for 9th-11th graders.
Asks dream school first, then explores grades, instruments, sports, travel,
what makes them happy — one question at a time. Full history reloads on
every visit, so a kid can talk for an hour and come back tomorrow. Every 8
student messages it distills "counselor notes" and refreshes
`narrative_summary`, so Counselor/Roadmap/Compass get smarter as they talk.
Daily cap: 150 student messages (Haiku, cheap).

**New files:** `app/foundations/conversation/page.jsx`,
`app/api/foundations/conversation/route.js`, `conversation-schema.sql`.
**Modified:** `components/FoundationsNav.jsx` (one nav item added).

**Your steps:**
1. Run `conversation-schema.sql` in the Supabase SQL editor (adds
   `conversation_messages` table with RLS + `user_stats.discovery_notes`).
2. Commit on your testing branch:
   ```bash
   git add app/foundations/conversation app/api/foundations/conversation conversation-schema.sql components/FoundationsNav.jsx
   git commit -m "Add Conversation tab: persistent discovery interview for Foundations"
   ```
No new env vars — uses the same `ANTHROPIC_API_KEY`.

---

Everything is integrated on your working copy. Because this environment can't
safely run git or push (and pushing needs your credentials), **you run the git
steps below yourself.** `main` is never touched.

---

## 1. What changed

**New files (additive — nothing existing was restructured):**

- `app/foundations/compass/page.jsx` — hub page; its tabs/cards now navigate to the real routes below
- `app/foundations/story/page.jsx`
- `app/foundations/roadmap/page.jsx`
- `app/foundations/activities/page.jsx`
- `app/foundations/spark/page.jsx`
- `app/foundations/counselor/page.jsx` — counselor chat UI
- `app/api/counselor/route.js` — counselor API (server)
- `counselor-schema.sql` — kept as a file; **not** run

**One existing file modified (additive, +19 lines):**

- `components/Navigation.tsx` — adds a "Foundations" nav link that only appears
  when the logged-in student's `user_stats.grade` is 9, 10, or 11. Wrapped so a
  missing `grade` column (i.e. before you run the SQL) simply hides the link and
  never breaks the nav for anyone. 12th graders never see it.

Mock data in each page is wrapped in clearly marked
`TODO(Supabase): MOCK DATA ... END MOCK DATA` blocks. The mock data still works,
so every page renders today.

---

## 2. Run these git commands (in the repo folder)

```bash
# if git complains about an existing lock, first run:  rm -f .git/index.lock
git checkout -b foundations
git add app/foundations app/api/counselor counselor-schema.sql components/Navigation.tsx
git commit -m "Add Vantage Foundations (grades 9-11): 5 pages, counselor chat + API, grade-gated nav"
git push -u origin foundations
```

> We add only the specific new files on purpose. Your working copy shows ~50
> other files as "modified" — that's just Windows vs. Unix line-ending noise,
> not real edits. Adding files individually keeps the commit clean.

After `git push`, Vercel automatically builds a **Preview Deployment** for the
`foundations` branch. Find its URL in your Vercel dashboard → the project →
Deployments (the row tagged `foundations`), or in the GitHub branch/PR checks.

---

## 3. Your remaining manual steps

1. **Run the SQL.** Open `counselor-schema.sql` in the Supabase SQL editor and run it.
   It adds `narrative_summary` and `grade` to your existing **`user_stats`** table
   (your per-user profile table) and creates the `counselor_messages` table with RLS.
   No `profiles` table is involved — the route, the nav gate, and this schema all use
   `user_stats` consistently now.

2. **Add one env var.** The counselor route needs `ANTHROPIC_API_KEY`, which you
   don't have yet (you have `OPENAI_API_KEY`). Add `ANTHROPIC_API_KEY` in:
   - your local `.env.local`, and
   - Vercel → Project → Settings → Environment Variables (for Preview + Production).
   The other two it needs (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
   you already have.

3. **Test the preview:** confirm existing pages work, the 5 Foundations pages
   render, and the counselor chat shows a graceful "something went wrong" message
   until the key + SQL are in place. (Logged-out users get a clean 401 → the same
   graceful message; that's expected.)

4. **Merge** `foundations` → `main` when you're happy.

> **Security note:** the counselor route now derives the user from the session
> token server-side (`getAuthedUser`) and reads only `messages` from the request
> body — it never trusts a browser-supplied `userId`, matching the rest of your
> API. The chat page sends the Supabase access token as a `Bearer` header.

You can delete the `incoming/` folder (your original drop) — it was not committed.
