import { BriefingProvider } from "@/lib/BriefingContext";
import { TypeformWizard } from "@/components/briefing/TypeformWizard";
import { getPublicSessionForFlow, getTemplateById, getBrandingByUserId, getPackagesBySlugs, getInteractionsBySession } from "@/lib/services/briefingService";
import { getDBSettings, getPerformanceConfig } from "@/lib/aiConfig";
import { notFound } from "next/navigation";
import type { BrandingInfo } from "@/lib/types";
import type { Metadata } from "next";
export const dynamic = 'force-dynamic';

// ────────────────────────────────────────────────────────────────
// Per-session metadata for share previews.
// ────────────────────────────────────────────────────────────────
// When an agency sends a briefing link via WhatsApp / email / Slack, the
// preview card used to show the generic Brieffy landing copy. With this
// generateMetadata the card shows the briefing's purpose / template name
// when available — much higher click-through and clearer to the receiver.
// We re-use the same UUID sanitization as the page itself so a malformed
// link doesn't blow up metadata generation.
function sanitizeSessionId(rawSessionId: string): string {
  let decoded: string;
  try { decoded = decodeURIComponent(rawSessionId); } catch { decoded = rawSessionId; }
  return decoded.replace(/[^a-f0-9-]/gi, '');
}

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
  const { sessionId: rawSessionId } = await params;
  const sessionId = sanitizeSessionId(rawSessionId);

  // Defensive defaults — if anything fails we still ship the brand card.
  const fallback: Metadata = {
    title: "Briefing Brieffy",
    description: "Responda em poucos minutos para alinharmos sua estratégia.",
    openGraph: {
      title: "Briefing Brieffy",
      description: "Responda em poucos minutos para alinharmos sua estratégia.",
      type: "website",
    },
    robots: { index: false, follow: false }, // never let public briefings be indexed
  };

  if (!sessionId || sessionId.length < 32) return fallback;

  try {
    const session = await getPublicSessionForFlow(sessionId);
    const purpose = (session.briefing_purpose || "").toString().trim();
    const sessionName = (session.session_name || "").toString().trim();

    // Build a tasteful title without leaking sensitive info; cap lengths.
    const titlePart = sessionName || "Novo Briefing";
    const title = `${titlePart.slice(0, 60)} • Brieffy`;
    const description = purpose
      ? `${purpose.slice(0, 160)}`
      : "Responda em poucos minutos para alinharmos sua estratégia.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: { index: false, follow: false },
    };
  } catch {
    return fallback;
  }
}

