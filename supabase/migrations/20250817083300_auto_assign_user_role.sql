-- Create function to automatically assign 'user' role to new registrations
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert default 'user' role for new user
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
exception
  when others then
    -- Log error but don't fail the user creation
    raise warning 'Failed to assign default role to user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Create trigger to run after user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.user_roles to anon, authenticated;
