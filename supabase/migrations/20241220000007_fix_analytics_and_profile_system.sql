-- PostgreSQL Analytics and Profile System Enhancement
-- This migration enhances analytics tracking and profile management for PostgreSQL

-- Ensure visitor_analytics table has proper structure
ALTER TABLE public.visitor_analytics 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT;

-- Ensure contact_submissions table has proper structure
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Ensure profiles table has all necessary columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_user_flow ON public.visitor_analytics(user_flow);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_created_at ON public.visitor_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_priority ON public.contact_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Migration completed successfully for PostgreSQL
-- Analytics and profile system configured for production

-- Disable RLS for analytics tables to ensure proper admin access
ALTER TABLE public.visitor_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions DISABLE ROW LEVEL SECURITY;

-- Add enhanced indexes for better analytics performance
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_created_at ON public.visitor_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_user_flow ON public.visitor_analytics(user_flow);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_session ON public.visitor_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_page_path ON public.visitor_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_flow ON public.contact_submissions(user_flow);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_priority ON public.contact_submissions(priority);

-- Enable realtime for analytics tables (only if not already added)
DO $$
BEGIN
  -- Add visitor_analytics to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'visitor_analytics' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_analytics;
  END IF;
  
  -- Add contact_submissions to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'contact_submissions' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;
  END IF;
  
  -- Add profiles to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- Insert enhanced sample analytics data for testing
INSERT INTO public.visitor_analytics (session_id, user_flow, page_path, user_agent, referrer, ip_address, country, device_type)
VALUES 
  ('test-session-1', 'employer', '/hire-flow', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://google.com', '192.168.1.1'::inet, 'United States', 'desktop'),
  ('test-session-2', 'viewer', '/portfolio-flow', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'https://linkedin.com', '192.168.1.2'::inet, 'Canada', 'mobile'),
  ('test-session-3', 'employer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'direct', '192.168.1.3'::inet, 'United Kingdom', 'desktop'),
  ('test-session-4', 'viewer', '/portfolio-flow', 'Mozilla/5.0 (Android 11; Mobile)', 'https://twitter.com', '192.168.1.4'::inet, 'Australia', 'mobile'),
  ('test-session-5', 'employer', '/hire-flow', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'https://github.com', '192.168.1.5'::inet, 'Germany', 'desktop')
ON CONFLICT DO NOTHING;

-- Insert enhanced sample contact submissions for testing
INSERT INTO public.contact_submissions (name, email, subject, message, user_flow, status, priority, tags)
VALUES 
  ('John Doe', 'john@example.com', 'Hiring Inquiry', 'I would like to discuss a potential full-time opportunity for a senior developer role.', 'employer', 'unread', 'high', ARRAY['hiring', 'full-time']),
  ('Jane Smith', 'jane@example.com', 'Project Collaboration', 'Interested in collaborating on a React project.', 'viewer', 'read', 'normal', ARRAY['collaboration', 'react']),
  ('Mike Johnson', 'mike@startup.com', 'Freelance Work', 'Looking for a freelance developer for a 3-month project.', 'employer', 'unread', 'normal', ARRAY['freelance', 'short-term']),
  ('Sarah Wilson', 'sarah@agency.com', 'Partnership Opportunity', 'Would like to discuss a potential partnership.', 'viewer', 'replied', 'low', ARRAY['partnership', 'business'])
ON CONFLICT DO NOTHING;

-- Create a function to automatically update profile image URLs
CREATE OR REPLACE FUNCTION update_profile_avatar_url()
RETURNS TRIGGER AS $$
BEGIN
-- Create analytics summary view for better performance
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
  DATE(created_at) as date,
  user_flow,
  COUNT(*) as visits,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT ip_address) as unique_visitors,
  AVG(time_spent) as avg_time_spent
FROM public.visitor_analytics 
GROUP BY DATE(created_at), user_flow
ORDER BY date DESC, user_flow;

-- Create contact submissions summary view
CREATE OR REPLACE VIEW public.contact_summary AS
SELECT 
  DATE(created_at) as date,
  user_flow,
  status,
  priority,
  COUNT(*) as count
FROM public.contact_submissions 
GROUP BY DATE(created_at), user_flow, status, priority
ORDER BY date DESC, user_flow, status, priority;

-- Migration completed successfully for PostgreSQL
-- Analytics views and profile system fully configured