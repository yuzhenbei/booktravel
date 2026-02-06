-- Create profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create books table
create table books (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  author text not null,
  cover_url text,
  nickname text,
  location text, -- Current general location, e.g. "Shenzhen"
  status text check (status in ('available', 'traveling', 'reserved')) default 'available',
  owner_id uuid references profiles(id), -- Who registered the book
  current_holder_id uuid references profiles(id), -- Who currently has it
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create travel_nodes table (The journey history)
create table travel_nodes (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references books(id) not null,
  user_id uuid references profiles(id), -- Operator of this node
  department text, -- Snapshot of user's department/location
  node_type text check (node_type in ('start', 'transit', 'current', 'end')),
  action_date timestamp with time zone default timezone('utc'::text, now()) not null,
  note text
);

-- Create posts table (Community)
create table posts (
  id uuid default uuid_generate_v4() primary key,
  targert_user_id uuid references profiles(id), -- e.g. "All users" or specific
  author_id uuid references profiles(id) not null,
  book_id uuid references books(id),
  content text,
  image_urls text[], -- Array of image URLs
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  likes_count int default 0,
  comments_count int default 0,
  tag text
);

-- Create notifications table
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null, -- Recipient
  type text check (type in ('handover', 'interaction', 'system')),
  title text not null,
  content text,
  is_read boolean default false,
  related_link text, -- e.g. link to a post or book
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table books enable row level security;
alter table travel_nodes enable row level security;
alter table posts enable row level security;
alter table notifications enable row level security;

-- Policies (Simplified for initial setup - mostly public read, auth write)

-- Profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Books
create policy "Books are viewable by everyone."
  on books for select
  using ( true );

create policy "Authenticated users can insert books."
  on books for insert
  with check ( auth.role() = 'authenticated' );

create policy "Holders can update book status."
  on books for update
  using ( auth.uid() = current_holder_id OR auth.uid() = owner_id );

-- Posts
create policy "Posts are viewable by everyone."
  on posts for select
  using ( true );

create policy "Authenticated users can create posts."
  on posts for insert
  with check ( auth.role() = 'authenticated' );

-- Notifications
create policy "Users can view their own notifications."
  on notifications for select
  using ( auth.uid() = user_id );

create policy "System or other users can create notifications."
  on notifications for insert
  with check ( true ); -- Ideally usage restricted via function, but open for now
