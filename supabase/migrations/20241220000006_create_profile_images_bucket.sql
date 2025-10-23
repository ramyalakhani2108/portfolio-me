-- PostgreSQL Profile Images Configuration
-- This migration configures profile image handling for PostgreSQL
-- Note: Actual file storage is handled by application layer (local filesystem or cloud CDN)

-- Update profiles table to ensure avatar_url column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing profile with default avatar if none exists
UPDATE public.profiles 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer&accessories=sunglasses&accessoriesChance=100&clothingGraphic=skull&top=shortHair&topChance=100&facialHair=goatee&facialHairChance=100'
WHERE avatar_url IS NULL OR avatar_url = '';

-- Create index for avatar_url queries
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON public.profiles(avatar_url);

-- Migration completed successfully for PostgreSQL
-- Profile image URLs configured
