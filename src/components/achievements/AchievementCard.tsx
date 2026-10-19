"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronDown,
  FileBadge,
  Link2,
  Medal,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { expandTransition } from "@/lib/motion";
import { safeUrl } from "@/lib/url";
import { cn, formatDate } from "@/lib/utils";
import type { AchievementWithDetails } from "./AchievementSection";

type AchievementCardProps = {
  achievement: AchievementWithDetails;
};


function certificateHref(certificate: AchievementWithDetails["certificates"][number]) {
  return (
    safeUrl(certificate.certificate_url) ??
    safeUrl(certificate.credential_url) ??
    safeUrl(certificate.file_path)
  );
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const proofUrl = safeUrl(achievement.proof_url);
  const links = achievement.links.flatMap((link) => {
    const url = safeUrl(link.url);
    return url ? [{ ...link, url }] : [];
  });
  const hasExpandedContent =
    proofUrl || links.length > 0 || achievement.certificates.length > 0;

  return (
    <article className="h-full">
      <GlassCard className="glass-card-interactive h-full overflow-hidden p-5">
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StatusBadge label={achievement.category ?? "Other"} variant="info" />
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-zinc-200">
              <CalendarDays size={13} />
              {formatDate(achievement.achievement_date, "Date not added")}
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-2xl font-semibold text-white">
              {achievement.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {achievement.description}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400">
                <Building2 size={14} />
                Organization
              </div>
              <p className="text-sm font-semibold text-white">
                {achievement.organization ?? "Not added"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400">
                <Medal size={14} />
                Rank / Result
              </div>
              <p className="text-sm font-semibold text-white">
                {achievement.rank_or_result ?? "Not added"}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-[color,background-color,border-color,scale] duration-200 ease-out hover:border-cyan-300/40 hover:bg-cyan-300/15 hover:text-cyan-100 active:scale-[0.96]"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((current) => !current)}
            >
              {isOpen ? "Hide Details" : "View Details"}
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
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
                transition={expandTransition}
                className="overflow-hidden"
              >
                <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                      <ShieldCheck size={16} />
                      Proof and required links
                    </div>
                    {hasExpandedContent ? (
                      <div className="flex flex-wrap gap-3">
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-[background-color,scale] duration-200 ease-out hover:bg-cyan-300/20 active:scale-[0.96]"
                          >
                            Proof
                            <ArrowUpRight size={14} className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </a>
                        ) : null}

                        {links.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-zinc-100 transition-[background-color,scale] duration-200 ease-out hover:bg-white/10 active:scale-[0.96]"
                          >
                            <Link2 size={14} />
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
                        No proof links or certificates attached yet.
                      </p>
                    )}
                  </div>

                  {achievement.certificates.length ? (
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <FileBadge size={16} />
                        Attached certificates
                      </div>
                      <div className="space-y-3">
                        {achievement.certificates.map((certificate) => {
                          const href = certificateHref(certificate);

                          return (
                            <div
                              key={certificate.id}
                              className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                            >
                              <p className="font-semibold text-white">
                                {certificate.title}
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                {certificate.issuer ?? "Issuer not added"}
                              </p>
                              {href ? (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group mt-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-[background-color,scale] duration-200 ease-out hover:bg-cyan-300/20 active:scale-[0.96]"
                                >
                                  View Certificate
                                  <ArrowUpRight size={14} className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </a>
                              ) : (
                                <span className="mt-3 inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-400">
                                  View Certificate
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </GlassCard>
    </article>
  );
}
