"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  FileText,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ConversationSummary {
  id: string;
  title: string;
  briefing_session_id: string;
  updated_at: string;
}

interface BriefingOption {
  id: string;
  session_name: string;
  status: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface AssistantChatProps {
  initialConversations: ConversationSummary[];
  briefings: BriefingOption[];
  // Optional pre-selected briefing from ?briefing=<id> query param so a click
  // on the FAB inside /dashboard/[id] lands here already pointing at that
  // briefing, ready to start a new conversation.
  initialBriefingId?: string;
}

export function AssistantChat({
  initialConversations,
  briefings,
  initialBriefingId,
}: AssistantChatProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeBriefingId, setActiveBriefingId] = useState<string | null>(
    initialBriefingId || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [maxTurnsReached, setMaxTurnsReached] = useState(false);

  // Briefing picker modal state — opens when the user clicks "Nova conversa"
  // without having an active or pre-selected briefing.
  const [showBriefingPicker, setShowBriefingPicker] = useState(false);
  const [briefingQuery, setBriefingQuery] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const briefingMap = useMemo(() => {
    const m = new Map<string, BriefingOption>();
    briefings.forEach((b) => m.set(b.id, b));
    return m;
  }, [briefings]);

  const activeBriefing = activeBriefingId ? briefingMap.get(activeBriefingId) : null;

  // Auto-scroll on new content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // If query param changes (e.g. user navigates from one briefing FAB to
  // another without a full reload), update the pre-selected briefing.
  useEffect(() => {
    const fromQuery = searchParams.get("briefing");
    if (fromQuery && fromQuery !== activeBriefingId && !activeId) {
      setActiveBriefingId(fromQuery);
    }
  }, [searchParams, activeBriefingId, activeId]);

  const loadConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setMaxTurnsReached(false);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/assistant/conversations/${id}`);
      if (!res.ok) throw new Error((await res.json())?.error || `HTTP ${res.status}`);
      const data = await res.json();
      setMessages(data.messages || []);
      const convBriefingId = data.conversation?.briefing_session_id;
      if (convBriefingId) setActiveBriefingId(convBriefingId);
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
    // If we don't have a pre-selected briefing (no FAB context, no leftover),
    // open the picker so the user is forced to choose one before typing.
    if (!activeBriefingId) {
      setShowBriefingPicker(true);
    }
  }, [activeBriefingId]);

  const pickBriefing = useCallback((id: string) => {
    setActiveBriefingId(id);
    setShowBriefingPicker(false);
    setActiveId(null);
    setMessages([]);
    setMaxTurnsReached(false);
  }, []);

  const clearBriefing = useCallback(() => {
    setActiveBriefingId(null);
    setActiveId(null);
    setMessages([]);
    setMaxTurnsReached(false);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    if (!activeBriefingId && !activeId) {
      setShowBriefingPicker(true);
      return;
    }

    setSending(true);
    const optimisticUser: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    const assistantId = `tmp-asst-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      optimisticUser,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      },
    ]);
    setInput("");

    let receivedAny = false;
    let newConversationId: string | null = null;

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: activeId,
          briefingSessionId: activeId ? undefined : activeBriefingId,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !res.body || !contentType.startsWith("application/x-ndjson")) {
        const data = await res.json().catch(() => ({}));
        if (data?.maxTurnsReached) setMaxTurnsReached(true);
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const evt = JSON.parse(trimmed) as
              | { type: "meta"; conversationId?: string; briefingSessionId?: string }
              | { type: "delta"; content: string }
              | { type: "done" }
              | { type: "error"; error?: string; partial?: boolean };

            if (evt.type === "meta") {
              if (evt.conversationId) newConversationId = evt.conversationId;
            } else if (evt.type === "delta") {
              receivedAny = true;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + evt.content } : m
                )
              );
            } else if (evt.type === "error") {
              streamError = evt.error || "Erro no stream";
            }
          } catch {
            // skip malformed chunk
          }
        }
      }

      if (streamError) throw new Error(streamError);
      if (!receivedAny) throw new Error("Resposta vazia do assistente.");

      if (!activeId && newConversationId) {
        setActiveId(newConversationId);
        const listRes = await fetch("/api/assistant/conversations");
        if (listRes.ok) {
          const listData = await listRes.json();
          setConversations(listData.conversations || []);
        }
      }
    } catch (e) {
      setMessages((prev) =>
        prev.filter((m) => {
          if (!receivedAny) return m.id !== optimisticUser.id && m.id !== assistantId;
          return true;
        })
      );
      if (!receivedAny) setInput(text);
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }, [input, sending, activeId, activeBriefingId]);

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
        }
        router.refresh();
      } catch (e) {
        toast.error(`Falha ao deletar: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [activeId, router]
  );

  const filteredBriefings = useMemo(() => {
    const q = briefingQuery.trim().toLowerCase();
    if (!q) return briefings;
    return briefings.filter((b) => b.session_name.toLowerCase().includes(q));
  }, [briefings, briefingQuery]);

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
            conversations.map((c) => {
              const b = briefingMap.get(c.briefing_session_id);
              return (
                <div
                  key={c.id}
                  className={`group flex items-start gap-2 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    activeId === c.id
                      ? "bg-[var(--bg2)] text-[var(--text)]"
                      : "text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]"
                  }`}
                  onClick={() => loadConversation(c.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{c.title}</div>
                    {b && (
                      <div className="truncate text-[10px] text-[var(--text3)] mt-0.5">
                        sobre: {b.session_name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity mt-0.5"
                    aria-label="Deletar conversa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col border border-[var(--bd)] rounded-2xl bg-[var(--bg)] overflow-hidden min-w-0">
        {/* Active briefing pill — shows above messages, clickable to change. */}
        {activeBriefing && (
          <div className="border-b border-[var(--bd)] px-4 py-2.5 flex items-center gap-2 bg-[var(--bg2)]">
            <FileText className="w-3.5 h-3.5 text-[var(--orange)] shrink-0" />
            <span className="text-[11px] uppercase tracking-wider text-[var(--text3)] font-bold shrink-0">
              Briefing:
            </span>
            <span className="text-xs font-semibold text-[var(--text)] truncate flex-1">
              {activeBriefing.session_name}
            </span>
            {!activeId && (
              <button
                onClick={() => setShowBriefingPicker(true)}
                className="text-[10px] text-[var(--orange)] hover:underline font-semibold"
              >
                trocar
              </button>
            )}
            {!activeId && (
              <button
                onClick={clearBriefing}
                className="text-[var(--text3)] hover:text-[var(--text)] transition-colors"
                aria-label="Limpar seleção"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && !loadingMessages && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto px-6 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--orange)]/10 border border-[var(--orange)]/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[var(--orange)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)]">Assistente da Brieffy</h2>
              {activeBriefing ? (
                <p className="text-xs text-[var(--text3)] leading-relaxed">
                  Conversa sobre o briefing <strong className="text-[var(--text)]">{activeBriefing.session_name}</strong>.
                  Pergunte sobre estratégia, copy, próximos passos.
                </p>
              ) : (
                <p className="text-xs text-[var(--text3)] leading-relaxed">
                  Pra começar, escolha um briefing — toda conversa precisa estar ancorada a um, assim a IA fundamenta as respostas nos dados reais.
                </p>
              )}
              {!activeBriefing && (
                <Button
                  onClick={() => setShowBriefingPicker(true)}
                  className="mt-2 h-9 px-4 text-xs font-semibold bg-[var(--orange)] hover:opacity-90 text-black rounded-full gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Escolher briefing
                </Button>
              )}
              <p className="text-[10px] text-[var(--text3)] mt-3">
                Não cole dados sensíveis — esta conversa é processada por um provedor de IA externo.
              </p>
            </div>
          )}

          {loadingMessages && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-[var(--orange)] animate-spin" />
            </div>
          )}

          {messages.map((m) => {
            if (m.role === "assistant" && m.content.length === 0) return null;
            return (
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
            );
          })}

          {sending && (() => {
            const last = messages[messages.length - 1];
            const stillWaiting = last?.role === "assistant" && last.content.length === 0;
            return stillWaiting ? (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl bg-[var(--bg2)] border border-[var(--bd)] flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[var(--orange)] animate-spin" />
                  <span className="text-xs text-[var(--text3)]">Pensando…</span>
                </div>
              </div>
            ) : null;
          })()}
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
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                maxTurnsReached
                  ? "Crie uma nova conversa pra continuar"
                  : !activeBriefingId && !activeId
                  ? "Escolha um briefing pra começar…"
                  : "Pergunte algo… (Enter envia, Shift+Enter pula linha)"
              }
              disabled={sending || maxTurnsReached || (!activeBriefingId && !activeId)}
              rows={2}
              className="flex-1 resize-none bg-[var(--bg2)] border-[var(--bd)] rounded-2xl text-sm placeholder:text-[var(--text3)] focus-visible:ring-[var(--orange)]/30 focus-visible:border-[var(--orange)] disabled:opacity-50 min-h-[60px] max-h-[200px]"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || sending || maxTurnsReached || (!activeBriefingId && !activeId)}
              className="h-[60px] w-[60px] rounded-2xl bg-[var(--text)] hover:opacity-90 text-[var(--bg)] disabled:opacity-40 shrink-0"
              aria-label="Enviar mensagem"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </main>

      {/* Briefing picker modal */}
      {showBriefingPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowBriefingPicker(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg)] border border-[var(--bd)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[var(--bd)]">
              <h3 className="text-base font-bold text-[var(--text)]">
                Escolha um briefing
              </h3>
              <p className="text-xs text-[var(--text3)] mt-1">
                A IA usa o briefing escolhido como contexto da conversa.
              </p>
            </div>
            <div className="p-3 border-b border-[var(--bd)]">
              <Input
                value={briefingQuery}
                onChange={(e) => setBriefingQuery(e.target.value)}
                placeholder="Buscar briefing por nome…"
                autoFocus
                className="h-9 bg-[var(--bg2)] border-[var(--bd)] rounded-full text-xs"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredBriefings.length === 0 ? (
                <p className="text-xs text-[var(--text3)] px-3 py-6 text-center">
                  {briefings.length === 0
                    ? "Você ainda não tem briefings. Crie um pra começar."
                    : "Nenhum briefing encontrado."}
                </p>
              ) : (
                filteredBriefings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => pickBriefing(b.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                      activeBriefingId === b.id
                        ? "bg-[var(--orange)]/10 border border-[var(--orange)]/30 text-[var(--text)]"
                        : "hover:bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)]"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 truncate font-medium">{b.session_name}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold shrink-0 ${
                        b.status === "finished"
                          ? "text-emerald-600"
                          : b.status === "in_progress"
                          ? "text-amber-600"
                          : "text-[var(--text3)]"
                      }`}
                    >
                      {b.status === "finished"
                        ? "concluído"
                        : b.status === "in_progress"
                        ? "em andamento"
                        : b.status === "pending"
                        ? "pendente"
                        : b.status || ""}
                    </span>
                    {activeBriefingId === b.id && <Check className="w-3.5 h-3.5 text-[var(--orange)]" />}
                  </button>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t border-[var(--bd)] flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowBriefingPicker(false)}
                className="h-9 px-4 text-xs font-semibold text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)] rounded-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
