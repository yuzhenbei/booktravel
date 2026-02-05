-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  department text,
  bio text,
  updated_at timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. BOOKS (Books in the system)
create table public.books (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  author text not null,
  cover_url text,
  nickname text, -- "旅行昵称"

  -- Owner/Holder Info
  owner_id uuid references public.profiles(id), -- Initial owner
  current_holder_id uuid references public.profiles(id), -- Who has it now

  -- Status
  status text check (status in ('available', 'traveling', 'reserved')) default 'available',
  current_location text, -- Physical location description e.g. "3F 休闲区"

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.books enable row level security;

create policy "Books are viewable by everyone."
  on books for select
  using ( true );

create policy "Authenticated users can create books."
  on books for insert
  with check ( auth.role() = 'authenticated' );

create policy "Holders or Owners can update books."
  on books for update
  using ( auth.uid() = owner_id or auth.uid() = current_holder_id );

-- 3. TRAVEL_HISTORY (The journey of the book)
create table public.travel_history (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references public.books(id) not null,
  user_id uuid references public.profiles(id) not null,

  action_type text check (action_type in ('start', 'transit', 'receive', 'return')),
  department_snapshot text, -- Capture dept at time of action
  location_snapshot text,
  note text, -- "寄语"

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.travel_history enable row level security;

create policy "History is viewable by everyone."
  on travel_history for select
  using ( true );

create policy "Authenticated users can add history."
  on travel_history for insert
  with check ( auth.role() = 'authenticated' );

-- 4. POSTS (Community Feed)
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  book_id uuid references public.books(id), -- Optional link to a book

  content text not null,
  image_urls text[], -- Array of image URLs
  tag text, -- e.g. "跨部门交流", "深度阅读"

  likes_count int default 0,
  comments_count int default 0,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone."
  on posts for select
  using ( true );

create policy "Authenticated users can create posts."
  on posts for insert
  with check ( auth.role() = 'authenticated' );

-- 5. NOTIFICATIONS
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  recipient_id uuid references public.profiles(id) not null,
  sender_id uuid references public.profiles(id), -- Optional

  type text check (type in ('handover', 'interaction', 'system')),
  title text not null,
  content text,
  related_link text, -- e.g., /book/123

  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications."
  on notifications for select
  using ( auth.uid() = recipient_id );

create policy "System or Users can insert notifications."
  on notifications for insert
  with check ( auth.role() = 'authenticated' ); -- Simplified for demo

-- FUNCTIONS & TRIGGERS (Auto-create profile on signup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 1. 启用扩展
create extension if not exists "pgcrypto";

-- 2. 修正 profiles 表的约束 (允许 2 个字符的用户名，如"小李")
alter table public.profiles drop constraint if exists username_length;
alter table public.profiles add constraint username_length check (char_length(username) >= 2);

-- 3. 清理旧数据 (为了避免冲突，先清理关联表)
truncate table public.notifications cascade;
truncate table public.posts cascade;
truncate table public.travel_history cascade;
truncate table public.books cascade;
-- 我们不删除 auth.users 和 profiles，而是用 ON CONFLICT 更新它们

-- 4. 插入/更新 模拟用户 (Auth)
-- Alex Chen
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex@booktravel.com', crypt('password123', gen_salt('bf')), now(), '{"username": "Alex Chen", "avatar_url": "https://picsum.photos/seed/me/100/100"}')
ON CONFLICT (id) DO NOTHING;

-- Sarah Jenkins
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah@booktravel.com', crypt('password123', gen_salt('bf')), now(), '{"username": "Sarah Jenkins", "avatar_url": "https://picsum.photos/seed/avatar1/100/100"}')
ON CONFLICT (id) DO NOTHING;

-- 王经理
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'wang@booktravel.com', crypt('password123', gen_salt('bf')), now(), '{"username": "王经理", "avatar_url": "https://picsum.photos/seed/u11/100/100"}')
ON CONFLICT (id) DO NOTHING;

-- 小李
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'li@booktravel.com', crypt('password123', gen_salt('bf')), now(), '{"username": "小李", "avatar_url": "https://picsum.photos/seed/u1/100/100"}')
ON CONFLICT (id) DO NOTHING;

-- 5. 插入/更新 用户资料 (Profiles)
INSERT INTO public.profiles (id, username, avatar_url, department, bio) VALUES
('a0000000-0000-0000-0000-000000000001', 'Alex Chen', 'https://picsum.photos/seed/me/100/100', '设计部', '热爱阅读与设计的混合体'),
('a0000000-0000-0000-0000-000000000002', 'Sarah Jenkins', 'https://picsum.photos/seed/avatar1/100/100', '产品部', '产品副总裁'),
('a0000000-0000-0000-0000-000000000003', '王经理', 'https://picsum.photos/seed/u11/100/100', '深圳总部', '技术部经理'),
('a0000000-0000-0000-0000-000000000004', '小李', 'https://picsum.photos/seed/u1/100/100', '研发部', '全栈工程师')
ON CONFLICT (id) DO UPDATE SET 
  username = EXCLUDED.username, 
  department = EXCLUDED.department,
  avatar_url = EXCLUDED.avatar_url;

-- 6. 插入书籍 (Books) - 已修复列名
INSERT INTO public.books (id, title, author, cover_url, nickname, current_location, status, owner_id, current_holder_id) VALUES
('b0000000-0000-0000-0000-000000000001', '午夜图书馆', 'Matt Haig', 'https://picsum.photos/seed/book1/400/600', '回声寻找者', '产品部 - 4F', 'available', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
('b0000000-0000-0000-0000-000000000002', '原子习惯', 'James Clear', 'https://picsum.photos/seed/book2/400/600', '习惯大师', '人力资源部 - 2F', 'traveling', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004'),
('b0000000-0000-0000-0000-000000000003', '沙丘', 'Frank Herbert', 'https://picsum.photos/seed/book3/400/600', '香料之路', '技术部 - 5F', 'available', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
('b0000000-0000-0000-0000-000000000004', '设计心理学', '唐纳德·诺曼', 'https://picsum.photos/seed/book4/400/600', '造物主视角', '1F 咖啡驿站', 'available', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000005', '创新自信力', '汤姆·凯利', 'https://picsum.photos/seed/book5/400/600', '破局者', '3F 休闲区', 'available', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
('b0000000-0000-0000-0000-000000000006', '非暴力沟通', '马歇尔·卢森堡', 'https://picsum.photos/seed/book_nvc/400/600', '和平鸽', '深圳总部', 'traveling', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- 7. 插入漂流历史 (Travel History)
INSERT INTO public.travel_history (book_id, user_id, action_type, department_snapshot, location_snapshot, note, created_at) VALUES
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'start', '行政部', '行政前台', '开启它的旅程', now() - interval '2 months'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'transit', '技术部', '工位', '非常棒的书', now() - interval '1 month'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'receive', '市场部', '会议室', '在午后的咖啡时光里享受阅读！码头尽头那束绿光依然让人感怀。', now());

-- 8. 插入社区动态 (Posts)
INSERT INTO public.posts (user_id, book_id, content, tag, likes_count, comments_count, image_urls, created_at) VALUES
('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', '读书笔记：这是一本改变了我沟通方式的书，期待它在技术部开启一段奇妙的旅程。希望你能从中受益...', '跨部门交流', 128, 24, ARRAY['https://picsum.photos/seed/feed_a1/400/400', 'https://picsum.photos/seed/feed_b1/400/400'], now() - interval '2 hours'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '每天进步1%，一年后你将进步37倍。这本书不仅教你方法，更重塑你的思维。', '深度阅读', 56, 8, ARRAY['https://picsum.photos/seed/feed_a2/400/400', 'https://picsum.photos/seed/feed_b2/400/400'], now() - interval '5 hours'),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', '作为领导者，如何激发团队的创造力？书中给出了非常实操的建议。', '领导力', 92, 15, ARRAY['https://picsum.photos/seed/feed_a3/400/400', 'https://picsum.photos/seed/feed_b3/400/400'], now() - interval '1 day');

-- 9. 插入通知 (Notifications)
INSERT INTO public.notifications (recipient_id, sender_id, type, title, content, is_read, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'handover', '新的书籍接力', '小李发起了《非暴力沟通》的传阅，你是下一站接待人，请及时确认。', false, now() - interval '10 minutes'),
('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'interaction', '获得点赞', '王经理点赞了你在《原子习惯》中留下的感悟寄语。', false, now() - interval '2 hours');





-- 1. 创建评论表 (如果刚才没创建)
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 开启 RLS
alter table public.comments enable row level security;

-- 3. 策略
drop policy if exists "Comments are viewable by everyone." on comments;
create policy "Comments are viewable by everyone."
  on comments for select
  using ( true );

drop policy if exists "Authenticated users can create comments." on comments;
create policy "Authenticated users can create comments."
  on comments for insert
  with check ( auth.role() = 'authenticated' );

-- 4. 创建增加评论数的 RPC 函数
create or replace function increment_comments_count(row_id uuid)
returns void as $$
begin
  update public.posts
  set comments_count = comments_count + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

do $$
declare
  -- 定义变量存储 Post ID
  post_wang_id uuid;
  post_alex_id uuid;
  post_sarah_id uuid;
  
  -- 定义用户 ID (之前脚本中固定的 UUID)
  user_alex_id uuid := 'a0000000-0000-0000-0000-000000000001';
  user_sarah_id uuid := 'a0000000-0000-0000-0000-000000000002';
  user_li_id uuid := 'a0000000-0000-0000-0000-000000000004';
begin
  -- 1. 查找 Post ID (根据内容片段查找，假设之前的 Seed 数据已插入)
  select id into post_wang_id from public.posts where content like '读书笔记：这是一本改变了我沟通方式的书%' limit 1;
  select id into post_alex_id from public.posts where content like '每天进步1%，一年后你将进步37倍%' limit 1;
  select id into post_sarah_id from public.posts where content like '作为领导者，如何激发团队的创造力%' limit 1;

  -- 2. 插入评论 (如果 Post 存在)
  
  -- 给 王经理的 Post (关于非暴力沟通)
  if post_wang_id is not null then
    insert into public.comments (post_id, user_id, content, created_at) values
    (post_wang_id, user_li_id, '很有共鸣，我也在读这一章节！', now() - interval '1 hour'),
    (post_wang_id, user_sarah_id, '感谢分享，这种沟通方式确实对跨部门协作很有帮助。', now() - interval '30 minutes');
    
    -- 更新计数
    update public.posts set comments_count = 2 where id = post_wang_id;
  end if;

  -- 给 Alex 的 Post (关于原子习惯)
  if post_alex_id is not null then
    insert into public.comments (post_id, user_id, content, created_at) values
    (post_alex_id, user_sarah_id, '微小的改变，巨大的力量。同意！', now() - interval '2 hours'),
    (post_alex_id, user_li_id, '已经在实践早起打卡了，效果不错。', now() - interval '1 hour');
    
    -- 更新计数
    update public.posts set comments_count = 2 where id = post_alex_id;
  end if;

  -- 给 Sarah 的 Post (关于创新)
  if post_sarah_id is not null then
    insert into public.comments (post_id, user_id, content, created_at) values
    (post_sarah_id, user_alex_id, 'IDEO 的方法论确实经典。', now() - interval '1 day');
    
    -- 更新计数
    update public.posts set comments_count = 1 where id = post_sarah_id;
  end if;
  
end $$;




-- 创建申请接待的 RPC 函数
create or replace function apply_for_book(book_uuid uuid, user_uuid uuid)
returns void as $$
begin
  -- 1. 检查书籍是否可用
  if not exists (select 1 from public.books where id = book_uuid and status = 'available') then
    raise exception 'Book is not available for application';
  end if;

  -- 2. 更新书籍状态
  update public.books
  set 
    status = 'traveling', -- 或者 'reserved'
    current_holder_id = user_uuid,
    current_location = (select department from public.profiles where id = user_uuid) -- 假设位置变更为用户所在部门
  where id = book_uuid;

  -- 3. 插入漂流历史
  insert into public.travel_history (book_id, user_id, action_type, department_snapshot, location_snapshot, note)
  values (
    book_uuid, 
    user_uuid, 
    'receive', 
    (select department from public.profiles where id = user_uuid),
    '申请接待',
    '通过线上申请成功接待此书'
  );
end;
$$ language plpgsql security definer;


