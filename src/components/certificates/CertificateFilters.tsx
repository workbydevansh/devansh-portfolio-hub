"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Certificate } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { CertificateCard } from "./CertificateCard";

type CertificateFiltersProps = {
  certificates: Certificate[];
};

const categories = [
  "All",
  "Hackathon",
  "Course",
  "Internship",
  "Coding",
  "Academic",
  "Other",
] as const;

const knownCategories = [
  "hackathon",
  "hackathons",
  "course",
  "courses",
  "internship",
  "internships",
  "coding",
  "academic",
  "academics",
];

function normalizeCategory(category: string | null) {
  return category?.trim().toLowerCase() ?? "";
}

function matchesCategoryFilter(
  certificateCategory: string | null,
  activeCategory: (typeof categories)[number],
) {
  const category = normalizeCategory(certificateCategory);

  if (activeCategory === "All") {
    return true;
  }

  if (activeCategory === "Other") {
    return !knownCategories.includes(category);
  }

  if (activeCategory === "Hackathon") {
    return category === "hackathon" || category === "hackathons";
  }

  if (activeCategory === "Course") {
    return category === "course" || category === "courses";
  }

  if (activeCategory === "Internship") {
    return category === "internship" || category === "internships";
  }

  if (activeCategory === "Academic") {
    return category === "academic" || category === "academics";
  }

  return category === activeCategory.toLowerCase();
}

export function CertificateFilters({
  certificates,
}: CertificateFiltersProps) {
  const [activeCategory, setActiveCategory] =
    useState<(typeof categories)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCertificates = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return certificates.filter((certificate) => {
      const matchesCategory = matchesCategoryFilter(
        certificate.category,
        activeCategory,
      );
      const searchableText = [
        certificate.title,
        certificate.issuer,
        certificate.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, certificates, searchQuery]);

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
            <span className="sr-only">Search certificates</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title, issuer, or category"
              className="w-full rounded-md border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
            />
          </label>
        </div>
      </GlassCard>

      {filteredCertificates.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
            />
          ))}
        </div>
      ) : (
        <GlassCard className="mt-6 p-8 text-center sm:p-10">
          <p className="text-sm leading-6 text-slate-300">
            No certificates added yet.
          </p>
        </GlassCard>
      )}
    </section>
  );
}
