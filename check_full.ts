
import { createClient } from '@supabase/supabase-js';

const supabase = createClient("https://bdxkcfngskagriaapepo.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkeGtjZm5nc2thZ3JpYWFwZXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTc4NzMsImV4cCI6MjA5MjM5Mzg3M30.w-KTLrUYHyvhg7bJVMvgoQ_P-G001NH9cDLo0tuCfQc");

async function checkBio() {
  const { data, error } = await supabase.from('bio_config').select('*');
  console.log('--- BIO CONFIGS ---');
  console.log(JSON.stringify(data, null, 2));
}

checkBio();
