"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  MessageCircle,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BriefingChatSheetProps {
  briefingId: string;
  briefingName: string;
}

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

// Embedded AI chat that opens as a right-side sheet from the briefing
// details page. Same /api/assistant/chat endpoint as the standalone page,
// but the briefing id is fixed (no picker) and conversations are filtered
// to just this briefing — keeps focus on "talk about THIS briefing".
export function BriefingChatSheet({ briefingId, briefingName }: BriefingChatSheetProps) {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [maxTurnsReached, setMaxTurnsReached] = useState(false);

  // "list" shows the prior conversations + a "new" button.
  // "chat" shows the active message thread + composer.
  const [view, setView] = useState<"list" | "chat">("list");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load existing conversations attached to THIS briefing the first time the
  // sheet opens. Subsequent opens reuse the cached list unless explicitly
  // refreshed after a send/delete.
  const fetchConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/assistant/conversations?briefing=${briefingId}`);
      if (!res.ok) throw new Error((await res.json())?.error || `HTTP ${res.status}`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      toast.error(`Falha ao listar conversas: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingList(false);
    }
  }, [briefingId]);

  useEffect(() => {
    if (open && conversations.length === 0 && !loadingList) {
      void fetchConversations();
    }
    // We only want to (lazily) load on first open; conversations cache is
    // refreshed manually after writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const startNewConversation = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setMaxTurnsReached(false);
    setInput("");
    setView("chat");
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setMaxTurnsReached(false);
    setLoadingMessages(true);
    setView("chat");
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

  const backToList = useCallback(() => {
    setView("list");
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
        body: JSON.stringify({
          message: text,
          conversationId: activeId,
          briefingSessionId: activeId ? undefined : briefingId,
        }),
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

      if (!activeId && data.conversationId) {
        setActiveId(data.conversationId);
        // Refresh list so the new conversation shows up next time the user
        // backs out of the chat view.
        void fetchConversations();
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(text);
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }, [input, sending, activeId, briefingId, fetchConversations]);

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!confirm("Deletar esta conversa? A ação não pode ser desfeita.")) return;
      try {
        const res = await fetch(`/api/assistant/conversations/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json())?.error || `HTTP ${res.status}`);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) {
          setActiveId(null);
          setMessages([]);
          setView("list");
        }
      } catch (e) {
        toast.error(`Falha ao deletar: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [activeId]
  );

  const composerDisabled = sending || maxTurnsReached;

  // FAB rendering — uses theme vars so it sits in the same tonal range as
  // the dashboard (light: white card + neutral text; dark: dark card + light
  // text). Accent dot stays brand orange for visibility.
  const fabContent = useMemo(
    () => (
      <span
        className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 h-12 pl-2 pr-4 rounded-full border border-[var(--bd)] bg-[var(--bg)] text-[var(--text)] shadow-lg hover:bg-[var(--bg2)] transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
        aria-label="Abrir assistente IA com este briefing"
        title="Conversar com a IA sobre este briefing"
      >
        <span className="w-8 h-8 rounded-full bg-[var(--orange)] flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-black" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
          Perguntar à IA
        </span>
      </span>
    ),
    []
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={fabContent} />
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] flex flex-col bg-[var(--bg)] border-l border-[var(--bd)] p-0 z-[100]"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-[var(--bd)] shrink-0 bg-[var(--bg)]">
          <div className="flex items-center gap-2">
            {view === "chat" && (
              <button
                onClick={backToList}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] transition-colors"
                aria-label="Voltar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--orange)]" />
                Assistente IA
              </SheetTitle>
              <SheetDescription className="text-[11px] text-[var(--text3)] truncate mt-0.5">
                sobre: {briefingName}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── LIST VIEW ──────────────────────────────────────────── */}
        {view === "list" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[var(--bd)] shrink-0">
              <Button
                onClick={startNewConversation}
                className="w-full h-9 text-xs font-semibold bg-[var(--orange)] hover:opacity-90 text-black rounded-full gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova conversa
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingList ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-[var(--orange)] animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-10 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-2xl bg-[var(--orange)]/10 border border-[var(--orange)]/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[var(--orange)]" />
                  </div>
                  <p className="text-xs text-[var(--text3)] leading-relaxed max-w-xs mx-auto">
                    Nenhuma conversa sobre este briefing ainda. Crie a primeira pra brainstormar com a IA usando os dados que você já coletou.
                  </p>
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className="group flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]"
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
          </div>
        )}

        {/* ── CHAT VIEW ──────────────────────────────────────────── */}
        {view === "chat" && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && !loadingMessages && (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto px-4 gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--orange)]/10 border border-[var(--orange)]/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[var(--orange)]" />
                  </div>
                  <p className="text-xs text-[var(--text3)] leading-relaxed">
                    A IA tem o contexto deste briefing. Pergunte sobre estratégia, copy, gaps, próximos passos.
                  </p>
                  <p className="text-[10px] text-[var(--text3)] mt-2">
                    Não cole dados sensíveis — processado por provedor de IA externo.
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
                    className={`max-w-[92%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
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
                  <div className="px-3.5 py-2 rounded-2xl bg-[var(--bg2)] border border-[var(--bd)] flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-[var(--orange)] animate-spin" />
                    <span className="text-xs text-[var(--text3)]">Pensando…</span>
                  </div>
                </div>
              )}
            </div>

            {maxTurnsReached && (
              <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-200">
                  Limite da conversa atingido. Volte e crie uma nova.
                </p>
              </div>
            )}

            <div className="border-t border-[var(--bd)] p-3 shrink-0">
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    maxTurnsReached
                      ? "Volte pra criar uma nova conversa"
                      : "Pergunte algo… (Enter envia, Shift+Enter quebra linha)"
                  }
                  disabled={composerDisabled}
                  rows={2}
                  className="flex-1 resize-none bg-[var(--bg2)] border-[var(--bd)] rounded-2xl text-sm placeholder:text-[var(--text3)] focus-visible:ring-[var(--orange)]/30 focus-visible:border-[var(--orange)] disabled:opacity-50 min-h-[56px] max-h-[160px]"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || composerDisabled}
                  className="h-[56px] w-[56px] rounded-2xl bg-[var(--text)] hover:opacity-90 text-[var(--bg)] disabled:opacity-40 shrink-0"
                  aria-label="Enviar mensagem"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
