-- Fix profiles table foreign key constraint
-- This script removes the incorrect foreign key constraint and modifies the id column

-- First, drop the old foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Now the id column should be an independent UUID primary key
-- The table is already set up correctly in terms of columns,
-- we just needed to remove the foreign key

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
