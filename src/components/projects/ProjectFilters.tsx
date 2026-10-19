"use client";

import { FilteredCardGrid } from "@/components/shared/FilteredCardGrid";
import type { Project } from "@/lib/supabase/types";
import { ProjectCard } from "./ProjectCard";

const categoryAliases = {
  AI: ["ai"],
  Web: ["web"],
  Hackathon: ["hackathon"],
  DSA: ["dsa"],
};

export function ProjectFilters({ projects }: { projects: Project[] }) {
  return (
    <FilteredCardGrid
      items={projects}
      noun="projects"
      categoryAliases={categoryAliases}
      getCategory={(project) => project.category}
      getSearchText={(project) => [project.title, ...(project.tech_stack ?? [])]}
      searchPlaceholder="Search title or tech stack"
      renderCard={(project) => <ProjectCard project={project} />}
    />
  );
}
