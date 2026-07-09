# Vantage — Security & Minor-Safety Compliance Review

**Date:** July 9, 2026
**Scope:** Database security, application security, and legal obligations arising from serving users aged 13–18.
**Important caveat:** This is a technical review, not legal advice. Before launch/scale, have a lawyer (ideally one who works with ed-tech/youth products) review the terms, privacy policy, and the applicability calls below.

---

## 1. What's in good shape

### Database security (verified today in Supabase)
- Row-Level Security enabled on **all 21 tables** (fixed `colleges` today — that was the "critical" advisor email).
- Security Advisor: **0 errors**. Warnings reduced 10 → 3; the remaining 3 are either intentional (permission-check functions must be callable by signed-in users) or plan-gated (leaked-password protection requires Supabase Pro).
- Fixed today: removed a policy that let anyone edit the college catalog; removed `"System can create permissions"` which let any signed-in user grant themselves access to any student's essay; invitation updates now restricted to the owning student or the invitee; permission grants now require a matching email invitation; helper functions have pinned `search_path` and anon execution revoked.

### Application security
- Anthropic/Stripe/Supabase service keys are server-side only; client uses the anon key with RLS.
- Rate limiting on expensive AI routes (thinking-partner, round-table, extract-activities).
- Invitation-token lookups go through a server API (admin client) instead of a public table read — tokens are no longer enumerable.
- Debug error-detail leakage to the client removed (today).
- Account self-deletion exists (`/api/delete-account`) and the privacy policy accurately describes retention (30-day backups, minimal records after deletion).
- No third-party ad trackers or analytics SDKs found in the app — this avoids the worst COPPA/NY-CDPA problems (behavioral advertising to minors).

### Legal groundwork already present
- Signup requires an explicit 13+ confirmation, stored with a timestamp (`age_confirmed_13_plus`, `age_confirmed_at`).
- Terms (§2) require under-18 users to review with a parent/guardian and require parental authorization for paid subscriptions.
- Privacy policy is written for a minor audience, states no sale/sharing of data, no under-13 collection, and includes a parent-contact channel.
- Both AI chat routes instruct the model not to counsel on mental-health topics and to redirect to a trusted adult.

---

## 2. Legal landscape (as of July 2026) and how it applies

### COPPA (federal) — amended rule, full compliance deadline was April 22, 2026
Applies to under-13 users. Vantage is teen-directed (13–18) and blocks under-13 at signup, which is the standard approach. Notes:
- The 2025 amendments expanded "personal information" (biometrics, government IDs — Vantage collects neither) and added data-retention limits ("no indefinite retention").
- The FTC's preferred age gate is a **neutral** one (e.g., ask birth date) rather than a pre-framed "I confirm I'm 13+" checkbox, which invites false attestation. Low-effort improvement below.

### New York Child Data Protection Act (effective June 20, 2025)
Applies to services **used by or targeted to under-18s** — Vantage squarely qualifies if any NY students use it. Key duties:
- No processing of 13–17-year-olds' personal data beyond what is **strictly necessary** to provide the requested service, absent separate informed consent. Vantage's processing (essays, activities, chat, stats → to deliver the product the student signed up for) fits "strictly necessary," but this means: **no marketing emails, no ad targeting, no data enrichment** without a separate, refusable consent prompt.
- **No sale of minors' data** (Vantage doesn't sell — keep it that way and keep saying so).
- **Data-processing agreements required with all processors.** Action: accept/execute the DPAs offered by Supabase, Anthropic, Stripe, Vercel, and Upstash (all offer standard ones).

### AI companion-chatbot laws — CA SB 243 (eff. Jan 1, 2026) and NY S-3008C (eff. Nov 5, 2025)
These target "companion" chatbots that sustain human-like, relationship-style interactions. Vantage's counselor/conversation is task-scoped (college prep), which likely lands in the carve-outs for narrow-purpose bots — **but** the Foundations "Conversation" feature is warm, persistent across sessions, and remembers the student, which is exactly the gray zone regulators described. The cheap move is to comply with the core requirements anyway, since they're good practice for a teen product:
1. **Clear AI disclosure** at the start of every chat and a persistent "AI" label in the UI ("Compass is a computer program, not a human"). *(Currently absent — neither chat UI states the counselor is AI.)*
2. **Break/AI reminder for long sessions** (both laws use a 3-hour cadence).
3. **Crisis protocol**: detect expressions of suicidal ideation/self-harm and respond with a referral to crisis services (988 Suicide & Crisis Lifeline, Crisis Text Line: text HOME to 741741) — not just "talk to a trusted adult." Publish a short page describing this protocol. *(Current system prompts redirect to a trusted adult but provide no crisis resources.)*

