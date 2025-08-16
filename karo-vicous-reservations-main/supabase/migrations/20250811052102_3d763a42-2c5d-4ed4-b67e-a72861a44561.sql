-- Idempotent migration to create Events, Schedules, Reservations, and Roles with RLS and triggers

-- 0) Ensure extension for UUID generation
create extension if not exists pgcrypto with schema public;

-- 1) Enums (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'app_role' AND n.nspname = 'public') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','organizer','user');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'reservation_status' AND n.nspname = 'public') THEN
    CREATE TYPE public.reservation_status AS ENUM ('pending','confirmed','cancelled','checked_in');
  END IF;
END$$;

-- 2) Roles support
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Function to check role
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

-- Policies for roles (drop if exist to keep idempotent)
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Events
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

-- 4) Schedules
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

-- 5) Reservations
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

-- 6) Common trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 7) Validation functions & triggers
create or replace function public.validate_event_times()
returns trigger as $$
begin
  if new.ends_at is not null and new.starts_at is not null and new.ends_at <= new.starts_at then
    raise exception 'Event ends_at must be after starts_at';
  end if;
  return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS trg_events_validate_times ON public.events;
CREATE TRIGGER trg_events_validate_times
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_times();

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

DROP TRIGGER IF EXISTS trg_schedules_validate ON public.schedules;
CREATE TRIGGER trg_schedules_validate
  BEFORE INSERT OR UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.validate_schedule_within_event();

-- 8) Capacity enforcement for reservations
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

DROP TRIGGER IF EXISTS trg_reservations_capacity ON public.reservations;
CREATE TRIGGER trg_reservations_capacity
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_schedule_capacity();

-- 9) Reservation status timestamps
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

DROP TRIGGER IF EXISTS trg_reservations_status_ts ON public.reservations;
CREATE TRIGGER trg_reservations_status_ts
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_reservation_status_timestamps();

-- 10) updated_at triggers
DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_schedules_updated_at ON public.schedules;
CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reservations_updated_at ON public.reservations;
CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11) RLS policies (drop if exist then create fresh)
-- Events
DROP POLICY IF EXISTS "Public can view public events" ON public.events;
CREATE POLICY "Public can view public events"
  ON public.events
  FOR SELECT
  TO anon
  USING (is_public = true);

DROP POLICY IF EXISTS "Authenticated can view permitted events" ON public.events;
CREATE POLICY "Authenticated can view permitted events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    is_public = true OR
    organizer_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Organizers and admins can insert events" ON public.events;
CREATE POLICY "Organizers and admins can insert events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Organizers and admins can update events" ON public.events;
CREATE POLICY "Organizers and admins can update events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    organizer_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Organizers and admins can delete events" ON public.events;
CREATE POLICY "Organizers and admins can delete events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    organizer_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin')
  );

-- Schedules
DROP POLICY IF EXISTS "Public can view schedules of public events" ON public.schedules;
CREATE POLICY "Public can view schedules of public events"
  ON public.schedules
  FOR SELECT
  TO anon
  USING (
    exists (
      select 1 from public.events e where e.id = schedules.event_id and e.is_public = true
    )
  );

DROP POLICY IF EXISTS "Authenticated can view permitted schedules" ON public.schedules;
CREATE POLICY "Authenticated can view permitted schedules"
  ON public.schedules
  FOR SELECT
  TO authenticated
  USING (
    exists (
      select 1 from public.events e
      where e.id = schedules.event_id
        and (
          e.is_public = true or
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Organizers and admins can insert schedules" ON public.schedules;
CREATE POLICY "Organizers and admins can insert schedules"
  ON public.schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.events e
      where e.id = schedules.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Organizers and admins can update schedules" ON public.schedules;
CREATE POLICY "Organizers and admins can update schedules"
  ON public.schedules
  FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.events e
      where e.id = schedules.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Organizers and admins can delete schedules" ON public.schedules;
CREATE POLICY "Organizers and admins can delete schedules"
  ON public.schedules
  FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.events e
      where e.id = schedules.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- Reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
CREATE POLICY "Users can view their own reservations"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Organizers/Admins can view reservations for their events" ON public.reservations;
CREATE POLICY "Organizers/Admins can view reservations for their events"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    exists (
      select 1 from public.events e
      where e.id = reservations.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Users can create their own reservation" ON public.reservations;
CREATE POLICY "Users can create their own reservation"
  ON public.reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users/Organizers/Admins can update their permitted reservations" ON public.reservations;
CREATE POLICY "Users/Organizers/Admins can update their permitted reservations"
  ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() or
    exists (
      select 1 from public.events e
      where e.id = reservations.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  )
  WITH CHECK (
    user_id = auth.uid() or
    exists (
      select 1 from public.events e
      where e.id = reservations.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Users/Organizers/Admins can delete their permitted reservations" ON public.reservations;
CREATE POLICY "Users/Organizers/Admins can delete their permitted reservations"
  ON public.reservations
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() or
    exists (
      select 1 from public.events e
      where e.id = reservations.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- 12) Realtime support
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.schedules REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'schedules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;
END$$;