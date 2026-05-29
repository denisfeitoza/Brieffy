"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

interface BriefingAssistantFabProps {
  briefingId: string;
}

// Floating button anchored bottom-right of the briefing details page.
// Clicking it opens /dashboard/assistant?briefing=<id>, which pre-selects
// this briefing in the AssistantChat picker so the user can start a
// conversation without re-choosing the briefing.
export function BriefingAssistantFab({ briefingId }: BriefingAssistantFabProps) {
  return (
    <Link
      href={`/dashboard/assistant?briefing=${briefingId}`}
      // Why a Link, not a Button-with-onClick: surface routing intent for
      // middle-click / open-in-new-tab / accessibility (keyboard, screen
      // reader announces destination).
      className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 h-12 pl-3 pr-4 rounded-full bg-[var(--text)] text-[var(--bg)] shadow-lg hover:opacity-95 transition-all hover:scale-105 active:scale-95"
      aria-label="Abrir assistente IA com este briefing"
      title="Conversar com a IA sobre este briefing"
    >
      <span className="w-8 h-8 rounded-full bg-[var(--orange)] flex items-center justify-center shrink-0">
        <MessageCircle className="w-4 h-4 text-black" />
      </span>
      <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
        Perguntar à IA
      </span>
    </Link>
  );
}
