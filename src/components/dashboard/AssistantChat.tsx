"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, Plus, Trash2, MessageSquare, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface AssistantChatProps {
  initialConversations: ConversationSummary[];
}

export function AssistantChat({ initialConversations }: AssistantChatProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [maxTurnsReached, setMaxTurnsReached] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the message list when new content arrives so the user
  // sees the latest reply without manual scrolling.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const loadConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setMaxTurnsReached(false);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/assistant/conversations/${id}`);
      if (!res.ok) throw new Error((await res.json())?.error || `HTTP ${res.status}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      toast.error(`Falha ao carregar conversa: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setMaxTurnsReached(false);
    setInput("");
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    const optimisticUser: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: activeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.maxTurnsReached) setMaxTurnsReached(true);
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      const reply: Message = {
        id: `tmp-${Date.now() + 1}`,
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);

      // If this was the first turn, capture the new conversation id and
      // refresh the side list so the user sees their freshly-created chat.
      if (!activeId && data.conversationId) {
        setActiveId(data.conversationId);
        const listRes = await fetch("/api/assistant/conversations");
        if (listRes.ok) {
          const listData = await listRes.json();
          setConversations(listData.conversations || []);
        }
      }
    } catch (e) {
      // Roll back the optimistic user bubble on failure so the chat doesn't
      // pretend the message was accepted.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(text);
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }, [input, sending, activeId]);

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!confirm("Deletar esta conversa? A ação não pode ser desfeita.")) return;
      try {
        const res = await fetch(`/api/assistant/conversations/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json())?.error || `HTTP ${res.status}`);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) startNewConversation();
        router.refresh();
      } catch (e) {
        toast.error(`Falha ao deletar: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [activeId, router, startNewConversation]
  );

  return (
    <div className="flex h-[calc(100dvh-9rem)] gap-4">
      {/* Sidebar with conversations */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border border-[var(--bd)] rounded-2xl bg-[var(--bg)] overflow-hidden">
        <div className="p-3 border-b border-[var(--bd)]">
          <Button
            onClick={startNewConversation}
            className="w-full h-9 text-xs font-semibold bg-[var(--orange)] hover:opacity-90 text-black rounded-full gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova conversa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-[11px] text-[var(--text3)] px-2 py-3 text-center">
              Nenhuma conversa ainda.
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  activeId === c.id
                    ? "bg-[var(--bg2)] text-[var(--text)]"
                    : "text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]"
                }`}
                onClick={() => loadConversation(c.id)}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate font-medium">{c.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Deletar conversa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col border border-[var(--bd)] rounded-2xl bg-[var(--bg)] overflow-hidden min-w-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {messages.length === 0 && !loadingMessages && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto px-6 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--orange)]/10 border border-[var(--orange)]/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[var(--orange)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)]">Assistente da Brieffy</h2>
              <p className="text-xs text-[var(--text3)] leading-relaxed">
                Use pra brainstorm, copy, estratégia, análise. Não cole dados sensíveis —
                esta conversa é processada por um provedor de IA externo.
              </p>
              <p className="text-[10px] text-[var(--text3)] mt-2">
                O assistente ainda não tem acesso aos seus briefings. Pra isso, use o fluxo de briefing.
              </p>
            </div>
          )}

          {loadingMessages && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-[var(--orange)] animate-spin" />
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--orange)] text-black rounded-br-md"
                    : "bg-[var(--bg2)] text-[var(--text)] rounded-bl-md border border-[var(--bd)]"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl bg-[var(--bg2)] border border-[var(--bd)] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-[var(--orange)] animate-spin" />
                <span className="text-xs text-[var(--text3)]">Pensando…</span>
              </div>
            </div>
          )}
        </div>

        {maxTurnsReached && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Esta conversa chegou ao limite. Clique em <strong>Nova conversa</strong> pra continuar.
            </p>
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-[var(--bd)] p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter inserts a newline. Most chat UIs
                // do this; copying the convention reduces user friction.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                maxTurnsReached
                  ? "Crie uma nova conversa pra continuar"
                  : "Pergunte algo… (Enter envia, Shift+Enter pula linha)"
              }
              disabled={sending || maxTurnsReached}
              rows={2}
              className="flex-1 resize-none bg-[var(--bg2)] border-[var(--bd)] rounded-2xl text-sm placeholder:text-[var(--text3)] focus-visible:ring-[var(--orange)]/30 focus-visible:border-[var(--orange)] disabled:opacity-50 min-h-[60px] max-h-[200px]"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || sending || maxTurnsReached}
              className="h-[60px] w-[60px] rounded-2xl bg-[var(--text)] hover:opacity-90 text-[var(--bg)] disabled:opacity-40 shrink-0"
              aria-label="Enviar mensagem"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
