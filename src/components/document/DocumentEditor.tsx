"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Bot,
  Save,
  Download,
  Loader2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Minus,
  Pilcrow,
  Quote,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  SlashCommandMenu,
  filterSlashItems,
  type SlashItem,
} from "./SlashCommandMenu";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let html2pdf: any;
if (typeof window !== "undefined") {
  import("html2pdf.js").then((mod) => {
    html2pdf = mod.default || mod;
  });
}

/* ─── Markdown → HTML (for legacy content migration) ─── */
function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
    .replace(/^[\-\*] (.*$)/gim, "<li>$1</li>")
    .replace(/^\d+\. (.*$)/gim, "<li>$1</li>")
    .replace(/^---$/gim, "<hr />")
    .replace(/`(.*?)`/gim, "<code>$1</code>")
    .replace(/\n\n/gim, "</p><p>")
    .replace(/\n/gim, "<br />");

  html = html.replace(/(<li>.*?<\/li>)(?=\s*<li>)/gim, "$1");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, (match) => {
    if (!match.startsWith("<ul>")) return "<ul>" + match + "</ul>";
    return match;
  });
  html = html.replace(/<\/ul>\s*<ul>/gim, "");

  return "<p>" + html + "</p>";
}

/**
 * Clean HTML output: strip empty paragraphs, collapse redundant <br>, etc.
 * Fixes excessive spacing from AI-generated Markdown with blank lines.
 */
function cleanHtml(html: string): string {
  return html
    // Remove empty paragraphs: <p></p>, <p> </p>, <p><br></p>, <p><br /></p>
    .replace(/<p>\s*(<br\s*\/?>\s*)*<\/p>/gi, "")
    // Collapse 3+ consecutive <br> into max 2
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />")
    // Remove leading/trailing <br> inside paragraphs
    .replace(/<p>\s*<br\s*\/?>/gi, "<p>")
    .replace(/<br\s*\/?>\s*<\/p>/gi, "</p>")
    .trim();
}

/** Detect Markdown safely — only if content does NOT start with an HTML tag */
function isMarkdown(content: string): boolean {
  const trimmed = content.trim();
  if (/^<[a-zA-Z]/.test(trimmed)) return false;
  return /^#{1,3}\s|^[\-\*] |\*\*((?!\s).+?)\*\*/m.test(trimmed);
}

/** Prepare content for Tiptap: convert from Markdown or return HTML as-is */
function prepareContent(raw: string): string {
  if (!raw || !raw.trim()) return "<p></p>";
  if (isMarkdown(raw)) return cleanHtml(markdownToHtml(raw));
  if (raw.includes("<")) return cleanHtml(raw);
  // Plain text fallback
  return `<p>${raw.replace(/\n/g, "<br />")}</p>`;
}

