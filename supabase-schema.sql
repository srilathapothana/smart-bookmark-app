-- =====================================================
-- Smart Bookmark App — Supabase Schema
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for the bookmarks table
-- (Run this after creating the table)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;

-- Optional: Index for faster user-specific queries
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx 
  ON public.bookmarks(user_id);

CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx 
  ON public.bookmarks(created_at DESC);
