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
      const errObj = result.error as { message?: string } | null;
      console.error('[Supabase] All retries exhausted:', errObj?.message || String(result.error));
      return result;
    }
  }
  return { error: 'Retry logic error' };
}

// In-flight de-duplication: dedupes concurrent calls (double-click, React Strict
// Mode double-invoke, two tabs racing under same JS runtime) so we never INSERT
// two sessions for the same templateId in one client. Resolves to the same id.
const inflightSessionPromises = new Map<string, Promise<string | null>>();

export async function ensureSessionInDb(templateId: string | null): Promise<string | null> {
  const cacheKey = templateId ?? '__no_template__';
  const existing = inflightSessionPromises.get(cacheKey);
  if (existing) return existing;

  const promise = (async (): Promise<string | null> => {
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
      }
      console.error("Failed to start session in Supabase:", (error as { message?: string })?.message || JSON.stringify(error));
      return null;
    } catch (err: unknown) {
      const errObj = err as { message?: string } | null;
      console.error("Failed to start session:", errObj?.message || JSON.stringify(err));
      return null;
    } finally {
      // Keep cache for 5s to absorb late-arriving duplicates, then clear so
      // a subsequent intentional reset/new flow can create a fresh session.
      setTimeout(() => inflightSessionPromises.delete(cacheKey), 5000);
    }
  })();

  inflightSessionPromises.set(cacheKey, promise);
  return promise;
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

  if (error) console.error('[Snapshot] Failed to persist after retries:', (error as { message?: string })?.message || JSON.stringify(error));
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
    const errObj = error as { message?: string } | null;
    console.error("Erro ao salvar interação após retries:", errObj?.message || String(error));
    return null;
  } catch (dbErr: unknown) {
    const errObj = dbErr as { message?: string } | null;
    console.error("Erro ao inserir interação:", errObj?.message || String(dbErr));
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
    
  if (error) console.error('Erro ao limpar interações futuras:', (error as { message?: string })?.message || JSON.stringify(error));
}

/**
 * Update a briefing session's snapshot.
 *
 * Optimistic concurrency:
 *   When `expectedVersion` is provided, we only write if the row's `version`
 *   still matches what the caller observed. If 0 rows are affected we DO NOT
 *   throw — we log a warning and surface a `conflict: true` flag to the
 *   caller via the return value. This lets the briefing flow keep functioning
 *   (the local snapshot is still valid) while making races observable.
 *
 *   When `expectedVersion` is undefined (legacy callers), behavior is the
 *   pre-existing "last write wins". We preserve that path so we can roll
 *   this out incrementally without breaking older clients still in users'
 *   browsers after a deploy.
 */
export async function updateSessionStateInDb(
  sessionId: string,
  sessionUpdate: Record<string, unknown>,
  expectedVersion?: number,
): Promise<{ ok: boolean; conflict: boolean; newVersion?: number }> {
  // Strip any caller-supplied `version` to avoid accidental tampering.
  const { version: _ignoredVersion, ...safeUpdate } = sessionUpdate as { version?: unknown } & Record<string, unknown>;
  void _ignoredVersion;

  if (typeof expectedVersion === 'number' && Number.isFinite(expectedVersion)) {
    const nextVersion = expectedVersion + 1;
    const payload = { ...safeUpdate, version: nextVersion };
    const { data, error } = await supabaseRetry(async () =>
      supabase
        .from('briefing_sessions')
        .update(payload)
        .eq('id', sessionId)
        .eq('version', expectedVersion)
        .select('id, version')
    );
    if (error) {
      console.error('Erro ao atualizar progresso da sessão após retries:', (error as { message?: string })?.message || JSON.stringify(error));
      return { ok: false, conflict: false };
    }
    const updatedRows = Array.isArray(data) ? data : (data ? [data] : []);
    if (updatedRows.length === 0) {
      console.warn(`[updateSessionStateInDb] Optimistic concurrency conflict on session ${sessionId} (expected v${expectedVersion}). Caller should refetch.`);
      return { ok: false, conflict: true };
    }
    return { ok: true, conflict: false, newVersion: nextVersion };
  }

  // Legacy path: no concurrency token supplied.
  const { error } = await supabaseRetry(async () =>
    supabase.from('briefing_sessions').update(safeUpdate).eq('id', sessionId)
  );
  if (error) {
    console.error('Erro ao atualizar progresso da sessão após retries:', (error as { message?: string })?.message || JSON.stringify(error));
    return { ok: false, conflict: false };
  }
  return { ok: true, conflict: false };
}

export async function updateInteractionSignalInDb(interactionId: string, interactionUpdate: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseRetry(async () =>
    supabase.from('briefing_interactions').update(interactionUpdate).eq('id', interactionId)
  );
  if (error) console.error('Erro ao atualizar interação após retries:', (error as { message?: string })?.message || JSON.stringify(error));
}

export async function markSessionAsFinishedInDb(
  sessionId: string,
  finishedPayload: Record<string, unknown>
): Promise<{ ok: boolean }> {
  const { error } = await supabaseRetry(async () =>
    supabase.from('briefing_sessions')
      .update(finishedPayload)
      .eq('id', sessionId)
      .select('id')
  );
  if (error) {
    console.error("Erro ao fechar sessão no DB após retries:", (error as { message?: string })?.message || JSON.stringify(error));
    return { ok: false };
  }
  return { ok: true };
}
