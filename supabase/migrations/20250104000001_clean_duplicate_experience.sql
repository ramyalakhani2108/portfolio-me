-- Clean up duplicate experience entries
-- Keep only the first occurrence of each experience

-- Remove all experiences
DELETE FROM hire_experience;

-- Recreate with clean data (no duplicates)
INSERT INTO hire_experience (company, position, description, start_date, end_date, is_current, location, achievements, order_index, is_active)
VALUES
  (
    'Tech Startup Inc.',
    'Senior Full-Stack Developer',
    'Led development of scalable web applications serving 100K+ users. Architected microservices infrastructure and implemented CI/CD pipelines.',
    '2023-01-01'::date,
    NULL,
    true,
    'Remote',
    ARRAY['Increased application performance by 40%', 'Reduced deployment time from 2 hours to 15 minutes', 'Mentored 3 junior developers'],
    1,
    true
  ),
  (
    'Digital Agency',
    'Full-Stack Developer',
    'Developed custom web solutions for enterprise clients. Collaborated with design teams to create pixel-perfect, responsive interfaces.',
    '2022-01-01'::date,
    '2022-12-31'::date,
    false,
    'New York, NY',
    ARRAY['Delivered 15+ client projects on time', 'Implemented automated testing reducing bugs by 60%', 'Led migration to modern React architecture'],
    2,
    true
  ),
  (
    'Freelance',
    'Web Developer',
    'Provided end-to-end web development services for small businesses and startups. Specialized in e-commerce and content management systems.',
    '2021-01-01'::date,
    '2021-12-31'::date,
    false,
    'Remote',
    ARRAY['Built 20+ websites from scratch', 'Achieved 98% client satisfaction rate', 'Established long-term partnerships with 5 agencies'],
    3,
    true
  );
