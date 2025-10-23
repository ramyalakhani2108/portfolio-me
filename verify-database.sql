-- Database Verification Report
-- This script verifies all migrations and default data

-- 1. AUTH USERS COUNT
SELECT COUNT(*) as "Total Auth Users" FROM public.auth_users;

-- 2. ADMIN USERS
SELECT username, email, is_active FROM public.admins ORDER BY username;

-- 3. HIRE SECTIONS
SELECT section_type, title, order_index, is_active FROM public.hire_sections ORDER BY order_index;

-- 4. HIRE SKILLS SUMMARY
SELECT COUNT(*) as "Total Skills", 
       STRING_AGG(DISTINCT category, ', ') as "Categories"
FROM public.hire_skills;

-- 5. HIRE EXPERIENCES
SELECT company, position, is_current FROM public.hire_experience ORDER BY order_index;

-- 6. HIRE CONTACT FIELDS
SELECT label, field_type, is_required FROM public.hire_contact_fields ORDER BY order_index;

-- 7. PORTFOLIO SKILLS
SELECT name, category, proficiency FROM public.skills ORDER BY category LIMIT 10;

-- 8. MIGRATION HISTORY
SELECT COUNT(*) as "Total Migrations Executed" FROM public.schema_migrations;

-- 9. TABLE STATISTICS
SELECT COUNT(*) as "Total Tables" 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
