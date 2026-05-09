-- Fix and harden appointment saving flow
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  reminder_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER DEFAULT 30;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $do$
BEGIN
  -- Backfill from common legacy column names when available.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'date'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'time'
  ) THEN
    EXECUTE 'UPDATE public.appointments
      SET scheduled_at = COALESCE(scheduled_at, (date::text || '' '' || time::text)::timestamptz)
      WHERE scheduled_at IS NULL';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'appointment_date'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'appointment_time'
  ) THEN
    EXECUTE 'UPDATE public.appointments
      SET scheduled_at = COALESCE(scheduled_at, (appointment_date::text || '' '' || appointment_time::text)::timestamptz)
      WHERE scheduled_at IS NULL';
  END IF;
END
$do$ LANGUAGE plpgsql;

UPDATE public.appointments SET title = COALESCE(NULLIF(title, ''), 'Appointment');
UPDATE public.appointments SET reminder_minutes = COALESCE(reminder_minutes, 30);
UPDATE public.appointments SET created_at = COALESCE(created_at, now());
UPDATE public.appointments SET updated_at = COALESCE(updated_at, now());
UPDATE public.appointments SET scheduled_at = COALESCE(scheduled_at, now());

ALTER TABLE public.appointments
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN scheduled_at SET NOT NULL,
  ALTER COLUMN reminder_minutes SET NOT NULL,
  ALTER COLUMN reminder_minutes SET DEFAULT 30,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_reminder_minutes_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_reminder_minutes_check
  CHECK (reminder_minutes >= 0 AND reminder_minutes <= 10080);

CREATE INDEX IF NOT EXISTS idx_appointments_user_time
  ON public.appointments(user_id, scheduled_at ASC);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their appointments" ON public.appointments;

CREATE POLICY "Users can view their appointments"
  ON public.appointments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their appointments"
  ON public.appointments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their appointments"
  ON public.appointments
  FOR DELETE
  USING (auth.uid() = user_id);
