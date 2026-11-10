import { createClient } from '@supabase/supabase-js';

// Server-only client (service-role key). Never import this in a 'use client' file.
export const db = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
