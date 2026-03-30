import { BriefingProvider } from "@/lib/BriefingContext";
import { TypeformWizard } from "@/components/briefing/TypeformWizard";
import { getSessionById, getTemplateById, getBrandingByUserId, getPackagesBySlugs } from "@/lib/services/briefingService";
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

  return (
    <BriefingProvider 
       activeTemplate={template} 
       sessionId={session.id} 
       initialContext={session.initial_context}
       selectedPackages={selectedPackages}
       selectedPackageDetails={selectedPackageDetails}
       branding={branding}
       initialPassphrase={session.edit_passphrase}
    >
      <main className="h-screen w-full bg-neutral-950 font-inter">
        <TypeformWizard />
      </main>
    </BriefingProvider>
  );
}
