"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { FilterChips } from "@/components/shared/FilterChips";
import { GlassCard } from "@/components/shared/GlassCard";
import { gridItemMotion } from "@/lib/motion";

type FilteredCardGridProps<T extends { id: string }> = {
  items: T[];
  noun: string;
  // Chip label -> the stored category values it covers. "All" and "Other"
  // (anything not listed) are added automatically.
  categoryAliases: Record<string, string[]>;
  getCategory: (item: T) => string | null;
  getSearchText: (item: T) => (string | null)[];
  searchPlaceholder: string;
  renderCard: (item: T) => ReactNode;
};

// Category chips + search over a card grid; shared by projects and certificates.
export function FilteredCardGrid<T extends { id: string }>({
  items,
  noun,
  categoryAliases,
  getCategory,
  getSearchText,
  searchPlaceholder,
  renderCard,
}: FilteredCardGridProps<T>) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", ...Object.keys(categoryAliases), "Other"];
  const knownCategories = Object.values(categoryAliases).flat();
  const search = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const category = getCategory(item)?.trim().toLowerCase() ?? "";
    const matchesCategory =
      activeCategory === "All" ||
      (activeCategory === "Other"
        ? !knownCategories.includes(category)
        : categoryAliases[activeCategory].includes(category));

    return (
      matchesCategory &&
      (!search ||
        getSearchText(item).join(" ").toLowerCase().includes(search))
    );
  });

  return (
    <section className="mt-10">
      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterChips
            label={`Filter ${noun} by category`}
            options={categories}
            value={activeCategory}
            onChange={setActiveCategory}
          />

          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search {noun}</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
            />
          </label>
        </div>
      </GlassCard>

      {filteredItems.length ? (
        <div className="relative mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout="position"
                className="h-full"
                {...gridItemMotion}
              >
                {renderCard(item)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <GlassCard className="fade-in mt-6 p-8 text-center sm:p-10">
          <p className="text-sm leading-6 text-slate-300">
            {items.length
              ? `No ${noun} match this filter.`
              : `No ${noun} added yet.`}
          </p>
        </GlassCard>
      )}
    </section>
  );
}
