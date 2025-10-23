-- Remove all duplicate sections and recreate with proper structure
-- Keep only ONE of each section type

-- Delete all sections first
DELETE FROM hire_sections;

-- Recreate all sections with correct data
INSERT INTO hire_sections (section_type, title, content, order_index, is_active)
VALUES 
(
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
),
(
  'skills',
  'Technical Skills',
  '{
    "description": "Comprehensive skill set across the full development stack",
    "show_proficiency": true,
    "layout": "grid"
  }',
  2,
  true
),
(
  'experience',
  'Professional Experience',
  '{
    "description": "Career progression and key achievements",
    "show_timeline": true,
    "show_achievements": true
  }',
  3,
  true
),
(
  'contact',
  'Get In Touch',
  '{
    "description": "Ready to discuss your next project",
    "submit_text": "Send Message",
    "success_message": "Thank you for your message! I''ll get back to you within 24 hours."
  }',
  4,
  true
),
(
  'resume',
  'Download Resume',
  '{
    "button_text": "Download PDF Resume",
    "file_url": "",
    "version": "1.0",
    "last_updated": "2024-03-15"
  }',
  5,
  true
);
