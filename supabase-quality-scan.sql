-- Vantage: helper for the weekly AI quality scan report.
-- Lets the service-role cron resolve user ids to emails for the
-- admin audit email. Locked down: only service_role may execute.

create or replace function get_user_emails(user_ids uuid[])
returns table (id uuid, email text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email::text from auth.users u where u.id = any(user_ids);
$$;

revoke all on function get_user_emails(uuid[]) from public, anon, authenticated;
grant execute on function get_user_emails(uuid[]) to service_role;

select 'get_user_emails ready' as status;
