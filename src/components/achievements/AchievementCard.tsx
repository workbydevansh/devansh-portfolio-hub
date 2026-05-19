"use client";

import { AnimatePresence, motion } from "framer-motion";
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
import { cn } from "@/lib/utils";
import type { AchievementWithDetails } from "./AchievementSection";

type AchievementCardProps = {
  achievement: AchievementWithDetails;
};

function formatDate(date: string | null) {
  if (!date) {
    return "Date not added";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

function certificateHref(certificate: AchievementWithDetails["certificates"][number]) {
  return (
    certificate.certificate_url ??
    certificate.credential_url ??
    certificate.file_path
  );
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasExpandedContent =
    achievement.proof_url ||
    achievement.links.length > 0 ||
    achievement.certificates.length > 0;

  return (
    <motion.article whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
      <GlassCard className="h-full overflow-hidden p-5">
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StatusBadge label={achievement.category ?? "Other"} variant="info" />
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-slate-200">
              <CalendarDays size={13} />
              {formatDate(achievement.achievement_date)}
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-2xl font-semibold text-white">
              {achievement.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {achievement.description}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <Building2 size={14} />
                Organization
              </div>
              <p className="text-sm font-semibold text-white">
                {achievement.organization ?? "Not added"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
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
                <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                      <ShieldCheck size={16} />
                      Proof and required links
                    </div>
                    {hasExpandedContent ? (
                      <div className="flex flex-wrap gap-3">
                        {achievement.proof_url ? (
                          <a
                            href={achievement.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/20"
                          >
                            Proof
                            <ArrowUpRight size={14} />
                          </a>
                        ) : null}

                        {achievement.links.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-100 transition-colors duration-200 hover:bg-white/10"
                          >
                            <Link2 size={14} />
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
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
                              <p className="mt-1 text-sm text-slate-400">
                                {certificate.issuer ?? "Issuer not added"}
                              </p>
                              {href ? (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/20"
                                >
                                  View Certificate
                                  <ArrowUpRight size={14} />
                                </a>
                              ) : (
                                <span className="mt-3 inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-400">
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
    </motion.article>
  );
}
