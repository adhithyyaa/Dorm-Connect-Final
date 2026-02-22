
-- Create role enum
create type public.app_role as enum ('student', 'admin', 'primary_admin');

-- User roles table (security requirement: roles in separate table)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Security definer function to check roles (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Profiles table
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  username text not null unique,
  name text,
  roll_number text,
  room_number text,
  email text,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Complaints table
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  student_name text not null,
  room_number text not null,
  description text not null,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'declined')),
  admin_id uuid references auth.users(id),
  resolution_description text,
  resolution_image_url text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.complaints enable row level security;

-- SOS alerts table
create table public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  room_number text not null,
  triggered_by text not null default 'Anonymous',
  created_at timestamptz not null default now(),
  active boolean not null default true
);
alter table public.sos_alerts enable row level security;

-- Storage bucket for complaint/resolution images
insert into storage.buckets (id, name, public) values ('complaint-images', 'complaint-images', true);

-- Update timestamp trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- ===== RLS Policies =====

-- user_roles: users read own, primary_admin reads all
create policy "Users can read their own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Primary admin can read all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'primary_admin'));

-- profiles: users read/update own, admins read all, primary admin update all
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'primary_admin')
  );

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid());

create policy "Primary admin can update any profile"
  on public.profiles for update
  to authenticated
  using (public.has_role(auth.uid(), 'primary_admin'));

-- complaints: students read own + insert own, admins read all + update
create policy "Students can read their own complaints"
  on public.complaints for select
  to authenticated
  using (student_id = auth.uid());

create policy "Admins can read all complaints"
  on public.complaints for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'primary_admin')
  );

create policy "Students can insert their own complaints"
  on public.complaints for insert
  to authenticated
  with check (student_id = auth.uid());

create policy "Admins can update complaints"
  on public.complaints for update
  to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'primary_admin')
  );

-- sos_alerts: anyone can insert (public SOS), admins can read/update
create policy "Anyone can insert SOS alerts"
  on public.sos_alerts for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read SOS alerts"
  on public.sos_alerts for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'primary_admin')
  );

create policy "Admins can update SOS alerts"
  on public.sos_alerts for update
  to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'primary_admin')
  );

-- Storage policies
create policy "Anyone can read complaint images"
  on storage.objects for select
  using (bucket_id = 'complaint-images');

create policy "Authenticated users can upload complaint images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'complaint-images');
