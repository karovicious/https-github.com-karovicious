-- Make enum creation idempotent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','organizer','user');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE public.reservation_status AS ENUM ('pending','confirmed','cancelled','checked_in');
  END IF;
END$$;

-- Ensure extension
create extension if not exists pgcrypto with schema public;

-- Tables (idempotent where possible)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can read their own roles'
  ) THEN
    CREATE POLICY "Users can read their own roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles"
      ON public.user_roles
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  location text,
  image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_events_organizer on public.events(organizer_id);
alter table public.events enable row level security;

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  scheduled_at timestamptz not null,
  capacity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_schedules_event on public.schedules(event_id);
alter table public.schedules enable row level security;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  schedule_id uuid references public.schedules(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  status public.reservation_status not null default 'pending',
  qr_token uuid not null default gen_random_uuid(),
  reserved_at timestamptz not null default now(),
  checked_in_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (qr_token)
);
create index if not exists idx_reservations_event on public.reservations(event_id);
create index if not exists idx_reservations_schedule on public.reservations(schedule_id);
create index if not exists idx_reservations_user on public.reservations(user_id);
create unique index if not exists uq_reservations_schedule_user on public.reservations(schedule_id, user_id) where schedule_id is not null;
alter table public.reservations enable row level security;

-- Functions & triggers (idempotent)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.validate_event_times()
returns trigger as $$
begin
  if new.ends_at is not null and new.starts_at is not null and new.ends_at <= new.starts_at then
    raise exception 'Event ends_at must be after starts_at';
  end if;
  return new;
end;
$$ language plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_events_validate_times'
  ) THEN
    CREATE TRIGGER trg_events_validate_times
      BEFORE INSERT OR UPDATE ON public.events
      FOR EACH ROW EXECUTE FUNCTION public.validate_event_times();
  END IF;
END$$;

create or replace function public.validate_schedule_within_event()
returns trigger as $$
declare
  ev_start timestamptz;
  ev_end timestamptz;
begin
  select starts_at, ends_at into ev_start, ev_end from public.events where id = new.event_id;
  if ev_start is not null and new.scheduled_at < ev_start then
    raise exception 'Schedule time must be after event starts_at';
  end if;
  if ev_end is not null and new.scheduled_at > ev_end then
    raise exception 'Schedule time must be before event ends_at';
  end if;
  return new;
end;
$$ language plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_schedules_validate'
  ) THEN
    CREATE TRIGGER trg_schedules_validate
      BEFORE INSERT OR UPDATE ON public.schedules
      FOR EACH ROW EXECUTE FUNCTION public.validate_schedule_within_event();
  END IF;
END$$;

create or replace function public.ensure_schedule_capacity()
returns trigger as $$
declare
  cap integer;
  current_count integer;
begin
  if new.schedule_id is null then
    return new; -- No schedule capacity to enforce
  end if;
  select capacity into cap from public.schedules where id = new.schedule_id for update;
  if cap is null then
    return new; -- unlimited
  end if;
  select count(*) into current_count
  from public.reservations r
  where r.schedule_id = new.schedule_id
    and r.status in ('pending', 'confirmed');
  if current_count >= cap then
    raise exception 'Schedule is full';
  end if;
  return new;
end;
$$ language plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reservations_capacity'
  ) THEN
    CREATE TRIGGER trg_reservations_capacity
      BEFORE INSERT ON public.reservations
      FOR EACH ROW EXECUTE FUNCTION public.ensure_schedule_capacity();
  END IF;
END$$;

