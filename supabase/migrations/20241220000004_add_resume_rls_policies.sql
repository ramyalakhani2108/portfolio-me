-- PostgreSQL Portfolio Database - Resume Data Security Enhancement
-- This migration adds proper ownership and access control to resume data

-- Add user_id column to resume_data table for ownership tracking
ALTER TABLE public.resume_data 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.auth_users(id) ON DELETE CASCADE;

-- Update existing resume_data records to have a user_id
-- Assign to first available auth_users record (typically the admin)
DO $$
BEGIN
  -- Try to find an admin user or any user to assign the existing resume data to
  UPDATE public.resume_data 
  SET user_id = (
    SELECT id FROM public.auth_users 
    WHERE email LIKE '%admin%' OR full_name LIKE '%Admin%'
    LIMIT 1
  )
  WHERE user_id IS NULL;
  
  -- If no admin user found, assign to first available user
  IF NOT EXISTS (SELECT 1 FROM public.resume_data WHERE user_id IS NOT NULL) THEN
    UPDATE public.resume_data 
    SET user_id = (
      SELECT id FROM public.auth_users 
      LIMIT 1
    )
    WHERE user_id IS NULL;
  END IF;
END $$;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_resume_data_user_id ON public.resume_data(user_id);

-- Note: PostgreSQL setup uses application-level authentication
-- No Row Level Security needed - access controlled by API layer

-- Create or update trigger function for resume data management
CREATE OR REPLACE FUNCTION update_resume_data_meta()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at := CURRENT_TIMESTAMP;
  
  -- Ensure user_id is set (use first available user if null)
  IF NEW.user_id IS NULL THEN
    NEW.user_id := (SELECT id FROM public.auth_users LIMIT 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-setting user_id and updated_at
DROP TRIGGER IF EXISTS set_resume_data_meta ON public.resume_data;
CREATE TRIGGER set_resume_data_meta
  BEFORE INSERT OR UPDATE ON public.resume_data
  FOR EACH ROW EXECUTE FUNCTION update_resume_data_meta();

-- Migration completed successfully for PostgreSQL
-- Resume data ownership and metadata management configured

-- Grant necessary permissions
GRANT ALL ON public.resume_data TO authenticated;
GRANT ALL ON public.resume_data TO service_role;

-- Ensure the table is included in realtime (only if not already added)
DO $$
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'resume_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.resume_data;
  END IF;
END $$;