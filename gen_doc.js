require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Starting...");
  const sessionId = "6bb4a4ba-329b-4375-9b78-435728a3f8fe";
  const { data: session, error } = await supabase
    .from('briefing_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    console.error("Session not found", error);
    return;
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

  console.log("Sending request to generate document...");

  try {
    const response = await fetch('http://localhost:3000/api/briefing/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: fullHistory,
        briefingState: 'concluido',
        assets: null,
        activeTemplate: null,
        chosenLanguage,
        detectedSignals: [],
        sessionId,
        editPassphrase: null
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Error generating document:", err);
    } else {
      const data = await response.json();
      console.log("Success! Document generated.");
    }
  } catch (err) {
    console.error("Localhopst fetch failed. Are you sure the Next.js app is running on port 3000?", err.message);
  }
}

main().catch(console.error);
