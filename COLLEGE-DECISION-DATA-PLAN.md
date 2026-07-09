# Vantage — Decision Data Plan
**Geographic advantage, decision criteria, data sources, and the prompt-release digest**
July 9, 2026

---

## 1. Is the "underrepresented state" advantage real?

**Yes — real, but modest, and concentrated at small selective private colleges.**

What the evidence says:
- Selective privates want all 50 states represented; applicants from low-application states (WY, MT, ND, SD, AK, HI, MS, ID, AL, ME, WV) genuinely stand out. Example data point: Brown accepted ~20–30% of applicants from ND/MT vs ~8.5% overall for CA/TX/NJ applicants in the same year.
- The advantage is a **tiebreaker, not a golden ticket** — it moves a competitive applicant up, it doesn't rescue an uncompetitive one.
- It's strongest where the applicant pool from that state is tiny (elite privates in the Northeast), weak-to-zero at large public universities — which instead have the *opposite* lever: **in-state admission preference and in-state tuition**.
- The flip side matters just as much for advice: a kid from NJ/NY/MA/CA is in the most oversubscribed pools in the country and should calibrate reaches accordingly.

**How to model it in Vantage** (per student × college):
1. Student's home state (already collected? — add to user_stats if not).
2. College's freshman geographic mix — % of first-years from the student's state (IPEDS "Residence & Migration," collected even-numbered years, public).
3. Whether the college says it considers state residency (Common Data Set item C7 — a factor matrix each college publishes).
4. Public vs private + in-state/out-of-state status → tuition and admission preference direction.

Simple v1 scoring: if student's state supplies <0.5% of the college's freshman class AND the college is a private with acceptance rate <25% → "geo edge: meaningful." If the college is the student's in-state public flagship → "in-state edge + tuition." Everything else → neutral. Feed the edge into `lib/classifier.ts` as a tier nudge (e.g., Hard Reach → Reach), and surface it as a labeled reason in SchoolCard ("Montana is underrepresented here — your application travels well").

---

## 2. The full criteria set for "where should I apply / go"

Grouped by the question the student is actually asking:

**Can I get in?** (Vantage already has much of this)
- Acceptance rate overall; ED/EA vs RD rates (ED advantage is often 2–3×) — already in colleges table
- SAT/ACT middle-50%, test-optional policy
- Geographic edge (above); legacy/first-gen/recruited factors (CDS C7)
- Demonstrated interest tracked? (CDS C7 — changes visit/email strategy)

