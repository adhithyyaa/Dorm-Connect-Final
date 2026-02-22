
-- Allow primary admin to delete profiles (for rejecting admins)
create policy "Primary admin can delete profiles"
  on public.profiles for delete
  to authenticated
  using (public.has_role(auth.uid(), 'primary_admin'));

-- Allow primary admin to delete user_roles
create policy "Primary admin can delete user_roles"
  on public.user_roles for delete
  to authenticated
  using (public.has_role(auth.uid(), 'primary_admin'));
