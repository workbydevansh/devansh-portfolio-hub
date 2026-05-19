"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Project } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const projectLinks = [
    { label: "GitHub", href: project.github_url },
    { label: "Live Demo", href: project.live_url },
    { label: "Demo Video", href: project.demo_url },
    { label: "Case Study", href: project.case_study_url },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <motion.article whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
      <GlassCard className="h-full overflow-hidden p-5">
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StatusBadge label={project.category ?? "Project"} variant="info" />
            {project.featured ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                <Star size={13} />
                Featured
              </span>
            ) : null}
          </div>

          <div className="mt-5">
            <h2 className="text-2xl font-semibold text-white">{project.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {project.short_description}
            </p>
          </div>

          {project.tech_stack?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto pt-6">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:border-cyan-300/40 hover:bg-cyan-300/15 hover:text-cyan-100"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((current) => !current)}
            >
              {isOpen ? "Hide Details" : "View Details"}
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  isOpen ? "rotate-180" : "rotate-0",
                )}
              />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {isOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-5 border-t border-white/10 pt-5">
                  {project.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="mb-5 aspect-video w-full rounded-lg border border-white/10 object-cover"
                    />
                  ) : null}

                  {project.long_description ? (
                    <p className="text-sm leading-6 text-slate-300">
                      {project.long_description}
                    </p>
                  ) : null}

                  {projectLinks.length ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {projectLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/20"
                        >
                          {link.label}
                          <ArrowUpRight size={14} />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </GlassCard>
    </motion.article>
  );
}
