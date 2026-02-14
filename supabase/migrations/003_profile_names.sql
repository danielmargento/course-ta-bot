-- Add first/last name columns to profiles
alter table profiles add column first_name text not null default '';
alter table profiles add column last_name text not null default '';

-- Update trigger to populate names from user metadata
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role, display_name, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;
