-- Clean up duplicate skills entries
-- Keep only the first occurrence of each skill

-- Remove all skills
DELETE FROM hire_skills;

-- Recreate with clean data (no duplicates)
INSERT INTO hire_skills (name, category, proficiency, color, order_index, is_active)
VALUES
  ('React', 'Frontend', 90, '#61dafb', 1, true),
  ('TypeScript', 'Language', 88, '#3178c6', 2, true),
  ('Node.js', 'Backend', 85, '#339933', 3, true),
  ('Python', 'Language', 82, '#3776ab', 4, true),
  ('PostgreSQL', 'Database', 80, '#336791', 5, true),
  ('AWS', 'Cloud', 75, '#ff9900', 6, true),
  ('Docker', 'DevOps', 78, '#2496ed', 7, true),
  ('GraphQL', 'API', 85, '#e10098', 8, true);