export default async function FormPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId: rawSessionId } = await params;

  // Sanitize sessionId: messaging apps (WhatsApp, email, SMS) often append
  // trailing `%` or other characters to shared URLs, producing malformed
  // request paths like `/b/uuid%`. Strip everything that isn't a valid UUID char.
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawSessionId);
  } catch {
    // A bare `%` without two hex digits throws URIError — fallback to raw string
    decoded = rawSessionId;
  }
  const sessionId = decoded.replace(/[^a-f0-9-]/gi, '');

  // If after sanitization the ID is empty or invalid, bail to 404
  if (!sessionId || sessionId.length < 32) {
    notFound();
  }

  let session;

  let branding: BrandingInfo | undefined;

  try {
    session = await getPublicSessionForFlow(sessionId);
  } catch {
    notFound();
  }

  const selectedPackages: string[] = Array.isArray(session.selected_packages)
    ? session.selected_packages
    : [];
  const isInProgress = session.status === 'in_progress' || session.status === 'pending';

  // Parallel fetch: template, branding, packages, interactions, settings — all independent after session
  const [templateResult, brandingResult, selectedPackageDetails, savedInteractions, dbSettings] = await Promise.all([
    session.template_id ? getTemplateById(session.template_id).catch(() => null) : Promise.resolve(null),
    (session.user_id ? getBrandingByUserId(session.user_id) : Promise.resolve(undefined)) as Promise<BrandingInfo | undefined>,
    getPackagesBySlugs(selectedPackages),
    isInProgress ? getInteractionsBySession(sessionId) : Promise.resolve([]),
    getDBSettings(),
  ]);

  const perfConfig = getPerformanceConfig(dbSettings);

  const template = templateResult;

  // If branding wasn't found via user_id, try template owner
  if (!brandingResult && template?.user_id) {
    branding = await getBrandingByUserId(template.user_id);
  } else {
    branding = brandingResult;
  }

  // Restore company state, signals, basal coverage and language from the session
  const savedState = (isInProgress && session.company_info && typeof session.company_info === 'object')
    ? (session.company_info as Record<string, unknown>)
    : undefined;

  const savedBasalCoverage = isInProgress && typeof session.basal_coverage === 'number'
    ? session.basal_coverage
    : undefined;

  // Detect language: prefer DB column (persisted each step), fallback to first interaction
  const savedLanguage = (() => {
    // Best source: persisted chosen_language column (saved on every step)
    if (isInProgress && session.chosen_language) {
      return session.chosen_language as string;
    }
    // Fallback: infer from the first interaction answer
    if (isInProgress && savedInteractions.length > 0) {
      const firstAnswer = savedInteractions[0]?.user_answer;
      if (typeof firstAnswer === 'string') {
        const langMap: Record<string, string> = {
          '🇧🇷 Português': 'pt',
          '🇺🇸 English': 'en',
          '🇪🇸 Español': 'es',
        };
        return langMap[firstAnswer.trim()] || 'pt';
      }
    }
    return 'pt';
  })();

  // Load messages snapshot for seamless resume (preserves all metadata)
  const savedMessagesSnapshot = (isInProgress && Array.isArray(session.messages_snapshot) && session.messages_snapshot.length > 0)
    ? session.messages_snapshot
    : undefined;

  const savedStepIndex = (isInProgress && typeof session.current_step_index === 'number')
    ? session.current_step_index
    : undefined;

  const hasAccessPassword = !!session.access_password;

  return (
    <BriefingProvider 
       activeTemplate={template} 
       sessionId={session.id} 
       initialContext={session.initial_context ?? undefined}
       selectedPackages={selectedPackages}
       selectedPackageDetails={selectedPackageDetails}
       branding={branding}
       savedInteractions={savedInteractions.length > 0 ? savedInteractions : undefined}
       savedState={savedState}
       savedBasalCoverage={savedBasalCoverage}
       savedLanguage={savedLanguage}
       savedMessagesSnapshot={savedMessagesSnapshot}
       savedStepIndex={savedStepIndex}
       initialTimeoutMs={perfConfig.timeoutMs}
       initialIsFinished={session.status === 'finished'}
       initialPurpose={session.briefing_purpose || ''}
       initialDepthSignals={session.depth_signals || []}
       initialMaxQuestions={session.max_questions || 25}
    >
      <main className="h-screen w-full bg-background text-foreground font-inter relative overflow-hidden">
        <TypeformWizard 
          hasAccessPassword={hasAccessPassword}
          accessSessionId={session.id}
        />
        <a
          href="https://brieffy.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Powered by Brieffy"
          className="fixed bottom-3 right-4 z-50 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-all duration-300 pointer-events-auto min-h-11 px-2 py-2 -mr-2 -mb-2"
        >
          <span className="text-[10px] md:text-[9px] uppercase tracking-widest text-[var(--text3)] font-semibold">Powered by</span>
          <div className="flex items-center gap-1">
            <div 
              className="w-4 h-4 rounded border-none flex items-center justify-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #ff6029, #ffcfbc)" }}
            >
              <span className="text-white text-[9px] font-black z-10 relative">B</span>
            </div>
            <span 
              className="text-xs font-bold text-[var(--text)] tracking-tight" 
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              Brief<span className="text-[var(--orange)]">fy</span>
            </span>
          </div>
        </a>
      </main>
    </BriefingProvider>
  );
}
