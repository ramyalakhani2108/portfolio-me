import { createClient } from "@supabase/supabase-js";

// You need to replace these with your actual Supabase credentials
// Get them from your Supabase project settings
const supabaseUrl = "https://fwizozqegwzmyunggfxv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aXpvenFlZ3d6bXl1bmdnZnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjQzMDcsImV4cCI6MjA2OTYwMDMwN30.RSkPGXnmuXYgYhdOu3uOUjHpwhaRlDXu3MvUQUXax4Q";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
