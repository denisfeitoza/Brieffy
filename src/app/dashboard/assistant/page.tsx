import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssistantChat } from "@/components/dashboard/AssistantChat";
import { userHasAssistantAccess } from "@/lib/services/briefingService";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface ConversationRow {
  id: string;
  title: string;
  briefing_session_id: string;
  updated_at: string;
}

interface BriefingRow {
  id: string;
  session_name: string | null;
  status: string | null;
}

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ briefing?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/dashboard/login");
  }

  // Hard gate — admin must have flipped briefing_quotas.assistant_enabled.
  // We render an explicit message instead of 404'ing so the user knows the
  // feature exists and who to ask about it.
  const hasAccess = await userHasAssistantAccess(user.id);
  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4 px-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--orange)]/10 border border-[var(--orange)]/20 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-[var(--orange)]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Assistente <span className="text-[var(--orange)]">IA</span>
        </h1>
        <p className="text-sm text-[var(--text2)] leading-relaxed">
          Esta conta ainda não tem acesso ao Assistente IA liberado. Fale com o administrador da plataforma pra ativar.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const initialBriefingId = typeof params?.briefing === "string" ? params.briefing : undefined;

  // Load the user's recent conversations and their full briefing list in
  // parallel. The picker needs the briefing list; the sidebar shows which
  // briefing each conversation is anchored to so the user can scan it.
  const [{ data: convs }, { data: briefings }] = await Promise.all([
    supabase
      .from("assistant_conversations")
      .select("id, title, briefing_session_id, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("briefing_sessions")
      .select("id, session_name, status")
      .eq("user_id", user.id)
      .not("template_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // Defensive default values + filter out rows without a usable name so the
  // picker doesn't render "(null) — null" entries.
  const briefingOptions = ((briefings as BriefingRow[]) || [])
    .filter((b) => !!b.session_name)
    .map((b) => ({
      id: b.id,
      session_name: b.session_name as string,
      status: b.status || "pending",
    }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)]">
          Assistente <span className="text-[var(--orange)]">IA</span>
        </h1>
        <p className="text-sm text-[var(--text3)] mt-1">
          Conversa contextual com a IA da Brieffy — ancorada num briefing seu pra fundamentar as respostas.
        </p>
      </div>

      <AssistantChat
        initialConversations={(convs as ConversationRow[]) || []}
        briefings={briefingOptions}
        initialBriefingId={initialBriefingId}
      />
    </div>
  );
}
