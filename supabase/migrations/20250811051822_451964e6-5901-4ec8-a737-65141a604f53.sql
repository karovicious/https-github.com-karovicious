-- Harden trigger functions with explicit search_path to satisfy linter

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validate_event_times()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ends_at is not null and new.starts_at is not null and new.ends_at <= new.starts_at then
    raise exception 'Event ends_at must be after starts_at';
  end if;
  return new;
end;
$$;

create or replace function public.validate_schedule_within_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function public.ensure_schedule_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function public.set_reservation_status_timestamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'checked_in' and (old.status is distinct from new.status) then
    new.checked_in_at = now();
  end if;
  if new.status = 'cancelled' and (old.status is distinct from new.status) then
    new.cancelled_at = now();
  end if;
  return new;
end;
$$;