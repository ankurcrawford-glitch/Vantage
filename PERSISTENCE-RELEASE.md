# Persistence reliability release

This branch fixes the save failures and false success states identified in the September 16 audit. It has **not been deployed**, and no production database data has been changed by this work.

## What changes for students

- Both essay editors save from the first draft, keep a browser recovery copy while unsaved, serialize writes, and refuse to overwrite a newer draft from another session.
- Explicitly saved checkpoints stay intact. Saving does not reload the editor over newer typing. Failed reads block editing instead of pretending an essay is empty.
- Story Builder answers update the same question reliably; Story Builder and Spark keep recovery text. Spark refuses overlong text instead of cutting it off.
- Foundations onboarding only reports completion after its student summary is stored; failures keep the last answer available to retry.
- Chat only acknowledges a reply after history is stored. Retries reuse a turn identifier. Recent history and free FAQ replies survive reload. A history-load failure is visible.
- Roadmap and activity controls show failures instead of displaying an unconfirmed change. Refreshing profile lists preserves unsaved academic fields.
- Linked activities synchronize their shared fields transactionally. Deleting a linked activity removes its linked counterpart, with a confirmation. Application-specific descriptions and dates remain intact.
- Early application plan changes are atomic. Reviewer acceptance verifies the signed-in, confirmed email against the invitation. Support reports success only after storing the request.
- AI guidance warns when its output was not saved to history. Story Builder's access action opens support instead of a payment flow.

## Required release order

1. Back up the production database and use an isolated Supabase project with the **actual schema and policies**, plus anonymized representative data. Local tests use a minimal PostgreSQL fixture; they cannot establish compatibility with unseen production constraints or policies.
2. Run `supabase-persistence-preflight.sql`. Investigate duplicates, missing prerequisites, permissive reviewer policies, and multiple current versions. Preserve all drafts/answers while reconciling; do not automatically choose or delete a duplicate. Check the existing unique `(essay_id,user_id)` permission constraint required by acceptance.
3. Apply `supabase-common-app-prompts.sql`, then `supabase-persistence-reliability.sql` in the isolated project. The reliability migration is transactional and aborts on duplicate answers/mirrors. Re-run it to check idempotency. Existing saved versions become protected checkpoints; no historical records are deleted by the migration.
4. Run `npm ci`, `npm run typecheck`, `npm test`, and `npm run build`. Preview against the isolated project. Verify the smoke scenarios below using student and reviewer test accounts.
5. Coordinate a production maintenance window: prevent writes, ask active editors to save/copy their writing and close their tabs, back up, repeat preflight, apply both SQL files, deploy the matching app revision, then reopen access and require existing tabs to reload. **Old clients write directly and do not participate in revision checking.** Do not leave old editor sessions writing during rollout.
6. Verify the same smoke scenarios in production using dedicated test records. Monitor API save errors and database errors. Do not mark this issue resolved solely because the build or local tests pass.

The migration installs RPCs used by the new app. Deploying the app first will break saves. Applying the triggers while the old activity mirroring code is active can conflict with its separate writes; the maintenance window is required.

## Smoke scenarios

- All seven Common App prompts and a supplemental essay: first save, edit, checkpoint, refresh, sign out/in, restore, delete a version.
- Throttled/offline connection: keep typing during save, retry, leave/return before autosave; verify exact text and honest save status. Try two tabs; stale text must not overwrite the newer server draft.
- Save and reopen all twelve Story Builder answers. Recover an unsaved answer after refresh. Spark accepts exactly 8,000 characters and rejects 8,001 without truncation.
- Edit GPA/strategy, mutate an activity/AP/award list, confirm the unsaved academic text remains.
- Confirm/edit/remove a linked activity from both products. Check shared fields and preserved application descriptions/dates. Existing divergent pairs are intentionally not bulk-overwritten: review them separately; the next explicit edit wins.
- Roadmap toggle failure, activity failure, missing college plan target, rejected chat history write, free FAQ reload, support database failure.
- Intended reviewer accepts and reads; wrong account, anonymous user, expired/revoked invitation, and forged permission cannot read student work. Test comment permissions separately against the actual deployed comment policies.

## Evidence and limits

`tests/database.test.cjs` executes the real prompt seed twice, enforces the prompt foreign key, runs the migration in PostgreSQL (PGlite), and exercises owner/reviewer RLS, atomic rollback, stale revisions, repeat saves, synchronization and migration reruns. `tests/editor.test.cjs` mounts the actual React hook and exercises slow/failing writes and recovery. `tests/handlers.test.cjs` runs actual handler functions with failed storage/network responses. CI runs tests and TypeScript checking on PRs and main.

Browser recovery is per browser/user; it is not a server backup and may be unavailable in restricted storage environments. The app warns when storage fails. AI extraction/summary jobs remain best effort; they are not a substitute for the durable transcript or explicit profile entries. AI output that failed history persistence must be copied before leaving. Automated tests do not replace an authenticated production walkthrough.

## Rollback

Keep a database backup and the previous deployment available. If verification fails, stop writes and restore the previous app **together with** a reviewed database rollback/backup restore. Do not casually drop columns/functions or revert to direct writes while new editors remain open. Preserve drafts created since the backup before restoring it. Reviewer permission policy changes must not be undone by reinstating the insecure self-grant policy.
