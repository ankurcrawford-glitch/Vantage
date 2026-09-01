-- Vantage: per-school application status
-- Not started (null) / in_progress / submitted / decision.
-- Closes the loop: submitted schools drop off the deadline radar and
-- the dashboard can say "3 submitted, 4 to go."
-- (The UPDATE policy on user_colleges already exists from the
-- application_plan migration.)

alter table user_colleges add column if not exists app_status text;

select count(*)::int as user_college_rows from user_colleges;
