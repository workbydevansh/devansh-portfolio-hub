"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, CalendarDays } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Certificate } from "@/lib/supabase/types";

type CertificateCardProps = {
  certificate: Certificate;
};

function formatDate(date: string | null) {
  if (!date) {
    return "Not added";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <motion.article whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
      <GlassCard className="h-full p-5">
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StatusBadge
              label={certificate.category ?? "Other"}
              variant="info"
            />
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-slate-200">
              <BadgeCheck size={13} />
              Certificate
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-2xl font-semibold text-white">
              {certificate.title}
            </h2>
            <p className="mt-2 text-sm font-medium text-cyan-200">
              {certificate.issuer ?? "Issuer not added"}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {certificate.description ?? "Description not added."}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <CalendarDays size={14} />
                Issue Date
              </div>
              <p className="text-sm font-semibold text-white">
                {formatDate(certificate.issue_date)}
              </p>
            </div>
            {certificate.expiry_date ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <CalendarDays size={14} />
                  Expiry Date
                </div>
                <p className="text-sm font-semibold text-white">
                  {formatDate(certificate.expiry_date)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            {certificate.certificate_url ? (
              <a
                href={certificate.certificate_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/20"
              >
                View Certificate
                <ArrowUpRight size={14} />
              </a>
            ) : null}
            {certificate.credential_url ? (
              <a
                href={certificate.credential_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-100 transition-colors duration-200 hover:bg-white/10"
              >
                Verify Credential
                <ArrowUpRight size={14} />
              </a>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </motion.article>
  );
}
