-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: Receipts
create table if not exists receipts (
  id uuid primary key default uuid_generate_v4(),
  image_path text,
  total_amount numeric,
  merchant_name text,
  purchase_date date,
  created_at timestamptz default now()
);

-- Table: Receipt Items
create table if not exists receipt_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references receipts(id) on delete cascade,
  name text not null,
  quantity numeric default 1,
  price numeric,
  total_price numeric
);

-- Table: Budget / Expenses (Simple Daily Log)
-- We can aggregate from receipts, but sometimes we might want manual entry or just caching daily totals.
-- For MVP, let's just use receipts. But we need to store the Weekly Budget settings somewhere?
-- Maybe a simple Key-Value store or just hardcode in ENV for MVP as per instruction (210€).
-- Let's keep it simple.

-- Storage Bucket for Receipts
insert into storage.buckets (id, name, public) 
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- RLS Policies (Simple for MVP: Allow generic access since we use a publishable key + server)
-- WARNING: In a real app, strict RLS is needed.
-- For this MVP usage with just one family, we will allow anon read/write for simplicity of the prompt "Simple > Perfect".
-- Ideally, we'd use auth. But the prompt says "One family... Mini App... Backend".

alter table receipts enable row level security;
alter table receipt_items enable row level security;

create policy "Allow generic access" on receipts for all using (true) with check (true);
create policy "Allow generic access" on receipt_items for all using (true) with check (true);

-- Storage Policy
create policy "Public Access" on storage.objects for all using ( bucket_id = 'receipts' );
