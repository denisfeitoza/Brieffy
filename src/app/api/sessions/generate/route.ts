import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // 1. IP-based Rate Limiting
    const ip = getRequestIP(req);
    const rl = await checkRateLimit(`generate_session:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Você atingiu o limite de criação de links por minuto. Tente novamente em alguns instantes." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { 
      templateId, 
      sessionName, 
      initialContext, 
      selectedPackages, 
      editPassphrase, 
      accessPassword,
      briefingPurpose,
      depthSignals,
      maxQuestions
    } = await req.json();

    if (!templateId || !sessionName) {
      return NextResponse.json({ error: "Nome da sessão e Template são obrigatórios." }, { status: 400 });
    }

    const supabaseSession = await createServerSupabaseClient();
    const { data: { user } } = await supabaseSession.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sua sessão expirou. Faça login novamente." }, { status: 401 });
    }

    // 2. Fetch Quota to Verify Access (block check stays here so we fail fast)
    const { data: quota, error: quotaError } = await supabaseSession
      .from('briefing_quotas')
      .select('max_briefings, is_blocked')
      .eq('user_id', user.id)
      .single();

    if (quotaError) {
      return NextResponse.json({ error: "Erro ao verificar cotas. Contate o suporte." }, { status: 500 });
    }

    if (quota?.is_blocked) {
      return NextResponse.json({ error: "Sua conta está bloqueada. Contate o suporte." }, { status: 403 });
    }

    // 2.1 CRITICAL: Verify the templateId actually belongs to the caller before
    // creating a session under it (prevents IDOR / cross-tenant template hijacking).
    const { data: template, error: templateOwnershipError } = await supabaseSession
      .from('briefing_templates')
      .select('id, user_id')
      .eq('id', templateId)
      .maybeSingle();

    if (templateOwnershipError) {
      console.error("Template ownership query error:", templateOwnershipError);
      return NextResponse.json({ error: "Erro ao validar template." }, { status: 500 });
    }

    if (!template || (template.user_id && template.user_id !== user.id)) {
      return NextResponse.json({ error: "Template não encontrado ou acesso negado." }, { status: 403 });
    }

    // 3. Atomic quota check + insert via Postgres RPC.
    // The previous count() + insert() pattern allowed two concurrent requests
    // to both read e.g. usedBriefings=2 / max=3 and both insert, leaving the
    // user with 4 briefings on a 3-briefing plan.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const safeMaxQuestions = (!isNaN(Number(maxQuestions)) && Number(maxQuestions) > 0 && Number(maxQuestions) <= 100)
      ? Number(maxQuestions)
      : 25;

    const { data: rpcRows, error: rpcError } = await supabaseAdmin.rpc('create_session_if_under_quota', {
      p_user_id: user.id,
      p_template_id: templateId,
      p_session_name: sessionName.trim().slice(0, 200),
      p_initial_context: initialContext ? String(initialContext).trim().substring(0, 30000) : null,
      p_selected_packages: Array.isArray(selectedPackages) ? selectedPackages.slice(0, 50) : [],
      p_edit_passphrase: editPassphrase?.trim() || null,
      p_access_password: accessPassword?.trim() || null,
      p_briefing_purpose: briefingPurpose ? String(briefingPurpose).trim().substring(0, 30000) : null,
      p_depth_signals: Array.isArray(depthSignals) ? depthSignals.slice(0, 100) : [],
      p_max_questions: safeMaxQuestions,
      p_max_briefings: typeof quota?.max_briefings === 'number' ? quota.max_briefings : -1,
    });

    if (rpcError) {
      console.error("Error creating session via RPC:", rpcError);
      return NextResponse.json({ error: "Erro ao criar a sessão no banco." }, { status: 500 });
    }

    const rpcRow = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    const rpcStatus = (rpcRow as { status?: string } | null)?.status;
    const rpcId = (rpcRow as { id?: string } | null)?.id;

    if (rpcStatus === 'duplicate_name') {
      return NextResponse.json({ error: "Você já possui uma sessão com este nome. Escolha um nome diferente." }, { status: 400 });
    }
    if (rpcStatus === 'quota_exceeded') {
      return NextResponse.json({ error: `Você atingiu seu limite de ${quota?.max_briefings} briefings. Faça upgrade para continuar.` }, { status: 403 });
    }
    if (rpcStatus !== 'ok' || !rpcId) {
      return NextResponse.json({ error: "Não foi possível criar a sessão." }, { status: 500 });
    }

    return NextResponse.json({ id: rpcId });
  } catch (err) {
    console.error("Session Generate Error:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