### FERPA
Not applicable today — Vantage is direct-to-consumer, not operating under a school contract. Revisit if you ever sell to schools/districts.

### Payments (minors + Stripe)
Minors generally can't form binding contracts. Terms already require parental authorization; add a checkout-time affirmation ("A parent or guardian is completing this purchase") so the requirement is enforced at the moment of payment, not just in the terms.

---

## 3. Prioritized action list

**P0 — do before/at launch (legal exposure or child-safety)**
1. Add AI disclosure to both chat UIs: first-message banner + persistent label. (~1 hr)
2. Add crisis-resource language (988 / Crisis Text Line) to both chat system prompts, and a `/safety` page describing the protocol. (~1–2 hrs)
3. Execute DPAs with Supabase, Anthropic, Stripe, Vercel, Upstash. (admin work, no code)
4. Add parent/guardian affirmation checkbox to checkout. (~30 min)

**P1 — soon**
5. Replace the "I'm 13+" checkbox with a neutral birth-date (or birth-year) field; keep storing the attestation + timestamp; block under-13 with a neutral message. Store the derived under-18 flag (the app already has `isUnder18` state but should persist it).
6. Raise Supabase Auth minimum password length 6 → 8 (Dashboard → Authentication → Sign In/Providers → Email).
7. Write a short internal data-retention policy (COPPA amendments require retention limits): e.g., auto-delete accounts inactive 24+ months after email warning; document backup windows.
8. Add the every-3-hours AI reminder in chat sessions (trivial timer; sessions rarely reach it, but it's the letter of the law).

**P2 — as you grow**
9. Upgrade to Supabase Pro to enable leaked-password protection (advisor warning clears).
10. If you add marketing emails, analytics SDKs, or any data sharing: stop and design the NY-CDPA consent prompt first (separate, refusable, revocable, once per year, no dark patterns).
11. Breach-response plan: who notifies whom, within what window (state laws typically 30–90 days; NY SHIELD Act applies).
12. Annual re-review — CA SB 243 reporting obligations begin July 2027 if the companion-chatbot classification ever applies to you.

---

## 4. What I'd tell a lawyer to look at specifically
- Whether Foundations "Conversation"/"Counselor" meets the CA SB 243 / NY S-3008C "companion chatbot" definitions or their narrow-purpose exemptions.
- Whether Vantage's processing inventory fully fits NY CDPA "strictly necessary" (it appears to, since there's no advertising/marketing processing).
- Terms §2 enforceability of parental-authorization-for-payment, and whether checkout affirmation is sufficient.
- CCPA/CPRA: policy already references know/delete/correct rights; confirm thresholds (likely not met at current scale).

## Sources
- [FTC: final COPPA rule changes (Jan 2025)](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data)
- [Federal Register: COPPA rule, compliance dates](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
- [Taft: COPPA amendments effective June 23, 2025](https://www.privacyanddatasecurityinsight.com/2025/05/childrens-online-privacy-protection-act-amendments-effective-june-23-2025/)
- [NY AG: Child Data Protection Act guidance](https://ag.ny.gov/child-data-protection-act-guidance)
- [Goodwin: NY CDPA in effect — what to do](https://www.goodwinlaw.com/en/insights/publications/2025/06/alerts-practices-dpc-new-yorks-child-data-protection-act-now-effect)
- [Skadden: California SB 243 companion chatbot law](https://www.skadden.com/insights/publications/2025/10/new-california-companion-chatbot-law)
- [FPF: chatbot legislation comparison (SB 243 and beyond)](https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/)
- [Fenwick: NY AI companion safeguard law in effect](https://www.fenwick.com/insights/publications/new-yorks-ai-companion-safeguard-law-takes-effect)
- [MoFo: NY + CA AI companion laws compared](https://www.mofo.com/resources/insights/251120-new-york-and-california-enact-landmark-ai)
