import { BriefingProvider } from "@/lib/BriefingContext";
import { TypeformWizard } from "@/components/briefing/TypeformWizard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <BriefingProvider 
       apiEndpoint="/api/onboarding"
       isOnboarding={true}
       initialContext="Onboarding inicial da agência/empresa para capturar perfil e identidade visual."
    >
      <main className="h-screen w-full bg-[var(--bg)] font-inter">
        <TypeformWizard />
      </main>
    </BriefingProvider>
  );
}
