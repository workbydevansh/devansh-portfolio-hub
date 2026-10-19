"use client";

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

// Display order of the groups, and the stored category values each covers.
const categoryGroups = {
  Hackathons: ["hackathon", "hackathons"],
  "Competitive Programming": ["competitive programming", "cp", "codeforces", "leetcode"],
  Projects: ["project", "projects"],
  Academics: ["academic", "academics"],
  Certifications: ["certification", "certifications", "certificate", "certificates"],
  Other: [],
} satisfies Record<string, string[]>;

function groupFor(category: string | null) {
  const value = category?.trim().toLowerCase() ?? "";
  const match = Object.entries(categoryGroups).find(([, values]) =>
    (values as string[]).includes(value),
  );

  return match?.[0] ?? "Other";
}

export function AchievementSection({ achievements }: AchievementSectionProps) {
  const groupedAchievements = Object.keys(categoryGroups).map((category) => ({
    category,
    achievements: achievements.filter(
      (achievement) => groupFor(achievement.category) === category,
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
          <section key={group.category} className="scroll-reveal relative">
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
          </section>
        ) : null,
      )}
    </div>
  );
}
