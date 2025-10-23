-- Fix duplicate professional summary sections in hire_sections table
-- This migration removes duplicate hero sections and ensures only one exists

-- First, identify if there are duplicates
DO $$
DECLARE
  hero_count INT;
BEGIN
  -- Count hero sections
  SELECT COUNT(*) INTO hero_count FROM public.hire_sections WHERE section_type = 'hero';
  
  IF hero_count > 1 THEN
    -- Delete all hero sections and recreate with proper data
    DELETE FROM public.hire_sections WHERE section_type = 'hero';
    
    -- Insert single hero section with enhanced fields
    INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
    VALUES (
      'hero',
      'Professional Summary',
      '{
        "headline": "Ramya Lakhani - Full-Stack Developer",
        "tagline": "Building scalable web applications with modern technologies",
        "bio": "Passionate developer creating amazing digital experiences with modern technologies",
        "profile_photo": "",
        "email": "lakhani.ramya.u@gmail.co",
        "phone": "+91 7202800803",
        "location": "India",
        "cta_text": "Let''s Work Together",
        "background_image": "",
        "show_avatar": true,
        "avatar_text": "RL"
      }',
      1,
      true
    );
    
    RAISE NOTICE 'Removed % duplicate hero sections and created single hero section', (hero_count - 1);
  ELSIF hero_count = 0 THEN
    -- Create hero section if it doesn't exist
    INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
    VALUES (
      'hero',
      'Professional Summary',
      '{
        "headline": "Ramya Lakhani - Full-Stack Developer",
        "tagline": "Building scalable web applications with modern technologies",
        "bio": "Passionate developer creating amazing digital experiences with modern technologies",
        "profile_photo": "",
        "email": "lakhani.ramya.u@gmail.co",
        "phone": "+91 7202800803",
        "location": "India",
        "cta_text": "Let''s Work Together",
        "background_image": "",
        "show_avatar": true,
        "avatar_text": "RL"
      }',
      1,
      true
    );
    
    RAISE NOTICE 'Created hero section (was missing)';
  END IF;
END
$$;

-- Ensure other default sections exist (skills, experience, contact, resume)
INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'skills', 'Technical Skills', '{
  "description": "Comprehensive skill set across the full development stack",
  "show_proficiency": true,
  "layout": "grid"
}', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'skills');

INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'experience', 'Professional Experience', '{
  "description": "Career progression and key achievements",
  "show_timeline": true,
  "show_achievements": true
}', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'experience');

INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'contact', 'Get In Touch', '{
  "description": "Ready to discuss your next project",
  "submit_text": "Send Message",
  "success_message": "Thank you for your message! I''ll get back to you within 24 hours."
}', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'contact');

INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'resume', 'Download Resume', '{
  "button_text": "Download PDF Resume",
  "file_url": "",
  "version": "1.0",
  "last_updated": "2024-03-15"
}', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'resume');
