import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ================================================================
// SUPABASE RETRY — retries transient failures (network, 5xx)
// ================================================================
export async function supabaseRetry<T>(
  fn: () => Promise<{ data?: T; error: unknown }>,
  maxRetries = 2
): Promise<{ data?: T; error: unknown }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn();
    if (!result.error) return result;
    if (attempt < maxRetries) {
      console.warn(`[Supabase] Retry ${attempt + 1}/${maxRetries}`);
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    } else {
      console.error('[Supabase] All retries exhausted:', result.error);
      return result;
    }
  }
  return { error: 'Retry logic error' };
}

export async function ensureSessionInDb(templateId: string | null): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('briefing_sessions')
      .insert([{ 
        status: 'in_progress',
        template_id: templateId 
      }])
      .select('id')
      .single();
      
    if (!error && data) {
      return data.id;
    } else {
      console.error("Failed to start session in Supabase:", error);
      return null;
    }
  } catch (err) {
    console.error("Failed to start session:", err);
    return null;
  }
}

export async function persistSnapshotInDb(
  sessionId: string,
  snapshot: unknown[],
  currentStepIndex: number
): Promise<void> {
  const { error } = await supabaseRetry(async () =>
    supabase.from('briefing_sessions').update({
      messages_snapshot: snapshot,
      current_step_index: currentStepIndex,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
  );

  if (error) console.error('[Snapshot] Failed to persist after retries:', error);
}

export async function logInteractionInDb(
  sessionId: string,
  stepOrder: number,
  questionType: string,
  questionText: string,
  optionsOffered: unknown[] | null,
  userAnswer: string | string[] | number,
  isDepthQuestion: boolean
): Promise<string | null> {
  try {
    const upsertPayload = {
      session_id: sessionId,
      step_order: stepOrder,
      question_type: questionType,
      question_text: questionText,
      options_offered: optionsOffered,
      user_answer: userAnswer,
      is_depth_question: isDepthQuestion,
    };

    const { data, error } = await supabaseRetry<{ id: string }>(async () =>
      supabase.from('briefing_interactions')
        .upsert(upsertPayload, { onConflict: 'session_id,step_order' })
        .select('id')
        .single()
    );

    if (!error && data) return data.id;
    console.error("Erro ao salvar interação após retries:", error);
    return null;
  } catch (dbErr) {
    console.error("Erro ao inserir interação:", dbErr);
    return null;
  }
}

export async function clearFutureInteractionsInDb(
  sessionId: string,
  currentStepIndex: number
): Promise<void> {
  const { error } = await supabase.from('briefing_interactions')
    .delete()
    .eq('session_id', sessionId)
    .gt('step_order', currentStepIndex);
    
  if (error) console.error('Erro ao limpar interações futuras:', error);
}

export async function updateSessionStateInDb(sessionId: string, sessionUpdate: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseRetry(async () =>
    supabase.from('briefing_sessions').update(sessionUpdate).eq('id', sessionId)
  );
  if (error) console.error('Erro ao atualizar progresso da sessão após retries:', error);
}

export async function updateInteractionSignalInDb(interactionId: string, interactionUpdate: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseRetry(async () =>
    supabase.from('briefing_interactions').update(interactionUpdate).eq('id', interactionId)
  );
  if (error) console.error('Erro ao atualizar interação após retries:', error);
}

export async function markSessionAsFinishedInDb(
  sessionId: string, 
  finishedPayload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('briefing_sessions')
    .update(finishedPayload)
    .eq('id', sessionId);
  if (error) console.error("Erro ao fechar sessão no DB:", error);
}

export async function finalizeDocumentInDb(
  sessionId: string,
  docPayload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('briefing_sessions')
    .update(docPayload)
    .eq('id', sessionId);

  if (error) console.error("Erro ao salvar documento no DB:", error);
}
