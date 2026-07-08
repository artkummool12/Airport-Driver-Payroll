import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://ypwcxnswkdrdnntpfvmj.supabase.co';
const rawKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwd2N4bnN3a2RyZG5udHBmdm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Nzk3NTksImV4cCI6MjA5OTA1NTc1OX0.Df3cQ6LYKpZtxFZyqJWvsU69UmHP_GNdiPHlN997mq4';

// Clean up Supabase URL: make sure it never has /rest/v1 or trailing slashes
let cleanUrl = rawUrl.trim();
// Remove any "/rest/v1" case-insensitively, anywhere it occurs at the end or middle
cleanUrl = cleanUrl.replace(/\/rest\/v1/gi, '');
// Remove any trailing slashes
cleanUrl = cleanUrl.replace(/\/+$/, '');

const supabaseUrl = cleanUrl;
const supabaseAnonKey = rawKey.trim();

console.log('Supabase URL Initialized:', {
  rawUrl,
  supabaseUrl
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

