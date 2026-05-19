import { AchievementSection } from "@/components/achievements/AchievementSection";
import type { AchievementWithDetails } from "@/components/achievements/AchievementSection";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { AnimatedPage } from "@/components/shared/AnimatedPage";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Achievement,
  AchievementCertificate,
  AchievementLink,
  Certificate,
} from "@/lib/supabase/types";

async function getAchievements(): Promise<AchievementWithDetails[]> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .order("display_order", { ascending: true })
    .order("achievement_date", { ascending: false })
    .order("created_at", { ascending: false });

  const achievementRows = (achievements ?? []) as Achievement[];

  if (!achievementRows.length) {
    return [];
  }

  const achievementIds = achievementRows.map((achievement) => achievement.id);

  const [{ data: links }, { data: certificateRelations }] = await Promise.all([
    supabase
      .from("achievement_links")
      .select("*")
      .in("achievement_id", achievementIds),
    supabase
      .from("achievement_certificates")
      .select("*")
      .in("achievement_id", achievementIds),
  ]);

  const linkRows = (links ?? []) as AchievementLink[];
  const certificateRelationRows =
    (certificateRelations ?? []) as AchievementCertificate[];

  const certificateIds = Array.from(
    new Set(
      certificateRelationRows
        .map((relation) => relation.certificate_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: certificates } = certificateIds.length
    ? await supabase.from("certificates").select("*").in("id", certificateIds)
    : { data: [] };

  const certificateRows = (certificates ?? []) as Certificate[];
  const certificatesById = new Map(
    certificateRows.map((certificate) => [certificate.id, certificate]),
  );

  return achievementRows.map((achievement) => {
    const achievementCertificateRelations = certificateRelationRows.filter(
      (relation) => relation.achievement_id === achievement.id,
    );

    return {
      ...achievement,
      links: linkRows.filter((link) => link.achievement_id === achievement.id),
      certificateRelations: achievementCertificateRelations,
      certificates: achievementCertificateRelations
        .map((relation) =>
          relation.certificate_id
            ? certificatesById.get(relation.certificate_id)
            : null,
        )
        .filter((certificate): certificate is Certificate =>
          Boolean(certificate),
        ),
    };
  });
}

export default async function AchievementsPage() {
  const achievements = await getAchievements();

  return (
    <div className="gradient-aurora min-h-screen">
      <PublicNavbar />
      <AnimatedPage>
        <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Achievements"
            title="Achievement Timeline"
            description="Grouped milestones with proof links, required references, and attached certificates."
          />
          <AchievementSection achievements={achievements} />
        </main>
      </AnimatedPage>
      <PublicFooter />
    </div>
  );
}
