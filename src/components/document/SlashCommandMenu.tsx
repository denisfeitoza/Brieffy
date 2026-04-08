"use client";

import { useRef, useEffect } from "react";
import {
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Highlighter,
  type LucideIcon,
} from "lucide-react";

export interface SlashItem {
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  command: (editor: { chain: () => any }) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const SLASH_ITEMS: SlashItem[] = [
  {
    label: "Texto",
    description: "Parágrafo normal",
    icon: Pilcrow,
    keywords: ["texto", "paragrafo", "paragraph", "text"],
    command: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    label: "Título 1",
    description: "Título grande",
    icon: Heading1,
    keywords: ["titulo", "heading", "h1", "title"],
    command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "Título 2",
    description: "Título médio",
    icon: Heading2,
    keywords: ["titulo", "heading", "h2", "subtitle"],
    command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Título 3",
    description: "Título pequeno",
    icon: Heading3,
    keywords: ["titulo", "heading", "h3"],
    command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "Lista",
    description: "Lista com marcadores",
    icon: List,
    keywords: ["lista", "bullet", "list", "marcadores"],
    command: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Lista Numerada",
    description: "Lista ordenada",
    icon: ListOrdered,
    keywords: ["lista", "numerada", "ordered", "number"],
    command: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Citação",
    description: "Bloco de citação",
    icon: Quote,
    keywords: ["citação", "quote", "blockquote", "citacao"],
    command: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Divisor",
    description: "Linha horizontal",
    icon: Minus,
    keywords: ["divisor", "linha", "horizontal", "rule", "hr", "separador"],
    command: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    label: "Destaque",
    description: "Marcador de texto",
    icon: Highlighter,
    keywords: ["destaque", "highlight", "marcador", "marker"],
    command: (e) => e.chain().focus().toggleHighlight().run(),
  },
];

export function filterSlashItems(query: string): SlashItem[] {
  if (!query) return SLASH_ITEMS;
  const q = query.toLowerCase();
  return SLASH_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q))
  );
}

/* ─── Visual Menu Component ─── */

interface SlashCommandMenuProps {
  isOpen: boolean;
  items: SlashItem[];
  selectedIndex: number;
  position: { top: number; left: number; direction: "up" | "down" };
  onSelect: (item: SlashItem) => void;
}

export function SlashCommandMenu({
  isOpen,
  items,
  selectedIndex,
  position,
  onSelect,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view (+1 offset for the "Blocos" header)
  useEffect(() => {
    if (!menuRef.current) return;
    const selected = menuRef.current.children[selectedIndex + 1] as HTMLElement;
    if (selected) selected.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen || items.length === 0) return null;

  const isUp = position.direction === "up";

  const posStyle: React.CSSProperties = isUp
    ? { bottom: `calc(100% - ${position.top}px)`, left: Math.max(0, position.left) }
    : { top: position.top, left: Math.max(0, position.left) };

  return (
    <div
      ref={menuRef}
      className={`
        absolute z-50 w-64 max-h-72 overflow-y-auto
        bg-[var(--bg)] border border-[var(--bd)] rounded-xl shadow-xl py-1.5
        animate-in fade-in duration-150
        ${isUp ? "slide-in-from-bottom-2" : "slide-in-from-top-2"}
      `}
      style={posStyle}
    >
      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text3)]">
        Blocos
      </p>
      {items.map((item, index) => (
        <button
          key={item.label}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          className={`
            w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
            ${
              index === selectedIndex
                ? "bg-[var(--bg2)] text-[var(--text)]"
                : "text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]"
            }
          `}
        >
          <div
            className={`
            w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
            ${
              index === selectedIndex
                ? "bg-[var(--orange)]/10 text-[var(--orange)]"
                : "bg-[var(--bg3)] text-[var(--text3)]"
            }
          `}
          >
            <item.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate">{item.label}</p>
            <p className="text-[11px] text-[var(--text3)] truncate">
              {item.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
