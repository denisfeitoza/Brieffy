import { BriefingProvider } from "@/lib/BriefingContext";
import { TypeformWizard } from "@/components/briefing/TypeformWizard";
import { getSessionById, getTemplateById, getBrandingByUserId, getPackagesBySlugs, getInteractionsBySession } from "@/lib/services/briefingService";
import { notFound } from "next/navigation";
import type { BrandingInfo } from "@/lib/types";

export const dynamic = 'force-dynamic';

export default async function FormPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  let session;
  let template;
  let branding: BrandingInfo | undefined;

  try {
    session = await getSessionById(sessionId);
    // Busca o template base que gerou a sessão para recuperar cores, campos estruturais etc.
    if (session.template_id) {
       template = await getTemplateById(session.template_id);
    }

    // Fetch branding from the template/session owner
    const ownerId = session.user_id || template?.user_id;
    if (ownerId) {
      branding = await getBrandingByUserId(ownerId);
    }
  } catch (error) {
    // Se não encontrou o ID da sessão, volta a 404
    notFound();
  }

  // Agrega o contexto inicial (o que já se sabe da empresa) ao template object ou passar via prop
  const selectedPackages: string[] = Array.isArray(session.selected_packages)
    ? session.selected_packages
    : [];

  const selectedPackageDetails = await getPackagesBySlugs(selectedPackages);

  // ================================================================
  // RESUME SUPPORT — load previous interactions if session is in_progress
  // ================================================================
  const isInProgress = session.status === 'in_progress';
  const savedInteractions = isInProgress ? await getInteractionsBySession(sessionId) : [];

  // Restore company state, signals, basal coverage and language from the session
  const savedState = (isInProgress && session.company_info && typeof session.company_info === 'object')
    ? (session.company_info as Record<string, unknown>)
    : undefined;

  const savedSignals = isInProgress && Array.isArray(session.detected_signals)
    ? session.detected_signals
    : undefined;

  const savedBasalCoverage = isInProgress && typeof session.basal_coverage === 'number'
    ? session.basal_coverage
    : undefined;

  // Detect language from the first interaction (if any)
  const savedLanguage = isInProgress && savedInteractions.length > 0
    ? (() => {
        const firstAnswer = savedInteractions[0]?.user_answer;
        if (typeof firstAnswer === 'string') {
          const langMap: Record<string, string> = {
            '🇧🇷 Português': 'pt',
            '🇺🇸 English': 'en',
            '🇪🇸 Español': 'es',
          };
          return langMap[firstAnswer.trim()] || 'pt';
        }
        return 'pt';
      })()
    : 'pt';

  return (
    <BriefingProvider 
       activeTemplate={template} 
       sessionId={session.id} 
       initialContext={session.initial_context}
       selectedPackages={selectedPackages}
       selectedPackageDetails={selectedPackageDetails}
       branding={branding}
       initialPassphrase={session.edit_passphrase}
       savedInteractions={savedInteractions.length > 0 ? savedInteractions : undefined}
       savedState={savedState}
       savedSignals={savedSignals}
       savedBasalCoverage={savedBasalCoverage}
       savedLanguage={savedLanguage}
    >
      <main className="h-screen w-full bg-neutral-950 font-inter">
        <TypeformWizard />
      </main>
    </BriefingProvider>
  );
}
