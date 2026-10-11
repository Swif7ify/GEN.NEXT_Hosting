-- ==============================================================
-- Deployment Playground: Supabase Demo Schema
-- ==============================================================

-- 1. Create demonstration table (isolated from production data)
CREATE TABLE IF NOT EXISTS public.demo_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.demo_entries ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anonymous demo read access
CREATE POLICY "Allow demo select"
ON public.demo_entries
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Policy: Allow anonymous demo write access
CREATE POLICY "Allow demo insert"
ON public.demo_entries
FOR INSERT
TO anon, authenticated
WITH CHECK (char_length(name) <= 50);

-- Index for timestamp sorting
CREATE INDEX IF NOT EXISTS idx_demo_entries_created_at
ON public.demo_entries (created_at DESC);
