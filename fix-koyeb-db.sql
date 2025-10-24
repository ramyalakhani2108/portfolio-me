-- Fix Koyeb DB for Portfolio App
-- Adds missing columns and removes problematic constraints

-- 1. Add is_active column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Remove foreign key constraint from profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Remove fk_profiles_user_id foreign key constraint from profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_user_id;