/* ─── Toolbar Button ─── */
interface ToolbarBtnProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarBtn({ onClick, isActive, disabled, title, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 shrink-0
        ${isActive
          ? "bg-[var(--orange)]/15 text-[var(--orange)] shadow-sm"
          : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
        }
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-[var(--bd)] mx-0.5 shrink-0" />;
}

/* ─── Editor Toolbar ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-1">
      {/* Text formatting */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Sublinhado (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Tachado"
      >
        <Minus className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive("highlight")}
        title="Marcador de texto"
      >
        <Highlighter className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarSeparator />

      {/* Headings */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive("paragraph") && !editor.isActive("heading")}
        title="Parágrafo"
      >
        <Pilcrow className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Título 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Título 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Título 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Lista com marcadores"
      >
        <List className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Lista numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Citação"
      >
        <Quote className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divisor"
      >
        <Minus className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarSeparator />

      {/* Undo / Redo — FIX #6: use editor.can() safely, Tiptap handles this efficiently */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Desfazer (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Refazer (Ctrl+Shift+Z)"
      >
        <Redo2 className="w-4 h-4" />
      </ToolbarBtn>
    </div>
  );
}

/* ─── PDF Content Clone ─── */
function createPdfHtml(htmlContent: string): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    width: 700px;
    padding: 0;
    background: #ffffff;
    color: #1a1a1a;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.7;
    box-sizing: border-box;
  `;

  // ── Brieffy Logo Header ──
  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:30px 40px 20px 40px;border-bottom:2px solid #ff6029;margin-bottom:24px;";
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="9" fill="#ff6029"/>
        <circle cx="26" cy="6" r="2.5" fill="white"/>
        <text x="16" y="23.5" font-family="system-ui" font-size="21" font-weight="900" fill="white" text-anchor="middle">B</text>
      </svg>
      <span style="font-size:18px;font-weight:800;color:#1a1a1a;letter-spacing:-0.5px;">Brieffy</span>
    </div>
    <span style="font-size:11px;font-weight:600;color:#999;letter-spacing:0.5px;text-transform:uppercase;">Smart Briefing</span>
  `;
  wrapper.appendChild(header);

  // ── Document content ──
  const content = document.createElement("div");
  content.innerHTML = cleanHtml(htmlContent);
  content.style.cssText = "padding:0 40px 40px 40px;";
  wrapper.appendChild(content);

  // ── Style all block elements with page-break-inside:avoid ──
  const avoidBreak = "page-break-inside:avoid;break-inside:avoid;";

  content.querySelectorAll("h1").forEach((el) => {
    el.style.cssText = `font-size:26px;font-weight:900;margin:0 0 16px 0;color:#1a1a1a;line-height:1.3;${avoidBreak}`;
  });
  content.querySelectorAll("h2").forEach((el) => {
    el.style.cssText = `font-size:20px;font-weight:700;color:#ff6029;margin:28px 0 10px 0;padding-bottom:6px;border-bottom:1px solid #e5e5e5;line-height:1.3;page-break-after:avoid;${avoidBreak}`;
  });
  content.querySelectorAll("h3").forEach((el) => {
    el.style.cssText = `font-size:16px;font-weight:600;margin:18px 0 6px 0;color:#333;line-height:1.3;page-break-after:avoid;${avoidBreak}`;
  });
  content.querySelectorAll("p").forEach((el) => {
    el.style.cssText = `margin:0 0 8px 0;line-height:1.7;${avoidBreak}`;
  });
  content.querySelectorAll("ul, ol").forEach((el) => {
    (el as HTMLElement).style.cssText = `padding-left:22px;margin:0 0 10px 0;${avoidBreak}`;
  });
  content.querySelectorAll("li").forEach((el) => {
    (el as HTMLElement).style.cssText = `margin:0 0 4px 0;line-height:1.6;${avoidBreak}`;
  });
  content.querySelectorAll("mark").forEach((el) => {
    (el as HTMLElement).style.cssText = "background-color:#fef3c7;border-bottom:2px solid #f59e0b;padding:1px 3px;border-radius:2px;";
  });
  content.querySelectorAll("blockquote").forEach((el) => {
    (el as HTMLElement).style.cssText = `border-left:4px solid #ff6029;padding:10px 16px;margin:12px 0;background:#fff7f4;border-radius:0 8px 8px 0;${avoidBreak}`;
  });
  content.querySelectorAll("strong").forEach((el) => {
    (el as HTMLElement).style.cssText = "font-weight:700;";
  });
  content.querySelectorAll("hr").forEach((el) => {
    (el as HTMLElement).style.cssText = `border:none;border-top:1px solid #e5e5e5;margin:20px 0;${avoidBreak}`;
  });

  // ── Footer ──
  const footer = document.createElement("div");
  footer.style.cssText = "padding:16px 40px;border-top:1px solid #eee;text-align:center;font-size:10px;color:#bbb;margin-top:20px;";
  footer.textContent = "Gerado por Brieffy — brieffy.com";
  wrapper.appendChild(footer);

  return wrapper;
}

