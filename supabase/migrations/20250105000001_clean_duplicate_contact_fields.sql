-- Clean up duplicate contact field entries
-- Keep only the first occurrence of each contact field

-- Remove all contact fields
DELETE FROM hire_contact_fields;

-- Recreate with clean data (no duplicates)
INSERT INTO hire_contact_fields (field_type, label, placeholder, is_required, order_index, is_active)
VALUES
  ('text', 'Full Name', 'Enter your full name', true, 1, true),
  ('email', 'Email Address', 'your.email@company.com', true, 2, true),
  ('text', 'Company', 'Your company name', false, 3, true),
  ('text', 'Subject', 'Brief subject line', true, 4, true),
  ('textarea', 'Message', 'Tell me about your project or opportunity...', true, 5, true);
