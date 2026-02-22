# Going live: VANTAGE on Vercel + one Supabase project

You’re using **Vercel** for the app and **one Supabase project** for both local dev and production. Same database and auth for everything.

---

## 1. Deploy on Vercel

1. **Push your code to GitHub** (if not already).
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. **Add New Project** → **Import** your `vantage` repo. Vercel will detect Next.js.
4. Before deploying, go to **Settings → Environment Variables** and add every variable from your `.env.local` (see table below). Add them for **Production**; add the same for **Preview** if you want branch previews to work.
5. Click **Deploy**. Vercel will build and give you a URL like `vantage-xxx.vercel.app`.
6. (Optional) **Settings → Domains** to add a custom domain.

### Environment variables in Vercel

Use the **same** values as in `.env.local` (same Supabase project for dev and prod).

| Variable | Used for | Where to get it |
|----------|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (client) key | Same place |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (AI/essays, future webhooks) | Same place — **keep secret** |
| `OPENAI_API_KEY` | Strategic Intelligence / thinking partner | OpenAI dashboard |
| `STRIPE_SECRET_KEY` | Payments (when you re-enable) | Stripe Dashboard → Developers → API keys |
| `STRIPE_PRICE_ID` | Your $100 product price | Stripe Dashboard → Products → your product → Price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks (when you add them) | After creating webhook endpoint in Stripe |

---

## 2. Supabase: make sure it works before & after go-live

### 2.1 Auth (redirect URLs) — one Supabase project

Your **one Supabase project** must allow both localhost (dev) and your Vercel URL (prod).

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**.
2. **Site URL**: set to your **production** URL (e.g. `https://vantage-xxx.vercel.app`). This is where users land after email confirmation.
3. **Redirect URLs**: add **all** of these (one per line):
   - `http://localhost:3000/**`
   - `https://vantage-xxx.vercel.app/**` (use your real Vercel URL)
   - `https://your-custom-domain.com/**` (only if you added a custom domain)

Then both local dev and production login/signup will work with the same Supabase project.

### 2.2 Database tables your app uses

Ensure these exist and have the right structure. You can run SQL in **Supabase Dashboard → SQL Editor**.

| Table | Purpose |
|-------|---------|
| `auth.users` | Built-in; signup/login uses this. |
| `user_stats` | GPA, test scores (dashboard, profile). |
| `user_colleges` | User’s college list (portfolio). |
| `colleges` | Master list of colleges. |
| `college_prompts` | Essay prompts per college + Common App. |
| `essays` | One row per essay (links user, college/prompt, content). |
| `essay_versions` | Version history for essays. |
| `essay_permissions` | Who can view/edit (e.g. counselors). |
| `essay_invitations` | Invite links for counselors. |
| `counselor_comments` | Comments on essays. |
| `user_ap_classes` | AP classes (profile). |
| `user_extracurriculars` | Extracurriculars (profile). |
| `user_awards` | Awards (profile). |
| `user_subscriptions` | Paid access (Insight Questions / paywall). |
| `discovery_answers` | 12 Insight Question answers. |

You already have `supabase-subscription-table.sql` for `user_subscriptions`. The rest may exist from earlier setup. If any table is missing, you’ll see errors when that feature is used.

### 2.3 Row Level Security (RLS)

- **Enable RLS** on every table that holds user-specific data.
- **Policies**: users should only read/write their own rows (e.g. `auth.uid() = user_id`).  
- **Service role** (used with `SUPABASE_SERVICE_ROLE_KEY` in API routes) bypasses RLS; use it only on the server, never in client code.

If something works in the dashboard but not in the app, check the table’s RLS policies and that the anon key is used for client requests.

### 2.4 Quick test flow (before calling it “live”)

1. **Auth**: Sign up a new user → confirm email if you have confirmation on → log in. Then log out and log in again.
2. **Profile**: Edit academic stats, add an AP class, an extracurricular, an award. Reload and confirm they persist.
3. **Portfolio**: Add a college to your list. Open that college’s page and confirm prompts load.
4. **Essays**: Start a Common App essay and a college-specific essay. Save. Reload and confirm content is there. Use “Strategic Intelligence” once to confirm OpenAI + service role work.
5. **Insight Questions**: Open Discovery, answer one question, save. Reload and confirm the answer is there.

If all of that works in production (and locally), your Supabase/database setup is in good shape.

---

## 3. After go-live

- **Stripe**: When you re-enable payment, add a **webhook** in Stripe pointing to `https://your-domain.com/api/webhooks/stripe` (you’ll need to implement that route if not done) and set `STRIPE_WEBHOOK_SECRET` in Vercel.
- **Monitoring**: In Vercel, check **Deployments** and **Functions** for build/runtime errors. In Supabase, check **Logs** (API and Auth) for failed requests or auth issues.
- **Backups**: Supabase has point-in-time recovery on paid plans; consider backups if this is critical.

---

## 4. One-page checklist (Vercel + one Supabase project)

- [ ] Code pushed to GitHub.
- [ ] Vercel project created and repo imported.
- [ ] All env vars from `.env.local` added in Vercel (Production, and Preview if needed).
- [ ] First deploy succeeds; note your URL (e.g. `https://vantage-xxx.vercel.app`).
- [ ] Supabase → Authentication → URL Configuration: **Site URL** = that Vercel URL; **Redirect URLs** include `http://localhost:3000/**` and `https://your-vercel-url.vercel.app/**`.
- [ ] All required Supabase tables exist; RLS enabled and policies correct.
- [ ] Test on production: signup → login → profile → portfolio → essays → Insight Questions.
- [ ] (Optional) Custom domain in Vercel; add that domain to Supabase Redirect URLs. Stripe webhook when you turn payments back on.

Once this is done, your app is live using one Supabase project for both dev and prod.
