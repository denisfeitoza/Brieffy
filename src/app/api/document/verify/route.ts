import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(req: Request) {
  try {
    const { token, passphrase } = await req.json();

    if (!token || !passphrase) {
      return NextResponse.json({ error: "Missing token or passphrase" }, { status: 400 });
    }

    const { data: session, error } = await supabaseAdmin
      .from('briefing_sessions')
      .select('id, document_content, edit_passphrase, final_assets, company_info')
      .eq('edit_token', token)
      .single();

    if (error || !session) {
      return NextResponse.json({ valid: false, error: "Link inválido ou não encontrado." }, { status: 404 });
    }

    if (session.edit_passphrase !== passphrase) {
      return NextResponse.json({ valid: false, error: "Palavra-chave incorreta." }, { status: 401 });
    }

    // Retorna o conteúdo e dados extras caso precise
    return NextResponse.json({
      valid: true,
      document: session.document_content || session.final_assets?.document || "",
      companyInfo: session.company_info
    });

  } catch (err: unknown) {
    console.error("Error verifying document:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
