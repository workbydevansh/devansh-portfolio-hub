import { CertificateFilters } from "@/components/certificates/CertificateFilters";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { AnimatedPage } from "@/components/shared/AnimatedPage";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Certificate } from "@/lib/supabase/types";

async function getCertificates(): Promise<Certificate[]> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as Certificate[];
}

export default async function CertificatesPage() {
  const certificates = await getCertificates();

  return (
    <div className="gradient-aurora min-h-screen">
      <PublicNavbar />
      <AnimatedPage>
        <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Certificates"
            title="Certificate Vault"
            description="Credentials, verifications, and learning records in one focused grid."
          />
          <CertificateFilters certificates={certificates} />
        </main>
      </AnimatedPage>
      <PublicFooter />
    </div>
  );
}
