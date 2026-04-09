import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // 1. IP-based Rate Limiting
    const ip = getRequestIP(req);
    const rl = checkRateLimit(`generate_session:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    
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
      depthSignals
    } = await req.json();

    if (!templateId || !sessionName) {
      return NextResponse.json({ error: "Nome da sessão e Template são obrigatórios." }, { status: 400 });
    }

    const supabaseSession = await createServerSupabaseClient();
    const { data: { user } } = await supabaseSession.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sua sessão expirou. Faça login novamente." }, { status: 401 });
    }

    // 2. Fetch Quota to Verify Access
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

    const { count: sessionCount } = await supabaseSession
      .from('briefing_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('template_id', 'is', null);

    const usedBriefings = sessionCount || 0;

    if (quota && quota.max_briefings !== -1 && usedBriefings >= quota.max_briefings) {
      return NextResponse.json({ error: `Você atingiu seu limite de ${quota.max_briefings} briefings. Faça upgrade para continuar.` }, { status: 403 });
    }

    // 3. Create Session with Service Role (so we can lock down general INSERT later)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check for duplicate name
    const { data: existingSession, error: existingError } = await supabaseAdmin
      .from('briefing_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_name', sessionName.trim())
      .maybeSingle();

    if (existingSession) {
      return NextResponse.json({ error: "Você já possui uma sessão com este nome. Escolha um nome diferente." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('briefing_sessions')
      .insert([{
        template_id: templateId,
        session_name: sessionName.trim(),
        initial_context: initialContext?.trim() || null,
        selected_packages: selectedPackages || [],
        edit_passphrase: editPassphrase?.trim() || null,
        access_password: accessPassword?.trim() || null,
        briefing_purpose: briefingPurpose?.trim() || null,
        depth_signals: depthSignals || [],
        status: 'pending',
        user_id: user.id,
      }])
      .select('id')
      .single();

    if (error) {
      console.error("Error creating session in DB:", error);
      return NextResponse.json({ error: "Erro ao criar a sessão no banco." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error("Session Generate Error:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