**Can I afford it?** (biggest gap in Vantage today — and the #1 real-world decision factor)
- Average net price by family income bracket (Scorecard: `avg_net_price.by_income_level`)
- % need met, merit aid availability (privates that discount heavily vs. ones that don't)
- In-state vs out-of-state tuition delta for publics
- Median federal debt at graduation (Scorecard)

**Will it pay off?**
- Graduation rate (4yr/6yr) and first-year retention (Scorecard)
- Median earnings 6 and 10 years after entry — overall AND by major (Scorecard field-of-study files; earnings vary more by major than by college)
- % employed; grad-school pipelines for pre-med/pre-law kids

**Will I thrive there?**
- Size, student-faculty ratio, urban/suburban/rural, distance from home, climate
- Majors/programs strength; ability to switch majors (matters for undecided kids)
- Campus culture: Greek %, athletics, religious affiliation, diversity mix
- Support systems: first-gen programs, mental-health resources (matters for this audience)

**Logistics** (feeds the digest feature)
- Application plans offered (ED/ED2/EA/REA/rolling) + deadlines
- Supplemental essay load (# prompts × word counts — kids underestimate this)
- Prompt release status for the current cycle

---

## 3. Where the data comes from (all free/public)

| Source | What it gives | How |
|---|---|---|
| **College Scorecard API** (data.gov key, free, 1k req/hr) | Net price by income, earnings 6/10yr, grad/retention rates, debt, size, demographics, admission rate, SAT/ACT bands | One-time sync script → new columns on `colleges`; refresh annually |
| **IPEDS Residence & Migration** | Freshmen by home state per college → the geo-advantage numerator | CSV download (even years) → new `college_residence` table |
| **Common Data Set** (per college, published PDFs/xlsx) | C7 factor matrix (residency, interest, legacy…), admit rates by plan, essay requirements | Top-100 only, AI-assisted extraction once per cycle |
| **College websites / Common App** | Supplemental prompts + release timing | Weekly editorial check Aug–Oct (see §4) |

Suggested schema additions:
```sql
-- colleges: add scorecard fields
alter table colleges add column if not exists net_price_low_income int;   -- 0-48k bracket
alter table colleges add column if not exists net_price_mid_income int;   -- 48-75k
alter table colleges add column if not exists median_earnings_10yr int;
alter table colleges add column if not exists grad_rate numeric;
alter table colleges add column if not exists retention_rate numeric;
alter table colleges add column if not exists median_debt int;
alter table colleges add column if not exists considers_residency boolean; -- CDS C7

-- geographic mix (IPEDS)
create table if not exists college_residence (
  college_id uuid references colleges(id),
  state text not null,
  freshman_count int not null,
  data_year int not null,
  primary key (college_id, state, data_year)
);

-- user_stats: add home state if missing
alter table user_stats add column if not exists home_state text;
```

---

## 4. Prompt-release monitoring + Friday senior digest

**The cycle:** most colleges release 2026-27 supplemental prompts June–September (Common App refreshes Aug 1). Some are already out now (July).

**Design:**
1. `college_prompts` gets `cycle text` (e.g. '2026-27') and `released_at timestamptz`. When a new cycle's prompt is confirmed, insert/update the row with `released_at = now()`.
2. **Weekly editorial check (the hard part):** every Friday Aug–Oct (and biweekly now–July), check the top-100 list's admissions pages + Common App for newly released prompts, and update the table. This is research work — a human-or-AI job, not a cron. Recommended: a **Cowork scheduled task** where Claude checks the release status weekly and prepares the SQL updates for your approval.
3. **Friday digest email (pure code):** Vercel cron → `/api/cron/prompt-digest` (protected by CRON_SECRET) → finds prompts with `released_at` in the last 7 days → sends one Resend email to every grade-12 user: "New prompts out this week: Stanford (3 prompts), Duke (2)… already out: [list]. Log in to start drafting." Unsubscribe link required (CAN-SPAM), and note the minors angle: keep it strictly transactional/service tone.
4. In-app: badge colleges in My Schools whose prompts are out ("Prompts live — 4 supplementals").

**Effort:** #1+#3+#4 ≈ half a day of code. #2 is an ongoing weekly ritual (can start today with a scheduled task).

---

## Sources
- [College Transitions: geographic diversity and admissions](https://www.collegetransitions.com/blog/geographic-diversity-and-college-admissions/)
- [Ivy Coach: the importance of geographic diversity](https://www.ivycoach.com/the-ivy-coach-blog/college-admissions/the-importance-of-geographic-diversity/)
- [CollegeVine: underrepresented states at top colleges](https://www.collegevine.com/faq/117020/underrepresented-states-at-top-colleges-do-i-stand-a-better-chance)
- [College Scorecard API](https://collegescorecard.ed.gov/data/api/) · [API documentation](https://collegescorecard.ed.gov/data/api-documentation/)
- [IPEDS Residence & Migration](https://nces.ed.gov/ipeds/about-ipeds) · [IES: The "Where" of Going to College](https://ies.ed.gov/learn/blog/where-going-college-residence-migration-and-fall-enrollment)
- [College Board: in/out-of-state enrollment trends](https://highered.collegeboard.org/recruitment-admissions/policies-research/beyond-your-campus/state-migration)
