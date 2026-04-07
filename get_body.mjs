import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const sessionId = "6bb4a4ba-1dd0-4476-bc8b-740b09f6514b";
  const { data: session } = await supabase
    .from('briefing_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
     console.error("No session");
     process.exit(1);
  }

  const chosenLanguage = 'pt';
  const messages = session.messages || [];
  
  const fullHistory = messages.map((m, i) => {
    const resp = Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer;
    const prefix = chosenLanguage === 'en' ? `Answer ${i + 1}: ` : chosenLanguage === 'es' ? `Respuesta ${i + 1}: ` : `Resposta ${i + 1}: `;
    return {
      role: m.role,
      content: m.content + (resp ? `\n\n${prefix}${resp}` : "")
    };
  });

  const body = {
    history: fullHistory,
    briefingState: 'concluido',
    assets: null,
    activeTemplate: null,
    chosenLanguage,
    detectedSignals: [],
    sessionId,
    editPassphrase: null
  };

  fs.writeFileSync('payload.json', JSON.stringify(body));
  console.log("payload.json generated");
}
main();