/* ─── Main DocumentEditor ─── */
interface DocumentEditorProps {
  initialContent: string;
  onSave?: (newContent: string) => Promise<void>;
  readOnly?: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function DocumentEditor({ initialContent, onSave, readOnly = false }: DocumentEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const prevInitialContentRef = useRef<string>(initialContent);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef<string | null>(null);

  // ── Slash Command State ──
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0, direction: "down" as "up" | "down" });
  const [slashIndex, setSlashIndex] = useState(0);
  const slashOpenRef = useRef(false);
  const slashIndexRef = useRef(0);
  const slashItemsRef = useRef<SlashItem[]>([]);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { slashOpenRef.current = slashOpen; }, [slashOpen]);
  useEffect(() => { slashIndexRef.current = slashIndex; }, [slashIndex]);

  const filteredSlashItems = filterSlashItems(slashQuery);
  useEffect(() => { slashItemsRef.current = filteredSlashItems; }, [filteredSlashItems]);

  const closeSlash = useCallback(() => {
    setSlashOpen(false);
    setSlashQuery("");
    setSlashIndex(0);
  }, []);

  // ── Auto-save ──
  const performSave = useCallback(async (htmlContent: string) => {
    if (!onSave) return;
    if (isSavingRef.current) {
      pendingSaveRef.current = htmlContent;
      return;
    }
    isSavingRef.current = true;
    setSaveStatus("saving");
    try {
      await onSave(htmlContent);
      prevInitialContentRef.current = htmlContent;
      setSaveStatus("saved");
      if (pendingSaveRef.current !== null) {
        const pending = pendingSaveRef.current;
        pendingSaveRef.current = null;
        isSavingRef.current = false;
        performSave(pending);
        return;
      }
    } catch {
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  const debouncedSave = useCallback((htmlContent: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => performSave(htmlContent), 1500);
  }, [performSave]);

  useEffect(() => {
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, []);

  // ── Slash keyboard handler (via ref so ProseMirror closure stays current) ──
  const slashKeyHandlerRef = useRef<(event: KeyboardEvent) => boolean>(() => false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeSlashCommand = useCallback((item: SlashItem, ed: any) => {
    if (!ed) return;
    // Delete the "/" and query text from the current paragraph
    const { state } = ed;
    const { $from } = state.selection;
    const start = $from.start();
    const end = $from.pos;
    ed.chain().focus().deleteRange({ from: start, to: end }).run();
    item.command(ed);
    closeSlash();
  }, [closeSlash]);

  // Update the handler ref whenever dependencies change
  useEffect(() => {
    slashKeyHandlerRef.current = (event: KeyboardEvent): boolean => {
      if (!slashOpenRef.current) return false;
      const items = slashItemsRef.current;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlashIndex((prev) => (prev + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlashIndex((prev) => (prev - 1 + items.length) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = items[slashIndexRef.current];
        if (item) executeSlashCommand(item, editorRef.current);
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeSlash();
        return true;
      }
      return false;
    };
  }, [executeSlashCommand, closeSlash]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: { class: "brieffy-highlight" },
      }),
      Underline,
    ],
    content: prepareContent(initialContent),
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[50vh] px-1",
      },
      handleKeyDown: (_view, event) => {
        return slashKeyHandlerRef.current(event);
      },
    },
    onUpdate: ({ editor: ed }) => {
      // ── Detect slash command ──
      if (!readOnly) {
        try {
          const { selection } = ed.state;
          const { $from } = selection;
          const lineText = $from.parent.textContent;
          const cursorAtEnd = $from.parentOffset === lineText.length;

          if (lineText.startsWith("/") && cursorAtEnd) {
            const q = lineText.slice(1);
            setSlashQuery(q);
            setSlashOpen(true);
            setSlashIndex(0);

            // Position relative to editor container, with smart direction
            const coords = ed.view.coordsAtPos($from.pos);
            const containerRect = editorContainerRef.current?.getBoundingClientRect();
            if (containerRect) {
              const spaceBelow = window.innerHeight - coords.bottom;
              const menuHeight = 300; // approximate max menu height
              const openUp = spaceBelow < menuHeight;

              setSlashPos({
                top: openUp
                  ? coords.top - containerRect.top - 8  // position above cursor
                  : coords.bottom - containerRect.top + 8, // position below cursor
                left: coords.left - containerRect.left,
                direction: openUp ? "up" : "down",
              });
            }
          } else if (slashOpenRef.current) {
            closeSlash();
          }
        } catch {
          // Ignore position errors
        }
      }

      // ── Auto-save ──
      if (!readOnly && onSave) {
        debouncedSave(ed.getHTML());
      }
    },
  });

  // Keep editor ref current
  useEffect(() => { editorRef.current = editor; }, [editor]);

  // Sync readOnly
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  // Sync external content changes (e.g., translation)
  useEffect(() => {
    if (!editor) return;
    if (prevInitialContentRef.current === initialContent) return;
    prevInitialContentRef.current = initialContent;
    editor.commands.setContent(prepareContent(initialContent));
  }, [initialContent, editor]);

  const handleCopy = useCallback(() => {
    if (editor) {
      navigator.clipboard.writeText(editor.getText());
    } else {
      navigator.clipboard.writeText(initialContent);
    }
    toast.success("Conteúdo copiado para a área de transferência!");
  }, [editor, initialContent]);

  const generatePDF = useCallback(() => {
    if (!html2pdf || !editor) {
      toast.error("Utilitário PDF ainda está carregando, tente novamente.");
      return;
    }

    const pdfElement = createPdfHtml(editor.getHTML());

    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 700px;
      z-index: -9999; opacity: 0; pointer-events: none; overflow: hidden;
    `;
    container.appendChild(pdfElement);
    document.body.appendChild(container);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `briefing-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 700,
        windowWidth: 700,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    html2pdf()
      .from(pdfElement)
      .set(opt)
      .save()
      .then(() => document.body.removeChild(container))
      .catch(() => {
        document.body.removeChild(container);
        toast.error("Erro ao gerar PDF. Tente novamente.");
      });
  }, [editor]);

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* ACTION BAR */}
      <div className="flex flex-wrap justify-between items-center bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-3 gap-3 w-full">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 flex-nowrap">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="border-[var(--bd-strong)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] shrink-0"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          <Button
            onClick={() => {
              if (editor) {
                // Copy raw text content preserving structure for AI
                const rawText = editor.getText();
                navigator.clipboard.writeText(rawText);
                toast.success("Conteúdo copiado para IA!");
              }
            }}
            variant="outline"
            size="sm"
            className="border-[var(--bd-strong)] text-[var(--orange)] hover:text-[var(--text)] hover:bg-[var(--orange)]/10 shrink-0"
          >
            <Bot className="w-4 h-4 mr-2" />
            Copiar para IA
          </Button>
          <Button
            onClick={generatePDF}
            size="sm"
            className="bg-[var(--orange)] hover:opacity-90 text-white font-semibold shrink-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>

          {/* Auto-save status */}
          {!readOnly && onSave && saveStatus !== "idle" && (
            <div className="flex items-center gap-1.5 ml-auto text-[11px] font-medium tracking-wide shrink-0 select-none">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[var(--text3)]" />
                  <span className="text-[var(--text3)]">Salvando...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Save className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">Salvo</span>
                </>
              )}
              {saveStatus === "error" && (
                <span className="text-red-500">Erro ao salvar</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FORMATTING TOOLBAR — uses native CSS sticky for reliable behavior */}
      {!readOnly && editor && (
        <div className="sticky top-2 z-[60] print:hidden w-full transition-all duration-200">
          <div className="bg-[var(--bg2)]/90 backdrop-blur-xl border border-[var(--bd)] rounded-xl py-2 px-2 overflow-x-auto custom-scrollbar shadow-lg w-full max-w-3xl mx-auto">
            <EditorToolbar editor={editor} />
          </div>
        </div>
      )}

      {/* DOCUMENT CONTENT */}
      <div
        ref={editorContainerRef}
        className={`bg-[var(--bg)] border border-[var(--bd)] rounded-2xl p-6 md:p-10 shadow-sm overflow-clip relative`}
      >
        <div
          className={`
            prose prose-sm md:prose-base max-w-none
            dark:prose-invert
            prose-headings:font-sans prose-headings:tracking-tight
            prose-h1:text-2xl prose-h1:md:text-3xl prose-h1:font-bold prose-h1:mb-6
            prose-h2:text-xl prose-h2:text-[var(--orange)] prose-h2:border-b prose-h2:border-[var(--bd)] prose-h2:pb-2 prose-h2:mt-8
            prose-h3:text-lg prose-h3:font-semibold
            prose-p:leading-relaxed
            prose-strong:font-semibold
            prose-blockquote:border-l-[var(--orange)] prose-blockquote:bg-[var(--acbg)] prose-blockquote:rounded-r-lg prose-blockquote:px-4 prose-blockquote:py-2
            w-full mx-auto
          `}
        >
          <EditorContent editor={editor} />
        </div>

        {/* SLASH COMMAND MENU */}
        <SlashCommandMenu
          isOpen={slashOpen}
          items={filteredSlashItems}
          selectedIndex={slashIndex}
          position={slashPos}
          onSelect={(item) => {
            if (editor) executeSlashCommand(item, editor);
          }}
        />

        {/* Slash hint + Restore Original */}
        {!readOnly && editor && !slashOpen && (
          <div className="mt-8 pt-6 border-t border-dashed border-[var(--bd)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[11px] text-[var(--text3)] select-none opacity-60">
              Digite <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg3)] text-[var(--text2)] font-mono text-[10px]">/</kbd> para formatar
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--text3)] hover:text-red-500 hover:bg-red-500/10 text-xs gap-1.5 shrink-0"
              onClick={() => {
                if (window.confirm("Tem certeza que deseja restaurar o documento original? Todas as edições serão perdidas.")) {
                  const prepared = prepareContent(initialContent);
                  editor.commands.setContent(prepared);
                  if (onSave) {
                    onSave(prepared);
                  }
                  toast.success("Documento restaurado para o original.");
                }
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Original
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
