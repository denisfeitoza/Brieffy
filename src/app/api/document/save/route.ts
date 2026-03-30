import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(req: Request) {
  try {
    const { editToken, passphrase, documentContent } = await req.json();

    if (!editToken || !passphrase || documentContent === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: session, error: selError } = await supabaseAdmin
      .from('briefing_sessions')
      .select('id, edit_passphrase')
      .eq('edit_token', editToken)
      .single();

    if (selError || !session) {
      return NextResponse.json({ error: "Link inválido ou não encontrado." }, { status: 404 });
    }

    if (session.edit_passphrase !== passphrase) {
      return NextResponse.json({ error: "Palavra-chave incorreta." }, { status: 401 });
    }

    const { error: updError } = await supabaseAdmin
      .from('briefing_sessions')
      .update({ document_content: documentContent, updated_at: new Date().toISOString() })
      .eq('id', session.id);

    if (updError) {
      throw new Error(updError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error saving document:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
