-- Vault: Initial Schema

-- Items table (movies & books)
create table items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('movie', 'book')),
  title text not null,
  creator text,
  year int,
  cover_image_url text,
  status text not null,
  progress int check (progress >= 0 and progress <= 100),
  finished_month text check (finished_month in ('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec')),
  finished_year int,
  imdb_id text,
  openlibrary_id text,
  created_at timestamptz not null default now(),

  -- Status validation per type
  constraint valid_movie_status check (
    type != 'movie' or status in ('watched', 'want_to')
  ),
  constraint valid_book_status check (
    type != 'book' or status in ('read', 'reading', 'want_to')
  ),
  -- Progress only for reading
  constraint progress_only_reading check (
    progress is null or status = 'reading'
  )
);

-- Quotes table
create table quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  source_item_id uuid references items(id) on delete set null,
  source_title text not null,
  source_creator text not null,
  type text not null check (type in ('movie', 'book')),
  created_at timestamptz not null default now()
);

-- Screenshots table (Claude extraction pipeline)
create table screenshots (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  processed boolean not null default false,
  result_item_id uuid references items(id) on delete set null,
  result_quote_id uuid references quotes(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_items_type on items(type);
create index idx_items_status on items(status);
create index idx_items_created_at on items(created_at desc);
create index idx_quotes_type on quotes(type);
create index idx_quotes_created_at on quotes(created_at desc);
create index idx_quotes_source_item on quotes(source_item_id);
create index idx_screenshots_processed on screenshots(processed);

-- Row Level Security
alter table items enable row level security;
alter table quotes enable row level security;
alter table screenshots enable row level security;

-- RLS Policies: authenticated users only
create policy "Auth users: select items" on items for select to authenticated using (true);
create policy "Auth users: insert items" on items for insert to authenticated with check (true);
create policy "Auth users: update items" on items for update to authenticated using (true);
create policy "Auth users: delete items" on items for delete to authenticated using (true);

create policy "Auth users: select quotes" on quotes for select to authenticated using (true);
create policy "Auth users: insert quotes" on quotes for insert to authenticated with check (true);
create policy "Auth users: update quotes" on quotes for update to authenticated using (true);
create policy "Auth users: delete quotes" on quotes for delete to authenticated using (true);

create policy "Auth users: select screenshots" on screenshots for select to authenticated using (true);
create policy "Auth users: insert screenshots" on screenshots for insert to authenticated with check (true);
create policy "Auth users: update screenshots" on screenshots for update to authenticated using (true);
create policy "Auth users: delete screenshots" on screenshots for delete to authenticated using (true);