create or replace function public.set_reservation_status_timestamps()
returns trigger as $$
begin
  if new.status = 'checked_in' and (old.status is distinct from new.status) then
    new.checked_in_at = now();
  end if;
  if new.status = 'cancelled' and (old.status is distinct from new.status) then
    new.cancelled_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reservations_status_ts'
  ) THEN
    CREATE TRIGGER trg_reservations_status_ts
      BEFORE UPDATE ON public.reservations
      FOR EACH ROW EXECUTE FUNCTION public.set_reservation_status_timestamps();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_events_updated_at') THEN
    CREATE TRIGGER trg_events_updated_at
      BEFORE UPDATE ON public.events
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_schedules_updated_at') THEN
    CREATE TRIGGER trg_schedules_updated_at
      BEFORE UPDATE ON public.schedules
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reservations_updated_at') THEN
    CREATE TRIGGER trg_reservations_updated_at
      BEFORE UPDATE ON public.reservations
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- RLS policies for events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view public events') THEN
    CREATE POLICY "Public can view public events"
      ON public.events
      FOR SELECT
      TO anon
      USING (is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can view permitted events') THEN
    CREATE POLICY "Authenticated can view permitted events"
      ON public.events
      FOR SELECT
      TO authenticated
      USING (
        is_public = true OR
        organizer_id = auth.uid() OR
        public.has_role(auth.uid(), 'admin')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizers and admins can insert events') THEN
    CREATE POLICY "Organizers and admins can insert events"
      ON public.events
      FOR INSERT
      TO authenticated
      WITH CHECK (
        organizer_id = auth.uid() OR
        public.has_role(auth.uid(), 'admin')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizers and admins can update events') THEN
    CREATE POLICY "Organizers and admins can update events"
      ON public.events
      FOR UPDATE
      TO authenticated
      USING (
        organizer_id = auth.uid() OR
        public.has_role(auth.uid(), 'admin')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizers and admins can delete events') THEN
    CREATE POLICY "Organizers and admins can delete events"
      ON public.events
      FOR DELETE
      TO authenticated
      USING (
        organizer_id = auth.uid() OR
        public.has_role(auth.uid(), 'admin')
      );
  END IF;
END$$;

-- RLS policies for schedules
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view schedules of public events') THEN
    CREATE POLICY "Public can view schedules of public events"
      ON public.schedules
      FOR SELECT
      TO anon
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = schedules.event_id
            AND e.is_public = true
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can view permitted schedules') THEN
    CREATE POLICY "Authenticated can view permitted schedules"
      ON public.schedules
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = schedules.event_id
            AND (
              e.is_public = true OR
              e.organizer_id = auth.uid() OR
              public.has_role(auth.uid(), 'admin')
            )
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizers and admins can insert schedules') THEN
    CREATE POLICY "Organizers and admins can insert schedules"
      ON public.schedules
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = schedules.event_id
            AND (
              e.organizer_id = auth.uid() OR
              public.has_role(auth.uid(), 'admin')
            )
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizers and admins can update schedules') THEN
    CREATE POLICY "Organizers and admins can update schedules"
      ON public.schedules
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = schedules.event_id
            AND (
              e.organizer_id = auth.uid() OR
              public.has_role(auth.uid(), 'admin')
            )
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizers and admins can delete schedules') THEN
    CREATE POLICY "Organizers and admins can delete schedules"
      ON public.schedules
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = schedules.event_id
            AND (
              e.organizer_id = auth.uid() OR
              public.has_role(auth.uid(), 'admin')
            )
        )
      );
  END IF;
END$$;

-- RLS policies for reservations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own reservations') THEN
    CREATE POLICY "Users can view their own reservations"
      ON public.reservations
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Organizers/Admins can view reservations for their events') THEN
    CREATE POLICY "Organizers/Admins can view reservations for their events"
      ON public.reservations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = reservations.event_id
            AND (
              e.organizer_id = auth.uid() OR
              public.has_role(auth.uid(), 'admin')
            )
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own reservation') THEN
    CREATE POLICY "Users can create their own reservation"
      ON public.reservations
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users/Organizers/Admins can update their permitted reservations') THEN
    CREATE POLICY "Users/Organizers/Admins can update their permitted reservations"
      ON public.reservations
      FOR UPDATE
      TO authenticated
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = reservations.event_id
            AND (
              e.organizer_id = auth.uid() OR
              public.has_role(auth.uid(), 'admin')
            )
        )
      )
      WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = reservations.event_id
            AND (
              e.organizer_id = auth.uid() OR
              public.has_role(auth.uid(), 'admin')
            )
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users/Organizers/Admins can delete their permitted reservations') THEN
    CREATE POLICY "Users/Organizers/Admins can delete their permitted reservations"
      ON public.reservations
      FOR DELETE
      TO authenticated
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = reservations.event_id
            AND (
              e.organizer_id = auth.uid() OR
              public.has_role(auth.uid(), 'admin')
            )
        )
      );
  END IF;
END$$;

-- Realtime support (safe if repeated)
alter table public.events replica identity full;
alter table public.schedules replica identity full;
alter table public.reservations replica identity full;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;