import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssistantChat } from "@/components/dashboard/AssistantChat";

export const dynamic = "force-dynamic";

interface ConversationRow {
  id: string;
  title: string;
  updated_at: string;
}

export default async function AssistantPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/dashboard/login");
  }

  // List the user's recent conversations server-side so the first render
  // already has the sidebar populated (no flash). The chat component
  // refreshes this state after each send.
  const { data: convs } = await supabase
    .from("assistant_conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)]">
          Assistente <span className="text-[var(--orange)]">IA</span>
        </h1>
        <p className="text-sm text-[var(--text3)] mt-1">
          Conversa livre com a IA da Brieffy — pra brainstorm, copy, estratégia. Sem acesso aos seus briefings.
        </p>
      </div>

      <AssistantChat initialConversations={(convs as ConversationRow[]) || []} />
    </div>
  );
}
