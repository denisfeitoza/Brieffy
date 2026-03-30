import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const id = 'e25c5683-31cc-4ad0-917d-277e66b81f57';
  console.log('Fetching session:', id);
  console.log('Using URL:', supabaseUrl);
  
  const { data: session, error: err1 } = await supabase.from('briefing_sessions').select('*').eq('id', id).single();
  console.log('Session result:', session, err1);
  if (session?.template_id) {
    const { data: template, error: err2 } = await supabase.from('briefing_templates').select('*').eq('id', session.template_id).single();
    console.log('Template result:', template, err2);
  }
}
test().catch(console.error);
