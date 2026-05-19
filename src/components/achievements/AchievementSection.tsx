"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";
import type {
  Achievement,
  AchievementCertificate,
  AchievementLink,
  Certificate,
} from "@/lib/supabase/types";
import { AchievementCard } from "./AchievementCard";

export type AchievementWithDetails = Achievement & {
  links: AchievementLink[];
  certificateRelations: AchievementCertificate[];
  certificates: Certificate[];
};

type AchievementSectionProps = {
  achievements: AchievementWithDetails[];
};

const categoryOrder = [
  "Hackathons",
  "Competitive Programming",
  "Projects",
  "Academics",
  "Certifications",
  "Other",
] as const;

function normalizeCategory(category: string | null) {
  const value = category?.trim().toLowerCase();

  if (value === "hackathon" || value === "hackathons") {
    return "Hackathons";
  }

  if (
    value === "competitive programming" ||
    value === "cp" ||
    value === "codeforces" ||
    value === "leetcode"
  ) {
    return "Competitive Programming";
  }

  if (value === "project" || value === "projects") {
    return "Projects";
  }

  if (value === "academic" || value === "academics") {
    return "Academics";
  }

  if (
    value === "certification" ||
    value === "certifications" ||
    value === "certificate" ||
    value === "certificates"
  ) {
    return "Certifications";
  }

  return "Other";
}

export function AchievementSection({ achievements }: AchievementSectionProps) {
  const groupedAchievements = categoryOrder.map((category) => ({
    category,
    achievements: achievements.filter(
      (achievement) => normalizeCategory(achievement.category) === category,
    ),
  }));

  if (!achievements.length) {
    return (
      <GlassCard className="mt-10 p-8 text-center sm:p-10">
        <p className="text-sm leading-6 text-slate-300">
          No achievements added yet.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      {groupedAchievements.map((group) =>
        group.achievements.length ? (
          <motion.section
            key={group.category}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="relative"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <h2 className="text-lg font-semibold text-white">
                {group.category}
              </h2>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {group.achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
            </div>
          </motion.section>
        ) : null,
      )}
    </div>
  );
}
