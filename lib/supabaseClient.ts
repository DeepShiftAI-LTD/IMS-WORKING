
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rhoabmsfmeemvfyiqlxl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob2FibXNmbWVlbXZmeWlxbHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODc1OTYsImV4cCI6MjA3OTk2MzU5Nn0.GRshI9jSU8vvJYWm_GM2fQp_3ISBEzZFKyrHG2LXwW4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
