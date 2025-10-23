-- Create resume_data table for storing manual resume information
-- This table stores structured resume data in JSONB format for PostgreSQL
CREATE TABLE IF NOT EXISTS public.resume_data (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Note: File storage handled by application layer (local filesystem or cloud storage)
-- No database storage tables needed for PostgreSQL setup

-- Insert default resume data structure
INSERT INTO public.resume_data (id, content) VALUES (
  'main',
  '{
    "personalInfo": {
      "fullName": "Ramya Lakhani",
      "email": "lakhani.ramya.u@gmail.co",
      "phone": "+91 7202800803",
      "location": "India",
      "website": "",
      "linkedin": "",
      "github": "",
      "summary": "Passionate full-stack developer with expertise in modern web technologies, creating scalable applications and innovative digital solutions."
    },
    "education": [],
    "certifications": [],
    "languages": ["English", "Hindi"],
    "interests": "Web Development, Open Source, Technology Innovation"
  }'
) ON CONFLICT (id) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resume_data_updated_at ON public.resume_data(updated_at DESC);

-- Create function for updating updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at timestamp
DROP TRIGGER IF EXISTS update_resume_data_updated_at ON public.resume_data;
CREATE TRIGGER update_resume_data_updated_at 
  BEFORE UPDATE ON public.resume_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update default profile avatar to developer avatar (using external service)
UPDATE public.profiles 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=portfolio&accessories=prescription02&accessoriesChance=100&clothingGraphic=code&top=shortHair&topChance=100&facialHair=light&facialHairChance=100&skinColor=light'
WHERE avatar_url IS NULL OR avatar_url = '';

-- Migration completed successfully for PostgreSQL
-- Resume data table and profile enhancements added
