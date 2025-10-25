-- Create portfolio_hero_settings table for managing hero section content
CREATE TABLE IF NOT EXISTS public.portfolio_hero_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Creative Developer',
  title_highlight TEXT DEFAULT 'Developer',
  subtitle TEXT NOT NULL DEFAULT 'Crafting digital experiences that blend',
  subtitle_highlight_1 TEXT DEFAULT 'innovation',
  subtitle_highlight_2 TEXT DEFAULT 'functionality',
  description TEXT,
  hero_image_url TEXT,
  cta_button_1_text TEXT DEFAULT 'Explore My Work',
  cta_button_1_action TEXT DEFAULT 'projects',
  cta_button_2_text TEXT DEFAULT 'Let''s Connect',
  cta_button_2_action TEXT DEFAULT 'contact',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert default hero settings
INSERT INTO public.portfolio_hero_settings (
  title,
  title_highlight,
  subtitle,
  subtitle_highlight_1,
  subtitle_highlight_2,
  description,
  cta_button_1_text,
  cta_button_1_action,
  cta_button_2_text,
  cta_button_2_action
) VALUES (
  'Creative',
  'Developer',
  'Crafting digital experiences that blend',
  'innovation',
  'functionality',
  'Full-Stack Developer',
  'Explore My Work',
  'projects',
  'Let''s Connect',
  'contact'
) ON CONFLICT DO NOTHING;

-- Enable RLS on portfolio_hero_settings
ALTER TABLE public.portfolio_hero_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow public to read
CREATE POLICY "Allow public to read hero settings" ON public.portfolio_hero_settings
  FOR SELECT USING (true);

-- Policy to allow authenticated admins to update
CREATE POLICY "Allow authenticated admins to update hero settings" ON public.portfolio_hero_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated admins to insert
CREATE POLICY "Allow authenticated admins to insert hero settings" ON public.portfolio_hero_settings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated admins to delete
CREATE POLICY "Allow authenticated admins to delete hero settings" ON public.portfolio_hero_settings
  FOR DELETE
  USING (auth.role() = 'authenticated');
