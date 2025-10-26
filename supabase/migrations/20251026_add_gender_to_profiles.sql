-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')) DEFAULT 'male';

-- Set the default gender to male for the main profile
UPDATE public.profiles 
SET gender = 'male' 
WHERE id = (SELECT id FROM public.auth_users LIMIT 1);

-- Add a comment to explain the column
COMMENT ON COLUMN public.profiles.gender IS 'Gender information for pronouns usage in AI assistant (male, female, other)';
