-- USERS
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'user',
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- CATEGORIES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text
);

-- PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  price integer not null,
  status text not null default 'new',
  stock integer not null default 0,
  category_id uuid references categories(id),
  description text,
  long_description text,
  curiosities text[] default '{}',
  tips text[] default '{}',
  images text[] default '{}',
  created_at timestamptz default now()
);

-- ORDERS
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  total integer not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  unit_price integer not null
);

-- INDEXES
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_orders_user on orders(user_id);

-- RLS
alter table users enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- USERS policies
create policy "users can read own profile"
on users for select
using (auth.uid() = id);

-- PRODUCTS/CATEGORIES public read
create policy "products read"
on products for select
using (true);

create policy "categories read"
on categories for select
using (true);

-- ORDERS policies
create policy "orders read own"
on orders for select
using (auth.uid() = user_id);

create policy "order items read own"
on order_items for select
using (exists (
  select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
));
