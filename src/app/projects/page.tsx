import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { AnimatedPage } from "@/components/shared/AnimatedPage";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/supabase/types";

async function getProjects(): Promise<Project[]> {
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return data ?? [];
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="gradient-aurora min-h-screen">
      <PublicNavbar />
      <AnimatedPage>
        <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Projects"
            title="Project Command Center"
            description="A focused grid of builds, experiments, and technical work."
          />
          <ProjectFilters projects={projects} />
        </main>
      </AnimatedPage>
      <PublicFooter />
    </div>
  );
}
