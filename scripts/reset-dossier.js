const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vnjbtflgemwvjrcrvuse.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuamJ0ZmxnZW13dmpyY3J2dXNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY3NDAwOCwiZXhwIjoyMDY3MjUwMDA4fQ.C9hIHuO14DCMbDVIvteZTCHVISyQhfG9N1MYripFdIc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sessionId = 'b9ef6f16-51c3-4263-b6fd-e886ee264648';

  const { data: session } = await supabase
    .from('briefing_sessions')
    .select('final_assets')
    .eq('id', sessionId)
    .single();

  if (session && session.final_assets) {
    const newAssets = { ...session.final_assets };
    delete newAssets.document; // Rimuove o documento

    const { error } = await supabase
      .from('briefing_sessions')
      .update({ final_assets: newAssets })
      .eq('id', sessionId);
      
    if (error) console.error(error);
    else console.log('✅ Final assets cleared for session. Button should be back!');
  } else {
    console.log('Session not found or has no final_assets.');
  }
}

run();
