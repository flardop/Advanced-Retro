-- Additional RLS Policies for User Registration & OAuth
-- Run these in the Supabase SQL Editor if they're not already created

-- Allow users to INSERT their own profile (for registration)
create policy "users can insert own profile"
on users for insert
with check (auth.uid() = id);

-- Allow users to UPDATE their own profile
create policy "users can update own profile"
on users for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Allow users to create orders
create policy "users can create own orders"
on orders for insert
with check (auth.uid() = user_id);

-- Allow users to update their own orders (cancel, etc)
create policy "users can update own orders"
on orders for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Optional: Allow admins to read all users (if you have role-based access)
create policy "admins can read all users"
on users for select
using (
  exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  )
);
