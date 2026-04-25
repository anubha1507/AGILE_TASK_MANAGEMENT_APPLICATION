import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olwnruzaqlesxpjwfevf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sd25ydXphcWxlc3hwandmZXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Njc1NzQsImV4cCI6MjA5MjU0MzU3NH0.jBKyssxyqU3vMu4a4jqDnTnAIPNZibRF-nxBA6F2c0o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
