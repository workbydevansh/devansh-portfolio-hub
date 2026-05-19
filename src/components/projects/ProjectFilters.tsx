"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Project } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./ProjectCard";

type ProjectFiltersProps = {
  projects: Project[];
};

const categories = ["All", "AI", "Web", "Hackathon", "DSA", "Other"] as const;

export function ProjectFilters({ projects }: ProjectFiltersProps) {
  const [activeCategory, setActiveCategory] =
    useState<(typeof categories)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const category = project.category?.toLowerCase() ?? "";
      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Other"
          ? !["ai", "web", "hackathon", "dsa"].includes(category)
          : category === activeCategory.toLowerCase());

      const searchableText = [
        project.title,
        ...(project.tech_stack ?? []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, projects, searchQuery]);

  return (
    <section className="mt-10">
      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-200",
                  activeCategory === category
                    ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white",
                )}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search projects</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title or tech stack"
              className="w-full rounded-md border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
            />
          </label>
        </div>
      </GlassCard>

      {filteredProjects.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <GlassCard className="mt-6 p-8 text-center sm:p-10">
          <p className="text-sm leading-6 text-slate-300">
            No projects added yet.
          </p>
        </GlassCard>
      )}
    </section>
  );
}
