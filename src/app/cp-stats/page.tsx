import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { AnimatedPage } from "@/components/shared/AnimatedPage";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PlatformStatsPanel } from "@/components/stats/PlatformStatsPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CodingStats } from "@/lib/supabase/types";

async function getCodingStats(): Promise<CodingStats[]> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("coding_stats")
    .select("*")
    .order("platform", { ascending: true });

  return (data ?? []) as CodingStats[];
}

function findPlatformStats(stats: CodingStats[], platform: "codeforces" | "leetcode") {
  return stats.find(
    (item) => item.platform.trim().toLowerCase().replace(/\s+/g, "") === platform,
  );
}

export default async function CpStatsPage() {
  const stats = await getCodingStats();
  const codeforcesStats = findPlatformStats(stats, "codeforces");
  const leetCodeStats = findPlatformStats(stats, "leetcode");

  return (
    <div className="gradient-aurora min-h-screen">
      <PublicNavbar />
      <AnimatedPage>
        <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Competitive Programming"
            title="CP Stats Dashboard"
            description="Synced coding stats from stored platform records."
          />
          <section className="mt-10 grid gap-5 lg:grid-cols-2">
            <PlatformStatsPanel platform="Codeforces" stats={codeforcesStats} />
            <PlatformStatsPanel platform="LeetCode" stats={leetCodeStats} />
          </section>
        </main>
      </AnimatedPage>
      <PublicFooter />
    </div>
  );
}
