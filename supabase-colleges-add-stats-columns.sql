-- Run this in Supabase SQL Editor ONCE before supabase-colleges-seed-top100.sql
-- if your colleges table was created without acceptance_rate / SAT columns.
-- Adds the columns if they don't exist (safe to run multiple times).

alter table public.colleges
  add column if not exists acceptance_rate decimal,
  add column if not exists sat_range_low int,
  add column if not exists sat_range_high int;
