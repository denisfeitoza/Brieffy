require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  // We will compile the TS file roughly or just read it.
  // Actually transpiling it is easier to get the object:
  require('ts-node').register({ transpileOnly: true });
  
  // Need to mock Next.js imports if they exist, but skill-templates.ts seems pure.
  // Let's check imports of skill-templates.ts.
  const { SKILL_TEMPLATES } = require('./src/lib/skill-templates.ts');
  
  console.log(`Loaded ${SKILL_TEMPLATES.length} templates. Upserting...`);
  
  for (const tpl of SKILL_TEMPLATES) {
    const slug = tpl.suggested_slug || tpl.id;
    const { data, error } = await supabase
      .from('briefing_category_packages')
      .update({ system_prompt_fragment: tpl.system_prompt_fragment })
      .eq('slug', slug);
      
    if (error) {
      console.error(`Failed to update ${slug}:`, error.message);
    } else {
      console.log(`Updated ${slug}`);
    }
  }
}

run();
