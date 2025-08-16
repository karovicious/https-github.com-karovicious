-- Enable extension for UUID generation if not already enabled
create extension if not exists pgcrypto with schema public;

-- 1) Enums
create type public.app_role as enum ('admin', 'organizer', 'user');
create type public.reservation_status as enum ('pending', 'confirmed', 'cancelled', 'checked_in');

-- 2) Roles support
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Function to check role (SECURITY DEFINER to avoid recursive RLS issues)
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

-- Allow users to read their own roles
create policy "Users can read their own roles"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow admins to fully manage roles
create policy "Admins can manage roles"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 3) Events
create table public.events (
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

create index idx_events_organizer on public.events(organizer_id);

alter table public.events enable row level security;

-- 4) Schedules (sessions)
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  scheduled_at timestamptz not null,
  capacity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_schedules_event on public.schedules(event_id);

alter table public.schedules enable row level security;

-- 5) Reservations
create table public.reservations (
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

create index idx_reservations_event on public.reservations(event_id);
create index idx_reservations_schedule on public.reservations(schedule_id);
create index idx_reservations_user on public.reservations(user_id);
create unique index if not exists uq_reservations_schedule_user on public.reservations(schedule_id, user_id) where schedule_id is not null;

alter table public.reservations enable row level security;

-- 6) Common: updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 7) Validation: event time consistency
create or replace function public.validate_event_times()
returns trigger as $$
begin
  if new.ends_at is not null and new.starts_at is not null and new.ends_at <= new.starts_at then
    raise exception 'Event ends_at must be after starts_at';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_events_validate_times
  before insert or update on public.events
  for each row execute function public.validate_event_times();

-- 8) Validation: schedule within event window
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

create trigger trg_schedules_validate
  before insert or update on public.schedules
  for each row execute function public.validate_schedule_within_event();

-- 9) Capacity enforcement for schedule reservations
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

create trigger trg_reservations_capacity
  before insert on public.reservations
  for each row execute function public.ensure_schedule_capacity();

-- 10) Auto-set timestamps on reservation status changes
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

create trigger trg_reservations_status_ts
  before update on public.reservations
  for each row execute function public.set_reservation_status_timestamps();

-- 11) updated_at triggers
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.update_updated_at_column();

create trigger trg_schedules_updated_at
  before update on public.schedules
  for each row execute function public.update_updated_at_column();

create trigger trg_reservations_updated_at
  before update on public.reservations
  for each row execute function public.update_updated_at_column();

-- 12) RLS policies
-- Events
create policy "Public can view public events"
  on public.events
  for select
  to anon
  using (is_public = true);

create policy "Authenticated can view permitted events"
  on public.events
  for select
  to authenticated
  using (
    is_public = true or
    organizer_id = auth.uid() or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Organizers and admins can insert events"
  on public.events
  for insert
  to authenticated
  with check (
    organizer_id = auth.uid() or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Organizers and admins can update events"
  on public.events
  for update
  to authenticated
  using (
    organizer_id = auth.uid() or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Organizers and admins can delete events"
  on public.events
  for delete
  to authenticated
  using (
    organizer_id = auth.uid() or
    public.has_role(auth.uid(), 'admin')
  );

-- Schedules
create policy "Public can view schedules of public events"
  on public.schedules
  for select
  to anon
  using (
    exists (
      select 1 from public.events e
      where e.id = schedules.event_id
        and e.is_public = true
    )
  );

create policy "Authenticated can view permitted schedules"
  on public.schedules
  for select
  to authenticated
  using (
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

create policy "Organizers and admins can insert schedules"
  on public.schedules
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = schedules.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

create policy "Organizers and admins can update schedules"
  on public.schedules
  for update
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = schedules.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

create policy "Organizers and admins can delete schedules"
  on public.schedules
  for delete
  to authenticated
  using (
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
create policy "Users can view their own reservations"
  on public.reservations
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Organizers/Admins can view reservations for their events"
  on public.reservations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = reservations.event_id
        and (
          e.organizer_id = auth.uid() or
          public.has_role(auth.uid(), 'admin')
        )
    )
  );

create policy "Users can create their own reservation"
  on public.reservations
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users/Organizers/Admins can update their permitted reservations"
  on public.reservations
  for update
  to authenticated
  using (
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
  with check (
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

create policy "Users/Organizers/Admins can delete their permitted reservations"
  on public.reservations
  for delete
  to authenticated
  using (
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

-- 13) Realtime support
alter table public.events replica identity full;
alter table public.schedules replica identity full;
alter table public.reservations replica identity full;

alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.schedules;
alter publication supabase_realtime add table public.reservations;